"use client";

import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { NotificationItem } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  unreadCount: number;
  notifications: NotificationItem[];
  panelClassName?: string;
};

export function NotificationBell({
  unreadCount,
  notifications,
  panelClassName,
}: NotificationBellProps) {
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
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={
          unreadCount > 0
            ? `알림 ${unreadCount > 99 ? "99개 이상" : `${unreadCount}개`}`
            : "알림 열기"
        }
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          buttonVariants({ color: "neutral", variant: "outline", size: "icon-sm" }),
          "relative rounded-full",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold leading-4 text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-labelledby={menuTitleId}
          className={cn(
            "absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-[24px] border bg-popover p-3 text-popover-foreground shadow-[0_24px_64px_rgba(15,23,42,0.18)]",
            panelClassName,
          )}
        >
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <h2 id={menuTitleId} className="text-sm font-semibold">
              알림
            </h2>
            {unreadCount > 0 ? (
              <Badge color="secondary">
                새 알림 {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              아직 알림이 없어요
            </p>
          ) : (
            <ul className="mt-1 space-y-1">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-2xl px-3 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      notification.read_at ? "" : "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          {!notification.read_at ? (
                            <span
                              aria-label="새 알림"
                              className="size-1.5 shrink-0 rounded-full bg-primary"
                            />
                          ) : null}
                          <p className="truncate text-sm font-medium">
                            {notification.title}
                          </p>
                        </div>
                        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      <time
                        dateTime={notification.created_at}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {formatDate(notification.created_at)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className={cn(
              buttonVariants({ color: "secondary", size: "sm" }),
              "mt-3 w-full justify-between",
            )}
          >
            전체 보기
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
