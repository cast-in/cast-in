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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_BUCKET,
  ATTACHMENT_SIGNED_URL_TTL_SECONDS,
  MAX_ATTACHMENT_COUNT,
  attachmentsToJson,
  createAttachmentMetadata,
  createAttachmentPath,
  formatAttachmentSize,
  parseAttachmentList,
  signAttachments,
  validateAttachmentFile,
  type AttachmentMetadata,
} from "@/lib/attachments";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type MessageRow = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "body" | "sender_id" | "created_at" | "read_at" | "attachments"
>;

type Message = Omit<MessageRow, "attachments"> & {
  attachments: AttachmentMetadata[];
};

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
  const fileInputId = useId();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    AttachmentMetadata[]
  >([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const hydrateMessage = useCallback(
    async (row: MessageRow): Promise<Message> => ({
      ...row,
      attachments: await signAttachments(
        supabase,
        parseAttachmentList(row.attachments),
      ),
    }),
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender_id, created_at, read_at, attachments")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled && data) {
        setMessages(await Promise.all(data.map(hydrateMessage)));
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
          void (async () => {
            const message = await hydrateMessage(payload.new as MessageRow);
            setMessages((prev) =>
              prev.some((current) => current.id === message.id)
                ? prev
                : [...prev, message],
            );
            if (message.sender_id !== currentUserId) void markRoomAsRead();
          })();
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
          void (async () => {
            const next = await hydrateMessage(payload.new as MessageRow);
            setMessages((prev) =>
              prev.map((message) => (message.id === next.id ? next : message)),
            );
          })();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, hydrateMessage, markRoomAsRead, roomId, supabase]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text && pendingAttachments.length === 0) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      attachments: attachmentsToJson(pendingAttachments),
      body: text,
      room_id: roomId,
      sender_id: currentUserId,
    });
    setSending(false);
    if (error) toast.error("메시지를 보낼 수 없어요. 잠시 후 다시 보내주세요.");
    else {
      setBody("");
      setPendingAttachments([]);
    }
  }

  async function handleAttachmentChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    let nextCount = pendingAttachments.length;
    setUploading(true);
    try {
      for (const file of files) {
        if (nextCount >= MAX_ATTACHMENT_COUNT) {
          toast.error("첨부 파일은 최대 5개까지 보낼 수 있어요.");
          break;
        }

        const validationError = validateAttachmentFile(file);
        if (validationError) {
          toast.error(validationError);
          continue;
        }

        const path = createAttachmentPath({
          file,
          scope: "messages",
          targetId: roomId,
          userId: currentUserId,
        });
        const { error } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          toast.error(error.message);
          continue;
        }

        const { data: signed } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .createSignedUrl(path, ATTACHMENT_SIGNED_URL_TTL_SECONDS);
        const attachment = {
          ...createAttachmentMetadata({ file, path }),
          signedUrl: signed?.signedUrl ?? null,
        };
        setPendingAttachments((current) => [...current, attachment]);
        nextCount += 1;
      }
    } finally {
      setUploading(false);
    }
  }

  async function removePendingAttachment(attachment: AttachmentMetadata) {
    setPendingAttachments((current) =>
      current.filter((item) => item.id !== attachment.id),
    );
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([attachment.path]);
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

      <form onSubmit={handleSend} className="space-y-3 px-8 pb-8 pt-4">
        {pendingAttachments.length > 0 ? (
          <ul className="grid gap-2" aria-label="보낼 첨부 파일">
            {pendingAttachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAttachmentSize(attachment.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  color="neutral"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${attachment.name} 첨부 제거`}
                  disabled={sending || uploading}
                  onClick={() => void removePendingAttachment(attachment)}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex gap-3">
          <label htmlFor={inputId} className="sr-only">
            메시지 입력
          </label>
          <label htmlFor={fileInputId} className="sr-only">
            첨부 파일 선택
          </label>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            disabled={
              sending ||
              uploading ||
              pendingAttachments.length >= MAX_ATTACHMENT_COUNT
            }
            onChange={handleAttachmentChange}
            className="sr-only"
          />
          <Button
            type="button"
            color="neutral"
            variant="outline"
            size="icon"
            title="파일 첨부"
            aria-label="파일 첨부"
            loading={uploading}
            disabled={
              sending ||
              pendingAttachments.length >= MAX_ATTACHMENT_COUNT
            }
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip aria-hidden="true" className="size-4" />
          </Button>
          <Input
            id={inputId}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="메시지 입력"
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={
              sending ||
              uploading ||
              (!body.trim() && pendingAttachments.length === 0)
            }
            isLoading={sending}
          >
            전송
          </Button>
        </div>
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
              "inline-flex max-w-full flex-col gap-3 rounded-xl px-5 py-3 text-base leading-relaxed",
              mine
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {message.body.trim() ? (
              <p className="whitespace-pre-wrap break-words text-left">
                {message.body}
              </p>
            ) : null}
            {message.attachments.length > 0 ? (
              <MessageAttachmentLinks
                attachments={message.attachments}
                mine={mine}
              />
            ) : null}
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

function MessageAttachmentLinks({
  attachments,
  mine,
}: {
  attachments: AttachmentMetadata[];
  mine: boolean;
}) {
  return (
    <ul className="grid gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {attachment.signedUrl ? (
            <a
              href={attachment.signedUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex max-w-[280px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                mine
                  ? "bg-white/15 text-primary-foreground hover:bg-white/20"
                  : "bg-background text-foreground hover:bg-background/80",
              )}
            >
              <Paperclip aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{attachment.name}</span>
              <span
                className={cn(
                  "shrink-0 text-xs",
                  mine ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {formatAttachmentSize(attachment.size)}
              </span>
            </a>
          ) : (
            <span
              className={cn(
                "flex max-w-[280px] items-center gap-2 text-sm",
                mine ? "text-primary-foreground/75" : "text-muted-foreground",
              )}
            >
              <Paperclip aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{attachment.name}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
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
