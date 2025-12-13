import { apiPost } from "./apiClient";

export async function signup(fullName: string, email: string, password: string) {
  const res = await apiPost("/api/auth/signup", {
    fullName,
    email,
    password,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Signup failed" }));
    throw new Error(error.message || "Signup failed");
  }
  
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await apiPost("/api/auth/login", {
    email,
    password,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Login failed");
  }
  
  return res.json();
}

