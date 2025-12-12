import { apiGet, apiPost } from "./apiClient";

export async function getTodos(token: string) {
  const res = await apiGet("/api/todos", token);
  return res.json();
}

export async function addTodo(
  token: string,
  todo: { title: string; description?: string; dueDate?: string },
) {
  const res = await apiPost("/api/todos", todo, token);
  return res.json();
}

