import { redirect } from "next/navigation";
import {
  listDirectorBrandLogos,
  type BrandLogoAsset,
} from "@/lib/queries/brand-logos";
import {
  listLandingActors,
  listLandingJobsWithImages,
  type LandingActor,
  type LandingJobPosting,
} from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { LandingShowcase } from "./landing-showcase";

export default async function LandingPage() {
  const { user, profile, activeRole } = await getViewerProfile();

  if (user) {
    if (!profile || !activeRole) redirect("/onboarding/role");
    redirect("/talents");
  }

  let actors: LandingActor[] = [];
  let jobPostings: LandingJobPosting[] = [];
  let companyLogos: BrandLogoAsset[] = [];

  try {
    [actors, jobPostings, companyLogos] = await Promise.all([
      listLandingActors(18),
      listLandingJobsWithImages(24),
      listDirectorBrandLogos(),
    ]);
  } catch (error) {
    console.error("Failed to load landing data", error);
  }

  return (
    <LandingShowcase
      actors={actors}
      companyLogos={companyLogos}
      jobPostings={jobPostings}
    />
  );
}
