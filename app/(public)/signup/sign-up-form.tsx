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
            비밀번호{" "}
            <span className="text-muted-foreground">
              (8자 이상, 영문과 숫자 포함)
            </span>
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="비밀번호"
          />
        </div>

        <fieldset className="grid gap-3 rounded-lg border bg-muted/20 p-3">
          <legend className="sr-only">개인정보 수집 동의</legend>
          <ConsentCheckbox
            id="privacy_consent"
            name="privacy_consent"
            required
            disabled={pending}
            label="[필수] 개인정보 수집 및 이용에 동의해요"
          />
          <ConsentCheckbox
            id="marketing_consent"
            name="marketing_consent"
            disabled={pending}
            label="[선택] 광고·마케팅 정보 수신에 동의해요"
          />
        </fieldset>

        <Button type="submit" isLoading={pending} className="mt-2 w-full">
          이메일로 가입하기
        </Button>
      </form>

      <div className="flex justify-center">
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function ConsentCheckbox({
  id,
  name,
  label,
  required = false,
  disabled = false,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        value="accepted"
        required={required}
        disabled={disabled}
        className="mt-0.5 size-5 shrink-0 rounded-sm border border-input accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      />
      <label htmlFor={id} className="text-sm font-medium leading-5">
        <span>{label}</span>
      </label>
    </div>
  );
}
