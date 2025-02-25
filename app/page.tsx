import Link from 'next/link';
import { Button } from '@/components/ui/button';

const routes = {
  home: '/',
  pricing: '/pricing',
  docs: '/docs',
  login: '/api/auth/login',
} as const;

export default function Home() {
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
                Ziruna
              </Link>
              <Link href={routes.pricing} className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href={routes.docs} className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
            </div>
            <Link href={routes.login}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started
              </Button>
            </Link>
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
              <Link href={routes.login}>
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8"
                >
                  Get Started
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
          <p className="text-center text-muted-foreground">
            Built by{' '}
            <a href="https://ziruna.com" className="text-primary hover:text-primary/90">
              Ziruna
            </a>
            . The source code is available on{' '}
            <a href="https://github.com/ziruna/saas-sprawl" className="text-primary hover:text-primary/90">
              GitHub
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
} 