import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getViewerProfile } from "@/lib/queries/viewer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, activeRole, availableRoles } = await getViewerProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/role");
  if (!activeRole || availableRoles.length === 0) redirect("/onboarding/role");

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader viewer={{ user, profile, activeRole, availableRoles }} />

      <main className="mx-auto max-w-[1280px] p-5">{children}</main>
    </div>
  );
}
