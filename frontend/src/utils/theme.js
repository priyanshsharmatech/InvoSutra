// Light/dark theme helpers (class-based, persisted in localStorage).
export const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
};

export const getStoredTheme = () => localStorage.getItem("theme") || "light";

export const initTheme = () => applyTheme(getStoredTheme());

export const toggleTheme = () => {
  const next = getStoredTheme() === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
  return next;
};
