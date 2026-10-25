import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { config } from "../config";
import { functionDeclarations, executeTool } from "../tools";
import { SYSTEM_PROMPT } from "./system-prompt";

const MAX_STEPS = 6; // trava de segurança contra loops infinitos de tools
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// Se o Gemini estiver sobrecarregado (503) ou no limite por minuto (429), espera e tenta de novo.
async function generateWithRetry(contents: Content[]) {
  const maxAttempts = 4;
  for (let attempt = 1; ; attempt++) {
    try {
      return await ai.models.generateContent({
        model: config.geminiModel,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations }],
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const code =
        (err as { status?: number }).status ?? Number(/"code":(\d+)/.exec(message)?.[1]);
      const dailyQuota = message.includes("PerDay");
      const retryable = code === 503 || (code === 429 && !dailyQuota);
      if (!retryable || attempt >= maxAttempts) throw err;
      const waitMs = code === 429 ? 15000 : 3000 * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

export function createAgent() {
  const history: Content[] = []; // memória da sessão

  async function send(userText: string): Promise<string> {
    const checkpoint = history.length;
    history.push({ role: "user", parts: [{ text: userText }] });

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        const response = await generateWithRetry(history);

        const modelContent = response.candidates?.[0]?.content;
        if (!modelContent) {
          return "Desculpe, não consegui gerar uma resposta agora. Pode tentar de novo?";
        }
        history.push(modelContent); // intacto, com as assinaturas de raciocínio

        const calls = response.functionCalls ?? [];
        if (calls.length === 0) {
          return response.text ?? "";
        }

        const resultParts: Part[] = [];
        for (const call of calls) {
          const result = await executeTool(call.name ?? "", call.args ?? {});
          resultParts.push({
            functionResponse: { id: call.id, name: call.name, response: result },
          });
        }
        history.push({ role: "user", parts: resultParts });
      }
      return "Não consegui concluir seu pedido agora. Pode reformular?";
    } catch (err) {
      history.length = checkpoint; // desfaz o turno com falha para não corromper o histórico
      throw err;
    }
  }

  return { send };
}