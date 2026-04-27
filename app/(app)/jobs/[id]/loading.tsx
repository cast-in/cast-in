import { PageContainer } from "@/components/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <div role="status" aria-label="공고 상세를 불러오는 중" className="space-y-6">
        <Skeleton className="h-9 w-28" />

        <section className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-4 w-56" />
          <div className="grid gap-2 pt-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border bg-card p-4">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="mt-3 h-5 w-24" />
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-6 h-10 w-32" />
        </div>
      </div>
    </PageContainer>
  );
}
