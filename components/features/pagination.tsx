import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
  if (totalPages <= 1) return null;

  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") search.set(key, value);
    }
    if (nextPage > 1) search.set("page", String(nextPage));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {page} / {totalPages} 페이지 · 총 {total}건
      </p>
      <div className="flex items-center gap-2">
        <PageLink
          href={buildHref(page - 1)}
          disabled={prevDisabled}
          label="이전"
          icon="prev"
        />
        <PageLink
          href={buildHref(page + 1)}
          disabled={nextDisabled}
          label="다음"
          icon="next"
        />
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: "prev" | "next";
}) {
  const className = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    disabled && "pointer-events-none opacity-50",
  );
  const Icon = icon === "prev" ? ChevronLeft : ChevronRight;

  return (
    <Link
      href={disabled ? "#" : href}
      className={className}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {icon === "prev" && <Icon aria-hidden="true" className="size-4" />}
      {label}
      {icon === "next" && <Icon aria-hidden="true" className="size-4" />}
    </Link>
  );
}
