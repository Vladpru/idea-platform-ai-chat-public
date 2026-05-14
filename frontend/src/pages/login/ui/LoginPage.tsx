import { LoginForm } from '@/features/auth';

import { Card, CardContent, CardHeader } from '@/shared/ui';

export function LoginPage() {
  return (
    <div className="bg-muted/30 md:bg-muted/30 flex min-h-[100svh] flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Card className="md:bg-card border-0 bg-transparent shadow-none md:rounded-2xl md:border md:shadow-lg">
          <CardHeader className="pt-8">
            <div className="text-center">
              <div className="text-muted-foreground text-xs font-semibold tracking-[0.22em]">
                LOGO
              </div>
              <h1 className="mt-3 text-xl font-semibold tracking-tight uppercase">
                Sign in
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Welcome back! Please enter your details.
              </p>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
