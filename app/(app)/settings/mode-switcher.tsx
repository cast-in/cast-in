"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { getRoleModeLabel } from "@/lib/app-ia";
import type { UserRole } from "@/types/enums";
import { switchActiveRoleAction } from "./actions";

const ROLES = ["actor", "casting"] as const;

export function ModeSwitcher({
  activeRole,
  availableRoles,
}: {
  activeRole: UserRole;
  availableRoles: readonly UserRole[];
}) {
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (role: UserRole) => {
    if (role === activeRole) return;
    if (!availableRoles.includes(role)) return;
    setPendingRole(role);
  };

  const handleConfirm = () => {
    if (!pendingRole) return;
    const formData = new FormData();
    formData.set("role", pendingRole);
    startTransition(async () => {
      await switchActiveRoleAction(formData);
    });
  };

  return (
    <>
      <div className="grid gap-4">
        {ROLES.map((role) => {
          const enabled = availableRoles.includes(role);
          const active = activeRole === role;

          return (
            <div
              key={role}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{getRoleModeLabel(role)}</span>
                {!enabled ? <Badge variant="secondary">미추가</Badge> : null}
              </div>

              {enabled ? (
                <Switch
                  checked={active}
                  disabled={active || isPending}
                  onCheckedChange={() => handleToggle(role)}
                  aria-label={`${getRoleModeLabel(role)}로 전환`}
                />
              ) : (
                <Link
                  href={`/onboarding/profile?role=${role}&intent=add`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  추가하기
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={pendingRole !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRole(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingRole ? getRoleModeLabel(pendingRole) : ""}로 전환할까요?
            </DialogTitle>
            <DialogDescription>
              활동 모드를 바꾸면 메뉴와 화면 구성이 새 모드에 맞게 전환돼요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRole(null)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isPending}>
              전환하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
