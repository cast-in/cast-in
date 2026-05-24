"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { socialLinksToJson, type ActorSocialLink } from "@/lib/social-links";
import type { Database } from "@/types/database";

type ActorProfileUpsert =
  Database["public"]["Tables"]["actor_profiles"]["Insert"];
type ActorCreditInsert =
  Database["public"]["Tables"]["actor_credits"]["Insert"];
type ActorAwardInsert =
  Database["public"]["Tables"]["actor_awards"]["Insert"];

function parseCsv(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseBirthDateFromAge(value: FormDataEntryValue | null) {
  const age = parsePositiveInt(value);
  if (!age) return null;

  const year = new Date().getFullYear() - age;
  return `${year}-01-01`;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("@")) {
    return `https://instagram.com/${trimmed.slice(1)}`;
  }

  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

function buildSocialLinks(formData: FormData) {
  const raw = String(formData.get("social_url") ?? "").trim();
  const url = normalizeUrl(raw);
  if (!url) return [];

  const title = raw.startsWith("@")
    ? raw
    : String(formData.get("social_title") ?? "").trim() || raw;

  return [{ title, url }] satisfies ActorSocialLink[];
}

function collectCredits(formData: FormData, actorId: string): ActorCreditInsert[] {
  const years = formData.getAll("credit_year");
  const titles = formData.getAll("credit_title");
  const roles = formData.getAll("credit_role");
  const hrefs = formData.getAll("credit_href");
  const rows: ActorCreditInsert[] = [];

  titles.forEach((titleValue, index) => {
    const title = String(titleValue ?? "").trim();
    if (!title) return;

    const rawHref = String(hrefs[index] ?? "").trim();
    rows.push({
      actor_id: actorId,
      year: parsePositiveInt(years[index] ?? null),
      title,
      role: String(roles[index] ?? "").trim() || null,
      href: rawHref ? normalizeUrl(rawHref) : null,
      sort_order: index,
    });
  });

  return rows;
}

function collectAwards(formData: FormData, actorId: string): ActorAwardInsert[] {
  const years = formData.getAll("award_year");
  const titles = formData.getAll("award_title");
  const organizations = formData.getAll("award_organization");
  const rows: ActorAwardInsert[] = [];

  titles.forEach((titleValue, index) => {
    const title = String(titleValue ?? "").trim();
    if (!title) return;

    rows.push({
      actor_id: actorId,
      year: parsePositiveInt(years[index] ?? null),
      title,
      organization: String(organizations[index] ?? "").trim() || null,
      sort_order: index,
    });
  });

  return rows;
}

export async function saveActorProfileEditAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase
    .from("profiles")
    .update({
      name,
      email: String(formData.get("email") ?? "").trim() || user.email || null,
    })
    .eq("id", user.id);

  const actorPayload: ActorProfileUpsert = {
    user_id: user.id,
    birth_date: parseBirthDateFromAge(formData.get("age")),
    gender: String(formData.get("gender") ?? "").trim() || null,
    region: String(formData.get("region") ?? "").trim() || null,
    height_cm: parsePositiveInt(formData.get("height_cm")),
    weight_kg: parsePositiveInt(formData.get("weight_kg")),
    affiliation:
      String(formData.get("affiliation") ?? "").trim() || "프리랜서",
    genres: parseCsv(formData.get("genres")),
    skills: parseCsv(formData.get("skills")),
    image_tags: parseCsv(formData.get("image_tags")),
    social_links: socialLinksToJson(buildSocialLinks(formData)),
    bio: String(formData.get("bio") ?? "").trim() || null,
    visibility: "public",
  };

  await supabase.from("actor_profiles").upsert(actorPayload);

  const credits = collectCredits(formData, user.id);
  await supabase.from("actor_credits").delete().eq("actor_id", user.id);
  if (credits.length > 0) {
    await supabase.from("actor_credits").insert(credits);
  }

  const awards = collectAwards(formData, user.id);
  await supabase.from("actor_awards").delete().eq("actor_id", user.id);
  if (awards.length > 0) {
    await supabase.from("actor_awards").insert(awards);
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  redirect("/profile");
}
