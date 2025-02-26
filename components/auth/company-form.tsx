'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const companyFormSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters.' })
    .max(100, { message: 'Company name must not exceed 100 characters.' }),
  industry: z
    .string()
    .min(2, { message: 'Industry must be at least 2 characters.' })
    .max(50, { message: 'Industry must not exceed 50 characters.' }),
  size: z
    .string()
    .min(1, { message: 'Please enter your company size.' })
    .max(20, { message: 'Company size must not exceed 20 characters.' }),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function CompanyForm({ user }: CompanyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: '',
      industry: '',
      size: '',
    },
  });

  async function onSubmit(data: CompanyFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create company');
      }

      toast({
        title: 'Profile completed',
        description: 'Your company profile has been created.',
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: 'Something went wrong',
        description: 'Failed to create your company profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormDescription>
                Enter your company or organization name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <FormControl>
                <Input placeholder="Technology" {...field} />
              </FormControl>
              <FormDescription>
                What industry does your company operate in?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Size</FormLabel>
              <FormControl>
                <Input placeholder="1-50" {...field} />
              </FormControl>
              <FormDescription>
                Approximate number of employees
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Complete Profile'}
        </Button>
      </form>
    </Form>
  );
} 