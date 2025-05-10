import { Suspense } from 'react';
import { CandidateWithStats } from '@/types';
import Link from 'next/link';
import { getUserSelectionHistory, getCandidateStats } from '@/lib/database';
import { ALLOWED_ADMINS } from '@/lib/constants';
import ClientHistorySection from './ClientHistorySection';
import ClientHeader from './ClientHeader';

interface SelectionSession {
  groupId: string;
  timestamp: string;
  selectionCount: number;
  selections: {
    id: string;
    candidate_name: string;
    list_name: string;
    selection_order: number;
  }[];
}

// Helper function to capitalize first letter of each word
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const extractUserNameFromEmailOrId = (userId: string): string => {
  // Define static mapping for known user IDs
  const knownUserMap: Record<string, string> = {
    // Exact UUIDs for each admin
    "88251147": "George Elias",
    "8ae9181b": "Elie Mina",
    "7b42b1a6": "Camilio Daaboul",
    "3192006b": "Kamil Daaboul"
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
      // Check specific email patterns for your admins
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

export default async function ViewerDetailPage({ params }: { params: { userId: string } }) {
  // Use params directly, it's not a Promise
  const userId = params.userId;
  
  // Fetch data server-side
  const history = await getUserSelectionHistory(userId);
  const candidateStats = await getCandidateStats(userId);
  
  // Split by list and sort by selection count in descending order
  const listAStats = candidateStats
    .filter(c => c.list_name === 'List A')
    .sort((a, b) => b.selection_count - a.selection_count);
    
  const listBStats = candidateStats
    .filter(c => c.list_name === 'List B')
    .sort((a, b) => b.selection_count - a.selection_count);
  
  // Get the user name
  const userName = extractUserNameFromEmailOrId(userId);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        <ClientHeader userName={userName} />
        
        {/* Statistics Section - Grid with two cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl">List A Statistics</h2>
              
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="text-center">Selection Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listAStats.map((candidate) => (
                      <tr key={candidate.name}>
                        <td className="font-medium">{candidate.name}</td>
                        <td className="text-center">
                          {candidate.selection_count > 0 ? (
                            <div className="badge badge-primary">{candidate.selection_count}</div>
                          ) : (
                            <span className="opacity-50">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl">List B Statistics</h2>
              
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="text-center">Selection Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listBStats.map((candidate) => (
                      <tr key={candidate.name}>
                        <td className="font-medium">{candidate.name}</td>
                        <td className="text-center">
                          {candidate.selection_count > 0 ? (
                            <div className="badge badge-primary">{candidate.selection_count}</div>
                          ) : (
                            <span className="opacity-50">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Selection History Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Selection History</h2>
            
            {history.length === 0 ? (
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <h3 className="font-bold">No Selections</h3>
                  <div className="text-sm">This administrator has not made any candidate selections yet.</div>
                </div>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <ClientHistorySection 
                  selectionHistory={history} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 