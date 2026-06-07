"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { socialLinksToJson, type ActorSocialLink } from "@/lib/social-links";
import { normalizeHttpUrl, normalizeSocialUrl } from "@/lib/url-validation";
import type { Database, Json } from "@/types/database";

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

function buildSocialLinks(formData: FormData) {
  const raw = String(formData.get("social_url") ?? "").trim();
  const url = normalizeSocialUrl(raw);
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
      href: rawHref ? normalizeHttpUrl(rawHref) : null,
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

function actorCreditsToJson(credits: ActorCreditInsert[]): Json {
  return credits.map((credit) => ({
    href: credit.href ?? null,
    role: credit.role ?? null,
    sort_order: credit.sort_order ?? 0,
    title: credit.title,
    year: credit.year ?? null,
  }));
}

function actorAwardsToJson(awards: ActorAwardInsert[]): Json {
  return awards.map((award) => ({
    organization: award.organization ?? null,
    sort_order: award.sort_order ?? 0,
    title: award.title,
    year: award.year ?? null,
  }));
}

export async function saveActorProfileEditAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("이름을 입력해주세요.");

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
  };

  const [{ error: profileError }, { error: actorProfileError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .update({
          name,
          email: String(formData.get("email") ?? "").trim() || user.email || null,
        })
        .eq("id", user.id),
      supabase.from("actor_profiles").upsert(actorPayload),
    ]);

  if (profileError) throw new Error(profileError.message);
  if (actorProfileError) throw new Error(actorProfileError.message);

  const credits = collectCredits(formData, user.id);
  const awards = collectAwards(formData, user.id);
  const { error: showcaseError } = await supabase.rpc("replace_my_actor_showcase", {
    target_awards: actorAwardsToJson(awards),
    target_credits: actorCreditsToJson(credits),
  });
  if (showcaseError) throw new Error(showcaseError.message);

  revalidatePath("/profile");
  redirect("/profile");
}
