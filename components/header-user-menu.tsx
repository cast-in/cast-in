"use client";

import Link from "next/link";
import { Bookmark, ChevronDown, LogOut, Repeat2, Settings, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { signOutAction } from "@/app/(public)/login/actions";
import { switchActiveRoleAction } from "@/app/(app)/settings/actions";
import { getRoleModeLabel } from "@/lib/app-ia";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/enums";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

type HeaderUserMenuProps = {
  activeRole: UserRole;
  availableRoles: UserRole[];
  profileName: string;
  avatarUrl?: string | null;
  userEmail?: string | null;
};

export function HeaderUserMenu({
  activeRole,
  availableRoles,
  profileName,
  avatarUrl,
  userEmail,
}: HeaderUserMenuProps) {
  const otherRole: UserRole = activeRole === "actor" ? "casting" : "actor";
  const otherRoleEnabled = availableRoles.includes(otherRole);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuTitleId = `${menuId}-title`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    // Escape mirrors native popover/menu dismissal for keyboard users.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        ref={triggerRef}
        type="button"
        aria-label="프로필 메뉴 열기"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          buttonVariants({ color: "neutral", variant: "outline", size: "md" }),
          "items-center gap-2 rounded-full py-1 px-2",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar size="sm">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={`${profileName} 프로필 사진`} />
          ) : null}
          <AvatarFallback>
            {getAvatarFallback(profileName || userEmail || "U")}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-28 truncate text-sm font-medium">
          {profileName}
        </span>
        <Badge color="primary" variant="soft-outline" size="sm">
          {getRoleTriggerLabel(activeRole)}
        </Badge>
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-labelledby={menuTitleId}
          className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border bg-popover p-3 text-popover-foreground shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        >
          <h2 id={menuTitleId} className="sr-only">프로필 메뉴</h2>

          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={`${profileName} 프로필 사진`} />
                ) : null}
                <AvatarFallback>
                  {getAvatarFallback(profileName || userEmail || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{profileName}</p>
                  <Badge>{getRoleModeLabel(activeRole)}</Badge>
                </div>
                {userEmail ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {otherRoleEnabled ? (
              <form action={switchActiveRoleAction} onSubmit={() => setOpen(false)}>
                <input type="hidden" name="role" value={otherRole} />
                {/* Keep this as a native submit button so keyboard users get the expected form behavior. */}
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ color: "neutral", variant: "ghost" }),
                    "w-full justify-between",
                  )}
                >
                  <span>{getRoleModeLabel(otherRole)}로 전환</span>
                  <Repeat2 aria-hidden="true" className="size-4" />
                </button>
              </form>
            ) : (
              <Link
                href={`/onboarding/profile?role=${otherRole}&intent=add`}
                className={cn(
                  buttonVariants({ color: "neutral", variant: "ghost" }),
                  "w-full justify-between",
                )}
                onClick={() => setOpen(false)}
              >
                <span>{getRoleModeLabel(otherRole)} 추가</span>
                <Repeat2 aria-hidden="true" className="size-4" />
              </Link>
            )}

            <Link
              href="/profile"
              className={cn(buttonVariants({ color: "neutral", variant: "ghost" }), "w-full justify-between")}
              onClick={() => setOpen(false)}
            >
              <span>내 프로필</span>
              <UserRound aria-hidden="true" className="size-4" />
            </Link>

            <Link
              href="/bookmarks"
              className={cn(buttonVariants({ color: "neutral", variant: "ghost" }), "w-full justify-between")}
              onClick={() => setOpen(false)}
            >
              <span>저장한 항목</span>
              <Bookmark aria-hidden="true" className="size-4" />
            </Link>

            <Link
              href="/settings"
              className={cn(buttonVariants({ color: "neutral", variant: "ghost" }), "w-full justify-between")}
              onClick={() => setOpen(false)}
            >
              <span>설정</span>
              <Settings aria-hidden="true" className="size-4" />
            </Link>

            <form action={signOutAction} onSubmit={() => setOpen(false)}>
              <button
                type="submit"
                className={cn(
                  buttonVariants({ color: "neutral", variant: "ghost" }),
                  "w-full justify-between text-destructive hover:bg-destructive/10 hover:text-destructive",
                )}
              >
                <span>로그아웃</span>
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}

function getRoleTriggerLabel(role: UserRole) {
  return role === "actor" ? "배우" : "캐스팅";
}
