import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getViewerProfile } from "@/lib/queries/viewer";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage() {
  const { activeRole } = await getViewerProfile();
  if (activeRole !== "casting") redirect("/jobs");

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">새 공고 만들기</h1>
        <p className="text-sm text-muted-foreground">
          필수 정보만 채워도 모집을 바로 시작할 수 있어요.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <NewJobForm />
        </CardContent>
      </Card>
    </section>
  );
}
