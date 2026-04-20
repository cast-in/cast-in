import { Card, CardContent } from "@/components/ui/card";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <Card className="w-[min(540px,calc(100vw-40px))]">
        <CardContent className="p-8">{children}</CardContent>
      </Card>
    </main>
  );
}
