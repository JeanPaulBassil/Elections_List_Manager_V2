'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateWithStats } from '@/types';
import Link from 'next/link';
import { getUserSelections, getCandidateStats, getUserSelectionHistory } from '@/lib/database';
import { listA, listB } from '@/lib/candidates';
import { ALLOWED_ADMINS } from '@/lib/constants';

export default function ViewerDetailPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { userId } = params;
  const [listACandidates, setListACandidates] = useState<CandidateWithStats[]>([]);
  const [listBCandidates, setListBCandidates] = useState<CandidateWithStats[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<{ name: string; list_name: string; selection_order: number }[]>([]);
  const [mostRecentSession, setMostRecentSession] = useState<{ timestamp: string, selections: any[] } | null>(null);
  const [totalSelections, setTotalSelections] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');

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
    setIsLoading(true);
    try {
      // Get candidate statistics
      const stats = await getCandidateStats(userId);
      
      // Split stats by list
      const listAStats = stats.filter(c => c.list_name === 'List A');
      const listBStats = stats.filter(c => c.list_name === 'List B');
      
      setListACandidates(listAStats);
      setListBCandidates(listBStats);
      
      // Calculate total selections
      const total = stats.reduce((sum, candidate) => sum + candidate.selection_count, 0);
      setTotalSelections(total);
      
      // Get selection history
      const history = await getUserSelectionHistory(userId);
      
      if (history.length > 0) {
        // Get most recent session
        setMostRecentSession(history[0]);
        
        // Set current selection
        const orderedSelections = history[0].selections.map(selection => ({
          name: selection.candidate_name,
          list_name: selection.list_name,
          selection_order: selection.selection_order
        }));
        
        setSelectedCandidates(orderedSelections);
      }
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

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{userName}'s Statistics</h1>
              <p className="text-gray-600 text-sm sm:text-base">Viewing election results and statistics</p>
            </div>
            <Link 
              href="/viewer"
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Back to Admins
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 text-center col-span-2 sm:col-span-1">
            <div className="text-gray-500 text-xs sm:text-sm uppercase font-semibold">Total Selections</div>
            <div className="text-2xl sm:text-4xl font-bold text-blue-600 my-1 sm:my-2">{totalSelections}</div>
            <div className="text-xs sm:text-sm text-gray-500">across all candidates</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 text-center col-span-2 sm:col-span-1">
            <div className="text-gray-500 text-xs sm:text-sm uppercase font-semibold">Active Lists</div>
            <div className="text-2xl sm:text-4xl font-bold text-blue-600 my-1 sm:my-2">2</div>
            <div className="text-xs sm:text-sm text-gray-500">List A and List B</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 text-center">
            <div className="text-gray-500 text-xs sm:text-sm uppercase font-semibold">List A Candidates</div>
            <div className="text-2xl sm:text-4xl font-bold text-blue-600 my-1 sm:my-2">{listA.length}</div>
            <div className="text-xs sm:text-sm text-gray-500">available candidates</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 text-center">
            <div className="text-gray-500 text-xs sm:text-sm uppercase font-semibold">List B Candidates</div>
            <div className="text-2xl sm:text-4xl font-bold text-blue-600 my-1 sm:my-2">{listB.length}</div>
            <div className="text-xs sm:text-sm text-gray-500">available candidates</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Most Recent Selections</h2>
            {selectedCandidates.length === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base">No candidates selected</p>
            ) : (
              <div>
                {mostRecentSession && (
                  <div className="mb-3 sm:mb-4 text-gray-500 text-xs sm:text-sm">
                    <span className="font-medium">Last updated:</span> {formatDate(mostRecentSession.timestamp)}
                  </div>
                )}
                <div className="divide-y divide-gray-200 overflow-x-auto">
                  <div className="min-w-[300px]">
                    {selectedCandidates.map((candidate, index) => (
                      <div 
                        key={`${candidate.name}-${candidate.selection_order}`} 
                        className="py-2 sm:py-3 flex items-center"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium mr-2 sm:mr-3 text-xs sm:text-sm">
                          {candidate.selection_order}
                        </div>
                        <div>
                          <div className="font-medium text-sm sm:text-base">{candidate.name}</div>
                          <div className="text-xs sm:text-sm">
                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs ${
                              candidate.list_name === 'List A' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {candidate.list_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Combined Candidate Rankings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List</th>
                    <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...listACandidates, ...listBCandidates]
                    .sort((a, b) => b.selection_count - a.selection_count)
                    .filter(candidate => candidate.selection_count > 0)
                    .slice(0, 10)
                    .map((candidate, index) => (
                      <tr key={`${candidate.name}-${candidate.list_name}`} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium">
                          #{index + 1}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">{candidate.name}</td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            candidate.list_name === 'List A' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {candidate.list_name}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm text-right font-medium">{candidate.selection_count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              {[...listACandidates, ...listBCandidates].filter(c => c.selection_count > 0).length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">No selection data available</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">List A Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {listACandidates
                    .sort((a, b) => b.selection_count - a.selection_count)
                    .map((candidate) => (
                      <tr key={candidate.name} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">{candidate.name}</td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm text-right font-medium">
                          {candidate.selection_count > 0 ? candidate.selection_count : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold">Total List A</td>
                    <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-right">
                      {listACandidates.reduce((sum, c) => sum + c.selection_count, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">List B Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {listBCandidates
                    .sort((a, b) => b.selection_count - a.selection_count)
                    .map((candidate) => (
                      <tr key={candidate.name} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">{candidate.name}</td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm text-right font-medium">
                          {candidate.selection_count > 0 ? candidate.selection_count : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold">Total List B</td>
                    <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-right">
                      {listBCandidates.reduce((sum, c) => sum + c.selection_count, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 