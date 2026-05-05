"use server";

import { revalidatePath } from "next/cache";
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

  if (!input.url?.startsWith("http")) {
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

  const oldPath = profile?.avatar_url ? extractAvatarPath(profile.avatar_url) : null;
  if (oldPath?.startsWith(`${user.id}/`)) {
    await supabase.storage.from("avatars").remove([oldPath]);
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/dashboard");
  revalidatePath("/talents");
  return { ok: true };
}

function extractAvatarPath(url: string) {
  const match = url.match(/\/avatars\/(.+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
