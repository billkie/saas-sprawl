import { SideNav } from '@/components/dashboard/side-nav';
import { TopNav } from '@/components/dashboard/top-nav';
import { auth } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={session?.user} />
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-gray-50/40 lg:block">
          <SideNav />
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic"; 