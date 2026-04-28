"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetFormAction,
  signInFormAction,
  type AuthResult,
} from "./actions";

type Mode = "signin" | "reset";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <div className="space-y-4">
      {mode === "signin" ? (
        <SignInForm onForgot={() => setMode("reset")} />
      ) : (
        <ResetForm onBack={() => setMode("signin")} />
      )}

      {mode === "signin" ? (
        <p className="text-center text-sm text-muted-foreground">
          처음이신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            새로 시작하기
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const [state, action, pending] = useActionState<AuthResult | null, FormData>(
    signInFormAction,
    null,
  );
  const error = state && !state.ok ? state.error : null;

  return (
    <form action={action} className="grid gap-4">
      {error ? <ErrorNotice message={error} size="sm" /> : null}

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
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="비밀번호"
        />
        <button
          type="button"
          className="w-fit text-sm text-primary hover:underline"
          onClick={onForgot}
        >
          비밀번호를 잊었나요?
        </button>
      </div>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "처리하는 중이에요" : "로그인하기"}
      </Button>
    </form>
  );
}

function ResetForm({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState<AuthResult | null, FormData>(
    requestPasswordResetFormAction,
    null,
  );
  const error = state && !state.ok ? state.error : null;
  const notice = state && state.ok ? (state.message ?? null) : null;

  return (
    <form action={action} className="grid gap-4">
      {error ? <ErrorNotice message={error} size="sm" /> : null}
      {notice ? (
        <div
          className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
          role="status"
        >
          {notice}
        </div>
      ) : null}

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

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "처리하는 중이에요" : "비밀번호 재설정 메일 받기"}
      </Button>
      <Button type="button" variant="ghost" disabled={pending} onClick={onBack}>
        로그인으로 돌아가기
      </Button>
    </form>
  );
}
