import { createTool } from "@runflow-ai/sdk";
import { z } from "zod";
import { api } from "./api-client";

// O schema Zod vira a descrição de parâmetros que o modelo enxerga e também valida os argumentos
// antes do execute. Se a validação falhar, o SDK devolve o erro ao modelo em vez de quebrar o turno.
export const tools = {
  list_products: createTool({
    id: "list_products",
    description:
      "Lista todos os produtos da loja, com id, nome, descrição, preço em reais e quantidade em estoque. " +
      "Use quando o cliente quiser ver o catálogo, saber o que está disponível ou filtrar produtos em estoque.",
    inputSchema: z.object({}),
    execute: () => api.get("/products"),
  }),

  get_product: createTool({
    id: "get_product",
    description:
      "Busca os detalhes de UM produto pelo id (nome, descrição, preço e estoque). " +
      "Use quando o cliente perguntar sobre um produto específico, como preço ou disponibilidade.",
    inputSchema: z.object({
      product_id: z.number().int().describe("Id numérico do produto."),
    }),
    execute: ({ context }) => api.get(`/products/${context.product_id}`),
  }),

  get_order_status: createTool({
    id: "get_order_status",
    description:
      "Consulta um pedido pelo id e devolve status (pending, shipped ou delivered), itens, total e data. " +
      "Use quando o cliente perguntar sobre um pedido existente.",
    inputSchema: z.object({
      order_id: z.number().int().describe("Id numérico do pedido."),
    }),
    execute: ({ context }) => api.get(`/orders/${context.order_id}`),
  }),

  create_order: createTool({
    id: "create_order",
    description:
      "Cria um pedido novo com um ou mais itens. Só chame quando o cliente tiver confirmado claramente " +
      "quais produtos e quantidades quer. Devolve o pedido criado com id e total, ou um erro (por exemplo, estoque insuficiente).",
    inputSchema: z.object({
      items: z
        .array(
          z.object({
            product_id: z.number().int().describe("Id do produto."),
            quantity: z.number().int().positive().describe("Quantidade desejada (inteiro maior que zero)."),
          })
        )
        .min(1)
        .describe("Lista de itens do pedido."),
    }),
    execute: ({ context }) =>
      api.post(
        "/orders",
        context.items.map((i) => ({ productId: i.product_id, quantity: i.quantity }))
      ),
  }),
};
