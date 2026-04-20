import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  pageTitle?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function PageContainer({
  pageTitle,
  description,
  actions,
  className,
  children,
}: PageContainerProps) {
  const hasHeader = Boolean(pageTitle || description || actions);

  return (
    <div className={cn("mx-auto w-full max-w-2xl space-y-6", className)}>
      {hasHeader ? (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            {pageTitle ? (
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {pageTitle}
              </h1>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
