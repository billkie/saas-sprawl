import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Quacco',
  description: 'Create your Quacco account to manage your SaaS subscriptions',
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 