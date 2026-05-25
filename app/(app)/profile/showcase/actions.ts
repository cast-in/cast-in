"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeHttpUrl } from "@/lib/url-validation";

function parseYear(value: FormDataEntryValue | null) {
  const year = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(year) && year > 1900 ? year : null;
}

function normalizeHref(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return normalizeHttpUrl(raw);
}

async function getActorUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function addActorCreditAction(formData: FormData) {
  const { supabase, userId } = await getActorUserId();
  if (!userId) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const { error } = await supabase.from("actor_credits").insert({
    actor_id: userId,
    year: parseYear(formData.get("year")),
    title,
    role: String(formData.get("role") ?? "").trim() || null,
    href: normalizeHref(formData.get("href")),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/profile/showcase");
}

export async function deleteActorCreditAction(formData: FormData) {
  const { supabase, userId } = await getActorUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase
    .from("actor_credits")
    .delete()
    .eq("id", id)
    .eq("actor_id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/profile/showcase");
}

export async function addActorAwardAction(formData: FormData) {
  const { supabase, userId } = await getActorUserId();
  if (!userId) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const { error } = await supabase.from("actor_awards").insert({
    actor_id: userId,
    year: parseYear(formData.get("year")),
    title,
    organization: String(formData.get("organization") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/profile/showcase");
}

export async function deleteActorAwardAction(formData: FormData) {
  const { supabase, userId } = await getActorUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase
    .from("actor_awards")
    .delete()
    .eq("id", id)
    .eq("actor_id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/profile/showcase");
}
