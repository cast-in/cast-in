import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <PageContainer pageTitle="메시지">
      {errorMessage && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {rooms.length === 0 && !errorMessage && (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                아직 주고받은 대화가 없어요.
              </CardContent>
            </Card>
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
            <Card>
              <CardContent className="grid h-[60vh] place-items-center text-muted-foreground">
                왼쪽에서 대화를 골라주세요.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
