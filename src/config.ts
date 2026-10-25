import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name} (veja o .env.example)`);
  }
  return value;
}

export const config = {
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3000",
};