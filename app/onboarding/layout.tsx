import { LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { signOutAction } from "@/app/(public)/login/actions";
import { cn } from "@/lib/utils";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <div className="w-[min(540px,calc(100vw-40px))]">
        <Card>
          <CardContent className="p-8">{children}</CardContent>
        </Card>
        <form action={signOutAction} className="mt-4 flex justify-center">
          <button
            type="submit"
            className={cn(
              buttonVariants({ color: "neutral", variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <LogOut aria-hidden="true" className="size-4" />
            다른 계정으로 로그인하기
          </button>
        </form>
      </div>
    </main>
  );
}
