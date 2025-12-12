import { apiPost } from "./apiClient";

export async function signup(fullName: string, email: string, password: string) {
  const res = await apiPost("/api/auth/signup", {
    fullName,
    email,
    password,
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await apiPost("/api/auth/login", {
    email,
    password,
  });
  return res.json();
}

