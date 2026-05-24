import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ActorCredit =
  Database["public"]["Tables"]["actor_credits"]["Row"];

export type ActorAward =
  Database["public"]["Tables"]["actor_awards"]["Row"];

export type ActorProfileMetrics = {
  viewCount: number;
  saveCount: number;
  offerCount: number;
};

const EMPTY_METRICS: ActorProfileMetrics = {
  viewCount: 0,
  saveCount: 0,
  offerCount: 0,
};

export async function listActorCredits(actorId: string): Promise<ActorCredit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actor_credits")
    .select("*")
    .eq("actor_id", actorId)
    .order("sort_order", { ascending: true })
    .order("year", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listActorAwards(actorId: string): Promise<ActorAward[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actor_awards")
    .select("*")
    .eq("actor_id", actorId)
    .order("sort_order", { ascending: true })
    .order("year", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActorProfileMetrics(
  actorId: string,
): Promise<ActorProfileMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_actor_profile_metrics", { target_actor_id: actorId })
    .maybeSingle();

  if (error || !data) return EMPTY_METRICS;

  return {
    viewCount: Number(data.view_count ?? 0),
    saveCount: Number(data.save_count ?? 0),
    offerCount: Number(data.offer_count ?? 0),
  };
}

export async function recordActorProfileView(actorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("actor_profile_views").insert({
    actor_id: actorId,
    viewer_id: user.id,
  });
}
