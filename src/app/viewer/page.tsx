'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUniqueUserIds } from '@/lib/database';
import { ALLOWED_ADMINS } from '@/lib/constants';

interface User {
  id: string;
  displayName: string;
  email?: string;
}

export default function ViewerPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const userIds = await getUniqueUserIds();
      
      // Map user IDs to display names
      // In a real app, you'd fetch user names from a table in your database
      const usersWithDisplayNames = userIds.map(id => {
        // For display purposes, match the first 8 chars of ID to an admin email if possible
        const shortId = id.substring(0, 8).toLowerCase();
        const matchedAdmin = ALLOWED_ADMINS.find(email => 
          email.toLowerCase().includes(shortId) || shortId.includes(email.substring(0, 8).toLowerCase())
        );
        
        // Create a display name from the email prefix or just use Admin + shortId
        let displayName = `Admin ${shortId}`;
        let email;
        
        if (matchedAdmin) {
          const emailPrefix = matchedAdmin.split('@')[0];
          // Convert to Title Case
          displayName = emailPrefix
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
          email = matchedAdmin;
        }
        
        return {
          id,
          displayName,
          email
        };
      });
      
      setUsers(usersWithDisplayNames);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Election Results Viewer</h1>
          <p className="text-gray-600 text-sm sm:text-base">Select an administrator to view their election results and statistics</p>
        </header>
        
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Available Administrators</h2>
          
          {users.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
              <p className="text-gray-500 mb-4 text-sm sm:text-base">No administrators have submitted selections yet.</p>
              <Link href="/" className="text-blue-600 hover:underline text-sm sm:text-base">
                Return to Home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/viewer/${user.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-3 sm:p-4 block"
                >
                  <div className="font-bold text-base sm:text-lg text-blue-700">{user.displayName}</div>
                  {user.email && (
                    <div className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{user.email}</div>
                  )}
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-blue-600">View Selection Results →</div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-md">
          <h3 className="text-base sm:text-lg font-semibold text-blue-700 mb-2">About This Section</h3>
          <p className="text-blue-700 text-sm sm:text-base">
            This public viewer allows anyone to see the selection results and statistics for each administrator.
            No login is required. Click on an administrator's card to view their detailed results.
          </p>
        </div>
        
        <div className="mt-6 sm:mt-8 text-center">
          <Link
            href="/"
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition inline-block"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 