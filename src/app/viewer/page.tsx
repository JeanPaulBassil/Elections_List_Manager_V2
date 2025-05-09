'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUniqueUserIds } from '@/lib/database';
import Link from 'next/link';
import { ALLOWED_ADMINS } from '@/lib/constants';

interface User {
  id: string;
  displayName: string;
}

export default function ViewerPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const userIds = await getUniqueUserIds();

      // Create display names based on IDs
      const formattedUsers = userIds.map(id => {
        // Try to match userId to an admin email
        const shortId = id.substring(0, 8).toLowerCase();
        const matchedAdmin = ALLOWED_ADMINS.find(email => 
          email.toLowerCase().includes(shortId) || shortId.includes(email.substring(0, 8).toLowerCase())
        );
        
        let displayName = `Admin ${id.substring(0, 8)}`;
        
        if (matchedAdmin) {
          const emailPrefix = matchedAdmin.split('@')[0];
          // Convert to Title Case
          displayName = emailPrefix
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
        }
        
        return {
          id,
          displayName
        };
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    router.push(`/viewer/${userId}`);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-6 justify-center">Election Results Viewer</h1>
            
            <div className="text-center mb-8">
              <p className="text-lg mb-4">
                Select an administrator to view their candidate selections and statistics
              </p>
              <div className="badge badge-primary badge-lg">Public View Only</div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 text-base-content/70">Loading administrators...</p>
              </div>
            ) : (
              <>
                {users.length === 0 ? (
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>No administrators have made selections yet.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user.id)}
                        className="btn btn-outline hover:btn-primary h-auto py-6 flex flex-col items-center justify-center gap-2"
                      >
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-12">
                            <span className="text-xl">{user.displayName.charAt(0)}</span>
                          </div>
                        </div>
                        <span className="text-lg">{user.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="divider my-8">Options</div>
                
                <div className="flex justify-center">
                  <Link href="/" className="btn btn-secondary">
                    Return to Home
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 