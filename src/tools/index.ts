import { Type, type FunctionDeclaration } from "@google/genai";
import { api, type ApiResult } from "./api-client";

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "list_products",
    description:
      "Lista todos os produtos da loja, com id, nome, descrição, preço em reais e quantidade em estoque. " +
      "Use quando o cliente quiser ver o catálogo, saber o que está disponível ou filtrar produtos em estoque.",
  },
  {
    name: "get_product",
    description:
      "Busca os detalhes de UM produto pelo id (nome, descrição, preço e estoque). " +
      "Use quando o cliente perguntar sobre um produto específico, como preço ou disponibilidade.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        product_id: { type: Type.INTEGER, description: "Id numérico do produto." },
      },
      required: ["product_id"],
    },
  },
  {
    name: "get_order_status",
    description:
      "Consulta um pedido pelo id e devolve status (pending, shipped ou delivered), itens, total e data. " +
      "Use quando o cliente perguntar sobre um pedido existente.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        order_id: { type: Type.INTEGER, description: "Id numérico do pedido." },
      },
      required: ["order_id"],
    },
  },
  {
    name: "create_order",
    description:
      "Cria um pedido novo com um ou mais itens. Só chame quando o cliente tiver confirmado claramente " +
      "quais produtos e quantidades quer. Devolve o pedido criado com id e total, ou um erro (por exemplo, estoque insuficiente).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          description: "Lista de itens do pedido.",
          items: {
            type: Type.OBJECT,
            properties: {
              product_id: { type: Type.INTEGER, description: "Id do produto." },
              quantity: { type: Type.INTEGER, description: "Quantidade desejada (inteiro maior que zero)." },
            },
            required: ["product_id", "quantity"],
          },
        },
      },
      required: ["items"],
    },
  },
];

type Args = Record<string, unknown>;

const handlers: Record<string, (args: Args) => Promise<ApiResult>> = {
  list_products: () => api.get("/products"),

  get_product: ({ product_id }) => api.get(`/products/${Number(product_id)}`),

  get_order_status: ({ order_id }) => api.get(`/orders/${Number(order_id)}`),

  create_order: async ({ items }) => {
    if (!Array.isArray(items)) {
      return { ok: false, error: "Parâmetro 'items' inválido: informe uma lista de itens." };
    }
    const payload = items.map((i: { product_id: unknown; quantity: unknown }) => ({
      productId: Number(i.product_id),
      quantity: Number(i.quantity),
    }));
    return api.post("/orders", payload);
  },
};

export async function executeTool(name: string, args: Args): Promise<ApiResult> {
  const handler = handlers[name];
  if (!handler) {
    return { ok: false, error: `Ferramenta desconhecida: ${name}` };
  }
  try {
    return await handler(args);
  } catch {
    // Argumentos malformados do modelo viram erro para ele ler, em vez de derrubar o turno.
    return { ok: false, error: `Argumentos inválidos para ${name}.` };
  }
}