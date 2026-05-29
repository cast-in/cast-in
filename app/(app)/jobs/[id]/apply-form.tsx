"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Paperclip, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_BUCKET,
  ATTACHMENT_SIGNED_URL_TTL_SECONDS,
  MAX_ATTACHMENT_COUNT,
  attachmentsToJson,
  createAttachmentMetadata,
  createAttachmentPath,
  formatAttachmentSize,
  validateAttachmentFile,
  type AttachmentMetadata,
} from "@/lib/attachments";
import type { JobApplicationQuestion } from "@/lib/queries/jobs";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { applyToJobAction } from "./actions";

export function ApplyForm({
  actorId,
  jobId,
  questions = [],
  className,
}: {
  actorId: string;
  jobId: string;
  questions?: JobApplicationQuestion[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const keepSubmittedAttachmentsRef = useRef(false);
  const attachmentInputId = `${jobId}-application-attachments`;
  const attachmentHelpId = `${attachmentInputId}-help`;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    data.set("job_id", jobId);
    data.set("attachments", JSON.stringify(attachmentsToJson(attachments)));
    startTransition(async () => {
      const result = await applyToJobAction(data);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
      } else {
        keepSubmittedAttachmentsRef.current = true;
        setSubmitted(true);
        setOpen(false);
        setAttachments([]);
        toast.success("지원했어요.");
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      keepSubmittedAttachmentsRef.current = false;
      setError(null);
    }
    if (!nextOpen && !submitted && !keepSubmittedAttachmentsRef.current) {
      void removeAttachments(attachments);
    }
  }

  async function handleAttachmentChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    let nextCount = attachments.length;
    setError(null);
    setUploading(true);

    try {
      for (const file of files) {
        if (nextCount >= MAX_ATTACHMENT_COUNT) {
          const message = "첨부 파일은 최대 5개까지 보낼 수 있어요.";
          setError(message);
          toast.error(message);
          break;
        }

        const validationError = validateAttachmentFile(file);
        if (validationError) {
          setError(validationError);
          toast.error(validationError);
          continue;
        }

        const supabase = createClient();
        const path = createAttachmentPath({
          file,
          scope: "applications",
          targetId: jobId,
          userId: actorId,
        });
        const { error: uploadError } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          setError(uploadError.message);
          toast.error(uploadError.message);
          continue;
        }

        const { data: signed } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .createSignedUrl(path, ATTACHMENT_SIGNED_URL_TTL_SECONDS);
        const attachment = {
          ...createAttachmentMetadata({ file, path }),
          signedUrl: signed?.signedUrl ?? null,
        };
        setAttachments((current) => [...current, attachment]);
        nextCount += 1;
      }
    } finally {
      setUploading(false);
    }
  }

  async function removeAttachment(attachment: AttachmentMetadata) {
    setAttachments((current) =>
      current.filter((item) => item.id !== attachment.id),
    );
    await createClient().storage.from(ATTACHMENT_BUCKET).remove([attachment.path]);
  }

  async function removeAttachments(items: AttachmentMetadata[]) {
    setAttachments([]);
    const paths = items.map((item) => item.path);
    if (paths.length > 0) {
      await createClient().storage.from(ATTACHMENT_BUCKET).remove(paths);
    }
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

          {questions.length > 0 ? (
            <div className="grid gap-3 border-t pt-4">
              {questions.map((question) => (
                <div key={question.id} className="grid gap-2">
                  <Label htmlFor={`question-${question.id}`}>
                    {question.label}
                    {question.required ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </Label>
                  <Input
                    id={`question-${question.id}`}
                    name={`question_${question.id}`}
                    aria-required={question.required}
                    placeholder="답변을 입력해주세요"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 border-t pt-4">
            <div className="grid gap-2">
              <Label htmlFor={attachmentInputId}>첨부 파일</Label>
              <p
                id={attachmentHelpId}
                className="text-sm text-muted-foreground"
              >
                PDF, 이미지, MP4 또는 MOV 파일을 최대 5개까지 첨부할 수 있어요.
              </p>
              <input
                id={attachmentInputId}
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                disabled={pending || uploading || attachments.length >= MAX_ATTACHMENT_COUNT}
                aria-describedby={attachmentHelpId}
                onChange={handleAttachmentChange}
                className="sr-only"
              />
              <label
                htmlFor={attachmentInputId}
                aria-disabled={
                  pending || uploading || attachments.length >= MAX_ATTACHMENT_COUNT
                }
                className={cn(
                  buttonVariants({
                    color: "neutral",
                    variant: "outline",
                    size: "sm",
                  }),
                  "relative w-fit",
                  (pending ||
                    uploading ||
                    attachments.length >= MAX_ATTACHMENT_COUNT) &&
                    "pointer-events-none opacity-50",
                )}
              >
                {uploading ? (
                  <Loader2
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 animate-spin"
                  />
                ) : null}
                <span
                  className={cn(
                    "inline-flex items-center justify-center [gap:inherit]",
                    uploading && "opacity-0",
                  )}
                >
                  <Paperclip aria-hidden="true" className="size-4" />
                  파일 첨부
                </span>
              </label>

              {attachments.length > 0 ? (
                <ul className="grid gap-2" aria-label="첨부한 파일">
                  {attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        {attachment.signedUrl ? (
                          <a
                            href={attachment.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            {attachment.name}
                          </a>
                        ) : (
                          <p className="truncate font-medium">
                            {attachment.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatAttachmentSize(attachment.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        color="neutral"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${attachment.name} 첨부 제거`}
                        disabled={pending || uploading}
                        onClick={() => void removeAttachment(attachment)}
                      >
                        <X aria-hidden="true" className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" color="neutral" variant="ghost" disabled={pending || uploading} />}
            >
              닫기
            </DialogClose>
            <Button
              type="submit"
              disabled={pending || uploading}
              isLoading={pending}
            >
              최종 제출
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
