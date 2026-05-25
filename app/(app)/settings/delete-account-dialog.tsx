"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "./actions";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const canDelete = confirmText.trim() === "삭제";

  function handleDelete() {
    if (!canDelete) return;

    const formData = new FormData();
    formData.set("confirm_text", confirmText);

    startTransition(async () => {
      const result = await deleteAccountAction(formData);
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setConfirmText("");
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            color="destructive"
            variant="outline"
          />
        }
      >
        계정 삭제
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>계정을 삭제할까요?</DialogTitle>
          <DialogDescription>
            프로필, 공고, 지원 내역, 메시지가 삭제돼요. 되돌릴 수 없어요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="delete-confirm">아래에 삭제를 입력해주세요.</Label>
          <Input
            id="delete-confirm"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            disabled={pending}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button
                type="button"
                color="neutral"
                variant="outline"
                disabled={pending}
              />
            }
          >
            닫기
          </DialogClose>
          <Button
            type="button"
            color="destructive"
            disabled={!canDelete || pending}
            onClick={handleDelete}
          >
            {pending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            삭제하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
