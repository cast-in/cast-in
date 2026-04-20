"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";

export async function switchActiveRoleAction(formData: FormData) {
  const requestedRole = formData.get("role");
  const role: UserRole = requestedRole === "casting" ? "casting" : "actor";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const roleProfile =
    role === "actor"
      ? await supabase
          .from("actor_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle()
      : await supabase
          .from("casting_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

  if (!roleProfile.data) {
    redirect(`/onboarding/profile?role=${role}&intent=add`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/discover");
}
