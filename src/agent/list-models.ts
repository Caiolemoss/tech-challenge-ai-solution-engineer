import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

async function main() {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const pager = await ai.models.list();
  for await (const model of pager) {
    console.log(model.name);
  }
}

main().catch((err) => {
  console.error("Falhou:", err.message);
  process.exitCode = 1;
});