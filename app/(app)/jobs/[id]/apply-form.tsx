"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { applyToJobAction } from "./actions";

export function ApplyForm({
  jobId,
  className,
}: {
  jobId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
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
        setOpen(false);
        setSubmitted(true);
        toast.success("지원했어요.");
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setError(null);
  }

  if (submitted) {
    return (
      <Button type="button" disabled className={cn("w-full", className)}>
        지원 완료
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button type="button" className={cn("w-full", className)} />}
      >
        지원하기
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>지원 사유</DialogTitle>
          <DialogDescription>
            선택 사항이에요. 강점이나 가능한 일정을 짧게 남겨보세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <ErrorNotice message={error} size="sm" />}

          <div className="grid gap-2">
            <Label htmlFor="memo">지원 사유</Label>
            <Textarea
              id="memo"
              name="memo"
              rows={5}
              placeholder="예: 액션 연기 경험이 있고, 다음 주 평일 촬영 가능해요."
            />
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" color="neutral" variant="ghost" disabled={pending} />}
            >
              닫기
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "제출하는 중이에요" : "최종 제출"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
