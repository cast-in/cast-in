import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/features/back-button";
import { PageContainer } from "@/components/page-container";
import { getJob } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { EditJobForm } from "./edit-job-form";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, activeRole } = await getViewerProfile();
  if (activeRole !== "casting") redirect("/jobs");

  const job = await getJob(id);
  if (!job) notFound();
  if (job.casting_id !== user?.id) notFound();

  return (
    <PageContainer>
      <header className="flex items-center gap-2">
        <BackButton fallbackHref={`/jobs/${job.id}`} />
        <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
          공고 수정
        </h1>
      </header>
      <Card>
        <CardContent className="p-6">
          <EditJobForm job={job} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
