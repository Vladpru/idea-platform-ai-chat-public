import { RegisterForm } from "@/features/auth";
import { Card, CardContent, CardHeader } from "@/shared/ui";

export function RegisterPage() {
  return (
    <div className="bg-muted/30 min-h-[100svh] px-4 py-10  flex flex-col justify-center">
      <div className="mx-auto w-full max-w-sm">
        <Card className="border-0 shadow-none bg-transparent md:border md:shadow-lg md:bg-card md:rounded-2xl">
          <CardHeader className="pt-8">
            <div className="text-center">
              <div className="text-muted-foreground text-xs font-semibold tracking-[0.22em]">
                LOGO
              </div>
              <h1 className="mt-3 text-xl font-semibold tracking-tight">
                SIGN UP
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Create your account to get started.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
          <div className="px-6 pb-8" />
        </Card>
      </div>
    </div>
  );
}
