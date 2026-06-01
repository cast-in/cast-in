import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/page-container";
import { listMyNotifications } from "@/lib/queries/notifications";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./actions";

export default async function NotificationsPage() {
  const notifications = await listMyNotifications();
  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <PageContainer
      pageTitle="알림"
      actions={
        unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" color="secondary" size="sm">
              모두 읽기
            </Button>
          </form>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="아직 알림이 없어요"
          description="지원, 메시지, 상태 변경 알림이 생기면 여기에 보여드릴게요."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read_at ? "bg-card" : "border-primary/40 bg-primary/5"}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                      {notification.title}
                    </CardTitle>
                    {!notification.read_at ? <Badge>새 알림</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
                <time
                  dateTime={notification.created_at}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {new Date(notification.created_at).toLocaleDateString()}
                </time>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {!notification.read_at ? (
                  <form action={markNotificationReadAction}>
                    <input
                      type="hidden"
                      name="notification_id"
                      value={notification.id}
                    />
                    <input
                      type="hidden"
                      name="redirect_to"
                      value={notification.href}
                    />
                    <Button type="submit" size="sm">
                      확인하기
                    </Button>
                  </form>
                ) : (
                  <Link
                    href={notification.href}
                    className={buttonVariants({ size: "sm" })}
                  >
                    확인하기
                  </Link>
                )}
                {!notification.read_at ? (
                  <form action={markNotificationReadAction}>
                    <input
                      type="hidden"
                      name="notification_id"
                      value={notification.id}
                    />
                    <Button
                      type="submit"
                      color="neutral"
                      variant="outline"
                      size="sm"
                    >
                      읽음
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
