import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/page-container";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import { listMyChatRooms } from "@/lib/queries/chat";
import { createClient } from "@/lib/supabase/server";
import { MessageJobFilterSelect } from "./message-job-filter-select";
import { MessageRoom } from "./message-room";

type MessagesSearchParams = {
  applicant?: string;
  filter?: string;
  job?: string;
  job_filter?: string;
  q?: string;
  room?: string;
};

type MessageFilter = "all" | "job" | "unread";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<MessagesSearchParams>;
}) {
  const {
    applicant,
    filter,
    job,
    job_filter: requestedJobFilter,
    q = "",
    room,
  } = await searchParams;

  let rooms: Awaited<ReturnType<typeof listMyChatRooms>> = [];
  let errorMessage: string | null = null;
  try {
    rooms = await listMyChatRooms();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "메시지를 불러오지 못했어요.";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const normalizedQuery = q.trim();
  const activeFilter = normalizeFilter(filter);
  const jobOptions = getJobOptions(rooms);
  const selectedJobId = jobOptions.some((option) => option.id === requestedJobFilter)
    ? (requestedJobFilter ?? "")
    : "";
  const visibleRooms = filterRooms({
    filter: activeFilter,
    jobId: selectedJobId,
    query: normalizedQuery,
    rooms,
  });
  const requestedRoomId =
    room ??
    (job ? rooms.find((chatRoom) => chatRoom.job_id === job)?.id : null) ??
    (applicant
      ? rooms.find((chatRoom) => chatRoom.other_id === applicant)?.id
      : null);
  const activeRoom =
    rooms.find((chatRoom) => chatRoom.id === requestedRoomId) ??
    visibleRooms[0] ??
    rooms[0] ??
    null;

  return (
    <PageContainer
      pageTitle="메시지"
      size="wide"
      className="max-w-[1512px] space-y-8"
      actions={
        <Link
          href="/talents"
          className={buttonVariants({ size: "lg" })}
        >
          새 대화 시작
        </Link>
      }
    >
      {errorMessage ? <ErrorNotice message={errorMessage} /> : null}

      <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
        <SurfaceCard className="h-[calc(100dvh-15rem)] min-h-[520px] max-h-[860px] overflow-hidden shadow-none">
          <aside className="flex min-h-0 flex-1 flex-col" aria-label="대화 목록">
            <div className="border-b border-border/80 p-5">
              <form action="/messages" className="relative">
                <input type="hidden" name="filter" value={activeFilter} />
                {selectedJobId ? (
                  <input type="hidden" name="job_filter" value={selectedJobId} />
                ) : null}
                <label htmlFor="message-search" className="sr-only">
                  메시지 검색
                </label>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="message-search"
                  type="search"
                  name="q"
                  defaultValue={normalizedQuery}
                  placeholder="메시지 검색"
                  className="pl-10"
                />
              </form>

              <nav className="mt-4 flex flex-wrap gap-3" aria-label="메시지 필터">
                <MessageFilterLink
                  href={buildMessagesHref({
                    filter: "all",
                    q: normalizedQuery,
                    room: activeRoom?.id,
                  })}
                  active={activeFilter === "all"}
                >
                  전체
                </MessageFilterLink>
                <MessageFilterLink
                  href={buildMessagesHref({
                    filter: "job",
                    job_filter: selectedJobId,
                    q: normalizedQuery,
                    room: activeRoom?.id,
                  })}
                  active={activeFilter === "job"}
                >
                  작품별
                </MessageFilterLink>
                <MessageFilterLink
                  href={buildMessagesHref({
                    filter: "unread",
                    q: normalizedQuery,
                    room: activeRoom?.id,
                  })}
                  active={activeFilter === "unread"}
                >
                  안 읽은 메시지
                </MessageFilterLink>
              </nav>

              {activeFilter === "job" ? (
                <div className="mt-4">
                  <MessageJobFilterSelect
                    jobs={jobOptions}
                    q={normalizedQuery}
                    roomId={activeRoom?.id ?? ""}
                    selectedJobId={selectedJobId}
                  />
                </div>
              ) : null}
            </div>

            {rooms.length === 0 && !errorMessage ? (
              <div className="grid flex-1 place-items-center p-5">
                <EmptyState
                  className="w-full border-0 shadow-none ring-0"
                  title="아직 메시지가 없어요"
                  description="지원하거나 제안을 받으면 여기에서 메시지를 주고받을 수 있어요."
                  action={
                    <Link
                      href="/jobs"
                      className={buttonVariants({
                        color: "secondary",
                        size: "sm",
                      })}
                    >
                      내 지원 보기
                    </Link>
                  }
                />
              </div>
            ) : visibleRooms.length === 0 ? (
              <div className="grid flex-1 place-items-center p-5 text-center text-sm text-muted-foreground">
                조건에 맞는 메시지가 없어요.
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {visibleRooms.map((chatRoom) => (
                  <li key={chatRoom.id} className="border-b border-border/70 last:border-b-0">
                    <Link
                      href={buildMessagesHref({
                        filter: activeFilter,
                        job_filter: selectedJobId,
                        q: normalizedQuery,
                        room: chatRoom.id,
                      })}
                      scroll={false}
                      className={cn(
                        "relative flex min-h-[116px] items-center gap-4 px-5 py-5 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        chatRoom.id === activeRoom?.id
                          ? "bg-primary-soft"
                          : "hover:bg-muted/60",
                      )}
                    >
                      {chatRoom.unread_count > 0 ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-primary"
                        />
                      ) : null}
                      <ConversationAvatar
                        avatarUrl={chatRoom.other_avatar_url}
                        name={chatRoom.other_name}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold">
                              {chatRoom.other_name}
                            </p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {chatRoom.last_message_preview ?? "아직 대화가 없어요."}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                            <span className="text-sm text-muted-foreground">
                              {formatRoomDate(chatRoom.last_message_at)}
                            </span>
                            {chatRoom.unread_count > 0 ? (
                              <span className="grid min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-xs font-bold leading-5 text-destructive-foreground">
                                {chatRoom.unread_count > 99
                                  ? "99+"
                                  : chatRoom.unread_count}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </SurfaceCard>

        <div className="min-w-0">
          {activeRoom && user ? (
            <MessageRoom
              roomId={activeRoom.id}
              currentUserId={user.id}
              peer={{
                avatarUrl: activeRoom.other_avatar_url,
                jobTitle: activeRoom.job_title,
                name: activeRoom.other_name,
              }}
            />
          ) : (
            <EmptyState
              className="h-[calc(100dvh-15rem)] min-h-[520px] max-h-[860px]"
              title="메시지를 선택하면 내용을 볼 수 있어요"
              description="왼쪽 목록에서 확인할 메시지를 골라보세요."
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function MessageFilterLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({
          color: active ? "primary" : "neutral",
          variant: active ? "fill" : "outline",
          size: "md",
        }),
        active
          ? "pointer-events-none"
          : "bg-background text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function ConversationAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  return (
    <Avatar className="size-14" size="lg">
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={`${name} 프로필 사진`} />
      ) : null}
      <AvatarFallback className="text-lg font-bold text-foreground">
        {getAvatarFallback(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function normalizeFilter(value: string | undefined): MessageFilter {
  if (value === "job" || value === "unread") return value;
  return "all";
}

function filterRooms({
  filter,
  jobId,
  query,
  rooms,
}: {
  filter: MessageFilter;
  jobId: string;
  query: string;
  rooms: Awaited<ReturnType<typeof listMyChatRooms>>;
}) {
  const normalizedQuery = query.toLowerCase();

  return rooms.filter((room) => {
    if (filter === "job" && !room.job_id) return false;
    if (filter === "job" && jobId && room.job_id !== jobId) return false;
    if (filter === "unread" && room.unread_count === 0) return false;
    if (!normalizedQuery) return true;

    return [
      room.other_name,
      room.job_title ?? "",
      room.last_message_preview ?? "",
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

function getJobOptions(rooms: Awaited<ReturnType<typeof listMyChatRooms>>) {
  const jobs = new Map<string, string>();

  for (const room of rooms) {
    if (room.job_id && room.job_title) jobs.set(room.job_id, room.job_title);
  }

  return Array.from(jobs, ([id, title]) => ({ id, title }));
}

function buildMessagesHref(params: {
  filter?: MessageFilter;
  job_filter?: string;
  q?: string;
  room?: string;
}) {
  const query = new URLSearchParams();
  const normalizedFilter = params.filter && params.filter !== "all" ? params.filter : "";

  if (params.room) query.set("room", params.room);
  if (normalizedFilter) query.set("filter", normalizedFilter);
  if (params.job_filter && normalizedFilter === "job") {
    query.set("job_filter", params.job_filter);
  }
  if (params.q) query.set("q", params.q);

  const qs = query.toString();
  return qs ? `/messages?${qs}` : "/messages";
}

function formatRoomDate(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "numeric",
  }).format(new Date(value));
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}
