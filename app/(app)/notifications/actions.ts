"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(
  formData: FormData,
): Promise<void> {
  const notificationId = String(formData.get("notification_id") ?? "");
  if (!notificationId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);
  if (error) return;

  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction(
  _formData: FormData,
): Promise<void> {
  void _formData;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return;

  revalidatePath("/notifications");
}
