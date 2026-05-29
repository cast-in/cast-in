"use client";

import { useRouter } from "next/navigation";
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
import { withdrawApplicationAction } from "./actions";

export function WithdrawApplicationDialog({
  applicationId,
  jobTitle,
}: {
  applicationId: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleWithdraw() {
    const formData = new FormData();
    formData.set("application_id", applicationId);

    startTransition(async () => {
      const result = await withdrawApplicationAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("지원을 철회했어요.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            color="destructive"
            variant="ghost"
            size="sm"
            className="h-10 px-4 font-bold"
          />
        }
      >
        지원 철회
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>지원을 철회할까요?</DialogTitle>
          <DialogDescription>
            {jobTitle} 지원 내역이 삭제돼요. 이미 시작한 대화는 그대로 남아요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" color="neutral" variant="outline" />}>
            닫기
          </DialogClose>
          <Button
            type="button"
            color="destructive"
            disabled={pending}
            isLoading={pending}
            onClick={handleWithdraw}
          >
            철회하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
