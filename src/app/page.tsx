'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-8 text-base-content">Election Voting System</h1>
            <p className="text-xl mb-8 text-base-content/80">
              A secure platform for managing candidate selections and viewing election results.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2 mt-12">
              <div className="card bg-primary text-primary-content shadow-xl">
                <div className="card-body">
                  <h2 className="card-title justify-center">Admin Area</h2>
                  <p>For authorized administrators to manage candidate selections.</p>
                  <div className="card-actions justify-center mt-4">
                    <Link 
                      href="/admin/login" 
                      className="btn btn-secondary"
                    >
                      {user ? 'Go to Dashboard' : 'Admin Login'}
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="card bg-accent text-accent-content shadow-xl">
                <div className="card-body">
                  <h2 className="card-title justify-center">Public Viewer</h2>
                  <p>View election results and statistics.</p>
                  <div className="card-actions justify-center mt-4">
                    <Link 
                      href="/viewer" 
                      className="btn btn-secondary"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="divider my-12">Election Information</div>
            
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="stat bg-base-100 rounded-box shadow">
                <div className="stat-figure text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="stat-title">Lists</div>
                <div className="stat-value">2</div>
                <div className="stat-desc">List A and List B</div>
              </div>
              
              <div className="stat bg-base-100 rounded-box shadow">
                <div className="stat-figure text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <div className="stat-title">Candidates</div>
                <div className="stat-value">18</div>
                <div className="stat-desc">9 per list</div>
              </div>
              
              <div className="stat bg-base-100 rounded-box shadow">
                <div className="stat-figure text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                </div>
                <div className="stat-title">Selections</div>
                <div className="stat-value">9</div>
                <div className="stat-desc">Maximum selections allowed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
