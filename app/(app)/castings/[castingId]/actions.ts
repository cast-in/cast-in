"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startCastingConversationAction(formData: FormData) {
  const castingId = String(formData.get("casting_id") ?? "").trim();
  if (!castingId) redirect("/discover");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: actorProfile } = await supabase
    .from("actor_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!actorProfile) redirect(`/castings/${castingId}`);

  const { data: existingRoom } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("actor_id", user.id)
    .eq("casting_id", castingId)
    .is("job_id", null)
    .limit(1)
    .maybeSingle();

  if (existingRoom) redirect(`/messages?room=${existingRoom.id}`);

  const { data: room, error } = await supabase
    .from("chat_rooms")
    .insert({
      actor_id: user.id,
      casting_id: castingId,
      job_id: null,
    })
    .select("id")
    .maybeSingle();

  if (error || !room) redirect(`/messages?casting=${castingId}`);

  revalidatePath("/messages");
  redirect(`/messages?room=${room.id}`);
}
