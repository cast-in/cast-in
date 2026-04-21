import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { listMyBookmarks } from "@/lib/queries/bookmarks";

export default async function BookmarksPage() {
  const bookmarks = await listMyBookmarks();

  return (
    <PageContainer
      pageTitle="보관함"
      description="관심 있는 배우와 공고를 모아두고 다음 액션을 빠르게 이어가요."
    >
      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="grid gap-3 p-10 text-center text-muted-foreground">
            <Bookmark aria-hidden="true" className="mx-auto size-8" />
            <p>아직 보관한 항목이 없어요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((item) => (
            <Card key={item.bookmark_id} className="h-full">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {item.target_type === "actor" ? (
                      <AvatarPreview
                        name={item.title}
                        avatarUrl={item.avatar_url ?? null}
                      />
                    ) : null}
                    <div className="min-w-0">
                      <Badge variant="secondary" className="mb-2">
                        {item.badge}
                      </Badge>
                      <h2 className="line-clamp-2 text-lg font-semibold">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.subtitle || "정보 미등록"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Link
                    href={item.href}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
                  >
                    보기
                  </Link>
                  <BookmarkButton
                    targetType={item.target_type}
                    targetId={item.target_id}
                    bookmarked
                    redirectTo="/bookmarks"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function AvatarPreview({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-sm font-semibold text-muted-foreground">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${name} 프로필 사진`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        getAvatarFallback(name)
      )}
    </div>
  );
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}
