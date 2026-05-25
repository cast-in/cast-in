"use server";

import { revalidatePath } from "next/cache";
import { getUserPublicStoragePath } from "@/lib/supabase/storage-url";
import { createClient } from "@/lib/supabase/server";

export type AddPortfolioResult =
  | { ok: true }
  | { ok: false; error: string };

export type DeletePortfolioResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPortfolioItemAction(input: {
  type: "image" | "video";
  url: string;
  caption?: string | null;
}): Promise<AddPortfolioResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const storagePath = getUserPublicStoragePath(input.url, "portfolio", user.id);
  if (!storagePath) {
    return { ok: false, error: "업로드된 파일 URL이 올바르지 않아요." };
  }
  if (input.type !== "image" && input.type !== "video") {
    return { ok: false, error: "지원하지 않는 포맷이에요." };
  }

  const { error } = await supabase.from("portfolio_items").insert({
    actor_id: user.id,
    type: input.type,
    url: input.url,
    caption: input.caption?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/profile/portfolio");
  return { ok: true };
}

export async function deletePortfolioItemAction(
  itemId: string,
): Promise<DeletePortfolioResult> {
  if (!itemId) return { ok: false, error: "항목을 찾을 수 없어요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { data: item, error: fetchErr } = await supabase
    .from("portfolio_items")
    .select("id, actor_id, url")
    .eq("id", itemId)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!item) return { ok: false, error: "항목을 찾을 수 없어요." };
  if (item.actor_id !== user.id) {
    return { ok: false, error: "이 항목을 지울 권한이 없어요." };
  }

  const storagePath = getUserPublicStoragePath(item.url, "portfolio", user.id);
  if (storagePath) {
    await supabase.storage.from("portfolio").remove([storagePath]);
  }

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/profile/portfolio");
  return { ok: true };
}
