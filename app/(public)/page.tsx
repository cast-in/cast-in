import { redirect } from "next/navigation";
import { listLandingActors, type LandingActor } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { LandingShowcase } from "./landing-showcase";

export default async function LandingPage() {
  const { user, profile, activeRole } = await getViewerProfile();

  if (user) {
    if (!profile || !activeRole) redirect("/onboarding/role");
    redirect("/talents");
  }

  let actors: LandingActor[] = [];

  try {
    actors = await listLandingActors(18);
  } catch (error) {
    console.error("Failed to load landing actors", error);
  }

  return <LandingShowcase actors={actors} />;
}
