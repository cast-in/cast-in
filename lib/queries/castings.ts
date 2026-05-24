import { createClient } from "@/lib/supabase/server";

export type CastingProfileJob = {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  media_urls: string[];
  platforms: string[];
  region: string | null;
  role_type: string | null;
  deadline: string | null;
  status: "open" | "closed" | "draft";
  created_at: string;
};

export type CastingProfileDetail = {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  company_name: string;
  contact: string | null;
  intro: string | null;
  updated_at: string;
  job_count: number;
  jobs: CastingProfileJob[];
};

export async function getCastingProfileDetail(
  castingId: string,
): Promise<CastingProfileDetail | null> {
  const supabase = await createClient();
  const [
    { data: profile, error: profileError },
    { data: castingProfile, error: castingProfileError },
    { count: jobCount, error: jobCountError },
    { data: jobs, error: jobsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, avatar_url")
      .eq("id", castingId)
      .maybeSingle(),
    supabase
      .from("casting_profiles")
      .select("company_name, contact, intro, updated_at")
      .eq("user_id", castingId)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("casting_id", castingId),
    supabase
      .from("jobs")
      .select(
        "id, title, description, genre, media_urls, platforms, region, role_type, deadline, status, created_at",
      )
      .eq("casting_id", castingId)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const error = profileError ?? castingProfileError ?? jobCountError ?? jobsError;
  if (error) throw error;
  if (!profile || !castingProfile) return null;

  return {
    id: profile.id,
    name: profile.name ?? "담당자 미등록",
    email: profile.email ?? null,
    avatar_url: profile.avatar_url ?? null,
    company_name: castingProfile.company_name,
    contact: castingProfile.contact ?? null,
    intro: castingProfile.intro ?? null,
    updated_at: castingProfile.updated_at,
    job_count: jobCount ?? 0,
    jobs: jobs ?? [],
  };
}
