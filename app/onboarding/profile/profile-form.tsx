"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveOnboardingProfile } from "./actions";

export type ProfileFormDefaults = {
  name?: string;
  // actor
  birth_date?: string | null;
  region?: string | null;
  genres?: string[] | null;
  bio?: string | null;
  skills?: string[] | null;
  visibility?: "public" | "connections" | "private" | null;
  // casting
  company_name?: string | null;
  contact?: string | null;
  intro?: string | null;
};

export function ProfileForm({
  role,
  defaults,
  defaultName,
  submitLabel,
  extended = false,
  redirectTo,
}: {
  role: "actor" | "casting";
  defaults?: ProfileFormDefaults;
  defaultName?: string;
  submitLabel?: string;
  extended?: boolean;
  redirectTo?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const d: ProfileFormDefaults = defaults ?? {};
  const nameDefault = d.name ?? defaultName ?? "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    data.set("role", role);
    if (redirectTo) data.set("redirect_to", redirectTo);
    startTransition(async () => {
      const result = await saveOnboardingProfile(data);
      if (result && !result.ok) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && <ErrorNotice message={error} size="sm" />}

      <div className="grid gap-2">
        <Label htmlFor="name">
          {role === "actor" ? "이름 / 활동명" : "담당자 이름"}
        </Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={nameDefault}
          placeholder={role === "actor" ? "홍길동" : "김담당"}
        />
      </div>

      {role === "actor" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="birth_date">생년월일</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                defaultValue={d.birth_date ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="region">활동 지역</Label>
              <Input
                id="region"
                name="region"
                defaultValue={d.region ?? ""}
                placeholder="서울 · 경기"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="genres">관심 장르 (쉼표로 구분)</Label>
            <Input
              id="genres"
              name="genres"
              defaultValue={(d.genres ?? []).join(", ")}
              placeholder="드라마, 광고, 뮤지컬"
            />
          </div>
          {extended && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="skills">특기 (쉼표로 구분)</Label>
                <Input
                  id="skills"
                  name="skills"
                  defaultValue={(d.skills ?? []).join(", ")}
                  placeholder="보컬, 승마, 영어"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">자기소개</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={5}
                  defaultValue={d.bio ?? ""}
                  placeholder="강점과 분위기를 짧게 남겨보세요."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="visibility">프로필 공개 범위</Label>
                <Select
                  id="visibility"
                  name="visibility"
                  defaultValue={d.visibility ?? "public"}
                >
                  <option value="public">전체 공개</option>
                  <option value="connections">연결된 캐스팅만</option>
                  <option value="private">비공개</option>
                </Select>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-2">
            <Label htmlFor="company_name">회사명</Label>
            <Input
              id="company_name"
              name="company_name"
              required
              defaultValue={d.company_name ?? ""}
              placeholder="예: 캐스트인 스튜디오"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">연락처</Label>
            <Input
              id="contact"
              name="contact"
              defaultValue={d.contact ?? ""}
              placeholder="010-0000-0000 또는 이메일"
            />
          </div>
          {extended && (
            <div className="grid gap-2">
              <Label htmlFor="intro">회사 소개</Label>
              <Textarea
                id="intro"
                name="intro"
                rows={5}
                defaultValue={d.intro ?? ""}
                placeholder="어떤 프로젝트를 주로 진행하나요?"
              />
            </div>
          )}
        </>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "저장하는 중이에요" : (submitLabel ?? "캐스트인 시작하기")}
      </Button>
    </form>
  );
}
