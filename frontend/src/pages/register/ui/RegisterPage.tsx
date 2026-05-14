import PolycodersLogo from '@/assets/svg/polycodersLogo.svg';
import { RegisterForm } from '@/features/auth';

import { Card, CardContent, CardHeader } from '@/shared/ui';

export function RegisterPage() {
  return (
    <div className="bg-muted/30 flex min-h-[100svh] flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Card className="md:bg-card border-0 bg-transparent shadow-none md:rounded-2xl md:border md:shadow-lg">
          <CardHeader className="pt-8">
            <div className="text-center">
              <img
                src={PolycodersLogo}
                alt="Polycoders Logo"
                className="h-8 w-auto shrink-0 object-contain transition-transform hover:scale-105"
              />
              <h1 className="mt-3 text-xl font-semibold tracking-tight uppercase">
                Sign up
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
