"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  requestPasswordResetAction,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "reset";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const action =
        mode === "signin"
          ? signInWithPassword
          : mode === "signup"
            ? signUpWithPassword
            : requestPasswordResetAction;
      const result = await action(data);
      if (result?.ok) setNotice(result.message ?? null);
      else if (result && !result.ok) setError(result.error);
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
              setNotice(null);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "signin" ? "로그인" : "새로 시작하기"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && <ErrorNotice message={error} size="sm" />}
        {notice && (
          <div
            className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
            role="status"
          >
            {notice}
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

        {mode !== "reset" && (
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
              placeholder="비밀번호"
            />
            {mode === "signin" ? (
              <button
                type="button"
                className="w-fit text-sm text-primary hover:underline"
                onClick={() => {
                  setMode("reset");
                  setError(null);
                  setNotice(null);
                }}
              >
                비밀번호를 잊었나요?
              </button>
            ) : null}
          </div>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending
            ? "처리하는 중이에요"
            : mode === "signin"
              ? "로그인하기"
              : mode === "signup"
                ? "가입하고 시작하기"
                : "비밀번호 재설정 메일 받기"}
        </Button>
        {mode === "reset" ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setMode("signin");
              setError(null);
              setNotice(null);
            }}
          >
            로그인하기
          </Button>
        ) : null}
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
        Google 로그인은 준비 중이에요
      </Button>
    </div>
  );
}
