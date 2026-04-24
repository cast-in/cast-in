"use client";

import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  THEME_PREFERENCE_KEY,
  type ThemePreference,
} from "@/lib/theme";
import { Select } from "@/components/ui/select";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    label: "라이트",
    icon: Sun,
  },
  {
    value: "dark",
    label: "다크",
    icon: Moon,
  },
  {
    value: "system",
    label: "시스템",
    icon: Monitor,
  },
];

export function ThemePreferenceControl({
  initialPreference,
}: {
  initialPreference: ThemePreference;
}) {
  const [selectedTheme, setSelectedTheme] =
    useState<ThemePreference>(initialPreference);
  const selectedOption =
    THEME_OPTIONS.find((option) => option.value === selectedTheme) ??
    THEME_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  useEffect(() => {
    applyThemePreference(selectedTheme);

    if (selectedTheme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyThemePreference("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [selectedTheme]);

  return (
    <div className="max-w-sm">
      <label htmlFor="theme-preference" className="sr-only">
        화면 모드 선택
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          <SelectedIcon aria-hidden="true" className="size-4" />
        </span>
        <Select
          id="theme-preference"
          name="theme-preference"
          value={selectedTheme}
          onChange={(event) =>
            setSelectedTheme(event.target.value as ThemePreference)
          }
          className="appearance-none pr-10 pl-9"
        >
          {THEME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
          <ChevronDown aria-hidden="true" className="size-4" />
        </span>
      </div>
    </div>
  );
}

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  const resolvedTheme =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;

  root.dataset.themePreference = preference;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;

  window.localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  document.cookie = `${THEME_PREFERENCE_KEY}=${preference}; path=/; max-age=31536000; samesite=lax`;
}
