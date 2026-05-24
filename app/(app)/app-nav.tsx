"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { APP_TABS, isAppTabActive } from "@/lib/app-ia";
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
  const searchParams = useSearchParams();
  const tabs = APP_TABS[role];

  return (
    <nav aria-label="주요 메뉴" className="flex flex-wrap justify-center gap-1">
      {tabs.map((tab) => {
        const active = isAppTabActive({
          href: tab.href,
          pathname,
          role,
          source: searchParams.get("from"),
        });
        const count =
          tab.href === "/messages"
            ? counts.messages ?? 0
            : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors after:pointer-events-none after:absolute after:-bottom-[12px] after:left-3 after:right-3 after:z-20 after:h-px after:rounded-full after:content-['']",
              active
                ? "text-primary after:bg-primary"
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
