import express from "express";
import { products, orders, Order, OrderItem } from "./data";

const app = express();
app.use(express.json());

app.get("/products", (_req, res) => {
  res.json(products);
});

app.get("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  res.json(product);
});

app.get("/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado" });
    return;
  }
  res.json(order);
});

app.post("/orders", (req, res) => {
  const items: OrderItem[] = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Envie uma lista com ao menos um item: [{ productId, quantity }]" });
    return;
  }

  // Soma as quantidades por produto, para que um item repetido não fure o estoque
  const quantities = new Map<number, number>();
  for (const item of items) {
    if (!Number.isInteger(item?.quantity) || item.quantity <= 0) {
      res.status(400).json({ error: "A quantidade deve ser um inteiro maior que zero" });
      return;
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  // 1ª passada: valida tudo ANTES de mexer no estoque
  let total = 0;
  for (const [productId, quantity] of quantities) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ error: `Produto ${productId} não encontrado` });
      return;
    }
    if (product.stock < quantity) {
      res.status(400).json({
        error: `Estoque insuficiente para "${product.name}": pedido ${quantity}, disponível ${product.stock}`,
      });
      return;
    }
    total += product.price * quantity;
  }

  // 2ª passada: tudo válido, agora sim baixa o estoque
  for (const [productId, quantity] of quantities) {
    products.find((p) => p.id === productId)!.stock -= quantity;
  }

  const order: Order = {
    id: Math.max(...orders.map((o) => o.id)) + 1,
    items,
    total: Math.round(total * 100) / 100,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  res.status(201).json(order);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API mock rodando em http://localhost:${PORT}`);
});