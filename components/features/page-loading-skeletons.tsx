import type { ReactNode } from "react";
import { PageContainer } from "@/components/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function LoadingStatus({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${label} 불러오는 중`}
      className={cn("space-y-6", className)}
    >
      {children}
    </div>
  );
}

function Block({ className }: { className?: string }) {
  return <Skeleton aria-hidden="true" className={className} />;
}

function HeaderSkeleton({
  withBack = false,
  withAction = false,
  subtitle = true,
  actionCount = 1,
}: {
  withBack?: boolean;
  withAction?: boolean;
  subtitle?: boolean;
  actionCount?: number;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {withBack ? <Block className="size-9 shrink-0 rounded-full" /> : null}
        <div className="min-w-0 space-y-2">
          <Block className="h-8 w-44 md:w-56" />
          {subtitle ? <Block className="h-4 w-64 max-w-[70vw]" /> : null}
        </div>
      </div>
      {withAction ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          {Array.from({ length: actionCount }).map((_, index) => (
            <Block
              key={index}
              className={cn(
                "h-9 rounded-lg",
                index === 0 ? "w-24" : "w-20",
              )}
            />
          ))}
        </div>
      ) : null}
    </header>
  );
}

function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card px-5 py-6 ring-1 ring-border/70 md:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PanelHeading({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Block className="h-5 w-28" />
        <Block className="h-3.5 w-44" />
      </div>
      {action ? <Block className="h-8 w-20 rounded-lg" /> : null}
    </div>
  );
}

function TextLines({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-2/3"] as const;

  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Block key={index} className={cn("h-4", widths[index % widths.length])} />
      ))}
    </div>
  );
}

function FilterPills({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Block
          key={index}
          className={cn("h-8 rounded-full", index % 2 === 0 ? "w-20" : "w-24")}
        />
      ))}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Panel className="space-y-4">
      <Block className="h-4 w-20" />
      <Block className="h-8 w-24" />
      <Block className="h-3 w-full" />
    </Panel>
  );
}

function InlineStatSkeleton() {
  return (
    <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-border/60">
      <Block className="h-4 w-20" />
      <Block className="mt-4 h-8 w-24" />
      <Block className="mt-3 h-3 w-full" />
    </div>
  );
}

function InlineJobTileSkeleton() {
  return (
    <div className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60">
      <div className="flex items-start gap-4">
        <Block className="size-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <Block className="h-5 w-2/3" />
          <TextLines count={2} />
          <FilterPills count={3} />
        </div>
      </div>
    </div>
  );
}

function ListRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-4">
          <Block className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Block className="h-4 w-2/3" />
            <Block className="h-3 w-1/2" />
          </div>
          <Block className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function SearchHeroSkeleton() {
  return (
    <section className="rounded-[28px] bg-card p-5 ring-1 ring-border/70 md:p-7">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
        <div className="space-y-4">
          <Block className="h-4 w-24 rounded-full" />
          <Block className="h-10 w-full max-w-xl" />
          <TextLines count={2} className="max-w-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl bg-muted/40 p-4 ring-1 ring-border/60"
            >
              <Block className="h-3 w-12" />
              <Block className="mt-3 h-6 w-14" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchControlsSkeleton() {
  return (
    <Panel className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
        <Block className="h-11 rounded-xl" />
        <Block className="h-11 rounded-xl" />
      </div>
      <FilterPills />
    </Panel>
  );
}

function JobCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card ring-1 ring-border/70",
        compact && "w-[260px] shrink-0",
      )}
    >
      <Block className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Block className="h-5 w-3/5" />
          <Block className="h-7 w-16 rounded-full" />
        </div>
        <Block className="h-4 w-4/5" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Block className="h-9 rounded-lg" />
          <Block className="h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ActorCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card ring-1 ring-border/70",
        compact && "w-[220px] shrink-0",
      )}
    >
      <Block className="aspect-[3/4] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Block className="h-5 w-24" />
          <Block className="h-6 w-14 rounded-full" />
        </div>
        <Block className="h-4 w-4/5" />
        <FilterPills count={3} />
      </div>
    </div>
  );
}

function SavedCardSkeleton() {
  return (
    <div className="rounded-xl bg-card px-4 py-4 ring-1 ring-border/70">
      <div className="flex gap-4">
        <Block className="size-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Block className="h-5 w-2/3" />
            <Block className="h-8 w-8 rounded-full" />
          </div>
          <TextLines count={2} />
          <FilterPills count={3} />
        </div>
      </div>
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex justify-center gap-2 pt-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Block key={index} className="size-9 rounded-lg" />
      ))}
    </div>
  );
}

function ListingSkeleton({
  label,
  card = "job",
  featured = true,
}: {
  label: string;
  card?: "job" | "actor" | "saved";
  featured?: boolean;
}) {
  const CardSkeleton =
    card === "actor"
      ? ActorCardSkeleton
      : card === "saved"
        ? SavedCardSkeleton
        : JobCardSkeleton;

  return (
    <PageContainer size="wide">
      <LoadingStatus label={label}>
        <SearchHeroSkeleton />
        <SearchControlsSkeleton />

        {featured ? (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-2">
                <Block className="h-6 w-32" />
                <Block className="h-4 w-48" />
              </div>
              <Block className="h-8 w-20 rounded-lg" />
            </div>
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <CardSkeleton key={index} compact />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Block className="h-6 w-28" />
            <Block className="h-9 w-32 rounded-lg" />
          </div>
          <div
            className={cn(
              "grid gap-4",
              card === "actor"
                ? "sm:grid-cols-2 lg:grid-cols-4"
                : card === "saved"
                  ? "lg:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {Array.from({ length: getListingSkeletonCount(card) }).map(
              (_, index) => (
                <CardSkeleton key={index} />
              ),
            )}
          </div>
          <PaginationSkeleton />
        </section>
      </LoadingStatus>
    </PageContainer>
  );
}

function getListingSkeletonCount(card: "job" | "actor" | "saved") {
  if (card === "actor") return 8;
  if (card === "job") return 12;
  return 6;
}

function DetailInfoGrid({ rows = 4 }: { rows?: number }) {
  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-2xl bg-muted/35 p-4">
          <Block className="h-3 w-16" />
          <Block className="mt-3 h-5 w-28" />
        </div>
      ))}
    </dl>
  );
}

function MediaTiles({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Block key={index} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

function ProfileHeroSkeleton({ withStats = true }: { withStats?: boolean }) {
  return (
    <section className="rounded-[28px] bg-card p-5 ring-1 ring-border/70 md:p-10">
      <div
        className={cn(
          "grid gap-7 lg:items-end",
          withStats
            ? "lg:grid-cols-[300px_minmax(0,1fr)_330px]"
            : "lg:grid-cols-[300px_minmax(0,1fr)]",
        )}
      >
        <Block className="aspect-[3/4] w-full max-w-[300px] rounded-lg" />
        <div className="min-w-0 space-y-5 lg:pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Block className="h-10 w-52" />
            <Block className="h-8 w-20 rounded-full" />
          </div>
          <Block className="h-4 w-72 max-w-full" />
          <TextLines count={3} className="max-w-2xl" />
        </div>
        {withStats ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-muted/40 p-4">
                <Block className="h-3 w-14" />
                <Block className="mt-3 h-7 w-12" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FormSectionSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Panel className="space-y-5">
      <PanelHeading />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Block className="h-4 w-20" />
            <Block className="h-11 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Block className="h-4 w-24" />
        <Block className="h-28 rounded-xl" />
      </div>
    </Panel>
  );
}

export function AppLoadingSkeleton() {
  return (
    <PageContainer>
      <LoadingStatus label="페이지">
        <HeaderSkeleton />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <Panel>
          <PanelHeading />
          <TextLines count={4} className="mt-5" />
        </Panel>
      </LoadingStatus>
    </PageContainer>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <PageContainer>
      <LoadingStatus label="대시보드">
        <HeaderSkeleton withAction subtitle={false} />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <Panel>
            <PanelHeading action />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <InlineJobTileSkeleton key={index} />
              ))}
            </div>
          </Panel>
          <Panel>
            <PanelHeading />
            <ListRows rows={5} />
          </Panel>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function DiscoverLoadingSkeleton() {
  return <ListingSkeleton label="공고 탐색" card="job" />;
}

export function TalentsLoadingSkeleton() {
  return <ListingSkeleton label="인재 탐색" card="actor" />;
}

export function BookmarksLoadingSkeleton() {
  return <ListingSkeleton label="저장 목록" card="saved" featured={false} />;
}

export function JobsLoadingSkeleton() {
  return (
    <PageContainer size="wide" className="max-w-[1500px]">
      <LoadingStatus label="공고 관리">
        <HeaderSkeleton withAction actionCount={2} />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Panel className="min-h-[680px]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <PanelHeading />
              <Block className="h-10 w-36 rounded-xl" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <InlineStatSkeleton key={index} />
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <InlineJobTileSkeleton key={index} />
              ))}
            </div>
          </Panel>
          <Panel className="min-h-[680px]">
            <PanelHeading action />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-muted/25 p-4 ring-1 ring-border/60"
                >
                  <div className="flex items-center gap-3">
                    <Block className="size-11 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Block className="h-4 w-32" />
                      <Block className="h-3 w-24" />
                    </div>
                    <Block className="h-7 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function NewJobLoadingSkeleton() {
  return (
    <PageContainer size="wide" className="max-w-[1300px] pb-16 pt-4 md:pt-8">
      <LoadingStatus label="공고 등록">
        <HeaderSkeleton withBack withAction actionCount={2} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <FormSectionSkeleton />
            <FormSectionSkeleton fields={6} />
            <FormSectionSkeleton fields={4} />
          </div>
          <aside className="space-y-5">
            <Panel>
              <PanelHeading />
              <div className="mt-5 space-y-3">
                <Block className="aspect-video rounded-xl" />
                <TextLines count={3} />
              </div>
            </Panel>
            <Panel>
              <PanelHeading />
              <FilterPills count={6} />
            </Panel>
          </aside>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function EditJobLoadingSkeleton() {
  return (
    <PageContainer>
      <LoadingStatus label="공고 수정">
        <HeaderSkeleton withBack subtitle={false} />
        <div className="space-y-5">
          <FormSectionSkeleton fields={4} />
          <FormSectionSkeleton fields={6} />
          <Panel className="space-y-4">
            <PanelHeading />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Block key={index} className="aspect-video rounded-xl" />
              ))}
            </div>
          </Panel>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function JobDetailLoadingSkeleton() {
  return (
    <PageContainer size="wide" className="space-y-6">
      <LoadingStatus label="공고 상세">
        <section className="rounded-[28px] bg-card p-5 ring-1 ring-border/70 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <Block className="h-9 w-24 rounded-full" />
            <Block className="h-10 w-28 rounded-xl" />
          </div>
          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <Block className="h-4 w-24 rounded-full" />
              <Block className="h-11 w-full max-w-2xl" />
              <TextLines count={3} className="max-w-3xl" />
              <FilterPills count={5} />
            </div>
            <Block className="aspect-[4/3] rounded-2xl" />
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Panel key={index}>
              <PanelHeading />
              <DetailInfoGrid rows={index < 2 ? 5 : 3} />
            </Panel>
          ))}
        </div>

        <Panel>
          <PanelHeading />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Block key={index} className="aspect-video rounded-xl" />
            ))}
          </div>
        </Panel>
      </LoadingStatus>
    </PageContainer>
  );
}

export function MessagesLoadingSkeleton() {
  return (
    <PageContainer
      pageTitle="메시지"
      size="wide"
      className="max-w-[1512px] space-y-8"
      actions={<Block className="h-11 w-28 rounded-lg" />}
    >
      <LoadingStatus label="메시지">
        <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
          <div className="h-[calc(100dvh-15rem)] min-h-[520px] max-h-[860px] overflow-hidden rounded-xl bg-card ring-1 ring-border/70">
            <aside className="flex min-h-0 flex-1 flex-col" aria-label="대화 목록">
              <div className="border-b border-border/80 p-5">
                <Block className="h-10 rounded-lg" />
                <div className="mt-4 flex flex-wrap gap-3">
                  <Block className="h-10 w-16 rounded-lg" />
                  <Block className="h-10 w-20 rounded-lg" />
                  <Block className="h-10 w-28 rounded-lg" />
                </div>
              </div>

              <ul className="min-h-0 flex-1 overflow-hidden">
                {Array.from({ length: 6 }).map((_, index) => (
                  <li key={index} className="border-b border-border/70">
                    <div
                      className={cn(
                        "relative flex min-h-[116px] items-center gap-4 px-5 py-5",
                        index === 0 && "bg-primary-soft",
                      )}
                    >
                      {index < 2 ? (
                        <Block className="absolute left-4 top-1/2 size-2.5 -translate-y-1/2 rounded-full" />
                      ) : null}
                      <Block className="size-14 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <Block className="h-5 w-28" />
                            <Block className="h-4 w-full max-w-52" />
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <Block className="h-4 w-12" />
                            {index < 3 ? (
                              <Block className="h-5 w-7 rounded-full" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          <div className="min-w-0">
            <div className="grid h-[calc(100dvh-15rem)] min-h-[520px] max-h-[860px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl bg-card ring-1 ring-border/70">
              <header className="flex items-start justify-between gap-4 border-b border-border/80 px-8 py-6">
                <div className="min-w-0 space-y-2">
                  <Block className="h-8 w-36" />
                  <Block className="h-5 w-64 max-w-full" />
                </div>
              </header>

              <div className="min-h-0 overflow-hidden px-8 py-7">
                <div className="space-y-10">
                  <div className="flex justify-center">
                    <Block className="h-5 w-28" />
                  </div>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        index % 2 === 0 ? "justify-end" : "justify-start",
                      )}
                    >
                      <Block
                        className={cn(
                          "h-14 max-w-full rounded-xl",
                          index % 2 === 0 ? "w-80" : "w-64",
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 px-8 pb-8 pt-4">
                <div className="flex gap-3">
                  <Block className="size-10 shrink-0 rounded-lg" />
                  <Block className="h-10 flex-1 rounded-lg" />
                  <Block className="h-10 w-16 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function NotificationsLoadingSkeleton() {
  return (
    <PageContainer pageTitle="알림" actions={<Block className="h-9 w-24 rounded-lg" />}>
      <LoadingStatus label="알림">
        <Panel>
          <ListRows rows={8} />
        </Panel>
      </LoadingStatus>
    </PageContainer>
  );
}

export function SettingsLoadingSkeleton() {
  return (
    <PageContainer size="narrow" pageTitle="설정">
      <LoadingStatus label="설정">
        {Array.from({ length: 4 }).map((_, index) => (
          <Panel key={index} className="space-y-5">
            <PanelHeading action={index < 2} />
            <div className="space-y-3">
              <Block className="h-11 rounded-xl" />
              <Block className="h-11 rounded-xl" />
            </div>
          </Panel>
        ))}
      </LoadingStatus>
    </PageContainer>
  );
}

export function ProfileLoadingSkeleton() {
  return (
    <PageContainer size="wide" className="space-y-5">
      <LoadingStatus label="프로필">
        <ProfileHeroSkeleton />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Panel>
              <PanelHeading action />
              <div className="mt-5">
                <MediaTiles />
              </div>
            </Panel>
            <Panel>
              <PanelHeading action />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Block className="aspect-video rounded-xl" />
                <Block className="aspect-video rounded-xl" />
              </div>
            </Panel>
            <div className="grid gap-5 md:grid-cols-2">
              <Panel>
                <PanelHeading action />
                <ListRows rows={3} />
              </Panel>
              <Panel>
                <PanelHeading action />
                <ListRows rows={3} />
              </Panel>
            </div>
          </div>
          <aside className="space-y-5">
            <Panel>
              <PanelHeading action />
              <DetailInfoGrid rows={5} />
            </Panel>
            <Panel>
              <PanelHeading action />
              <div className="mt-5 space-y-4">
                <FilterPills count={6} />
                <FilterPills count={5} />
              </div>
            </Panel>
          </aside>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function ProfileEditLoadingSkeleton() {
  return (
    <PageContainer>
      <LoadingStatus label="프로필 수정">
        <HeaderSkeleton withBack subtitle={false} />
        <Panel>
          <div className="flex items-center gap-4">
            <Block className="size-20 rounded-2xl" />
            <div className="space-y-2">
              <Block className="h-5 w-36" />
              <Block className="h-4 w-48" />
            </div>
          </div>
        </Panel>
        <FormSectionSkeleton fields={6} />
        <FormSectionSkeleton fields={4} />
      </LoadingStatus>
    </PageContainer>
  );
}

export function PortfolioLoadingSkeleton() {
  return (
    <PageContainer>
      <LoadingStatus label="포트폴리오 관리">
        <HeaderSkeleton withBack subtitle={false} />
        <Panel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PanelHeading />
            <Block className="h-10 w-28 rounded-xl" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl bg-muted/25 ring-1 ring-border/60"
              >
                <Block className="aspect-video rounded-none" />
                <div className="space-y-3 p-4">
                  <Block className="h-4 w-2/3" />
                  <Block className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </LoadingStatus>
    </PageContainer>
  );
}

export function ShowcaseLoadingSkeleton() {
  return (
    <PageContainer
      size="wide"
      pageTitle="필모그래피와 수상"
      actions={<Block className="h-9 w-9 rounded-full" />}
    >
      <LoadingStatus label="필모그래피와 수상">
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Panel key={index}>
              <PanelHeading />
              <div className="mt-5 rounded-xl bg-muted/30 p-4">
                <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
                  <Block className="h-11 rounded-xl" />
                  <Block className="h-11 rounded-xl" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Block className="h-11 rounded-xl" />
                  <Block className="h-11 rounded-xl" />
                </div>
                <Block className="ml-auto mt-3 h-10 w-20 rounded-lg" />
              </div>
              <ListRows rows={4} />
            </Panel>
          ))}
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function TalentDetailLoadingSkeleton() {
  return (
    <PageContainer size="wide" className="space-y-5">
      <LoadingStatus label="배우 상세">
        <ProfileHeroSkeleton />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Panel>
              <PanelHeading action />
              <div className="mt-5">
                <MediaTiles />
              </div>
            </Panel>
            <Panel>
              <PanelHeading action />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Block className="aspect-video rounded-xl" />
                <Block className="aspect-video rounded-xl" />
              </div>
            </Panel>
            <div className="grid gap-5 md:grid-cols-2">
              <Panel>
                <PanelHeading />
                <ListRows rows={3} />
              </Panel>
              <Panel>
                <PanelHeading />
                <ListRows rows={3} />
              </Panel>
            </div>
          </div>
          <aside className="space-y-5">
            <Panel>
              <PanelHeading />
              <DetailInfoGrid rows={5} />
            </Panel>
            <Panel>
              <PanelHeading />
              <FilterPills count={8} />
            </Panel>
          </aside>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function CastingDetailLoadingSkeleton() {
  return (
    <PageContainer size="wide" className="space-y-5">
      <LoadingStatus label="캐스팅 상세">
        <ProfileHeroSkeleton withStats={false} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Panel>
              <PanelHeading />
              <DetailInfoGrid rows={4} />
            </Panel>
            <Panel>
              <PanelHeading />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Block className="aspect-video rounded-xl" />
                <Block className="aspect-video rounded-xl" />
              </div>
            </Panel>
            <Panel>
              <PanelHeading />
              <div className="mt-5">
                <MediaTiles />
              </div>
            </Panel>
            <Panel>
              <PanelHeading />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <InlineJobTileSkeleton key={index} />
                ))}
              </div>
            </Panel>
          </div>
          <aside>
            <Panel>
              <PanelHeading />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <InlineJobTileSkeleton key={index} />
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </LoadingStatus>
    </PageContainer>
  );
}

export function CdsLoadingSkeleton() {
  return (
    <PageContainer pageTitle="Cast In Design System (CDS)">
      <LoadingStatus label="디자인 시스템">
        <Panel>
          <PanelHeading />
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border bg-background p-2.5"
              >
                <Block className="size-7 shrink-0 rounded-md" />
                <Block className="h-3 w-20" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeading />
          <div className="mt-5 flex flex-wrap gap-3">
            {Array.from({ length: 14 }).map((_, index) => (
              <Block key={index} className="h-10 w-24 rounded-lg" />
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeading />
          <ListRows rows={5} />
        </Panel>
      </LoadingStatus>
    </PageContainer>
  );
}
