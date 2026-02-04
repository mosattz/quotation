import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { getAuthUser } from "../utils/auth";

const STORAGE_KEY = "quotation.theme";

function getUserKey() {
  const user = getAuthUser();
  return user?.id ? `user:${user.id}` : user?.email ? `user:${user.email}` : "guest";
}

function getStoredTheme() {
  const key = `${STORAGE_KEY}:${getUserKey()}`;
  try {
    const stored = localStorage.getItem(key);
    return stored === "dark" || stored === "light" ? stored : "light";
  } catch {
    return "light";
  }
}

function applyThemeToDom(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  useEffect(() => {
    const syncFromStorage = () => {
      const next = getStoredTheme();
      setThemeState(next);
    };
    syncFromStorage();
    window.addEventListener("quotation:auth", syncFromStorage);
    return () => window.removeEventListener("quotation:auth", syncFromStorage);
  }, []);

  const setTheme = (next) => {
    const value = next === "dark" ? "dark" : "light";
    const key = `${STORAGE_KEY}:${getUserKey()}`;
    setThemeState(value);
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

