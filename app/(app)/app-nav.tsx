"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_TABS } from "@/lib/app-ia";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/enums";

export type AppNavCounts = {
  messages?: number;
};

export function AppNav({
  role,
  counts = {},
}: {
  role: UserRole;
  counts?: AppNavCounts;
}) {
  const pathname = usePathname();
  const tabs = APP_TABS[role];

  return (
    <nav aria-label="주요 메뉴" className="flex flex-wrap justify-center gap-1">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        const count =
          tab.href === "/messages"
            ? counts.messages ?? 0
            : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span>{tab.label}</span>
            {count > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] leading-5 text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
