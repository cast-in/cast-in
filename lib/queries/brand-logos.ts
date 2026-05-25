import "server-only";

import { createClient } from "@supabase/supabase-js";

export type BrandLogoAsset = {
  name: string;
  src: string;
};

const BRAND_LOGO_BUCKET = "brand-logos";
const DIRECTOR_LOGO_PREFIX = "director";

export async function listDirectorBrandLogos(
  limit = 60,
): Promise<BrandLogoAsset[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return [];

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.storage
    .from(BRAND_LOGO_BUCKET)
    .list(DIRECTOR_LOGO_PREFIX, {
      limit,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) throw error;

  return (data ?? [])
    .filter((item) => isLogoFile(item.name))
    .map((item) => {
      const path = `${DIRECTOR_LOGO_PREFIX}/${item.name}`;
      const { data: publicUrl } = supabase.storage
        .from(BRAND_LOGO_BUCKET)
        .getPublicUrl(path);

      return {
        name: formatLogoName(item.name),
        src: publicUrl.publicUrl,
      };
    });
}

function isLogoFile(fileName: string) {
  return /\.(png|jpe?g|webp|svg)$/i.test(fileName);
}

function formatLogoName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/^logo-0*/i, "Logo ")
    .trim();
}
