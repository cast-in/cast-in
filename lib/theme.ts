export const THEME_PREFERENCE_KEY = "castin-theme";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export function isThemePreference(
  value: string | null | undefined,
): value is ThemePreference {
  return THEME_PREFERENCES.some((theme) => theme === value);
}

export function getThemePreferenceScript() {
  return `
    (function () {
      try {
        var root = document.documentElement;
        root.dataset.themePreference = "light";
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      } catch (error) {
        console.error("Failed to apply theme preference", error);
      }
    })();
  `;
}
