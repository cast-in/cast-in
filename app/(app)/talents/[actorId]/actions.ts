"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startActorConversationAction(formData: FormData) {
  const actorId = String(formData.get("actor_id") ?? "").trim();
  if (!actorId) redirect("/talents");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: castingProfile } = await supabase
    .from("casting_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!castingProfile) redirect("/messages");

  const { data: existingRoom } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("actor_id", actorId)
    .eq("casting_id", user.id)
    .is("job_id", null)
    .limit(1)
    .maybeSingle();

  if (existingRoom) redirect(`/messages?room=${existingRoom.id}`);

  const { data: room, error } = await supabase
    .from("chat_rooms")
    .insert({
      actor_id: actorId,
      casting_id: user.id,
      job_id: null,
    })
    .select("id")
    .maybeSingle();

  if (error || !room) redirect(`/messages?applicant=${actorId}`);

  revalidatePath("/messages");
  redirect(`/messages?room=${room.id}`);
}
