import { redirect } from "next/navigation";
import {
  listDirectorBrandLogos,
  type BrandLogoAsset,
} from "@/lib/queries/brand-logos";
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
  let companyLogos: BrandLogoAsset[] = [];

  try {
    [actors, companyLogos] = await Promise.all([
      listLandingActors(18),
      listDirectorBrandLogos(),
    ]);
  } catch (error) {
    console.error("Failed to load landing data", error);
  }

  return <LandingShowcase actors={actors} companyLogos={companyLogos} />;
}
