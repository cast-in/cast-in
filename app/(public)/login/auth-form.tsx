"use client";

import { useActionState } from "react";
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
import { OAuthButtons } from "./oauth-buttons";

export type AuthMode = "signin" | "reset";

type AuthFormProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
};

const authLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:underline disabled:pointer-events-none disabled:opacity-50";

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  return (
    <div className="space-y-4">
      {mode === "signin" ? (
        <>
          <SignInForm onForgot={() => onModeChange("reset")} />
          <AuthDivider />
          <OAuthButtons />
        </>
      ) : (
        <ResetForm onBack={() => onModeChange("signin")} />
      )}
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span>또는</span>
      <div className="h-px flex-1 bg-border" />
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
      </div>

      <Button type="submit" isLoading={pending} className="mt-2 w-full">
        로그인하기
      </Button>

      <AuthLinks onForgot={onForgot} />
    </form>
  );
}

function AuthLinks({ onForgot }: { onForgot: () => void }) {
  return (
    <div className="flex items-center justify-center gap-4 text-sm">
      <Link href="/signup" className={authLinkClass}>
        회원가입
      </Link>
      <span className="h-3 w-px bg-border" aria-hidden="true" />
      <button type="button" className={authLinkClass} onClick={onForgot}>
        비밀번호 재설정
      </button>
    </div>
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

      <Button type="submit" isLoading={pending} className="mt-2 w-full">
        재설정 메일 보내기
      </Button>
      <div className="flex justify-center">
        <button
          type="button"
          className={authLinkClass}
          disabled={pending}
          onClick={onBack}
        >
          로그인
        </button>
      </div>
    </form>
  );
}
