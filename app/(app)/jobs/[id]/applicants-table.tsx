"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Paperclip, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_STATUS_META,
} from "@/lib/application-status";
import { formatAttachmentSize, type AttachmentMetadata } from "@/lib/attachments";
import { cn } from "@/lib/utils";
import type { Applicant } from "@/lib/queries/jobs";
import { updateApplicationAction } from "./actions";
import { JobConversationButton } from "./job-conversation-button";
import { ApplicationStatusSelect } from "../application-status-select";

export function ApplicantsTable({ applicants }: { applicants: Applicant[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>지원 사유</TableHead>
          <TableHead>첨부</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="w-[18rem] max-w-[18rem]">내부 메모</TableHead>
          <TableHead className="w-32">액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applicants.map((applicant) => (
          <ApplicantRow key={applicant.id} applicant={applicant} />
        ))}
      </TableBody>
    </Table>
  );
}

function ApplicantRow({ applicant }: { applicant: Applicant }) {
  const [castingMemo, setCastingMemo] = useState<string | null>(
    applicant.casting_memo,
  );

  return (
    <TableRow>
      <TableCell className="font-medium">{applicant.actor_name}</TableCell>
      <TableCell className="text-muted-foreground">
        {applicant.memo ?? "—"}
      </TableCell>
      <TableCell className="min-w-[180px]">
        <AttachmentLinks attachments={applicant.attachments} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge
            color={APPLICATION_STATUS_META[applicant.status].color}
            variant={APPLICATION_STATUS_META[applicant.status].variant}
          >
            {APPLICATION_STATUS_META[applicant.status].label}
          </Badge>
          <ApplicationStatusSelect
            applicationId={applicant.id}
            applicantName={applicant.actor_name}
            initialStatus={applicant.status}
            className="h-8 min-w-28 px-3 text-xs"
          />
        </div>
      </TableCell>
      <TableCell className="w-[18rem] max-w-[18rem]">
        <CastingMemoCell
          applicantId={applicant.id}
          applicantName={applicant.actor_name}
          memo={castingMemo}
          onSaved={(next) => setCastingMemo(next)}
        />
      </TableCell>
      <TableCell className="w-32">
        <JobConversationButton
          jobId={applicant.job_id}
          actorId={applicant.actor_id}
          label="메시지"
          size="sm"
          color="primary"
          variant="fill"
        />
      </TableCell>
    </TableRow>
  );
}

function CastingMemoCell({
  applicantId,
  applicantName,
  memo,
  onSaved,
}: {
  applicantId: string;
  applicantName: string;
  memo: string | null;
  onSaved: (next: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(memo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDraft(memo ?? "");
      setError(null);
    }
  }

  function handleSave() {
    setError(null);
    const data = new FormData();
    data.set("application_id", applicantId);
    data.set("casting_memo", draft);
    startTransition(async () => {
      const result = await updateApplicationAction(data);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      onSaved(draft.trim() ? draft.trim() : null);
      setOpen(false);
      toast.success("내부 메모를 저장했어요.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-start gap-2">
        <p
          title={memo ?? undefined}
          className={cn(
            "min-w-0 flex-1 truncate text-sm leading-6",
            memo ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {memo ?? "메모 없음"}
        </p>
        <DialogTrigger
          render={
            <Button
              color="neutral"
              variant="ghost"
              size="sm"
              className="shrink-0"
              aria-label="내부 메모 수정"
            />
          }
        >
          <Pencil aria-hidden="true" className="size-4" />
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{applicantName} 내부 메모</DialogTitle>
          <DialogDescription>
            캐스팅팀만 볼 수 있어요. 지원자에게는 노출되지 않아요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={`casting-memo-${applicantId}`}>메모</Label>
          <Textarea
            id={`casting-memo-${applicantId}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="평가, 체크해야 할 점 등을 남겨두세요."
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            color="neutral" variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            닫기
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "저장하는 중이에요" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentLinks({
  attachments,
}: {
  attachments: AttachmentMetadata[];
}) {
  if (attachments.length === 0) {
    return <span className="text-sm text-muted-foreground">없음</span>;
  }

  return (
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {attachment.signedUrl ? (
            <a
              href={attachment.signedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-[220px] items-center gap-2 rounded-md text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Paperclip aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{attachment.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatAttachmentSize(attachment.size)}
              </span>
              <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
            </a>
          ) : (
            <span className="inline-flex max-w-[220px] items-center gap-2 text-sm text-muted-foreground">
              <Paperclip aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{attachment.name}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
