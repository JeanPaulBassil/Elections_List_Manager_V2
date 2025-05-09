'use client';

import Link from 'next/link';

interface ClientHeaderProps {
  userName: string;
}

export default function ClientHeader({ userName }: ClientHeaderProps) {
  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-12">
                  <span>{userName.charAt(0)}</span>
                </div>
              </div>
              <span>{userName}'s Results</span>
            </h1>
            <p className="text-base-content/70 mt-2">
              Viewing selections and statistics for this administrator
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Link href="/viewer" className="btn btn-outline btn-sm">
              Back to Administrators
            </Link>
            <Link href="/" className="btn btn-secondary btn-sm">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 