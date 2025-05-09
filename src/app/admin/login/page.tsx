'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ALLOWED_ADMINS } from '@/lib/constants';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user is in allowed list
      const userEmail = user.email?.toLowerCase() || '';
      const isAdmin = ALLOWED_ADMINS.some(email => email.toLowerCase() === userEmail);

      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        // User is logged in but not allowed
        router.push('/admin/not-authorized');
      }
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Check if email is in allowed list before even attempting login
      const normalizedEmail = email.toLowerCase().trim();
      const isAllowed = ALLOWED_ADMINS.some(admin => admin.toLowerCase() === normalizedEmail);
      
      if (!isAllowed) {
        setError('You are not authorized to access the admin section.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      
      // Login successful, redirect will happen in useEffect
    } catch (error: any) {
      setError(error.message || 'An error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-3xl font-bold text-center self-center mb-6">Admin Login</h1>
          
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                required
                autoComplete="email"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
                required
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Logging in...
                </>
              ) : 'Log In'}
            </button>
          </form>
          
          <div className="divider mt-6">OR</div>
          
          <Link href="/" className="btn btn-outline btn-sm btn-block">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 