'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NotAuthorizedPage() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-gray-50">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-md text-center">
        <div className="text-red-600 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-red-600">Not Authorized</h1>
        
        <p className="mb-6 text-gray-700 text-sm sm:text-base">
          You are not authorized to access the admin section. Only specified administrators can access this area.
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition text-sm sm:text-base"
          >
            Sign Out
          </button>
          
          <Link 
            href="/"
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition inline-block text-sm sm:text-base"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 