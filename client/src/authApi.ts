import { apiPost } from "./apiClient";

export type AuthResponse = {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    totalPoints: number;
    level: number;
  };
};

export async function signup(email: string, password: string, displayName?: string) {
  const res = await apiPost("/api/auth/signup", { email, password, displayName });
  return res as AuthResponse;
}

export async function login(email: string, password: string) {
  const res = await apiPost("/api/auth/login", { email, password });
  return res as AuthResponse;
}

