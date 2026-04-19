import { apiFetch } from "@/lib/apiFetch";

export const fetchApiJson = async <T>(url: string): Promise<T> => {
  const res = await apiFetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return res.json() as Promise<T>;
};

export const getApiErrorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();

    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  } catch {
    // Fall through to fallback message when response body is not JSON.
  }

  return fallback;
};
