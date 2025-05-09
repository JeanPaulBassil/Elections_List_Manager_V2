'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import useAdminAuth from '@/hooks/useAdminAuth';
import { getUserSelectionHistory, getCandidateStats, deleteUserSelections } from '@/lib/database';
import { CandidateWithStats } from '@/types';

interface SelectionSession {
  timestamp: string;
  selections: {
    candidate_name: string;
    list_name: string;
    selection_order: number;
  }[];
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, isLoading, isAllowed } = useAdminAuth();
  const [selectionHistory, setSelectionHistory] = useState<SelectionSession[]>([]);
  const [candidateStats, setCandidateStats] = useState<CandidateWithStats[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user && isAllowed) {
      loadStatsData();
    }
  }, [user, isLoading, isAllowed]);

  const loadStatsData = async () => {
    if (!user) return;
    
    setIsDataLoading(true);
    try {
      // Load selection history
      const history = await getUserSelectionHistory(user.id);
      setSelectionHistory(history);
      
      // Load candidate statistics
      const stats = await getCandidateStats(user.id);
      setCandidateStats(stats);
    } catch (error) {
      console.error('Error loading stats data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleDeleteSelections = async (timestamp: string) => {
    if (!user) return;
    
    try {
      setDeleteError(null);
      await deleteUserSelections(user.id, timestamp);
      setDeleteSuccess(true);
      
      // Reload data after deletion
      loadStatsData();
      
      // Clear success message after a delay
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error deleting selections:', error);
      setDeleteError(error.message || 'Failed to delete selections. Please try again.');
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

  // Calculate total selections
  const totalSelections = candidateStats.reduce((sum, candidate) => sum + candidate.selection_count, 0);

  if (isLoading || isDataLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAllowed) {
    return null; // This will be handled by the useAdminAuth hook (redirecting to not-authorized)
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Selection Statistics</h1>
            <div className="flex gap-2 sm:gap-4">
              <Link
                href="/admin/dashboard"
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
          
          {deleteSuccess && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
              Selection list deleted successfully!
            </div>
          )}
          
          {deleteError && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {deleteError}
            </div>
          )}
        </div>
        
        {/* Saved Selections History */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Saved Lists History</h2>
          
          {selectionHistory.length === 0 ? (
            <div className="text-gray-500 py-4 text-center">No selection history available.</div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {selectionHistory.map((session, sessionIndex) => (
                <div 
                  key={session.timestamp} 
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                    <div className="font-medium text-gray-700 text-sm sm:text-base">
                      Session saved on: <span className="text-gray-900">{formatDate(session.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteSelections(session.timestamp)}
                      className="text-red-600 hover:text-red-800 text-sm hover:underline focus:outline-none self-end sm:self-auto"
                    >
                      Delete This List
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {session.selections.map((selection, index) => (
                          <tr key={`${session.timestamp}-${selection.selection_order}`} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm font-medium">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs">
                                {selection.selection_order}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">{selection.candidate_name}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                selection.list_name === 'List A' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
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
              ))}
            </div>
          )}
        </div>
        
        {/* Candidate Statistics */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Candidate Statistics</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selection Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidateStats
                  .sort((a, b) => b.selection_count - a.selection_count)
                  .map((candidate) => (
                    <tr key={`${candidate.name}-${candidate.list_name}`} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm font-medium">{candidate.name}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          candidate.list_name === 'List A' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {candidate.list_name}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">
                        {candidate.selection_count > 0 ? (
                          <span className="font-semibold">{candidate.selection_count}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-semibold text-right">Total Selections:</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-bold">{totalSelections}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 