import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { listActorPreviews, listOpenJobsPreview } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";

function formatDeadline(iso: string | null) {
  if (!iso) return "상시모집";
  const deadline = new Date(iso);
  return `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 마감`;
}

export default async function TalentsPage() {
  const { activeRole } = await getViewerProfile();
  if (!activeRole) return null;

  return activeRole === "casting" ? (
    <CastingTalentsPage />
  ) : (
    <ActorTalentsPage />
  );
}

async function CastingTalentsPage() {
  const actors = await listActorPreviews(9);

  return (
    <PageContainer
      pageTitle="배우 탐색"
      description="프로필 카드 중심으로 배우를 비교하고 다음으로 볼 후보를 빠르게 추려요."
    >
      {actors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            아직 탐색할 배우가 없어요.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {actors.map((actor) => (
            <Card key={actor.id} className="h-full">
              <CardHeader className="space-y-2">
                <Badge variant="secondary" className="w-fit">
                  배우
                </Badge>
                <CardTitle>{actor.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {actor.region ?? "지역 미등록"}
                  {actor.age ? ` · ${actor.age}세` : ""}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(actor.genres.length > 0 ? actor.genres : ["장르 준비 중"]).map(
                    (genre) => (
                      <Badge key={genre} variant="outline">
                        {genre}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

async function ActorTalentsPage() {
  const jobs = await listOpenJobsPreview(9);

  return (
    <PageContainer
      pageTitle="오디션 탐색"
      description="브랜드, 장르, 지역 기준으로 공고를 비교하고 바로 상세를 확인해요."
    >
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            지금 탐색할 오디션이 없어요.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="h-full">
              <CardHeader className="space-y-2">
                {job.genre ? (
                  <Badge variant="secondary" className="w-fit">
                    {job.genre}
                  </Badge>
                ) : null}
                <CardTitle>{job.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {job.region ?? "-"} · {formatDeadline(job.deadline)}
                </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  공고 보기
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
