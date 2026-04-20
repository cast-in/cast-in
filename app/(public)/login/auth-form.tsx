"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signInWithPassword, signUpWithPassword } from "./actions";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const action =
        mode === "signin" ? signInWithPassword : signUpWithPassword;
      const result = await action(data);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "signin" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">
            비밀번호{" "}
            {mode === "signup" && (
              <span className="text-muted-foreground">(6자 이상)</span>
            )}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 6 : undefined}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending
            ? "잠시만 기다려주세요..."
            : mode === "signin"
              ? "로그인"
              : "가입하고 시작하기"}
        </Button>
      </form>

      <div className="relative my-2">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
          또는
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled
        className="w-full"
        title="곧 준비돼요"
      >
        Google로 계속하기 · 곧 준비돼요
      </Button>
    </div>
  );
}
