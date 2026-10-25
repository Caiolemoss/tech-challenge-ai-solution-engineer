import { config } from "../config";

export type ApiResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

async function request(path: string, init?: RequestInit): Promise<ApiResult> {
  try {
    const res = await fetch(`${config.apiBaseUrl}${path}`, init);
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const message = (body as { error?: string } | null)?.error ?? `Erro ${res.status}`;
      return { ok: false, error: message };
    }
    return { ok: true, data: body };
  } catch {
    return {
      ok: false,
      error: "Não foi possível conectar ao sistema da loja. Tente novamente em instantes.",
    };
  }
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: unknown) =>
    request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};