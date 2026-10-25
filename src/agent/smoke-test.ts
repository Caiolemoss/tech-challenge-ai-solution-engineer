import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

async function main() {
  const model = process.argv[2] ?? config.geminiModel;
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const response = await ai.models.generateContent({
    model,
    contents: "Responda apenas: funcionando!",
  });
  console.log(`[${model}]`, response.text);
}

main().catch((err) => {
  console.error("Falhou:", err.message);
  process.exitCode = 1;
});