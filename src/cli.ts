import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ApiError } from "@google/genai";
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

      process.stdout.write("\nNed está digitando...");
      try {
        const reply = await agent.send(text);
        process.stdout.write("\r\x1b[K");
        console.log(`Ned: ${reply}\n`);
      } catch (err) {
        process.stdout.write("\r\x1b[K");
        const outOfQuota = err instanceof ApiError && err.status === 429;
        console.log(
          outOfQuota
            ? "Ned: Estou com muitos atendimentos agora e não consigo responder. Pode tentar de novo mais tarde?\n"
            : "Ned: Tive um problema técnico agora. Pode tentar de novo em instantes?\n"
        );
        console.error("[debug]", (err instanceof Error ? err.message : String(err)).slice(0, 300));
      }
    }
  } finally {
    rl.close();
  }
}

main();