'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/auth/auth-buttons';
import type { Route } from 'next';

const routes = {
  home: '/' as Route,
  pricing: '/pricing' as Route,
  docs: '/docs' as Route,
  privacy: '/privacy' as Route,
  terms: '/terms' as Route,
  dashboard: '/dashboard' as Route,
  login: '/api/auth/login' as Route,
  signup: '/api/auth/signup' as Route,
  logout: '/api/auth/logout' as Route,
} as const;

function AuthButtons() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="lg" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <Link href={routes.dashboard}>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            My Dashboard
          </Button>
        </Link>
        <Link href={routes.logout}>
          <Button variant="ghost" size="lg">
            Log out
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <AuthButton 
        variant="ghost" 
        isSignUp={false} 
        text="Log in"
      />
      <AuthButton 
        variant="default" 
        isSignUp={true} 
        text="Sign up"
      />
    </div>
  );
}

export default function Home() {
  const { user } = useUser();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/80" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6 border-b border-border">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href={routes.home} className="text-2xl font-bold text-foreground">
                Quacco
              </Link>
              <Link href={routes.pricing} className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href={routes.docs} className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
            </div>
            <AuthButtons />
          </nav>
        </header>

        {/* Hero Section */}
        <main className="py-20">
          {/* New Feature Banner */}
          <div className="mb-12 text-center">
            <Link 
              href={routes.pricing}
              className="inline-flex items-center px-4 py-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              🚀 New: Automatic SaaS Discovery
            </Link>
          </div>

          {/* Main Hero */}
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
              Discover and manage your SaaS spend
            </h1>
            <p className="text-xl text-muted-foreground">
              Automatically discover and track your organization's SaaS subscriptions.
              Get insights into usage, costs, and renewals.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href={user ? routes.dashboard : routes.signup}>
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8"
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </Button>
              </Link>
              <Link href={routes.pricing}>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-accent h-12 px-8"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <section className="py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Features</h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to manage your SaaS subscriptions in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "Automatic Discovery",
                  description: "Automatically discover SaaS apps through Google Workspace and accounting integrations."
                },
                {
                  title: "Renewal Tracking",
                  description: "Never miss a renewal with automated notifications and calendar integration."
                },
                {
                  title: "Spend Analytics",
                  description: "Get insights into your SaaS spend with detailed analytics and reporting."
                }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="group relative overflow-hidden rounded-lg border bg-card p-8 transition-colors hover:border-primary"
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-card-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-12 border-t border-border">
          <div className="text-center text-muted-foreground">
            <p>
              Built by{' '}
              <a href="https://quacco.com" className="text-primary hover:text-primary/90">
                Quacco
              </a>
            </p>
            <div className="mt-4 space-x-4">
              <Link href={routes.privacy} className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href={routes.terms} className="hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 