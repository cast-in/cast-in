import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/page-container";
import { cn } from "@/lib/utils";
import { listMyChatRooms } from "@/lib/queries/chat";
import { MessageRoom } from "./message-room";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; job?: string; applicant?: string }>;
}) {
  const { room, job, applicant } = await searchParams;

  let rooms: Awaited<ReturnType<typeof listMyChatRooms>> = [];
  let errorMessage: string | null = null;
  try {
    rooms = await listMyChatRooms();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "대화를 불러오지 못했어요.";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeRoomId =
    room ??
    (job ? rooms.find((chatRoom) => chatRoom.job_id === job)?.id : null) ??
    (applicant
      ? rooms.find((chatRoom) => chatRoom.other_id === applicant)?.id
      : null) ??
    rooms[0]?.id ??
    null;

  return (
    <PageContainer pageTitle="대화">
      {errorMessage && <ErrorNotice message={errorMessage} />}

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {rooms.length === 0 && !errorMessage && (
            <EmptyState
              title="아직 대화가 없어요"
              description="지원하거나 제안을 받으면 여기에서 대화할 수 있어요."
              action={
                <Link
                  href="/jobs"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  내 지원 보기
                </Link>
              }
            />
          )}
          {rooms.map((r) => {
            const isActive = r.id === activeRoomId;
            return (
              <a key={r.id} href={`/messages?room=${r.id}`} className="block">
                <Card
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm">{r.other_name}</strong>
                      <div className="flex items-center gap-2">
                        {r.unread_count > 0 ? (
                          <Badge>{r.unread_count > 99 ? "99+" : r.unread_count}</Badge>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {r.last_message_at
                            ? new Date(r.last_message_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                    {r.job_title && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        · {r.job_title}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </aside>

        <div className="min-h-[60vh]">
          {activeRoomId && user ? (
            <MessageRoom roomId={activeRoomId} currentUserId={user.id} />
          ) : (
            <EmptyState
              className="h-full min-h-[60vh]"
              title="대화를 선택하면 내용을 볼 수 있어요"
              description="왼쪽 목록에서 확인할 대화를 골라보세요."
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
