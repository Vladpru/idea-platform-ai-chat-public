import PolycodersLogo from '@/assets/svg/polycodersLogo.svg';
import PolycodersLogoDark from '@/assets/svg/polycodersLogoWhiteText.svg';
import { LoginForm } from '@/features/auth';
import { Link } from '@tanstack/react-router';

import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui';

export function LoginPage() {
  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center">
      <div className="mx-auto w-full max-w-md 2xl:max-w-[560px]">
        <Card className="md:bg-card md:shadow-shadow-soft flex flex-col items-center justify-center rounded-sm border-0 bg-transparent py-5 shadow-none md:border">
          <CardHeader className="p-0">
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src={PolycodersLogo}
                alt="Polycoders Logo"
                className="h-15 w-auto shrink-0 object-contain dark:hidden"
              />
              <img
                src={PolycodersLogoDark}
                alt="Polycoders Logo"
                className="hidden h-15 w-auto shrink-0 object-contain dark:block"
              />
              <h1 className="text-brand-gray-900 mt-3 text-3xl font-bold tracking-tight uppercase">
                Sign in
              </h1>
              <p className="text-brand-gray-700 mt-2 text-sm">
                Welcome back! Please enter your details.
              </p>
            </div>
          </CardHeader>
          <CardContent className="w-full px-8">
            <LoginForm />
          </CardContent>
          <CardFooter className="mt-6 p-6">
            <p className="text-brand-gray-700 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-brand-dark-blue hover:text-brand-dark-blue/80 dark:text-primary dark:hover:text-primary/80 underline-none underline-none font-semibold hover:underline hover:underline-offset-2"
              >
                SIGN UP
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
