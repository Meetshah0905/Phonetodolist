// client/src/apiClient.ts

// CORRECT SETTING FOR RENDER DEPLOYMENT:
// We use an empty string "" so it uses the current domain (https://phonetodolist-1.onrender.com)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function apiPost(path: string, body: any, token?: string) {
  // Ensure we don't have double slashes if path starts with /
  const url = `${API_BASE}${path}`;
  
  const res = await fetch(url, {
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
  const url = `${API_BASE}${path}`;
  
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res;
}