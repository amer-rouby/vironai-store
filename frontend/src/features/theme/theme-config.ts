export const THEMES = [
  { id: "bronze", swatch: "#4a2420", accent: "#c89b7b" },
  { id: "rose", swatch: "#8c3b52", accent: "#e0a3b1" },
  { id: "olive", swatch: "#4f5530", accent: "#a9a878" },
  { id: "noir", swatch: "#1c1c1c", accent: "#b8a07e" },
] as const;

export const MODES = ["light", "dark", "system"] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type Mode = (typeof MODES)[number];

export const DEFAULT_THEME: ThemeId = "bronze";
export const DEFAULT_MODE: Mode = "system";

export const STORAGE_KEYS = { theme: "vr-theme", mode: "vr-mode" } as const;

/**
 * Runs before first paint (inlined in <head>) so the correct palette and mode are applied
 * without a light-mode flash. Kept dependency-free and defensive: storage may be unavailable.
 */
export const themeBootScript = `(function(){try{
var d=document.documentElement,t=null,m=null;
try{t=localStorage.getItem("${STORAGE_KEYS.theme}");m=localStorage.getItem("${STORAGE_KEYS.mode}");}catch(e){}
var themes=${JSON.stringify(THEMES.map((t) => t.id))};
if(themes.indexOf(t)<0)t="${DEFAULT_THEME}";
if(["light","dark","system"].indexOf(m)<0)m="${DEFAULT_MODE}";
var dark=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
d.setAttribute("data-theme",t);d.classList.toggle("dark",dark);
}catch(e){}})();`;
