import { createClient } from "@/lib/supabase/server";
import {
  signPublicStorageUrl,
  signPublicStorageUrls,
} from "@/lib/supabase/storage-url";

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
  avatar_url: string | null;
  company_name: string;
  intro: string | null;
  updated_at: string;
  job_count: number;
  jobs: CastingProfileJob[];
};

export type MyCastingProfilePrivate = {
  company_name: string;
  contact: string | null;
  intro: string | null;
  updated_at: string;
};

export async function getMyCastingProfilePrivate(): Promise<MyCastingProfilePrivate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_my_casting_profile_private")
    .maybeSingle();

  if (error) throw error;
  return data;
}

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
      .select("id, name, avatar_url")
      .eq("id", castingId)
      .maybeSingle(),
    supabase
      .from("casting_profiles")
      .select("company_name, intro, updated_at")
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

  const allMediaUrls = (jobs ?? []).flatMap((job) => job.media_urls ?? []);
  const [avatarUrl, signedMediaUrlByUrl] = await Promise.all([
    signPublicStorageUrl(supabase, profile.avatar_url, "avatars"),
    signPublicStorageUrls(supabase, allMediaUrls, "job-media"),
  ]);

  return {
    id: profile.id,
    name: profile.name ?? "담당자 미등록",
    avatar_url: avatarUrl,
    company_name: castingProfile.company_name,
    intro: castingProfile.intro ?? null,
    updated_at: castingProfile.updated_at,
    job_count: jobCount ?? 0,
    jobs: (jobs ?? []).map((job) => ({
      ...job,
      media_urls: (job.media_urls ?? []).map(
        (url) => signedMediaUrlByUrl.get(url) ?? url,
      ),
    })),
  };
}
