"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJobAction } from "./actions";

export function NewJobForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    if (submitter?.value) data.set("status", submitter.value);

    startTransition(async () => {
      const result = await createJobAction(data);
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
        <Label htmlFor="title">공고 제목</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="드라마 [도시의 밤] 조연 모집"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="genre">장르</Label>
          <Input
            id="genre"
            name="genre"
            placeholder="드라마 / 영화 / 광고 / 뮤지컬"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="region">촬영 지역</Label>
          <Input id="region" name="region" placeholder="서울" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="deadline">마감 일시</Label>
        <Input id="deadline" name="deadline" type="datetime-local" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="requirements">요건 (쉼표 구분)</Label>
        <Input
          id="requirements"
          name="requirements"
          placeholder="20대 여성, 연기 경력 2년 이상, 드라마 경험"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">상세 설명</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          placeholder="프로젝트 소개, 촬영 일정, 페이 조건 등"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <Button
          type="submit"
          name="status"
          value="open"
          disabled={pending}
          className="flex-1"
        >
          {pending ? "올리는 중이에요" : "공고 올리기"}
        </Button>
        <Button
          type="submit"
          name="status"
          value="draft"
          disabled={pending}
          variant="secondary"
        >
          임시저장
        </Button>
      </div>
    </form>
  );
}
