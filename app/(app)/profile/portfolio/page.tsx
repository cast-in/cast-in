import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
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
    <PageContainer
      pageTitle="포트폴리오 관리"
      description="사진·영상을 올려 캐스팅 담당자에게 나를 보여주세요."
      actions={
        <Link
          href="/profile"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← 프로필로
        </Link>
      }
    >
      <PortfolioManager userId={profile.id} initialItems={items} />
    </PageContainer>
  );
}
