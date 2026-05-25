import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const items = getPaginationItems(currentPage, totalPages);

  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") search.set(key, value);
    }
    if (nextPage > 1) search.set("page", String(nextPage));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      aria-label={`페이지 탐색, 총 ${total}건`}
      className="flex items-center justify-center gap-2 pt-10"
    >
      <PageArrow
        href={buildHref(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        label="이전 페이지"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </PageArrow>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="grid size-9 place-items-center text-sm font-medium text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-current={currentPage === item ? "page" : undefined}
            className={cn(
              "grid size-9 place-items-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              currentPage === item
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <PageArrow
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        label="다음 페이지"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </PageArrow>
    </nav>
  );
}

function PageArrow({
  children,
  href,
  disabled,
  label,
}: {
  children: ReactNode;
  href: string;
  disabled: boolean;
  label: string;
}) {
  const className = cn(
    "grid size-9 place-items-center rounded-md border border-border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted",
    disabled && "pointer-events-none opacity-50",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

function getPaginationItems(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 3) return [1, 2, 3, "ellipsis", totalPages] as const;
  if (page >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages] as const;
  }
  return [1, "ellipsis", page, "ellipsis", totalPages] as const;
}
