"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOnboardingProfile } from "./actions";

export function ProfileForm({
  role,
  defaultName,
  submitLabel,
}: {
  role: "actor" | "casting";
  defaultName?: string;
  submitLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    data.set("role", role);
    startTransition(async () => {
      const result = await saveOnboardingProfile(data);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="name">
          {role === "actor" ? "이름 / 활동명" : "담당자 이름"}
        </Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          placeholder={role === "actor" ? "홍길동" : "김담당"}
        />
      </div>

      {role === "actor" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="age">연령</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min={5}
                max={100}
                placeholder="27"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="region">활동 지역</Label>
              <Input id="region" name="region" placeholder="서울 · 경기" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="genres">관심 장르 (쉼표로 구분)</Label>
            <Input
              id="genres"
              name="genres"
              placeholder="드라마, 광고, 뮤지컬"
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-2">
            <Label htmlFor="company_name">회사명</Label>
            <Input
              id="company_name"
              name="company_name"
              required
              placeholder="예: 캐스트인 스튜디오"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">연락처</Label>
            <Input
              id="contact"
              name="contact"
              placeholder="010-0000-0000 또는 이메일"
            />
          </div>
        </>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "저장하는 중..." : (submitLabel ?? "캐스트인 시작하기")}
      </Button>
    </form>
  );
}
