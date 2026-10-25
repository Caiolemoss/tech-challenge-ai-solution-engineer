# Tech Tudo — Agente de atendimento (Ned)

Agente de IA que atende clientes da **Tech Tudo**, uma loja online (fictícia) de acessórios para informática. O atendente se chama **Ned**: ele mostra produtos, tira dúvidas, consulta pedidos e cria pedidos novos, conversando em linguagem natural pelo terminal.

Projeto feito para o desafio técnico de AI Solution Engineer Jr. (Runflow AI).

## O que o Ned faz

- Lista produtos e fala de cada um de forma simples (marca, para que serve, preço).
- Não fala, sem consulta, informações, como: quantidade em estoque, descrição tecnica do produto.
- Consulta o status e os itens de um pedido.
- Cria pedidos, respeitando o estoque.
- Informa o horário de funcionamento da loja.
- Recusa com educação o que não faz: cancelar ou alterar pedidos, trocas, pagamento, frete, e assuntos fora da loja.

## Arquitetura

O projeto foi dividido em 4 partes, cada uma com um trabalho.

- Chat: (cli.ts), seria o balcão de atendimento/virtual, no nosso caso, o terminal
- Agente: Coloquei o nome de NED, para ter maior humanização, ele utiliza o gemini 3.8 flash e o system prompt para decidir o que fazer
- Tools: Define o que o NED sabe fazer, no caso, as pedidas no desafio.
- API mock: O estoque ficticio e o sistema da loja, guardados em memoria.

O que acontece quando o cliente chama algo?

```
Cliente → Chat → Agente (Gemini) → Tools → API mock
```

A mensagem vai do chat até o agente. Se o agente precisar de dados da loja, ele usa uma tool, que consulta a API, e a resposta volta pelo mesmo caminho.

Organização das pastas:

```
src/
├── api/
│   ├── data.ts          # produtos e pedidos
│   └── server.ts        # a API da loja
├── tools/
│   ├── api-client.ts    # faz as chamadas à API
│   └── index.ts         # as 4 ações que o Ned pode fazer
├── agent/
│   ├── agent.ts         # conversa com o Gemini e decide o que fazer
│   └── system-prompt.ts # personalidade e regras do Ned
├── config.ts            # lê o arquivo .env (chave e modelo)
└── cli.ts               # o chat no terminal
```

## Como rodar

### Pré-requisitos

- Node.js 20 ou superior
- Uma chave de API do Gemini, gratuita e sem cartão: https://aistudio.google.com (botão **Get API key**)

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
3. Abra o `.env` e coloque a sua chave em `GEMINI_API_KEY`.
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
| `GEMINI_API_KEY` | Chave de acesso ao Gemini (obrigatória) | — |
| `GEMINI_MODEL` | Modelo usado pelo agente | `gemini-3.8-flash` |
| `API_BASE_URL` | Endereço da API mock | `http://localhost:3000` |

### Observação sobre a cota gratuita

O plano gratuito do Gemini tem limites baixos, que variam por modelo (no meu caso, cerca de 20 requisições por dia por modelo e 5 por minuto). Cada mensagem do cliente gasta 1 requisição, ou 2 quando o Ned usa uma tool. Se a cota acabar, o Ned avisa de forma amigável e o erro técnico aparece no terminal. Para trocar de modelo basta mudar `GEMINI_MODEL` no `.env`, sem mexer no código.
O modelo 2.5 flash estava com respostas mais rapidas e naturais, porem, o limite esgotou de forma rapida, troquei para o 3.8 flash, onde as respostas passaram a demorar, para "maquiar" a demora, adicionei a frase "Ned está digitando..." como resposta imediata.

## API mock

Servidor Express com dados em memória (sem banco). Ao reiniciar, estoque e pedidos voltam ao início.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/products` | Lista os produtos |
| GET | `/products/:id` | Detalhes de um produto |
| GET | `/orders/:id` | Consulta um pedido |
| POST | `/orders` | Cria um pedido (`{ "items": [{ "productId": 1, "quantity": 2 }] }`) |

Os dados têm 9 produtos (com marca e descrição em linguagem simples) e 2 pedidos de exemplo (1042 e 1043). Um produto (Cabo USB) está sem estoque de propósito, para testar o caso de produto esgotado. As marcas são fictícias.

## Tools do agente

Quando o Ned usa 

- `list_products` - Cliente quer ver o catálogo ou o que há disponível 
- `get_product` - Dúvida sobre um produto específico 
- `get_order_status` - Cliente pergunta por um pedido existente 
- `create_order` - Cliente disse claramente o que quer comprar 

## Decisões técnicas

- **TypeScript com Node.js.** É a linguagem preferida do desafio, e os tipos ajudam a evitar erros nos dados de produtos e pedidos.
- **Loop de tool calling escrito à mão, sem framework.** O loop é curto e fácil de explicar: manda o histórico ao modelo, executa as tools que ele pedir, devolve os resultados e repete até vir uma resposta em texto. Assim eu controlo cada etapa (histórico, limite de passos, erros) e entendo tudo o que acontece, em vez de depender de uma biblioteca que esconde isso.
- **Gemini via SDK oficial (`@google/genai`).** Tem plano gratuito sem cartão. O modelo fica em variável de ambiente, porque nomes de modelos e cotas mudam com frequência (isso aconteceu durante o desenvolvimento).
- **Tools nunca lançam erro.** Toda falha vira `{ ok: false, error }`. Assim o erro (produto inexistente, sem estoque) chega ao modelo como informação, e ele explica ao cliente com as próprias palavras.
- **API valida o pedido inteiro antes de baixar o estoque.** Se um pedido tem vários itens e um deles não tem estoque, nenhum item é descontado.
- **Dados ricos para o agente não inventar.** Os produtos têm marca e descrição em linguagem simples, e o prompt manda usar só o que as ferramentas devolvem. Sem isso, o modelo tenderia a inventar marcas e características para soar natural.
- **Chat no terminal.** É o mínimo que o desafio pede e mantém o foco no agente, optei em ser pragmático.

### System prompt

O prompt define:

- **Persona:** Ned, da Tech Tudo, simpático, levemente informal e sempre respeitoso. Se apresenta só na primeira resposta.
- **Como falar dos produtos:** como um vendedor no balcão, em frases corridas, citando marcas e benefícios em vez de ficha técnica. Não informa estoque a menos que perguntem (ou que o pedido não possa ser feito por falta dele).
- **Regras:** sempre consultar as ferramentas, nunca inventar marca, preço ou característica, perguntar quando falta informação ou há mais de uma opção, criar o pedido direto quando o pedido já está claro.
- **Limites:** não cancela nem altera pedidos, não trata de pagamento, frete ou trocas, e recusa assuntos fora da loja sem fingir que executou algo.
- **Horário de funcionamento:** segunda a sexta, 9h às 18h; sábado, 9h às 13h; domingo e feriados fechado.

### Tratamento de erros


- Situação > Como é tratado 

- Produto ou pedido inexistente > API responde 404; a tool devolve a mensagem; o Ned explica sem inventar 
- Estoque insuficiente ou produto esgotado > API responde 400 e nada é descontado; o Ned explica e sugere alternativa 
- Modelo sobrecarregado (503) ou limite por minuto (429) > O agente espera e tenta de novo (até 4 tentativas) 
- Cota diária do Gemini esgotada > Falha na hora (esperar não adianta) e o Ned avisa de forma amigável 
- API mock fora do ar > A tool devolve um erro claro, em vez de quebrar o chat 
- Falha no meio de uma resposta > O histórico volta ao estado anterior, sem corromper a conversa 
- Modelo pedindo tools sem parar > Limite de 6 passos por mensagem 

### Fluxo 1 — Listar produtos

```text
[COLAR A CONVERSA AQUI]
```

### Fluxo 2 — Detalhes de produto

```text
[COLAR A CONVERSA AQUI]
```

### Fluxo 3 — Criar pedido

```text
[COLAR A CONVERSA AQUI]
```

### Fluxo 4 — Consultar pedido

```text
[COLAR A CONVERSA AQUI]
```

### Fluxo 5 — Erros

```text
[COLAR A CONVERSA AQUI]
```

### Fluxo 6 — Limites

```text
[COLAR A CONVERSA AQUI]
```

## O que ficou de fora e melhorias futuras

- **Interface web** para conversar sem terminal (o agente já está separado da interface, então é só adicionar um endpoint de chat e uma página).
- **Cancelar ou alterar pedidos:** exigiria novos endpoints na API e novas tools.
- **Saber se a loja está aberta agora:** hoje o Ned informa os horários, mas não sabe a data e a hora atuais. Dá para injetar isso no prompt a cada mensagem (e uma lista de feriados).
- **Dados:** dados em banco de dados mais completo e com mais produtos ao inves de memoria.

## Uso de IA no desenvolvimento

[PREENCHER: descreva, com as suas palavras, como usou IA no projeto (por exemplo, para tirar dúvidas e revisar código) e o que você mesmo decidiu e testou.]