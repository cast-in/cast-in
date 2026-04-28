import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/features/back-button";
import { PageContainer } from "@/components/page-container";
import { getViewerProfile } from "@/lib/queries/viewer";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage() {
  const { activeRole } = await getViewerProfile();
  if (activeRole !== "casting") redirect("/jobs");

  return (
    <PageContainer>
      <header className="flex items-center gap-2">
        <BackButton fallbackHref="/jobs" />
        <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
          공고 올리기
        </h1>
      </header>
      <Card>
        <CardContent className="p-6">
          <NewJobForm />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
