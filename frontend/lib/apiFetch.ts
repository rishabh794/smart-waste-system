export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // Get the signed token from our Next.js endpoint
  const tokenRes = await fetch('/api/auth/token');
  
  if (!tokenRes.ok) {
    throw new Error('Failed to get auth token');
  }

  const { token } = await tokenRes.json();

  return fetch(`http://localhost:5000${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`, 
    },
  });
};