"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(
  formData: FormData,
): Promise<void> {
  const notificationId = String(formData.get("notification_id") ?? "");
  const redirectTo = getSafeRedirectPath(formData.get("redirect_to"));
  if (!notificationId) {
    if (redirectTo) redirect(redirectTo);
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (redirectTo) redirect(redirectTo);
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .is("read_at", null);
  if (!error) revalidateNotificationViews();

  if (redirectTo) redirect(redirectTo);
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

  revalidateNotificationViews();
}

function revalidateNotificationViews() {
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

function getSafeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
