import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Your Account - Quacco',
  description: 'Set up your company information to get started with Quacco',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 