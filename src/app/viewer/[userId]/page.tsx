'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateWithStats } from '@/types';
import Link from 'next/link';
import { getUserSelectionHistory, getCandidateStats } from '@/lib/database';
import { ALLOWED_ADMINS } from '@/lib/constants';

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

export default function ViewerDetailPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const unwrappedParams = React.use(params as any);
  const userId = unwrappedParams.userId;
  const [listACandidates, setListACandidates] = useState<CandidateWithStats[]>([]);
  const [listBCandidates, setListBCandidates] = useState<CandidateWithStats[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<SelectionSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      // Try to match userId to an admin name
      const shortId = userId.substring(0, 8).toLowerCase();
      const matchedAdmin = ALLOWED_ADMINS.find(email => 
        email.toLowerCase().includes(shortId) || shortId.includes(email.substring(0, 8).toLowerCase())
      );
      
      if (matchedAdmin) {
        const emailPrefix = matchedAdmin.split('@')[0];
        // Convert to Title Case
        const displayName = emailPrefix
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
        setUserName(displayName);
      } else {
        setUserName(`Admin ${userId.substring(0, 8)}`);
      }
      
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user selection history
      const history = await getUserSelectionHistory(userId);
      setSelectionHistory(history);
      
      // Fetch candidate stats (counts for both lists)
      const candidateStats = await getCandidateStats(userId);
      
      // Split by list
      const listAStats = candidateStats.filter(c => c.list_name === 'List A');
      const listBStats = candidateStats.filter(c => c.list_name === 'List B');
      
      setListACandidates(listAStats);
      setListBCandidates(listBStats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const toggleHistoryExpand = (groupId: string) => {
    setExpandedHistory(prevExpanded => 
      prevExpanded.includes(groupId)
        ? prevExpanded.filter(id => id !== groupId)
        : [...prevExpanded, groupId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
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
        
        {/* Selection History Section */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Selection History</h2>
            
            {selectionHistory.length === 0 ? (
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <h3 className="font-bold">No Selections</h3>
                  <div className="text-sm">This administrator has not made any candidate selections yet.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectionHistory.map((session) => (
                  <div 
                    key={session.groupId} 
                    className="border border-base-300 rounded-lg hover:shadow-md transition"
                  >
                    <div 
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer"
                      onClick={() => toggleHistoryExpand(session.groupId)}
                    >
                      <div className="flex items-center">
                        <div className={`transform transition-transform ${expandedHistory.includes(session.groupId) ? 'rotate-90' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-base-content/60" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">Selection from {formatDate(session.timestamp)}</div>
                          <div className="text-sm text-base-content/60">{session.selectionCount} candidates selected</div>
                        </div>
                      </div>
                      <div className="badge badge-primary badge-lg">{session.selectionCount}</div>
                    </div>
                    
                    {expandedHistory.includes(session.groupId) && (
                      <div className="p-4 border-t border-base-300 bg-base-200">
                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr>
                                <th>Order</th>
                                <th>Candidate</th>
                                <th>List</th>
                              </tr>
                            </thead>
                            <tbody>
                              {session.selections.map((selection) => (
                                <tr key={selection.id}>
                                  <td className="w-16">
                                    <div className="badge badge-primary badge-lg">{selection.selection_order}</div>
                                  </td>
                                  <td className="font-medium">{selection.candidate_name}</td>
                                  <td>
                                    <span className={`badge ${
                                      selection.list_name === 'List A' 
                                        ? 'badge-info' 
                                        : 'badge-secondary'
                                    }`}>
                                      {selection.list_name}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Statistics Section - Grid with two cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                    {listACandidates.map((candidate) => (
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
                    {listBCandidates.map((candidate) => (
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
      </div>
    </div>
  );
} 