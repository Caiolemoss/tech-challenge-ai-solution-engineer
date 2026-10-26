# Tech Tudo — Agente de atendimento (Ned)

Agente de IA que atende clientes da **Tech Tudo**, uma loja online (fictícia) de acessórios para informática. O atendente se chama **Ned**: ele mostra produtos, tira dúvidas, consulta pedidos e cria pedidos novos, conversando em linguagem natural pelo terminal.

Projeto feito para o desafio técnico de AI Solution Engineer Jr. (Runflow AI).

## O que o Ned faz

- Lista produtos e fala de cada um de forma simples (marca, para que serve, preço).
- Não despeja informações que o cliente não pediu, como quantidade em estoque ou ficha técnica.
- Consulta o status e os itens de um pedido.
- Cria pedidos, respeitando o estoque.
- Informa o horário de funcionamento da loja.
- Recusa com educação o que não faz: cancelar ou alterar pedidos, trocas, pagamento, frete e assuntos fora da loja.

## Arquitetura

O projeto foi dividido em 4 partes, cada uma com um trabalho:

- **Chat** (`cli.ts`): o balcão de atendimento, no caso o terminal. Só lê o que o cliente digita e mostra a resposta.
- **Agente** (`agent/`): o Ned. Usa o **Runflow SDK** com o modelo `anthropic/claude-haiku-5.5` (via OpenRouter) e o system prompt para decidir o que fazer.
- **Tools** (`tools/`): o que o Ned sabe fazer, as 4 ações pedidas no desafio.
- **API mock** (`api/`): o sistema da loja, com produtos e pedidos guardados em memória.

O caminho de uma mensagem:

```
Cliente → Chat → Agente (Runflow SDK → LLM) → Tools → API mock
```

A mensagem vai do chat até o agente. Se o modelo precisar de dados da loja, ele pede uma tool; o agente executa a tool, que consulta a API, devolve o resultado ao modelo, e o modelo escreve a resposta final.

Organização das pastas:

```
src/
├── api/
│   ├── data.ts          # produtos e pedidos
│   └── server.ts        # a API da loja
├── tools/
│   ├── api-client.ts    # faz as chamadas à API
│   └── index.ts         # as 4 tools (createTool + Zod)
├── agent/
│   ├── agent.ts         # o Ned, configurado com o Agent do Runflow SDK
│   └── system-prompt.ts # personalidade e regras do Ned
├── config.ts            # lê o arquivo .env
└── cli.ts               # o chat no terminal
```

## Como rodar

### Pré-requisitos

- Node.js 22 ou superior (exigência do Runflow SDK)
- Uma conta na Runflow com workspace ativo e uma chave de API (no painel: **Configurações > Segurança**)
- Uma chave do OpenRouter com créditos: https://openrouter.ai/keys

### Passo a passo

1. Instale as dependências:
   ```
   npm install
   ```
2. Crie o arquivo `.env` a partir do exemplo:
   ```
   # Windows (PowerShell)
   Copy-Item .env.example .env

   # Mac / Linux
   cp .env.example .env
   ```
3. Abra o `.env` e preencha `RUNFLOW_API_KEY`, `RUNFLOW_TENANT_ID` e `OPENROUTER_KEY`. Para descobrir o tenant, use o CLI da Runflow: `npx @runflow-ai/cli login` e depois `npx @runflow-ai/cli whoami`.
4. Em um terminal, suba a API mock e deixe aberto:
   ```
   npm run dev:api
   ```
   Deve aparecer `API mock rodando em http://localhost:3000`.
5. Em **outro terminal**, abra o chat:
   ```
   npm run chat
   ```
6. Converse com o Ned. Para encerrar, digite `sair`.

### Variáveis de ambiente

| Variável | Para que serve | Padrão |
|---|---|---|
| `RUNFLOW_API_KEY` | Chave da API da Runflow (obrigatória) | — |
| `RUNFLOW_TENANT_ID` | Workspace da Runflow ao qual a chave pertence (obrigatória) | — |
| `OPENROUTER_KEY` | Chave do OpenRouter. Sem ela, a Runflow usa a credencial cadastrada no painel | — |
| `LLM_MODEL` | Modelo usado pelo agente (formato do OpenRouter) | `anthropic/claude-haiku-5.5` |
| `RUNFLOW_LOCAL_MEMORY` | Guarda a memória das conversas localmente, na pasta `.runflow/` | `true` |
| `RUNFLOW_LOG_LEVEL` | Nível de log do SDK (`error` deixa o chat limpo) | `error` |
| `API_BASE_URL` | Endereço da API mock | `http://localhost:3000` |

## API mock

Servidor Express com dados em memória (sem banco). Ao reiniciar, estoque e pedidos voltam ao início.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/products` | Lista os produtos |
| GET | `/products/:id` | Detalhes de um produto |
| GET | `/orders/:id` | Consulta um pedido |
| POST | `/orders` | Cria um pedido (`[{ "productId": 1, "quantity": 2 }]`) |

Os dados têm 9 produtos (com marca e descrição em linguagem simples) e 3 pedidos de exemplo (1041, 1042 e 1043). Um produto (Cabo USB) está sem estoque de propósito, para testar o caso de produto esgotado. As marcas são fictícias.

## Tools do agente

| Tool | Quando o Ned usa |
|---|---|
| `list_products` | O cliente quer ver o catálogo ou o que há disponível |
| `get_product` | Dúvida sobre um produto específico |
| `get_order_status` | O cliente pergunta por um pedido existente |
| `create_order` | O cliente disse claramente o que quer comprar |

Cada tool é criada com `createTool` do Runflow SDK e um schema **Zod**. O schema faz duas coisas: vira a descrição dos parâmetros que o modelo enxerga e valida os argumentos antes de executar. As tools usam `product_id`/`order_id` (formato comum em tools de LLM) e traduzem para `productId`, que é o formato que a API espera.

## Decisões técnicas

- **TypeScript com Node.js.** É a linguagem preferida do desafio, e os tipos ajudam a evitar erros nos dados de produtos e pedidos.
- **Primeiro o loop à mão, depois o Runflow SDK.** A primeira versão do projeto tinha o loop de tool calling escrito à mão com o SDK do Gemini (está no histórico do git, commit `eadb508`): mandar o histórico ao modelo, executar as tools pedidas, devolver os resultados e repetir até vir texto. Apesar de ter feito o loop "à mão", depois optei por usar o SDK da Runflow. Fazia sentido por ser a empresa para a qual estou me candidatando, e eu já tinha usado a plataforma antes, como forma de estudo, para criar um agente, inclusive com banco de dados externo. O `Agent` do SDK faz esse mesmo loop por dentro e já traz memória por sessão, limite de iterações, validação das tools com Zod e tracing. Escrever o loop primeiro me ajudou a entender o que o SDK faz, e usar o SDK deixa o código menor e mais próximo de como a Runflow trabalha no dia a dia.
- **Modelo `anthropic/claude-haiku-5.5` via OpenRouter.** Comecei com o Gemini pelo plano gratuito, mas a cota (cerca de 20 requisições por dia) acabava antes de conseguir rodar todos os testes. O Haiku é rápido (respostas em 3 a 4 segundos), muito bom com tools e em português, e barato: rodar os 13 testes do desafio custa centavos. O modelo fica no `.env` (`LLM_MODEL`), então dá para trocar sem mexer no código.
- **Memória com limite.** O SDK guarda as últimas 20 trocas de cada sessão (`maxTurns: 20`). Assim a conversa mantém o contexto ("o último que você me mostrou", "esse pedido") sem crescer para sempre.
- **Erro como informação, não como exceção.** As tools devolvem `{ ok: false, error }` quando a API recusa (produto inexistente, sem estoque). O erro chega ao modelo como informação, e ele explica ao cliente com as próprias palavras, em vez de a conversa quebrar.
- **Regra de negócio fica na API, não no prompt.** O prompt orienta o Ned a não criar pedido sem estoque, mas quem garante é a API: ela valida o pedido inteiro antes de baixar o estoque (se um item falhar, nenhum é descontado) e soma itens repetidos do mesmo produto. Mesmo que o modelo erre, um pedido inválido nunca é criado.
- **Dados ricos para o agente não inventar.** Os produtos têm marca e descrição em linguagem simples, e o prompt manda usar só o que as ferramentas devolvem. Sem isso, o modelo tenderia a inventar marcas e características para soar natural.
- **Chat no terminal.** É o mínimo que o desafio pede e mantém o foco no agente. Optei por ser pragmático.

### Desafio na migração: o tenant inativo

Ao migrar para o SDK, toda chamada falhava. Primeiro a API respondeu `Missing required x-runflow-tenant-id header`: além da chave, o SDK precisa do ID do workspace (`RUNFLOW_TENANT_ID`), que eu encontrei pelo CLI da Runflow (`rf whoami`). Com o tenant certo, o erro mudou para `403 Tenant is inactive`, e o próprio CLI confirmava o problema (`rf agents list` também retornava "Tenant not found or inactive"). Investigando, descobri que a conta que eu usava havia sido "apagada": o workspace dela estava inativo. Precisei criar uma conta nova, gerar uma nova chave e atualizar o tenant no `.env`, e aí tudo funcionou.

### System prompt

O prompt define:

- **Persona:** Ned, da Tech Tudo, simpático, levemente informal e sempre respeitoso. Se apresenta só na primeira resposta.
- **Como falar dos produtos:** como um vendedor no balcão, em frases corridas, citando marcas e benefícios em vez de ficha técnica. Não informa estoque a menos que perguntem (ou que o pedido não possa ser feito por falta dele).
- **Regras:** sempre consultar as ferramentas; nunca inventar marca, preço ou característica; perguntar quando falta informação ou há mais de uma opção; criar o pedido direto quando o pedido já está claro; usar o contexto da conversa para entender referências como "o último que você mostrou".
- **Limites:** não cancela nem altera pedidos, não trata de pagamento, frete ou trocas, e recusa assuntos fora da loja sem fingir que executou algo.
- **Horário de funcionamento:** segunda a sexta, 9h às 18h; sábado, 9h às 13h; domingo e feriados fechado.

### Tratamento de erros

| Situação | Como é tratado |
|---|---|
| Produto ou pedido inexistente | A API responde 404, a tool devolve a mensagem e o Ned explica sem inventar |
| Estoque insuficiente ou produto esgotado | A API responde 400 e nada é descontado; o Ned explica e sugere alternativa |
| Mesmo produto repetido no pedido | A API soma as quantidades antes de conferir o estoque |
| Modelo manda argumentos inválidos para uma tool | O schema Zod recusa e o SDK devolve o erro ao modelo, que pode corrigir |
| API mock fora do ar | A tool devolve um erro claro, em vez de quebrar o chat |
| Falha ao falar com o modelo | O chat mostra uma mensagem amigável ao cliente e o erro técnico em `[debug]` |
| Modelo pedindo tools sem parar | Limite de 6 iterações por mensagem (`maxToolIterations`) |

## Testes de aceite

Conversas reais com o Ned, rodadas numa única sessão, na ordem do desafio. Abaixo de cada resposta, entre colchetes, estão as chamadas que o agente fez à API, que mostram qual tool ele usou.

### Fluxo 1 — Listar produtos

```text
Você: Quais produtos vocês têm disponíveis?
Ned: Oi! Aqui é o Ned, da Tech Tudo. Temos uma boa variedade de acessórios para o seu setup.

Para mouse, tenho o sem fio da Nexa, que é bem confortável na mão e recarrega por cabo USB, e o sem fio compacto da Orbit, que é ótimo para levar na mochila e funciona com uma pilha AA. Também tenho mousepad grande da Orbit, de 80x30cm, que cobre mouse e teclado e não escorrega na mesa.

Para teclado, tenho o com fio da Volt, padrão ABNT2 com ç e teclado numérico, e o sem fio Bluetooth da Nexa, que conecta em até dois aparelhos, como computador e celular.

Também temos pendrive de 32GB da Nexa, cabo USB-C de 1 metro da Orbit que aceita carregamento rápido, e caixa de som para PC da Nexa, compacta e com entrada USB e P2. O cabo USB comum da Volt está em falta no momento.

Quer que eu te conte mais sobre algum desses ou que eu veja o preço de algum?
[API: GET /products]

Você: Me mostra só os produtos que estão em estoque.
Ned: Aqui estão os produtos que estão disponíveis agora. Só o cabo USB comum da Volt está em falta.

Em mouse, tenho o sem fio da Nexa e o sem fio compacto da Orbit, que é ótimo para a mochila. Para teclado, tenho o com fio da Volt, no padrão ABNT2 com ç e teclado numérico, e o sem fio Bluetooth da Nexa, que conecta em até dois aparelhos. Também tenho o mousepad grande da Orbit, que cobre mouse e teclado. Para outros acessórios, tem o pendrive de 32GB da Nexa, o cabo USB-C de 1 metro da Orbit e a caixa de som compacta para PC da Nexa.

Quer que eu passe o preço de algum deles ou dê mais detalhes para escolher?
[API: GET /products]
```

### Fluxo 2 — Detalhes de produto

```text
Você: Me conta mais sobre o produto 3.
Ned: O produto 3 é o teclado com fio da Volt. Ele usa o padrão ABNT2, com ç e teclado numérico, e tem teclas macias e silenciosas, então é uma boa escolha para trabalhar ou estudar sem incomodar quem está por perto. Custa R$ 129,90.

Quer que eu reserve um para você ou prefere comparar com o teclado sem fio da Nexa?
[API: GET /products/3, GET /products]

Você: E quanto custa o produto 2?
Ned: O produto 2 é o mousepad grande da Orbit, de 80x30cm, que cobre mouse e teclado e tem base antiderrapante, então não fica escorregando na mesa. Custa R$ 29,90.

Quer que eu monte um pedido com ele?
[API: GET /products/2]
```

### Fluxo 3 — Criar pedido

```text
Você: Quero comprar 2 unidades do produto 1 e 1 unidade do produto 4.
Ned: Pedido feito! O número é **1044**. Ele tem 2 mouses sem fio da Nexa, a R$ 79,90 cada, e 1 pendrive de 32GB da Nexa, a R$ 39,90. O total ficou em **R$ 199,70**, e o pedido está aguardando envio.

Posso ajudar com mais alguma coisa?
[API: POST /orders, GET /products/1, GET /products/4]

Você: Adiciona também 3 unidades do último que você me mostrou.
Ned: Como pedidos já criados não podem ser alterados, fiz um pedido separado para os 3 mousepads grandes da Orbit. O número é **1045**, o total ficou em **R$ 89,70** (3 unidades a R$ 29,90), e ele está aguardando envio.

O pedido 1044 continua como estava.
[API: POST /orders]
```

A API não permite alterar pedidos, então a decisão foi criar um pedido separado e deixar isso claro para o cliente.

### Fluxo 4 — Consultar pedido

```text
Você: Qual o status do pedido 1042?
Ned: O pedido 1042 já foi enviado. Ele tem 2 cabos USB-C de 1 metro da Orbit, que servem para celular e outros aparelhos com entrada Type-C e aceitam carregamento rápido. O total foi de R$ 49,80, e a data do pedido é 18/10/2026.

Posso ajudar com mais alguma coisa?
[API: GET /orders/1042, GET /products/5]

Você: E o que eu pedi nele mesmo?
Ned: No pedido 1042 você comprou 2 unidades do cabo Type-C da Orbit, que tem 1 metro, aceita carregamento rápido e serve para celular e outros aparelhos com entrada Type-C. Cada unidade custa R$ 24,90, então o total deu R$ 49,80.

Posso ajudar com mais alguma coisa?
[API: GET /orders/1042, GET /products/5]
```

### Fluxo 5 — Tratamento de erros

```text
Você: Me fala do produto 999.
Ned: Não encontrei nenhum produto com o número 999 na loja. Confere se o número está certo? Se quiser, posso listar o catálogo para você ver os produtos disponíveis.
[API: GET /products/999]

Você: Quero comprar 1000 unidades do produto 1.
Ned: Não consegui fazer esse pedido. Temos só 23 unidades do mouse sem fio da Nexa no momento, então não dá para atender 1000.

Se quiser, posso fazer o pedido com as 23 unidades disponíveis. Também tenho o mouse sem fio compacto da Orbit, que é outra opção. Quantas unidades você precisa?
[API: POST /orders]

Você: Qual o status do pedido 9999?
Ned: Não encontrei nenhum pedido com o número 9999. Confere se o número está certo? Se você tiver outro número de pedido, posso consultar para você.
[API: GET /orders/9999]
```

No pedido de 1000 unidades, o agente chegou a chamar `create_order`, mas a API recusou e nenhum pedido foi criado. O estoque mostrado (23) já desconta as 2 unidades do pedido 1044, feito no Fluxo 3.

### Fluxo 6 — Limites do agente

```text
Você: Qual a previsão do tempo em SP?
Ned: Essa eu não consigo ajudar, sou o atendimento da Tech Tudo e só posso falar sobre nossos produtos e pedidos. Se quiser, posso te ajudar a escolher um acessório para o seu setup ou consultar algum pedido.
[API: nenhuma]

Você: Cancela meu pedido 1042.
Ned: Não consigo cancelar pedidos por aqui, sinto muito. Para cancelar o pedido 1042, você vai precisar entrar em contato com a nossa equipe de atendimento.

Como o 1042 já consta como enviado, vale falar com eles o quanto antes. Posso ajudar com mais alguma coisa, como consultar outro pedido ou conferir um produto?
[API: nenhuma]
```

## O que ficou de fora e melhorias futuras

- **Interface web** para conversar sem terminal. O agente já está separado da interface, então bastaria um endpoint de chat que chama o agente, com um `sessionId` por cliente.
- **Cancelar ou alterar pedidos:** exigiria novos endpoints na API e novas tools.
- **Saber se a loja está aberta agora:** hoje o Ned informa os horários, mas não sabe a data e a hora atuais. Dá para injetar isso no prompt a cada mensagem (junto com uma lista de feriados).
- **Dados:** um banco de dados de verdade, com mais produtos, em vez de dados em memória.
- **Publicar o agente na plataforma da Runflow** (`rf agents deploy`), para ter as conversas e os traces no painel.
- **Testes automatizados** das tools e da API.

## Uso de IA no desenvolvimento

Usei o Claude durante todo o projeto, como apoio e como professor: ele me explicou os conceitos que não conhecia e sugeriu o código passo a passo nos meus momentos de dificuldade. Eu criei os arquivos, rodei, testei e corrigi os erros que apareceram.

Na reta final, usei o Claude Code para revisar o projeto inteiro. Ele trocou o retry manual pelo retry do SDK, corrigiu um bug de estoque (itens repetidos no mesmo pedido), me ajudou a migrar para o Runflow SDK e rodou os testes de aceite.

Sempre pedi explicações do "porquê" de cada etapa, para entender o que estou entregando e conseguir defender as escolhas na próxima fase.
