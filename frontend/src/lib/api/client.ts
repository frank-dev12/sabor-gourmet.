export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/** Error normalizado a partir del ProblemDetail que devuelve el backend. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errores: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

export function withQuery(path: string, query: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      cache: "no-store",
      headers: json !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(`No se pudo conectar con el servidor (${API_URL}). ¿Está corriendo el backend?`, 0);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.detail ?? `Error ${response.status}`, response.status, body?.errores ?? {});
  }
  return body as T;
}

/** Mensaje legible para mostrar en la UI, incluyendo los errores de validación por campo. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    const campos = Object.entries(error.errores).map(([campo, msg]) => `${campo}: ${msg}`);
    return campos.length ? `${error.message}. ${campos.join(" · ")}` : error.message;
  }
  return error instanceof Error ? error.message : "Error inesperado";
}
