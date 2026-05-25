"use server";

import { revalidatePath } from "next/cache";
import { isJobAccepting } from "@/lib/job-status";
import {
  StartActorConversationSchema,
  formatZodError,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type StartActorConversationResult =
  | { ok: true; roomId: string }
  | { ok: false; error: string };

export async function startActorConversationAction(
  formData: FormData,
): Promise<StartActorConversationResult> {
  const rawJobId = String(formData.get("job_id") ?? "").trim();
  const parsed = StartActorConversationSchema.safeParse({
    actor_id: formData.get("actor_id") ?? "",
    job_id: rawJobId || undefined,
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  if (parsed.data.actor_id === user.id) {
    return { ok: false, error: "본인에게는 메시지를 보낼 수 없어요." };
  }

  const [{ data: castingProfile }, { data: actorProfile, error: actorError }] =
    await Promise.all([
      supabase
        .from("casting_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("actor_profiles")
        .select("user_id")
        .eq("user_id", parsed.data.actor_id)
        .eq("visibility", "public")
        .maybeSingle(),
    ]);

  if (!castingProfile) {
    return { ok: false, error: "캐스팅 모드에서만 메시지를 보낼 수 있어요." };
  }
  if (actorError) return { ok: false, error: actorError.message };
  if (!actorProfile) {
    return { ok: false, error: "배우 정보를 찾을 수 없어요." };
  }

  const jobId = parsed.data.job_id ?? null;
  if (jobId) {
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, deadline, status")
      .eq("id", jobId)
      .eq("casting_id", user.id)
      .maybeSingle();

    if (jobError) return { ok: false, error: jobError.message };
    if (!job) return { ok: false, error: "공고 정보를 찾을 수 없어요." };
    if (!isJobAccepting(job)) {
      return { ok: false, error: "모집 중인 공고만 선택할 수 있어요." };
    }
  }

  let roomId: string | null = null;

  if (jobId) {
    const { data: room, error } = await supabase
      .from("chat_rooms")
      .upsert(
        {
          actor_id: parsed.data.actor_id,
          casting_id: user.id,
          job_id: jobId,
        },
        { onConflict: "job_id,actor_id,casting_id" },
      )
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    roomId = room?.id ?? null;
  } else {
    const { data: existingRoom, error: existingRoomError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("actor_id", parsed.data.actor_id)
      .eq("casting_id", user.id)
      .is("job_id", null)
      .limit(1)
      .maybeSingle();

    if (existingRoomError) {
      return { ok: false, error: existingRoomError.message };
    }

    if (existingRoom) {
      roomId = existingRoom.id;
    } else {
      const { data: room, error } = await supabase
        .from("chat_rooms")
        .insert({
          actor_id: parsed.data.actor_id,
          casting_id: user.id,
          job_id: null,
        })
        .select("id")
        .maybeSingle();

      if (error) return { ok: false, error: error.message };
      roomId = room?.id ?? null;
    }
  }

  if (!roomId) return { ok: false, error: "대화방을 열 수 없어요." };

  const { error: messageError } = await supabase.from("messages").insert({
    room_id: roomId,
    sender_id: user.id,
    body: parsed.data.message,
  });

  if (messageError) return { ok: false, error: messageError.message };

  revalidatePath("/messages");
  return { ok: true, roomId };
}
