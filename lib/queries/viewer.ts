import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";

export const getViewerProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, availableRoles: [] as UserRole[], activeRole: null };
  }

  const [{ data: profile, error }, { data: actorProfile }, { data: castingProfile }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, role, email, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("actor_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("casting_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (error) throw error;

  const availableRoles: UserRole[] = [];
  if (actorProfile) availableRoles.push("actor");
  if (castingProfile) availableRoles.push("casting");

  const preferredRole = profile?.role ?? null;
  const activeRole =
    preferredRole && availableRoles.includes(preferredRole)
      ? preferredRole
      : availableRoles[0] ?? null;

  return { user, profile, availableRoles, activeRole };
});
