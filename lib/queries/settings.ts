import { createClient } from "@/lib/supabase/server";

export type NotificationSettings = {
  application_notifications_enabled: boolean;
  message_notifications_enabled: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  application_notifications_enabled: true,
  message_notifications_enabled: true,
};

export async function getMyNotificationSettings(): Promise<NotificationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_NOTIFICATION_SETTINGS;

  const { data, error } = await supabase
    .from("notification_settings")
    .select("application_notifications_enabled, message_notifications_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  return data ?? DEFAULT_NOTIFICATION_SETTINGS;
}
