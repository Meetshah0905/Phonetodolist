// client/src/apiClient.ts

// CORRECT SETTING FOR RENDER DEPLOYMENT:
// We use an empty string "" so it uses the current domain (https://phonetodolist-1.onrender.com)
// CHANGE THIS LINE:
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function apiPost(path: string, body: any, token?: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  return res;
}

export async function apiGet(path: string, token?: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res;
}