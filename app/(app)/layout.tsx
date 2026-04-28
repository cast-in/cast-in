import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { countUnreadMessages } from "@/lib/queries/chat";
import {
  countUnreadNotifications,
  listMyNotifications,
} from "@/lib/queries/notifications";
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

  const [unreadMessages, unreadNotifications, recentNotifications] = await Promise.all([
    countUnreadMessages().catch(() => 0),
    countUnreadNotifications().catch(() => 0),
    listMyNotifications(5).catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader
        viewer={{
          user,
          profile,
          activeRole,
          availableRoles,
          unreadMessages,
          unreadNotifications,
          recentNotifications,
        }}
      />

      <main className="mx-auto max-w-[1280px] p-5">{children}</main>
    </div>
  );
}
