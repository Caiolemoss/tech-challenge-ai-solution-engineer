export type Product = {
  id: number;
  name: string;
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
  { id: 1, name: "Mouse Sem Fio", description: "Mouse ergonômico com receptor USB", price: 79.9, stock: 25 },
  { id: 2, name: "Mousepad", description: "Mousepad grande 80x30cm com base antiderrapante", price: 29.9, stock: 40 },
  { id: 3, name: "Teclado", description: "Teclado ABNT2 com fio USB, layout completo", price: 129.9, stock: 15 },
  { id: 4, name: "Pendrive 32GB", description: "Pendrive USB 3.0 com 32GB de capacidade", price: 39.9, stock: 30 },
  { id: 5, name: "Cabo Type-C", description: "Cabo USB-C de 1m com carga rápida", price: 24.9, stock: 50 },
  { id: 6, name: "Cabo USB", description: "Cabo USB-A de 1m para dados e carga", price: 14.9, stock: 0 },  
  { id: 7, name: "Caixa de Som para PC", description: "Caixa de som 2.0 USB com entrada P2", price: 89.9, stock: 10 },
];

export const orders: Order[] = [
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