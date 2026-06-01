import { createClient } from "@/lib/supabase/server";
import { parseAttachmentList } from "@/lib/attachments";

export type ChatRoomSummary = {
  id: string;
  job_id: string | null;
  job_title: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  other_id: string;
  other_name: string;
  other_avatar_url: string | null;
};

export async function listMyChatRooms(): Promise<ChatRoomSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("id, job_id, actor_id, casting_id, last_message_at")
    .or(`actor_id.eq.${user.id},casting_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  if (!rooms || rooms.length === 0) return [];

  const otherIds = Array.from(
    new Set(
      rooms.map((r) =>
        r.actor_id === user.id ? r.casting_id : r.actor_id,
      ),
    ),
  );
  const jobIds = Array.from(
    new Set(
      rooms
        .map((r) => r.job_id)
        .filter((v): v is string => typeof v === "string"),
    ),
  );

  const [{ data: profiles }, { data: jobs }] = await Promise.all([
    supabase.from("profiles").select("id, name, avatar_url").in("id", otherIds),
    jobIds.length > 0
      ? supabase.from("jobs").select("id, title").in("id", jobIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const roomIds = rooms.map((r) => r.id);
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const lastMessageTimes = Array.from(
    new Set(
      rooms
        .map((room) => room.last_message_at)
        .filter((value): value is string => typeof value === "string"),
    ),
  );
  const { data: unreadMessages } = await supabase
    .from("messages")
    .select("room_id")
    .in("room_id", roomIds)
    .neq("sender_id", user.id)
    .is("read_at", null);

  const unreadByRoom = new Map<string, number>();
  for (const message of unreadMessages ?? []) {
    unreadByRoom.set(message.room_id, (unreadByRoom.get(message.room_id) ?? 0) + 1);
  }

  const lastMessagePreviewByRoom = new Map<string, string>();
  if (lastMessageTimes.length > 0) {
    const { data: lastMessages } = await supabase
      .from("messages")
      .select("room_id, body, created_at, attachments")
      .in("room_id", roomIds)
      .in("created_at", lastMessageTimes)
      .order("created_at", { ascending: false });

    for (const message of lastMessages ?? []) {
      const room = roomById.get(message.room_id);
      if (!room || room.last_message_at !== message.created_at) continue;
      if (lastMessagePreviewByRoom.has(message.room_id)) continue;

      const preview = formatMessagePreview(message);
      if (preview) lastMessagePreviewByRoom.set(message.room_id, preview);
    }
  }

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  const avatarById = new Map(
    (profiles ?? []).map((p) => [p.id, p.avatar_url ?? null]),
  );
  const titleById = new Map((jobs ?? []).map((j) => [j.id, j.title]));

  return rooms.map((r) => {
    const otherId = r.actor_id === user.id ? r.casting_id : r.actor_id;
    return {
      id: r.id,
      job_id: r.job_id,
      job_title: r.job_id ? (titleById.get(r.job_id) ?? null) : null,
      last_message_at: r.last_message_at,
      last_message_preview: lastMessagePreviewByRoom.get(r.id) ?? null,
      unread_count: unreadByRoom.get(r.id) ?? 0,
      other_id: otherId,
      other_name: nameById.get(otherId) ?? "익명",
      other_avatar_url: avatarById.get(otherId) ?? null,
    };
  });
}

export async function countUnreadMessages(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_id", user.id)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

function formatMessagePreview(message: {
  attachments: unknown;
  body: string | null;
}) {
  const body = typeof message.body === "string" ? message.body.trim() : "";
  if (body) return body;

  const attachments = parseAttachmentList(message.attachments);
  if (attachments.length === 1) return `첨부 파일: ${attachments[0].name}`;
  if (attachments.length > 1) return `첨부 파일 ${attachments.length}개`;

  return null;
}
