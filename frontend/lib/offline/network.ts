const EXTERNAL_PROBE_URL = "https://connectivitycheck.gstatic.com/generate_204";
const PROBE_TIMEOUT_MS = 4000;

export const isBrowserOnline = () =>
  typeof navigator !== "undefined" ? navigator.onLine : true;

export const probeExternalConnectivity = async (): Promise<boolean> => {
  if (!isBrowserOnline()) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    await fetch(EXTERNAL_PROBE_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

export const isEffectivelyOnline = async (): Promise<boolean> => {
  if (!isBrowserOnline()) {
    return false;
  }

  return probeExternalConnectivity();
};

export const isNetworkError = (error: unknown) => {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("load failed") ||
      message.includes("auth token") ||
      message.includes("upload") ||
      message.includes("aborted")
    );
  }

  return false;
};

export const isAuthError = (response: Response) =>
  response.status === 401 || response.status === 403;
