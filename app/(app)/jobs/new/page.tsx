import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { getViewerProfile } from "@/lib/queries/viewer";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage() {
  const { activeRole } = await getViewerProfile();
  if (activeRole !== "casting") redirect("/jobs");

  return (
    <PageContainer pageTitle="새 공고 만들기">
      <Card>
        <CardContent className="p-6">
          <NewJobForm />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
