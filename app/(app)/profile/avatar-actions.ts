"use server";

import { revalidatePath } from "next/cache";
import { getUserPublicStoragePath } from "@/lib/supabase/storage-url";
import { createClient } from "@/lib/supabase/server";

export type UpdateAvatarResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileAvatarAction(input: {
  url: string;
}): Promise<UpdateAvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const newPath = getUserPublicStoragePath(input.url, "avatars", user.id);
  if (!newPath) {
    return { ok: false, error: "업로드된 파일 URL이 올바르지 않아요." };
  }

  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: input.url })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  const oldPath = profile?.avatar_url
    ? getUserPublicStoragePath(profile.avatar_url, "avatars", user.id)
    : null;
  if (oldPath?.startsWith(`${user.id}/`)) {
    await supabase.storage.from("avatars").remove([oldPath]);
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/dashboard");
  revalidatePath("/talents");
  return { ok: true };
}
