"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Message = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "body" | "sender_id" | "created_at"
>;

export function MessageRoom({
  roomId,
  currentUserId,
}: {
  roomId: string;
  currentUserId: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender_id, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled && data) setMessages(data);
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
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

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
    if (error) alert("메시지를 보내지 못했어요. 다시 시도해주세요.");
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
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={cn(
                "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                mine
                  ? "justify-self-end bg-primary text-primary-foreground"
                  : "justify-self-start bg-muted",
              )}
            >
              {m.body}
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
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
