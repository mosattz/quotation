const AUTH_KEY = "quotation.auth";

export function setAuth(payload) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthToken() {
  return getAuth()?.token || "";
}

export function getAuthUser() {
  return getAuth()?.user || null;
}

export function isAdminUser() {
  return getAuth()?.user?.role === "admin";
}

export function isAuthed() {
  return Boolean(getAuth()?.token);
}
