# Tech Tudo — Agente de atendimento (Ned)

O **Ned** é um agente de IA que atende os clientes da **Tech Tudo**, uma loja online (fictícia) de acessórios para informática. Pelo terminal, ele mostra produtos, consulta pedidos e cria pedidos novos.

Projeto feito para o desafio técnico de AI Solution Engineer Jr. (Runflow AI).

## Como funciona

```
Cliente → Chat (terminal) → Ned (Runflow SDK + LLM) → Tools → API mock da loja
```

- **Chat** (`cli.ts`): lê o que o cliente digita e mostra a resposta.
- **Ned** (`agent/`): usa o `Agent` do **Runflow SDK** com o modelo `anthropic/claude-haiku-5.5` (via OpenRouter). O system prompt define a personalidade e as regras.
- **Tools** (`tools/`): `list_products`, `get_product`, `get_order_status` e `create_order`.
- **API mock** (`api/`): Express com os produtos e pedidos em memória. Ao reiniciar, os dados voltam ao início.

## Como rodar

Você vai precisar de Node.js 22+, uma conta na Runflow (com uma chave de API) e uma chave do OpenRouter.

1. Instale as dependências: `npm install`
2. Copie o `.env.example` para `.env`. Preencha `RUNFLOW_API_KEY`, `RUNFLOW_TENANT_ID` e `OPENROUTER_KEY`. Para ver o tenant, use `npx @runflow-ai/cli whoami`.
3. Em um terminal, suba a API: `npm run dev:api`. Esse terminal mostra cada chamada que o agente faz.
4. Em outro terminal, abra o chat: `npm run chat`. Para encerrar, digite `sair`.

## Principais decisões

- **Primeiro o loop à mão, depois o Runflow SDK.** A primeira versão tinha o loop de tool calling escrito por mim, com o Gemini (commit `eadb508`). Depois migrei para o SDK da Runflow. Escolhi o SDK por ser a empresa à qual estou me candidatando e porque eu já tinha usado a plataforma para estudar, criando um agente com banco de dados externo. O SDK faz o mesmo loop e já traz memória por sessão, limite de iterações e validação das tools.
- **Modelo Haiku via OpenRouter.** A cota gratuita do Gemini acabava antes de eu terminar os testes. O Haiku é rápido, bom com tools e em português, e barato. O modelo pode ser trocado pelo `.env`.
- **As regras de negócio ficam na API, não no prompt.** O prompt orienta, mas quem garante é a API: ela confere o pedido inteiro antes de baixar o estoque. Assim, mesmo que o modelo erre, um pedido inválido nunca é criado.
- **Erro vira informação.** Quando a API recusa algo (produto inexistente, falta de estoque), a tool devolve o erro ao modelo. O Ned explica ao cliente, e a conversa não quebra.
- **Memória com limite.** O Ned guarda as últimas 20 trocas da conversa. Assim ele entende referências como "o último que você me mostrou".
- **Chat no terminal**, que é o mínimo pedido. Assim o foco fica no agente.

**Desafio na migração:** as chamadas ao SDK falhavam com `403 Tenant is inactive`. Pelo CLI da Runflow, descobri que a conta que eu usava tinha sido desativada. Criei uma conta nova, e tudo funcionou.

## Testes de aceite

Conversas reais, numa única sessão, na ordem do desafio. Entre colchetes estão as chamadas que o agente fez à API. Clique em cada fluxo para ver a conversa.

<details>
<summary><b>Fluxo 1 — Listar produtos</b></summary>

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
</details>

<details>
<summary><b>Fluxo 2 — Detalhes de produto</b></summary>

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
</details>

<details>
<summary><b>Fluxo 3 — Criar pedido</b></summary>

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

A API não permite alterar pedidos, por isso o Ned criou um pedido separado e avisou o cliente.
</details>

<details>
<summary><b>Fluxo 4 — Consultar pedido</b></summary>

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
</details>

<details>
<summary><b>Fluxo 5 — Tratamento de erros</b></summary>

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

A API recusou o pedido de 1000 unidades, e nada foi criado. O estoque de 23 já desconta as 2 unidades do pedido 1044.
</details>

<details>
<summary><b>Fluxo 6 — Limites do agente</b></summary>

```text
Você: Qual a previsão do tempo em SP?
Ned: Essa eu não consigo ajudar, sou o atendimento da Tech Tudo e só posso falar sobre nossos produtos e pedidos. Se quiser, posso te ajudar a escolher um acessório para o seu setup ou consultar algum pedido.
[API: nenhuma]

Você: Cancela meu pedido 1042.
Ned: Não consigo cancelar pedidos por aqui, sinto muito. Para cancelar o pedido 1042, você vai precisar entrar em contato com a nossa equipe de atendimento.

Como o 1042 já consta como enviado, vale falar com eles o quanto antes. Posso ajudar com mais alguma coisa, como consultar outro pedido ou conferir um produto?
[API: nenhuma]
```
</details>

## Melhorias futuras

- Interface web, com um `sessionId` por cliente. O agente já está separado do terminal.
- Cancelar e alterar pedidos (novos endpoints e novas tools).
- Um banco de dados de verdade no lugar dos dados em memória.
- Publicar o agente na plataforma da Runflow (`rf agents deploy`). Para isso, a API também precisaria estar hospedada na internet.
- Testes automatizados para as tools e a API.

## Uso de IA

Usei o Claude como apoio e como professor durante todo o projeto: ele explicou os conceitos e sugeriu código nos momentos de dificuldade. Eu criei os arquivos, testei e corrigi os erros. Na reta final, usei o Claude Code para revisar o projeto, migrar para o Runflow SDK e rodar os testes de aceite. Sempre pedi o "porquê" de cada escolha, para conseguir defendê-las na entrevista.
