import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <Card className="w-[min(460px,calc(100vw-40px))]">
        <CardHeader className="items-center text-center">
          <BrandLogo
            href="/"
            className="mb-1"
            size={28}
            textClassName="text-base"
          />
          <CardTitle className="text-2xl">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </main>
  );
}
