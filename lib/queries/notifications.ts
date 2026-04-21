import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { ApplicationStatus } from "@/types/enums";

export type NotificationItem = {
  id: string;
  type: string;
  created_at: string;
  read_at: string | null;
  title: string;
  description: string;
  href: string;
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "대기",
  reviewing: "검토중",
  pass: "합격",
  hold: "보류",
  reject: "반려",
};

export async function countUnreadNotifications(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function listMyNotifications(
  limit = 50,
): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!notifications || notifications.length === 0) return [];

  const jobIds = new Set<string>();
  const profileIds = new Set<string>();

  for (const notification of notifications) {
    const payload = asRecord(notification.payload);
    const jobId = asString(payload.job_id);
    const actorId = asString(payload.actor_id);
    const senderId = asString(payload.sender_id);
    if (jobId) jobIds.add(jobId);
    if (actorId) profileIds.add(actorId);
    if (senderId) profileIds.add(senderId);
  }

  const [{ data: jobs }, { data: profiles }] = await Promise.all([
    jobIds.size > 0
      ? supabase
          .from("jobs")
          .select("id, title")
          .in("id", Array.from(jobIds))
      : Promise.resolve({ data: [] }),
    profileIds.size > 0
      ? supabase
          .from("profiles")
          .select("id, name")
          .in("id", Array.from(profileIds))
      : Promise.resolve({ data: [] }),
  ]);

  const titleByJobId = new Map((jobs ?? []).map((job) => [job.id, job.title]));
  const nameByProfileId = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.name]),
  );

  return notifications.map((notification) => {
    const payload = asRecord(notification.payload);
    const jobId = asString(payload.job_id);
    const roomId = asString(payload.room_id);
    const actorId = asString(payload.actor_id);
    const senderId = asString(payload.sender_id);
    const jobTitle = jobId ? titleByJobId.get(jobId) : null;

    if (notification.type === "application_created") {
      const actorName = actorId ? nameByProfileId.get(actorId) : null;
      return {
        id: notification.id,
        type: notification.type,
        created_at: notification.created_at,
        read_at: notification.read_at,
        title: "새 지원자가 있어요",
        description: `${actorName ?? "지원자"}님이 ${jobTitle ?? "공고"}에 지원했어요.`,
        href: jobId ? `/jobs/${jobId}` : "/jobs",
      };
    }

    if (notification.type === "application_status_updated") {
      const status = asString(payload.status) as ApplicationStatus | "";
      return {
        id: notification.id,
        type: notification.type,
        created_at: notification.created_at,
        read_at: notification.read_at,
        title: "지원 상태가 바뀌었어요",
        description: `${jobTitle ?? "지원한 공고"} · ${
          status && STATUS_LABEL[status] ? STATUS_LABEL[status] : "상태 변경"
        }`,
        href: jobId ? `/jobs/${jobId}` : "/jobs",
      };
    }

    if (notification.type === "message_created") {
      const senderName = senderId ? nameByProfileId.get(senderId) : null;
      return {
        id: notification.id,
        type: notification.type,
        created_at: notification.created_at,
        read_at: notification.read_at,
        title: "새 메시지가 도착했어요",
        description: [senderName ?? "상대방", jobTitle].filter(Boolean).join(" · "),
        href: roomId ? `/messages?room=${roomId}` : "/messages",
      };
    }

    return {
      id: notification.id,
      type: notification.type,
      created_at: notification.created_at,
      read_at: notification.read_at,
      title: "새 알림이 있어요",
      description: "확인이 필요한 업데이트가 있어요.",
      href: "/notifications",
    };
  });
}

function asRecord(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}
