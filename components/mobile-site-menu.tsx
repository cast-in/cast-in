"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { APP_TABS, getRoleModeLabel } from "@/lib/app-ia";
import type { UserRole } from "@/types/enums";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BrandLogo } from "@/components/brand-logo";

type MobileSiteMenuProps = {
  activeRole: UserRole;
  profileName: string;
  avatarUrl?: string | null;
  userEmail?: string | null;
  counts?: {
    messages?: number;
    notifications?: number;
  };
};

export function MobileSiteMenu({
  activeRole,
  profileName,
  avatarUrl,
  userEmail,
  counts = {},
}: MobileSiteMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const tabs = APP_TABS[activeRole];
  const profileSubtitle = getRoleModeLabel(activeRole);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}
      >
        <Menu aria-hidden="true" />
        <span className="sr-only">메뉴 열기</span>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="top-20 w-[calc(100%-2rem)] max-w-none translate-x-[-50%] translate-y-0 gap-0 rounded-[28px] p-0 sm:max-w-sm md:hidden"
      >
        <div className="rounded-[28px] bg-popover p-6">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo size={30} textClassName="text-[1.75rem] leading-none" />
            <DialogClose
              render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}
            >
              <X aria-hidden="true" />
              <span className="sr-only">메뉴 닫기</span>
            </DialogClose>
          </div>

          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>

          <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl transition-colors hover:bg-accent"
            >
              <Avatar size="lg">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={`${profileName} 프로필 사진`} />
                ) : null}
                <AvatarFallback>
                  {getAvatarFallback(profileName || userEmail || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{profileName}</p>
                <p className="text-xs text-muted-foreground">{profileSubtitle}</p>
              </div>
            </Link>
          </div>

          <nav aria-label="모바일 주요 메뉴" className="mt-6">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.href}>
                  {/*
                    Keep these as native links so keyboard and assistive tech users
                    get the expected navigation behavior inside the mobile menu.
                  */}
                  <Link
                    href={tab.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-4 text-[1.1rem] font-medium transition-colors hover:bg-accent",
                      pathname === tab.href || pathname.startsWith(tab.href + "/")
                        ? "bg-primary/8 text-primary"
                        : "text-foreground",
                    )}
                  >
                      <span>{tab.label}</span>
                    <span className="flex items-center gap-2">
                      {getTabCount(tab.href, counts) > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground">
                          {getTabCount(tab.href, counts) > 99
                            ? "99+"
                            : getTabCount(tab.href, counts)}
                        </span>
                      ) : null}
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4 text-muted-foreground"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "w-full justify-center",
              )}
            >
              <Settings aria-hidden="true" />
              설정 보기
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getTabCount(
  href: string,
  counts: { messages?: number; notifications?: number },
) {
  if (href === "/messages") return counts.messages ?? 0;
  if (href === "/notifications") return counts.notifications ?? 0;
  return 0;
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}
