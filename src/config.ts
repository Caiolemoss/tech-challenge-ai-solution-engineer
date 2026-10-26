import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name} (veja o .env.example)`);
  }
  return value;
}

// O Runflow SDK lê RUNFLOW_API_KEY e RUNFLOW_TENANT_ID direto do ambiente; conferimos aqui para falhar logo no início.
required("RUNFLOW_API_KEY");
required("RUNFLOW_TENANT_ID");

export const config = {
  llmModel: process.env.LLM_MODEL ?? "anthropic/claude-haiku-5.5",
  // Opcional: sem ela, a Runflow usa a credencial do OpenRouter cadastrada no painel.
  openrouterKey: process.env.OPENROUTER_KEY || undefined,
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3000",
};
