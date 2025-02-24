import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // If auth is required and user is not authenticated
    if (requireAuth && !session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // If user is authenticated but on auth pages
    if (session && (pathname === '/auth/signin')) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, requireAuth, router, pathname]);

  return {
    session,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  };
} 