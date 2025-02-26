import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CompanyForm } from '@/components/auth/company-form';

export const metadata: Metadata = {
  title: 'Complete Your Profile - Quacco',
  description: 'Complete your profile to start using Quacco',
};

export default async function OnboardingPage() {
  const session = await auth();

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user already has a company and redirect to dashboard if so
  const user = session.user;

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Tell us about your company to get started with Quacco
          </p>
        </div>
        
        <CompanyForm user={user} />
      </div>
    </div>
  );
}

// Force dynamic rendering for this page because it uses cookies
export const dynamic = 'force-dynamic'; 