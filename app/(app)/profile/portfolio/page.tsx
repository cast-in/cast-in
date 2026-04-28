import { redirect } from "next/navigation";
import { BackButton } from "@/components/features/back-button";
import { PageContainer } from "@/components/page-container";
import { listMyPortfolio } from "@/lib/queries/portfolio";
import { getViewerProfile } from "@/lib/queries/viewer";
import { PortfolioManager } from "./portfolio-manager";

export default async function PortfolioPage() {
  const { profile, activeRole } = await getViewerProfile();
  if (!profile) redirect("/login");
  if (activeRole !== "actor") redirect("/profile");

  const items = await listMyPortfolio();

  return (
    <PageContainer>
      <header className="flex items-center gap-2">
        <BackButton fallbackHref="/profile" />
        <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
          포트폴리오 관리
        </h1>
      </header>
      <PortfolioManager userId={profile.id} initialItems={items} />
    </PageContainer>
  );
}
