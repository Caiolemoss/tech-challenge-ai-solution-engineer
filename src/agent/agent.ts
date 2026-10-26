import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { config } from "../config";
import { functionDeclarations, executeTool } from "../tools";
import { SYSTEM_PROMPT } from "./system-prompt";

const MAX_STEPS = 6; // trava de segurança contra loops infinitos de tools

// O SDK repete sozinho, com backoff exponencial, quando o modelo está sobrecarregado (503) ou no limite (429).
const ai = new GoogleGenAI({
  apiKey: config.geminiApiKey,
  httpOptions: { retryOptions: { attempts: 4, initialDelay: 5, httpStatusCodes: [429, 503] } },
});

export function createAgent() {
  const history: Content[] = []; // memória da sessão

  async function send(userText: string): Promise<string> {
    const checkpoint = history.length;
    history.push({ role: "user", parts: [{ text: userText }] });

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        const response = await ai.models.generateContent({
          model: config.geminiModel,
          contents: history,
          config: { systemInstruction: SYSTEM_PROMPT, tools: [{ functionDeclarations }] },
        });

        const modelContent = response.candidates?.[0]?.content;
        if (!modelContent) break;
        // Vai intacto para o histórico: o Gemini 3 exige receber de volta as assinaturas de raciocínio.
        history.push(modelContent);

        const calls = response.functionCalls ?? [];
        if (calls.length === 0) return response.text ?? "";

        const parts: Part[] = [];
        for (const call of calls) {
          const result = await executeTool(call.name ?? "", call.args ?? {});
          parts.push({ functionResponse: { id: call.id, name: call.name, response: result } });
        }
        history.push({ role: "user", parts });
      }
    } catch (err) {
      history.length = checkpoint; // desfaz o turno com falha para não corromper o histórico
      throw err;
    }

    // Resposta vazia ou MAX_STEPS esgotado: desfaz o turno incompleto também.
    history.length = checkpoint;
    return "Não consegui concluir seu pedido agora. Pode reformular?";
  }

  return { send };
}
