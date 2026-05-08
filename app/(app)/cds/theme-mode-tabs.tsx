"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { THEME_PREFERENCE_KEY } from "@/lib/theme";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ThemeMode = "light" | "dark";

export function ThemeModeTabs() {
  const [mode, setMode] = useState<ThemeMode>(getCurrentThemeMode);

  function handleValueChange(value: string | null) {
    if (value !== "light" && value !== "dark") return;

    setMode(value);
    applyThemeMode(value);
  }

  return (
    <Tabs value={mode} onValueChange={handleValueChange}>
      <TabsList aria-label="화면 모드" className="h-9">
        <TabsTrigger value="light" className="min-w-16 px-2">
          <Sun aria-hidden="true" />
          라이트
        </TabsTrigger>
        <TabsTrigger value="dark" className="min-w-16 px-2">
          <Moon aria-hidden="true" />
          다크
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function getCurrentThemeMode(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;

  root.dataset.themePreference = mode;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;

  window.localStorage.setItem(THEME_PREFERENCE_KEY, mode);
  document.cookie = `${THEME_PREFERENCE_KEY}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
