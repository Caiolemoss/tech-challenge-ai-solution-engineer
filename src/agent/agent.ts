import { config } from "../config"; // primeiro: carrega o .env antes do SDK ler as variáveis dele
import { randomUUID } from "node:crypto";
import { Agent, openrouter } from "@runflow-ai/sdk";
import { tools } from "../tools";
import { SYSTEM_PROMPT } from "./system-prompt";

// O Agent do Runflow SDK faz o loop de tool calling: chama o modelo, executa as tools pedidas,
// devolve os resultados e repete até vir uma resposta em texto (ou até maxToolIterations).
const ned = new Agent({
  name: "Ned",
  instructions: SYSTEM_PROMPT,
  model: openrouter(config.llmModel, { apiKey: config.openrouterKey }),
  tools,
  maxToolIterations: 6, // trava de segurança contra loops infinitos de tools
  memory: { maxTurns: 20 }, // guarda as últimas 20 trocas da sessão
});

export function createAgent() {
  const sessionId = randomUUID(); // cada agente tem a sua conversa na memória do SDK

  async function send(userText: string): Promise<string> {
    const result = await ned.process({ message: userText, sessionId });
    return result.message;
  }

  return { send, sessionId};
}
