"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { Applicant } from "@/lib/queries/jobs";
import type { ApplicationStatus } from "@/types/enums";
import { updateApplicationAction } from "./actions";

const STATUS_OPTIONS: {
  value: ApplicationStatus;
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
}[] = [
  { value: "pending", label: "대기", variant: "secondary" },
  { value: "reviewing", label: "검토중", variant: "default" },
  { value: "pass", label: "합격", variant: "default" },
  { value: "hold", label: "보류", variant: "outline" },
  { value: "reject", label: "반려", variant: "destructive" },
];

const STATUS_META = Object.fromEntries(
  STATUS_OPTIONS.map((opt) => [opt.value, opt]),
) as Record<ApplicationStatus, (typeof STATUS_OPTIONS)[number]>;

export function ApplicantsTable({ applicants }: { applicants: Applicant[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>지원 사유</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>내부 메모</TableHead>
          <TableHead>액션</TableHead>
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
  const [status, setStatus] = useState<ApplicationStatus>(applicant.status);
  const [castingMemo, setCastingMemo] = useState<string | null>(
    applicant.casting_memo,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitStatus(next: ApplicationStatus) {
    const prev = status;
    setStatus(next);
    setError(null);
    const data = new FormData();
    data.set("application_id", applicant.id);
    data.set("status", next);
    startTransition(async () => {
      const result = await updateApplicationAction(data);
      if (!result.ok) {
        setStatus(prev);
        setError(result.error);
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{applicant.actor_name}</TableCell>
      <TableCell className="text-muted-foreground">
        {applicant.memo ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_META[status].variant}>
            {STATUS_META[status].label}
          </Badge>
          <select
            value={status}
            onChange={(e) => submitStatus(e.target.value as ApplicationStatus)}
            disabled={pending}
            aria-label="상태 변경"
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {pending && (
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </TableCell>
      <TableCell className="max-w-[240px]">
        <CastingMemoCell
          applicantId={applicant.id}
          applicantName={applicant.actor_name}
          memo={castingMemo}
          onSaved={(next) => setCastingMemo(next)}
        />
      </TableCell>
      <TableCell>
        <Link
          href={`/messages?applicant=${applicant.actor_id}`}
          className={buttonVariants({ size: "sm" })}
        >
          <MessageSquare aria-hidden="true" className="size-4" />
          메시지
        </Link>
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
        return;
      }
      onSaved(draft.trim() ? draft.trim() : null);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-start gap-2">
        <p
          className={cn(
            "flex-1 text-sm leading-6",
            memo ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {memo ?? "메모 없음"}
        </p>
        <DialogTrigger
          render={<Button variant="ghost" size="sm" aria-label="내부 메모 수정" />}
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
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
