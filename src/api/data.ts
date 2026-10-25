export type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
};

export type OrderItem = {
  productId: number;
  quantity: number;
};

export type Order = {
  id: number;
  items: OrderItem[];
  total: number;
  status: "pending" | "shipped" | "delivered";
  createdAt: string;
};

export const products: Product[] = [
  { id: 1, name: "Mouse Sem Fio", brand: "Nexa", description: "Mouse sem fio bem ergonômico e confortável na mão, com ajuste de velocidade do cursor em 3 níveis. Recarrega por cabo USB, então não precisa de pilha.", price: 79.9, stock: 25 },
  { id: 2, name: "Mousepad", brand: "Orbit", description: "Mousepad grande, de 80x30cm, que cobre mouse e teclado. Base antiderrapante, não fica escorregando na mesa.", price: 29.9, stock: 40 },
  { id: 3, name: "Teclado", brand: "Volt", description: "Teclado com fio USB, padrão ABNT2 (com ç e teclado numérico). Teclas macias e silenciosas, bom para trabalhar ou estudar.", price: 129.9, stock: 15 },
  { id: 4, name: "Pendrive 32GB", brand: "Nexa", description: "Pendrive USB 3.0 de 32GB, bom para transferir arquivos rápido e levar documentos e fotos.", price: 39.9, stock: 30 },
  { id: 5, name: "Cabo Type-C", brand: "Orbit", description: "Cabo USB-C de 1 metro, aceita carregamento rápido. Serve para celular e outros aparelhos com entrada Type-C.", price: 24.9, stock: 50 },
  { id: 6, name: "Cabo USB", brand: "Volt", description: "Cabo USB comum (USB-A) de 1 metro, para carregar e passar dados.", price: 14.9, stock: 0 },
  { id: 7, name: "Caixa de Som para PC", brand: "Nexa", description: "Caixa de som para computador com conexão USB e entrada P2. Compacta, ideal para deixar na mesa.", price: 89.9, stock: 10 },
  { id: 8, name: "Mouse Sem Fio", brand: "Orbit", description: "Mouse sem fio compacto, ótimo para levar na mochila. Funciona com 1 pilha AA, que dura bastante, e tem ajuste de velocidade em 2 níveis.", price: 59.9, stock: 12 },
  { id: 9, name: "Teclado Sem Fio", brand: "Nexa", description: "Teclado sem fio por Bluetooth, padrão ABNT2, que conecta em até 2 aparelhos (por exemplo, computador e celular).", price: 159.9, stock: 8 },
];

export const orders: Order[] = [
  {
    id: 1041,
    items: [{ productId: 1, quantity: 5 }],
    total: 399.5,
    status: "shipped",
    createdAt: "2026-10-18T11:30:00.000Z",
  },
  {
    id: 1042,
    items: [{ productId: 5, quantity: 2 }],
    total: 49.8,
    status: "shipped",
    createdAt: "2026-10-18T14:30:00.000Z",
  },
  {
    id: 1043,
    items: [{ productId: 7, quantity: 1 }],
    total: 89.9,
    status: "delivered",
    createdAt: "2026-10-10T09:15:00.000Z",
  },
];