"use client";

import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Repeat2, Settings } from "lucide-react";
import { switchActiveRoleAction } from "@/app/(app)/settings/actions";
import { getRoleModeLabel } from "@/lib/app-ia";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/enums";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

type HeaderUserMenuProps = {
  activeRole: UserRole;
  availableRoles: UserRole[];
  profileName: string;
  userEmail?: string | null;
};

export function HeaderUserMenu({
  activeRole,
  availableRoles,
  profileName,
  userEmail,
}: HeaderUserMenuProps) {
  const otherRole: UserRole = activeRole === "actor" ? "casting" : "actor";
  const otherRoleEnabled = availableRoles.includes(otherRole);

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="프로필 메뉴 열기"
        render={
          <Button
            variant="outline"
            className="hidden h-auto items-center gap-2 rounded-full px-3 py-1.5 md:flex"
          />
        }
      >
        <span className="max-w-28 truncate text-sm font-medium">
          {profileName}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={12}>
          <Popover.Popup
            initialFocus={false}
            className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-[28px] border bg-popover p-3 text-popover-foreground shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
          >
            <Popover.Title className="sr-only">프로필 메뉴</Popover.Title>

            <div className="p-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
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
                <form action={switchActiveRoleAction}>
                  <input type="hidden" name="role" value={otherRole} />
                  {/* Keep this as a native submit button so keyboard users get the expected form behavior. */}
                  <button
                    type="submit"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
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
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-between",
                  )}
                >
                  <span>{getRoleModeLabel(otherRole)} 추가</span>
                  <Repeat2 aria-hidden="true" className="size-4" />
                </Link>
              )}

              <Link
                href="/settings"
                className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-between")}
              >
                <span>설정</span>
                <Settings aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}
