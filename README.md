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
Ned: Oi! Aqui é o Ned, da Tech Tudo. Temos bastante coisa para computador e celular. Vou listar por categoria:

Mouse: tenho sem fio da Nexa, mais confortável na mão e recarregável por USB, por R$ 79,90, e também sem fio da Orbit, mais compacto e bom para levar na mochila, por R$ 59,90.

Teclado: tenho com fio da Volt, padrão ABNT2 com ç e teclado numérico, por R$ 129,90, e sem fio Bluetooth da Nexa, que conecta em até dois aparelhos, por R$ 159,90.

Mousepad: da Orbit, grande (80x30 cm), cabe mouse e teclado, com base antiderrapante, por R$ 29,90.

Armazenamento: pendrive de 32GB da Nexa, USB 3.0, por R$ 39,90.

Cabos: cabo USB-C de 1 metro da Orbit, que aceita carregamento rápido, por R$ 24,90.

Caixa de som para PC da Nexa, compacta, com USB e entrada P2, por R$ 89,90.

Quer que eu detalhe algum desses ou já monte um pedido?
[API: GET /products]

Você: Me mostra só os produtos que estão em estoque.
Ned: Estes estão disponíveis agora:

Mouse sem fio da Nexa, por R$ 79,90, e mouse sem fio da Orbit, por R$ 59,90. Também tenho teclado com fio da Volt, por R$ 129,90, e teclado sem fio da Nexa, por R$ 159,90.

Do mousepad da Orbit, por R$ 29,90, tenho em estoque. O pendrive de 32GB da Nexa, por R$ 39,90, também está disponível, assim como o cabo USB-C de 1 metro da Orbit, por R$ 24,90, e a caixa de som para PC da Nexa, por R$ 89,90.

O único que está em falta é o cabo USB comum da Volt.

Quer que eu detalhe algum deles ou já monte um pedido?
[API: GET /products]
```
</details>

<details>
<summary><b>Fluxo 2 — Detalhes de produto</b></summary>

```text
Você: Me conta mais sobre o produto 3.
Ned: O produto 3 é o teclado com fio da Volt, por R$ 129,90. Ele se conecta por USB e tem o padrão ABNT2, com ç e teclado numérico. As teclas são macias e silenciosas, então dá para usar o dia todo, seja trabalhando ou estudando, sem incomodar quem está por perto.

Quer que eu monte um pedido com ele?
[API: GET /products/3, GET /products]

Você: E quanto custa o produto 2?
Ned: O produto 2 é o mousepad da Orbit, por R$ 29,90. Ele é grande, de 80x30 cm, cabe mouse e teclado, e a base antiderrapante evita que ele saia do lugar na mesa.

Quer que eu inclua no pedido?
[API: GET /products/2]
```
</details>

<details>
<summary><b>Fluxo 3 — Criar pedido</b></summary>

```text
Você: Quero comprar 2 unidades do produto 1 e 1 unidade do produto 4.
Ned: Pedido criado! O número é 1044 e ficou assim:

2 unidades do mouse sem fio da Nexa, a R$ 79,90 cada, e 1 pendrive de 32GB da Nexa, a R$ 39,90.

O total é R$ 199,70. O pedido está aguardando envio.

Precisa de mais alguma coisa?
[API: GET /products/1, GET /products/4, POST /orders]

Você: Adiciona também 3 unidades do último que você me mostrou.
Ned: Pronto! Como pedidos não podem ser alterados depois de criados, fiz um pedido separado: o número é 1045, com 3 unidades do mousepad da Orbit, a R$ 29,90 cada. O total é R$ 89,70 e o pedido está aguardando envio.

Precisa de mais alguma coisa?
[API: POST /orders]
```

A API não permite alterar pedidos, por isso o Ned criou um pedido separado e avisou o cliente.
</details>

<details>
<summary><b>Fluxo 4 — Consultar pedido</b></summary>

```text
Você: Qual o status do pedido 1042?
Ned: O pedido 1042 já foi enviado. Ele tem 2 unidades do cabo USB-C de 1 metro da Orbit, a R$ 24,90 cada, com total de R$ 49,80.

Precisa de mais alguma coisa?
[API: GET /orders/1042, GET /products/5]

Você: E o que eu pedi nele mesmo?
Ned: No pedido 1042 você comprou 2 unidades do cabo USB-C de 1 metro da Orbit, a R$ 24,90 cada, com total de R$ 49,80. Ele já foi enviado. O cabo serve para celular e outros aparelhos com entrada Type-C.

Precisa de mais alguma coisa?
[API: GET /orders/1042, GET /products/5]
```
</details>

<details>
<summary><b>Fluxo 5 — Tratamento de erros</b></summary>

```text
Você: Me fala do produto 999.
Ned: Não encontrei nenhum produto com o código 999 na loja. Confere se o número está certo? Se quiser, posso listar os produtos disponíveis para você escolher.
[API: GET /products/999]

Você: Quero comprar 1000 unidades do produto 1.
Ned: Não consegui fazer esse pedido. O mouse sem fio da Nexa tem só 23 unidades disponíveis, e 1000 é bem mais do que isso.

Posso fazer o pedido com até 23 unidades. Se preferir, também tenho o mouse sem fio da Orbit, por R$ 59,90. Quantas unidades você quer?
[API: POST /orders]

Você: Qual o status do pedido 9999?
Ned: Não encontrei nenhum pedido com o número 9999. Confere se o número está certo? Se você tiver o número do pedido que procura, posso consultar para você.
[API: GET /orders/9999]
```

A API recusou o pedido de 1000 unidades, e nada foi criado. O estoque de 23 já desconta as 2 unidades do pedido 1044.
</details>

<details>
<summary><b>Fluxo 6 — Limites do agente</b></summary>

```text
Você: Qual a previsão do tempo em SP?
Ned: Essa eu não consigo ajudar, sou o atendente da Tech Tudo e só tenho informações sobre produtos e pedidos da loja. Se quiser, posso te ajudar a escolher um mouse, um teclado ou outro acessório, ou consultar algum pedido seu.
[API: nenhuma]

Você: Cancela meu pedido 1042.
Ned: Não consigo cancelar pedidos nem fazer alterações em pedidos já criados. Também não tenho como registrar esse tipo de pedido por aqui.

Posso te ajudar com outra coisa, como consultar o status de algum pedido ou montar um novo.
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
