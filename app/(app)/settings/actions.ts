"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/enums";

export type SettingsActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function switchActiveRoleAction(formData: FormData) {
  const requestedRole = formData.get("role");
  const role: UserRole = requestedRole === "casting" ? "casting" : "actor";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const roleProfile =
    role === "actor"
      ? await supabase
          .from("actor_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle()
      : await supabase
          .from("casting_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

  if (!roleProfile.data) {
    redirect(`/onboarding/profile?role=${role}&intent=add`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/talents");
}

export async function updateNotificationSettingsAction(
  _prev: SettingsActionResult | null,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { error } = await supabase.from("notification_settings").upsert({
    user_id: user.id,
    application_notifications_enabled:
      formData.get("application_notifications_enabled") === "on",
    message_notifications_enabled:
      formData.get("message_notifications_enabled") === "on",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true, message: "알림 설정을 저장했어요." };
}

export async function sendPasswordResetFromSettingsAction(
  _prev: SettingsActionResult | null,
): Promise<SettingsActionResult> {
  void _prev;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "로그인한 이메일을 찾을 수 없어요." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${getOrigin()}/auth/callback?next=/login/reset`,
  });

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    message: "비밀번호 재설정 링크를 보냈어요. 메일함을 확인해주세요.",
  };
}

export type DeleteAccountResult =
  | { ok: false; error: string }
  | { ok: true };

export async function deleteAccountAction(
  formData: FormData,
): Promise<DeleteAccountResult> {
  const confirmText = String(formData.get("confirm_text") ?? "").trim();
  if (confirmText !== "삭제") {
    return { ok: false, error: "삭제를 입력해야 계정을 삭제할 수 있어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const admin = createAdminClient();
  const cleanupError = await removeOwnedStorageObjects(admin, user.id);
  if (cleanupError) return { ok: false, error: cleanupError };

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut();
  redirect("/login");
}

async function removeOwnedStorageObjects(
  admin: SupabaseClient<Database>,
  userId: string,
) {
  const buckets = ["avatars", "portfolio", "job-media", "attachments"] as const;

  for (const bucket of buckets) {
    const paths = await listStoragePaths(admin, bucket, userId);
    if (typeof paths === "string") return paths;
    if (paths.length === 0) continue;

    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) {
      return "업로드한 파일을 정리하지 못했어요. 잠시 후 다시 시도해주세요.";
    }
  }

  return null;
}

async function listStoragePaths(
  admin: SupabaseClient<Database>,
  bucket: string,
  prefix: string,
): Promise<string[] | string> {
  const { data, error } = await admin.storage.from(bucket).list(prefix, {
    limit: 1000,
  });
  if (error) {
    return "업로드한 파일을 확인하지 못했어요. 잠시 후 다시 시도해주세요.";
  }

  const paths: string[] = [];
  for (const item of data ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id) {
      paths.push(path);
      continue;
    }

    const nestedPaths = await listStoragePaths(admin, bucket, path);
    if (typeof nestedPaths === "string") return nestedPaths;
    paths.push(...nestedPaths);
  }

  return paths;
}

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3333";
}
