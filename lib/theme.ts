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
        var key = "${THEME_PREFERENCE_KEY}";
        var root = document.documentElement;
        var stored = localStorage.getItem(key);
        var cookieMatch = document.cookie.match(new RegExp("(?:^|; )" + key + "=([^;]+)"));
        var cookieValue = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        var preference = stored || cookieValue || "system";

        if (!["light", "dark", "system"].includes(preference)) {
          preference = "system";
        }

        var resolved =
          preference === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : preference;

        root.dataset.themePreference = preference;
        root.classList.toggle("dark", resolved === "dark");
        root.style.colorScheme = resolved;
      } catch (error) {
        console.error("Failed to apply theme preference", error);
      }
    })();
  `;
}
