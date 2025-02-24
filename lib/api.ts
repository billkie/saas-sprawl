import { getSession } from 'next-auth/react';

interface FetchOptions extends RequestInit {
  data?: any;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const session = await getSession();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (session) {
    headers.set('Authorization', `Bearer ${session.user.id}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.data ? JSON.stringify(options.data) : options.body,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error || 'An error occurred while making the request'
    );
  }

  return data;
}

export const api = {
  get: (url: string, options: FetchOptions = {}) => 
    fetchWithAuth(url, { ...options, method: 'GET' }),

  post: (url: string, data: any, options: FetchOptions = {}) =>
    fetchWithAuth(url, { ...options, method: 'POST', data }),

  put: (url: string, data: any, options: FetchOptions = {}) =>
    fetchWithAuth(url, { ...options, method: 'PUT', data }),

  delete: (url: string, options: FetchOptions = {}) =>
    fetchWithAuth(url, { ...options, method: 'DELETE' }),
}; 