'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NotAuthorizedPage() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="text-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-error mb-4">Access Denied</h1>
          
          <p className="mb-6">
            You are not authorized to access the admin section. Only specified administrators can access this area.
          </p>
          
          <div className="card-actions flex-col w-full gap-2">
            <button
              onClick={handleSignOut}
              className="btn btn-error w-full"
            >
              Sign Out
            </button>
            
            <Link 
              href="/"
              className="btn btn-outline w-full"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 