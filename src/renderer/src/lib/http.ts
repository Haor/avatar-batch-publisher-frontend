import { parseApiError } from "./errors";

export async function requestJson<TResponse>(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
