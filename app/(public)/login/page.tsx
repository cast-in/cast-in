import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { AuthForm } from "./auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <Card className="w-[min(460px,calc(100vw-40px))]">
        <CardHeader className="items-center text-center">
          <BrandLogo size={28} textClassName="text-base" />
        </CardHeader>
        <CardContent>
          <AuthForm />
        </CardContent>
      </Card>
    </main>
  );
}
