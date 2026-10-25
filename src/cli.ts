import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createAgent } from "./agent/agent";

async function main() {
  const agent = createAgent();
  const rl = createInterface({ input, output });

  console.log("Atendimento da loja. Digite 'sair' para encerrar.\n");

  try {
    while (true) {
      const text = (await rl.question("Você: ")).trim();
      if (!text) continue;
      if (text.toLowerCase() === "sair") break;

      try {
        const reply = await agent.send(text);
        console.log(`\nAgente: ${reply}\n`);
      } catch (err) {
        console.log("\nAgente: Tive um problema técnico agora. Pode tentar de novo em instantes?\n");
        console.error("[debug]", err instanceof Error ? err.message : err);
      }
    }
  } finally {
    rl.close();
  }
}

main();