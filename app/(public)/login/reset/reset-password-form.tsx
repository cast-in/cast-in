"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "../actions";

export function ResetPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePasswordAction(data);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error ? <ErrorNotice message={error} size="sm" /> : null}

      <div className="grid gap-2">
        <Label htmlFor="password">새 비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="6자 이상"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password_confirm">새 비밀번호 확인</Label>
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="한 번 더 입력"
        />
      </div>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "변경하는 중이에요" : "비밀번호 바꾸기"}
      </Button>
      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        로그인하기
      </Link>
    </form>
  );
}
