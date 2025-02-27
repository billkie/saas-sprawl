'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  isSignUp?: boolean;
}

export function AuthButton({ variant = 'outline', isSignUp = false }: AuthButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  // Check if the standard Auth0 endpoints are working
  useEffect(() => {
    async function checkAuthEndpoints() {
      try {
        const response = await fetch('/api/auth/status');
        if (!response.ok) {
          console.warn('Auth0 endpoints not working properly, enabling fallback mode');
          setFallbackMode(true);
        }
      } catch (error) {
        console.error('Error checking Auth0 status:', error);
        setFallbackMode(true);
      }
    }
    
    checkAuthEndpoints();
  }, []);
  
  // Direct construction of Auth0 URL as a fallback
  async function getDirectAuth0Url(screenHint?: string) {
    try {
      // First try to get configuration from debug endpoint
      const response = await fetch('/api/auth/debug');
      if (response.ok) {
        const data = await response.json();
        
        // Extract the Auth0 domain from issuer URL
        let auth0Domain = '';
        let clientId = '';
        
        if (data.config.issuerUrlPrefix) {
          // Extract domain from issuer URL
          const match = data.config.issuerUrlPrefix.match(/https:\/\/([^.]+)\./);
          if (match && match[1]) {
            auth0Domain = match[1] + '.auth0.com';
          }
        }
        
        // Use host as redirect URI
        const redirectUri = window.location.origin + '/api/auth/callback';
        
        // Construct Auth0 universal login URL directly
        if (auth0Domain) {
          let url = `https://${auth0Domain}/authorize?`;
          url += `response_type=code`;
          url += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
          url += `&scope=openid+profile+email`;
          
          // Add screen_hint for signup if needed
          if (screenHint === 'signup') {
            url += `&screen_hint=signup`;
          }
          
          return url;
        }
      }
      
      throw new Error('Could not construct Auth0 URL from available information');
    } catch (error) {
      console.error('Failed to create direct Auth0 URL:', error);
      throw error;
    }
  }
  
  const handleAuth = async () => {
    try {
      setIsLoading(true);
      
      // FALLBACK APPROACH 1: Try our direct auth endpoints first
      // These are designed to work around environment variable problems
      if (fallbackMode) {
        try {
          const directEndpoint = isSignUp 
            ? `/api/auth/direct-signup` 
            : `/api/auth/direct-login`;
          
          // Add cache busting parameter
          const directUrl = `${directEndpoint}?t=${Date.now()}`;
          
          console.log(`Using direct auth endpoint: ${directUrl}`);
          window.location.href = directUrl;
          return; // Wait for redirect
        } catch (directError) {
          console.error('Direct auth endpoint failed:', directError);
          // Continue to next fallback
        }
      }
      
      // FALLBACK APPROACH 2: Try to construct Auth0 URL directly
      if (fallbackMode) {
        try {
          // Use direct Auth0 URL construction as fallback
          const constructedUrl = await getDirectAuth0Url(isSignUp ? 'signup' : undefined);
          if (constructedUrl) {
            console.log(`Using constructed Auth0 URL: ${constructedUrl}`);
            window.location.href = constructedUrl;
            return; // Wait for redirect
          }
        } catch (fallbackError) {
          console.error('Constructed Auth0 URL failed:', fallbackError);
          // Continue to standard approach as last resort
        }
      }
      
      // STANDARD APPROACH: Use the SDK-based Auth0 endpoint
      // For signup, always use the login endpoint with screen_hint=signup
      // This matches the route handling in our API
      let endpoint = '/api/auth/login';
      const params = new URLSearchParams();
      
      // Add cache-busting parameter to avoid any CDN caching issues
      params.append('t', Date.now().toString());
      
      // If signing up, add screen_hint and set returnTo to onboarding
      if (isSignUp) {
        console.log('Using signup flow with screen_hint=signup');
        params.append('screen_hint', 'signup');
        params.append('returnTo', '/onboarding');
      } else {
        // For login, return to dashboard
        params.append('returnTo', '/dashboard');
      }
      
      const url = `${endpoint}?${params.toString()}`;
      console.log(`Using standard Auth0 endpoint: ${url}`);
      
      // Navigate to the auth endpoint
      window.location.href = url;
      
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
      
      // Show error toast
      toast({
        title: 'Authentication Error',
        description: 'There was a problem connecting to the authentication service. Please try again.',
        variant: 'destructive',
      });
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