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

// Helper function to capitalize first letter of each word
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// The same improved name extraction logic as in [userId]/page.tsx
const extractUserNameFromEmailOrId = (userId: string): string => {
  // Define static mapping for known user IDs
  const knownUserMap: Record<string, string> = {
    // Example format: "start of UUID": "Display Name"
    "3192006b": "Kamil Daaboul",
    "a9b86c4d": "George Elias",
    "58f3d27e": "Camilio Daaboul",
    "c5e2f810": "Elie Mina"
  };
  
  // First check if we have a direct mapping for this user ID
  const shortId = userId.substring(0, 8).toLowerCase();
  
  if (knownUserMap[shortId]) {
    return knownUserMap[shortId];
  }
  
  // Try to match the userId with one of the admin emails
  const matchedAdmin = ALLOWED_ADMINS.find(email => {
    const emailLower = email.toLowerCase();
    const emailUsername = emailLower.split('@')[0];
    
    // Try various matching strategies
    return (
      emailLower.includes(shortId) || 
      shortId.includes(emailUsername.substring(0, Math.min(8, emailUsername.length)).toLowerCase())
    );
  });
  
  if (matchedAdmin) {    
    // Extract the name part from the email
    const emailParts = matchedAdmin.split('@')[0];
    
    // Handle different email naming conventions
    if (emailParts.includes('.')) {
      // Format: first.last@domain.com
      const [firstName, lastName] = emailParts.split('.');
      return `${capitalize(firstName)} ${capitalize(lastName)}`;
    } else if (emailParts.includes('_')) {
      // Format: first_last@domain.com
      const nameParts = emailParts.split('_');
      return nameParts.map(capitalize).join(' ');
    } else {
      // Try to detect name patterns in the email
      // Check specific email patterns for known admins
      if (emailParts.toLowerCase().includes('kamil')) {
        return 'Kamil Daaboul';
      } else if (emailParts.toLowerCase().includes('camilio')) {
        return 'Camilio Daaboul';
      } else if (emailParts.toLowerCase().includes('george') || emailParts.toLowerCase().includes('elias')) {
        return 'George Elias';
      } else if (emailParts.toLowerCase().includes('elie') || emailParts.toLowerCase().includes('mina')) {
        return 'Elie Mina';
      }
      
      // Look for common patterns like lowercase/uppercase transitions
      let formattedName = '';
      
      // Check if it might be a compound name like "johndoe" or "kabildaaboul"
      if (/^[a-z]+$/.test(emailParts)) {
        // First try with common last names
        const knownLastNames = ['daaboul', 'elias', 'mina'];
        for (const lastName of knownLastNames) {
          if (emailParts.endsWith(lastName)) {
            const firstName = emailParts.substring(0, emailParts.length - lastName.length);
            formattedName = `${capitalize(firstName)} ${capitalize(lastName)}`;
            break;
          }
        }
        
        // If we couldn't match a known last name, try some heuristics
        if (!formattedName) {
          // Assume the last 5-7 characters might be the last name
          const possibleLastNameLength = Math.min(emailParts.length - 3, 7);
          if (possibleLastNameLength > 0) {
            const firstName = emailParts.substring(0, emailParts.length - possibleLastNameLength);
            const lastName = emailParts.substring(emailParts.length - possibleLastNameLength);
            formattedName = `${capitalize(firstName)} ${capitalize(lastName)}`;
          } else {
            // Just capitalize the whole thing if it's short
            formattedName = capitalize(emailParts);
          }
        }
      } else {
        // Just use the default title case conversion
        formattedName = emailParts
          .split(/(?=[A-Z])/)
          .map(capitalize)
          .join(' ');
      }
      
      return formattedName;
    }
  } else {
    // Fallback: check if the user ID contains any name hints
    const userId_lower = userId.toLowerCase();
    
    if (userId_lower.includes('kamil') || userId_lower.includes('daaboul')) {
      return 'Kamil Daaboul';
    } else if (userId_lower.includes('george') || userId_lower.includes('elias')) {
      return 'George Elias';
    } else if (userId_lower.includes('camilio')) {
      return 'Camilio Daaboul';
    } else if (userId_lower.includes('elie') || userId_lower.includes('mina')) {
      return 'Elie Mina';
    }
    
    // Final fallback to just showing the user ID
    return `Admin ${shortId}`;
  }
};

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

      // Create display names based on IDs using the improved extraction logic
      const formattedUsers = userIds.map(id => {
        return {
          id,
          displayName: extractUserNameFromEmailOrId(id)
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