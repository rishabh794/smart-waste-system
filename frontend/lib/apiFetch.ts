const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // Read the existing Express JWT from NextAuth's encrypted cookie (no re-signing).
  const tokenRes = await fetch("/api/auth/token");

  if (!tokenRes.ok) {
    throw new Error("Failed to get auth token");
  }

  const { token } = await tokenRes.json();

  return fetch(`${backendBaseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
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
