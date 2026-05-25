"use client";

import {
  Fragment,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Message = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "body" | "sender_id" | "created_at" | "read_at"
>;

type MessageRoomPeer = {
  avatarUrl: string | null;
  jobTitle: string | null;
  name: string;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "long",
  weekday: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function MessageRoom({
  roomId,
  currentUserId,
  peer,
}: {
  roomId: string;
  currentUserId: string;
  peer: MessageRoomPeer;
}) {
  const router = useRouter();
  const inputId = useId();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const messagesWithDateMarkers = useMemo(
    () =>
      messages.map((message, index) => {
        const dateKey = getDateKey(message.created_at);
        const previousMessage = messages[index - 1];

        return {
          dateKey,
          message,
          showDate:
            index === 0 ||
            !previousMessage ||
            getDateKey(previousMessage.created_at) !== dateKey,
        };
      }),
    [messages],
  );

  const markRoomAsRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("messages")
      .update({ read_at: readAt })
      .eq("room_id", roomId)
      .neq("sender_id", currentUserId)
      .is("read_at", null);

    if (!error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.sender_id !== currentUserId && !message.read_at
            ? { ...message, read_at: readAt }
            : message,
        ),
      );
      router.refresh();
    }
  }, [currentUserId, roomId, router, supabase]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender_id, created_at, read_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled && data) {
        setMessages(data);
        void markRoomAsRead();
      }
    })();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          setMessages((prev) =>
            prev.some((current) => current.id === message.id)
              ? prev
              : [...prev, message],
          );
          if (message.sender_id !== currentUserId) void markRoomAsRead();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) =>
            prev.map((message) => (message.id === next.id ? next : message)),
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, markRoomAsRead, roomId, supabase]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      body: text,
      room_id: roomId,
      sender_id: currentUserId,
    });
    setSending(false);
    if (error) toast.error("메시지를 보낼 수 없어요. 잠시 후 다시 보내주세요.");
    else setBody("");
  }

  return (
    <SurfaceCard className="grid h-[calc(100dvh-15rem)] min-h-[520px] max-h-[860px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden shadow-none">
      <header className="flex items-start justify-between gap-4 border-b border-border/80 px-8 py-6">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold">{peer.name}</h2>
          <p className="mt-2 truncate text-base text-muted-foreground">
            {peer.jobTitle ?? "공고 없이 시작한 대화"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="대화 옵션"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <MoreVertical aria-hidden="true" className="size-5" />
          </button>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="min-h-0 overflow-y-auto px-8 py-7"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            첫 메시지를 보내보세요.
          </div>
        ) : null}
        <div className="space-y-10">
          {messagesWithDateMarkers.map(({ message, showDate }) => {
            const mine = message.sender_id === currentUserId;
            return (
              <Fragment key={message.id}>
                {showDate ? (
                  <div className="flex justify-center">
                    <time
                      dateTime={message.created_at}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      {dateFormatter.format(new Date(message.created_at))}
                    </time>
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  mine={mine}
                  peer={peer}
                />
              </Fragment>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSend} className="flex gap-3 px-8 pb-8 pt-4">
        <label htmlFor={inputId} className="sr-only">
          메시지 입력
        </label>
        <Input
          id={inputId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="메시지 입력"
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={sending || !body.trim()}
        >
          전송
        </Button>
      </form>
    </SurfaceCard>
  );
}

function MessageBubble({
  message,
  mine,
  peer,
}: {
  message: Message;
  mine: boolean;
  peer: MessageRoomPeer;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[76%] gap-3",
          mine ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!mine ? (
          <Avatar className="mt-1 size-11" size="lg">
            {peer.avatarUrl ? (
              <AvatarImage src={peer.avatarUrl} alt={`${peer.name} 프로필 사진`} />
            ) : null}
            <AvatarFallback className="font-bold text-foreground">
              {getAvatarFallback(peer.name)}
            </AvatarFallback>
          </Avatar>
        ) : null}
        <div className={cn("min-w-0", mine && "text-right")}>
          <div
            className={cn(
              "inline-flex rounded-xl px-5 py-3 text-base leading-relaxed",
              mine
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {message.body}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <time dateTime={message.created_at}>
              {timeFormatter.format(new Date(message.created_at))}
            </time>
            {mine ? (
              <span> · {message.read_at ? "읽음" : "전송됨"}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}
