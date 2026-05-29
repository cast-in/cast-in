"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  APPLICATION_STATUS_META,
  APPLICATION_STATUS_OPTIONS,
  toSelectableApplicationStatus,
  type SelectableApplicationStatus,
} from "@/lib/application-status";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/enums";
import { updateApplicationAction } from "./[id]/actions";

const statusDotClass: Record<SelectableApplicationStatus, string> = {
  reviewing: "bg-warning",
  pass: "bg-primary",
  hold: "bg-blue-500",
  reject: "bg-destructive",
};

type ApplicationStatusSelectProps = {
  applicationId: string;
  applicantName: string;
  initialStatus: ApplicationStatus;
  className?: string;
};

export function ApplicationStatusSelect({
  applicationId,
  applicantName,
  initialStatus,
  className,
}: ApplicationStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [pendingStatus, setPendingStatus] =
    useState<SelectableApplicationStatus | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const selectedStatus = toSelectableApplicationStatus(status);
  const selectedMeta = APPLICATION_STATUS_META[selectedStatus];

  function handleSelect(next: SelectableApplicationStatus) {
    setOpen(false);
    if (next === status) return;
    setPendingStatus(next);
  }

  function confirmStatus() {
    if (!pendingStatus) return;

    const next = pendingStatus;
    const prev = status;
    setStatus(next);
    setPendingStatus(null);

    const data = new FormData();
    data.set("application_id", applicationId);
    data.set("status", next);

    startTransition(async () => {
      const result = await updateApplicationAction(data);
      if (!result.ok) {
        setStatus(prev);
        toast.error(result.error);
        return;
      }

      toast.success(
        `${applicantName}님 상태를 ${APPLICATION_STATUS_META[next].label}(으)로 변경했어요.`,
      );
      router.refresh();
    });
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            color="primary"
            variant="outline"
            aria-label={`${applicantName} 지원 상태 변경`}
            disabled={pending}
            isLoading={pending}
            className={cn(
              "min-w-32 justify-between rounded-xl px-4 font-bold",
              className,
            )}
          />
        }
      >
        <span>{selectedMeta.label}</span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 gap-1 rounded-xl p-2 shadow-lg"
      >
        {APPLICATION_STATUS_OPTIONS.map((option) => {
          const value = option.value as SelectableApplicationStatus;
          const selected = value === selectedStatus;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected && "bg-primary-soft text-primary",
              )}
              onClick={() => handleSelect(value)}
              disabled={pending}
            >
              {selected ? (
                <Check aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    statusDotClass[value],
                  )}
                />
              )}
              <span>{option.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>

      <Dialog
        open={pendingStatus !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPendingStatus(null);
        }}
      >
        <DialogContent showCloseButton={false} className="gap-6 p-6 text-center">
          <DialogHeader className="items-center">
            <DialogTitle className="text-lg">지원 상태 변경</DialogTitle>
            <DialogDescription className="text-base">
              {applicantName}님 상태를{" "}
              {pendingStatus && APPLICATION_STATUS_META[pendingStatus].label}
              (으)로 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mx-0 mb-0 flex-row justify-center border-0 bg-transparent p-0">
            <Button
              color="neutral"
              variant="outline"
              className="flex-1"
              onClick={() => setPendingStatus(null)}
            >
              취소
            </Button>
            <Button className="flex-1" onClick={confirmStatus}>
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
