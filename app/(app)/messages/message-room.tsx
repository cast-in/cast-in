"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Message = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "body" | "sender_id" | "created_at" | "read_at"
>;

export function MessageRoom({
  roomId,
  currentUserId,
}: {
  roomId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

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
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
          if (m.sender_id !== currentUserId) void markRoomAsRead();
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

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_id: currentUserId,
      body: text,
    });
    setSending(false);
    if (error) toast.error("메시지를 보낼 수 없어요. 잠시 후 다시 보내주세요.");
    else setBody("");
  }

  return (
    <Card className="grid h-[65vh] grid-rows-[1fr_auto] gap-3 p-4">
      <div
        ref={scrollerRef}
        className="flex flex-col gap-2 overflow-y-auto px-1"
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            첫 메시지를 보내보세요.
          </div>
        )}
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                mine ? "justify-end" : "justify-start",
              )}
            >
              <div className="max-w-[72%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {message.body}
                </div>
                <div
                  className={cn(
                    "mt-1 text-[0.72rem] text-muted-foreground",
                    mine && "text-right",
                  )}
                >
                  <time dateTime={message.created_at}>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  {mine ? (
                    <span> · {message.read_at ? "읽음" : "전송됨"}</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          메시지 입력
        </label>
        <Input
          id={inputId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="메시지 입력"
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          전송
        </Button>
      </form>
    </Card>
  );
}
