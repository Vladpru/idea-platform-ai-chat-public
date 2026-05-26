import PolycodersLogo from '@/assets/svg/polycodersLogo.svg';
import { ForgotPasswordForm } from '@/features/auth';
import { Link } from '@tanstack/react-router';

import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui';

export function ForgotPasswordPage() {
  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center">
      <div className="mx-auto w-full max-w-md 2xl:max-w-[560px]">
        <Card className="md:bg-card md:shadow-shadow-soft flex flex-col items-center justify-center rounded-sm border-0 bg-transparent py-5 shadow-none md:border">
          <CardHeader className="p-0">
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src={PolycodersLogo}
                alt="Polycoders Logo"
                className="h-15 w-auto shrink-0 object-contain"
              />
              <h1 className="text-brand-gray-900 mt-3 text-3xl font-bold tracking-tight uppercase">
                Forgot Password ?
              </h1>
              <p className="text-brand-gray-700 mt-2 px-10 text-center text-sm">
                Enter your registered email address below, and we will send you
                a link to reset your password.
              </p>
            </div>
          </CardHeader>
          <CardContent className="w-full px-8">
            <ForgotPasswordForm />
          </CardContent>
          <CardFooter className="mt-6 p-6">
            <p className="text-brand-gray-700 text-center text-sm">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-brand-dark-blue hover:text-brand-dark-blue/80 dark:text-brand-light-blue dark:hover:text-brand-light-blue/80 font-semibold hover:underline hover:underline-offset-2"
              >
                SIGN IN
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
