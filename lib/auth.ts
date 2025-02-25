import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';

export interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Session {
  user: User;
}

// Helper function to get the current session
export async function auth(): Promise<Session | null> {
  try {
    const auth0Session = await getSession();
    
    if (!auth0Session?.user) {
      return null;
    }
    
    // Find or create user in the database
    const user = await prisma.user.upsert({
      where: { 
        email: auth0Session.user.email 
      },
      update: {
        name: auth0Session.user.name,
        image: auth0Session.user.picture,
      },
      create: {
        email: auth0Session.user.email,
        name: auth0Session.user.name,
        image: auth0Session.user.picture,
      },
    });
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    };
  } catch (error) {
    console.error('Error getting Auth0 session:', error);
    return null;
  }
} 