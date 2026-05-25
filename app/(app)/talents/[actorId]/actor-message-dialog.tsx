"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { startActorConversationAction } from "./actions";

export type ActorMessageJob = {
  id: string;
  title: string;
};

export function ActorMessageDialog({
  actorId,
  actorName,
  jobs,
  className,
}: {
  actorId: string;
  actorName: string;
  jobs: ActorMessageJob[];
  className?: string;
}) {
  const router = useRouter();
  const jobSelectId = useId();
  const messageId = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData();
    data.set("actor_id", actorId);
    data.set("message", message);
    if (selectedJobId) data.set("job_id", selectedJobId);

    startTransition(async () => {
      const result = await startActorConversationAction(data);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setOpen(false);
      setMessage("");
      toast.success("메시지를 보냈어요.");
      router.push(`/messages?room=${result.roomId}`);
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={`${actorName} 배우에게 메시지 보내기`}
        className={cn(
          buttonVariants({ color: "neutral", variant: "ghost", size: "icon-lg" }),
          "rounded-full",
          className,
        )}
        onClick={() => handleOpenChange(true)}
      >
        <Send aria-hidden="true" className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 rounded-xl p-6 sm:max-w-[520px]"
      >
        <button
          type="button"
          aria-label="닫기"
          className={cn(
            buttonVariants({ color: "neutral", variant: "ghost", size: "icon-sm" }),
            "absolute right-3 top-3",
          )}
          onClick={() => handleOpenChange(false)}
        >
          <X aria-hidden="true" className="size-4" />
        </button>

        <div className="mx-auto grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
          <Send aria-hidden="true" className="size-5" />
        </div>

        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-lg font-bold">
            {jobs.length > 0
              ? "어떤 공고로 메시지를 보낼까요?"
              : `${actorName} 배우에게 메시지를 보낼까요?`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            공고를 선택하고 배우에게 보낼 메시지를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {error ? <ErrorNotice message={error} size="sm" /> : null}

          {jobs.length > 0 ? (
            <div className="grid gap-2">
              <Label htmlFor={jobSelectId} className="sr-only">
                공고 선택
              </Label>
              <Select
                id={jobSelectId}
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="h-9 rounded-md border-primary/40 text-sm font-medium"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              모집 중인 공고가 없어 공고 없이 메시지를 보내요.
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor={messageId} className="sr-only">
              메시지
            </Label>
            <div className="relative">
              <Textarea
                id={messageId}
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="메시지를 입력해주세요."
                className="min-h-28 resize-none rounded-md pr-16"
              />
              <span className="absolute bottom-2 right-3 text-[0.7rem] text-muted-foreground">
                {message.length}/1000
              </span>
            </div>
          </div>

          <div className="flex justify-center pt-1">
            <Button
              type="submit"
              color="primary"
              className="min-w-40"
              disabled={pending || !message.trim()}
            >
              {pending ? "보내는 중이에요" : "보내기"}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
