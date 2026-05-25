import { createClient } from "@/lib/supabase/server";
import { signPublicStorageUrls } from "@/lib/supabase/storage-url";
import type { Database } from "@/types/database";

export type PortfolioItem =
  Database["public"]["Tables"]["portfolio_items"]["Row"];

export async function listMyPortfolio(): Promise<PortfolioItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("actor_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return signPortfolioItemUrls(supabase, data ?? []);
}

export async function listPortfolioFor(
  actorId: string,
): Promise<PortfolioItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return signPortfolioItemUrls(supabase, data ?? []);
}

async function signPortfolioItemUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: PortfolioItem[],
) {
  const signedUrlByUrl = await signPublicStorageUrls(
    supabase,
    items.map((item) => item.url),
    "portfolio",
  );

  return items.map((item) => ({
    ...item,
    url: signedUrlByUrl.get(item.url) ?? item.url,
  }));
}
