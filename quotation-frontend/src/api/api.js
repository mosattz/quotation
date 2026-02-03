import { getAuthToken } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function withAuth(headers = {}) {
  const token = getAuthToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

// Centralized API helpers.
export async function apiGet(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    ...options,
    headers: withAuth(options.headers),
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }
  return response.json();
}

export async function apiPost(path, body, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: withAuth({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
    body: JSON.stringify(body),
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `POST ${path} failed with ${response.status}`);
  }
  return response.json();
}

export async function apiPut(path, body, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: withAuth({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
    body: JSON.stringify(body),
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `PUT ${path} failed with ${response.status}`);
  }
  return response.json();
}

export async function apiDelete(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    ...options,
    headers: withAuth(options.headers),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `DELETE ${path} failed with ${response.status}`);
  }
  return response.json();
}
