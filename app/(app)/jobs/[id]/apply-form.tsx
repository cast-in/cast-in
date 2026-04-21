"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyToJobAction } from "./actions";

export function ApplyForm({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    data.set("job_id", jobId);
    startTransition(async () => {
      const result = await applyToJobAction(data);
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
        <Label htmlFor="memo">지원 메모 (선택)</Label>
        <Textarea
          id="memo"
          name="memo"
          rows={4}
          placeholder="캐스팅에게 전할 첫 메시지를 남겨보세요. 입력하면 지원과 동시에 대화방으로 전송돼요."
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "지원하는 중..." : "지원하기"}
      </Button>
    </form>
  );
}
