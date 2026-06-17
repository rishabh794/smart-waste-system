const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // Route authenticated API requests through the secure Next.js proxy
  // to avoid exposing the backend JWT to the browser.
  const proxyUrl = url.replace(/^\/api\//, '/api/proxy/');

  return fetch(proxyUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};

export const apiFetchPublic = (url: string, options: RequestInit = {}) => {
  return fetch(`${backendBaseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};
