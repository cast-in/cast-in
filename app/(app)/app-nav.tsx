"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_TABS } from "@/lib/app-ia";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/enums";

export function AppNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const tabs = APP_TABS[role];

  return (
    <nav aria-label="주요 메뉴" className="flex flex-wrap justify-center gap-1">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
