"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_MODE, DEFAULT_THEME, MODES, STORAGE_KEYS, THEMES, type Mode, type ThemeId } from "./theme-config";

interface ThemeContextValue {
  theme: ThemeId;
  mode: Mode;
  resolvedMode: "light" | "dark";
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_IDS = THEMES.map((t) => t.id);

// Preferences live in localStorage; this tiny store lets React subscribe to them (and to other tabs).
const listeners = new Set<() => void>();
// Fallback when storage is blocked (private mode, disabled cookies): choices persist for this page only.
const memory = new Map<string, string>();
const notify = () => listeners.forEach((l) => l());

function subscribePreferences(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = (localStorage.getItem(key) ?? memory.get(key) ?? null) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    const value = memory.get(key) as T | undefined;
    return value && allowed.includes(value) ? value : fallback;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the in-memory value above still applies until reload */
  }
  notify();
}

const DARK_QUERY = "(prefers-color-scheme: dark)";
function subscribeSystem(listener: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribePreferences,
    () => read(STORAGE_KEYS.theme, THEME_IDS, DEFAULT_THEME),
    () => DEFAULT_THEME,
  );
  const mode = useSyncExternalStore(
    subscribePreferences,
    () => read(STORAGE_KEYS.mode, MODES, DEFAULT_MODE),
    () => DEFAULT_MODE,
  );
  const systemDark = useSyncExternalStore(subscribeSystem, () => window.matchMedia(DARK_QUERY).matches, () => false);

  const resolvedMode: "light" | "dark" = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  // Sync the <html> element (the boot script already did this before first paint).
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", resolvedMode === "dark");
  }, [theme, resolvedMode]);

  const setTheme = useCallback((next: ThemeId) => write(STORAGE_KEYS.theme, next), []);
  const setMode = useCallback((next: Mode) => write(STORAGE_KEYS.mode, next), []);

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode }),
    [theme, mode, resolvedMode, setTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
