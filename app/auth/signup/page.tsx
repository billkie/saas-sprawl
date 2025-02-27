import { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { AuthButton } from '@/components/auth/auth-buttons';

export const metadata: Metadata = {
  title: 'Sign Up - Quacco',
  description: 'Create your Quacco account to manage your SaaS subscriptions',
};

export default function SignUpPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href={'/' as Route} className="hover:text-gray-200">
            Quacco
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Quacco has helped us save thousands on unused SaaS subscriptions and better manage our software spend.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis, CTO</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign up for Quacco to start managing your SaaS subscriptions
            </p>
          </div>
          <div className="grid gap-6">
            <AuthButton isSignUp={true} />
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href={'/auth/signin' as Route}
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </div>
          <p className="px-8 text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href={'/terms' as Route}
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href={'/privacy' as Route}
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
} 