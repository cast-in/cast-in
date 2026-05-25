import { redirect } from "next/navigation";
import { PageContainer } from "@/components/page-container";
import { getViewerProfile } from "@/lib/queries/viewer";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage() {
  const { activeRole, user } = await getViewerProfile();
  if (activeRole !== "casting") redirect("/jobs");
  if (!user) redirect("/login");

  return (
    <PageContainer size="wide" className="max-w-[1300px] pb-16 pt-4 md:pt-8">
      <NewJobForm userId={user.id} />
    </PageContainer>
  );
}
