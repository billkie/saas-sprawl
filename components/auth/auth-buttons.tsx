'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  isSignUp?: boolean;
}

export function AuthButton({ variant = 'outline', isSignUp = false }: AuthButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAuth = async () => {
    try {
      setIsLoading(true);
      
      // Use the correct Auth0 endpoint based on whether this is signup or login
      const endpoint = isSignUp 
        ? `/api/auth/signup` // Use the dedicated signup handler we configured
        : `/api/auth/login`;
        
      // Navigate to the auth endpoint
      router.push(endpoint);
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleAuth} 
      className="w-full"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isSignUp ? 'Redirecting to signup...' : 'Redirecting to login...'}
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
        </>
      )}
    </Button>
  );
} 