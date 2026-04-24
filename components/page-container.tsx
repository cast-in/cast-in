import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  pageTitle?: string;
  actions?: ReactNode;
  size?: "narrow" | "default" | "wide";
  className?: string;
  children: ReactNode;
};

const sizeClassName = {
  narrow: "max-w-2xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
} as const;

export function PageContainer({
  pageTitle,
  actions,
  size = "default",
  className,
  children,
}: PageContainerProps) {
  const hasHeader = Boolean(pageTitle || actions);

  return (
    <div className={cn("mx-auto w-full space-y-6", sizeClassName[size], className)}>
      {hasHeader ? (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            {pageTitle ? (
              <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
                {pageTitle}
              </h1>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
