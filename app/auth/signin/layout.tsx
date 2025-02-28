import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Quacco',
  description: 'Sign in to your Quacco account',
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 