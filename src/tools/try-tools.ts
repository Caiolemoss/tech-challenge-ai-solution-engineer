import { executeTool } from "./index";

async function show(name: string, args: Record<string, unknown>) {
  console.log(`\n> ${name}`, JSON.stringify(args));
  console.log(JSON.stringify(await executeTool(name, args), null, 2));
}

async function main() {
  await show("list_products", {});
  await show("get_product", { product_id: 3 });
  await show("get_product", { product_id: 999 });
  await show("create_order", { items: [{ product_id: 5, quantity: 1 }] });
  await show("create_order", { items: [{ product_id: 6, quantity: 1 }] });
  await show("get_order_status", { order_id: 1042 });
  await show("get_order_status", { order_id: 9999 });
}

main();