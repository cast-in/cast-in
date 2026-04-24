"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { applyToJobAction } from "./actions";

export function ApplyForm({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    data.set("job_id", jobId);
    startTransition(async () => {
      const result = await applyToJobAction(data);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setSubmitted(true);
        toast.success("지원했어요. 메시지에서 대화를 이어갈 수 있어요.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-primary/10 p-4" role="status">
        <p className="font-medium text-foreground">지원했어요</p>
        <p className="mt-1 text-sm text-muted-foreground">
          메시지에서 캐스팅팀과 바로 대화할 수 있어요.
        </p>
        <Link
          href={`/messages?job=${jobId}`}
          className={cn(buttonVariants({ size: "sm" }), "mt-4")}
        >
          대화 보기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && <ErrorNotice message={error} size="sm" />}

      <div className="grid gap-2">
        <Label htmlFor="memo">캐스팅팀에게 전할 말 (선택)</Label>
        <Textarea
          id="memo"
          name="memo"
          rows={4}
          placeholder="강점이나 가능한 일정을 짧게 남겨보세요."
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "지원하는 중이에요" : "지원하고 대화 시작하기"}
      </Button>
    </form>
  );
}
