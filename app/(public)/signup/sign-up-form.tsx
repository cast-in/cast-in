"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpFormAction, type AuthResult } from "../login/actions";

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthResult | null, FormData>(
    signUpFormAction,
    null,
  );
  const error = state && !state.ok ? state.error : null;
  const notice = state && state.ok ? (state.message ?? null) : null;

  return (
    <div className="space-y-4">
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

        <div className="grid gap-2">
          <Label htmlFor="password">
            비밀번호 <span className="text-muted-foreground">(6자 이상)</span>
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="비밀번호"
          />
        </div>

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "처리하는 중이에요" : "가입하고 시작하기"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          로그인하기
        </Link>
      </p>
    </div>
  );
}
