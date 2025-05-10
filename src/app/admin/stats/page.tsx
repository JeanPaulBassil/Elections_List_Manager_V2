'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import useAdminAuth from '@/hooks/useAdminAuth';
import { 
  getUserSelectionHistory, 
  getAllCandidateStats, 
  findIdenticalSelectionPatterns,
  deleteUserSelections,
  deleteAllUserSelections,
  getCandidateStats
} from '@/lib/database';
import { CandidateWithStats } from '@/types';

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

interface SelectionPattern {
  patternId: string;
  count: number;
  selections: {
    id: string;
    candidate_name: string;
    list_name: string;
    selection_order: number;
  }[];
}

type StatsTab = 'candidates' | 'history' | 'patterns';

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, isLoading, isAllowed } = useAdminAuth();
  const [selectionHistory, setSelectionHistory] = useState<SelectionSession[]>([]);
  const [candidateStats, setCandidateStats] = useState<CandidateWithStats[]>([]);
  const [selectionPatterns, setSelectionPatterns] = useState<SelectionPattern[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<StatsTab>('candidates');
  const [expandedHistory, setExpandedHistory] = useState<string[]>([]);
  const [expandedPatterns, setExpandedPatterns] = useState<string[]>([]);

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
      
      // Load candidate statistics for this specific user (not all users)
      const stats = await getCandidateStats(user.id);
      setCandidateStats(stats);
      
      // Load identical selection patterns
      const patterns = await findIdenticalSelectionPatterns(user.id);
      setSelectionPatterns(patterns);
    } catch (error) {
      console.error('Error loading stats data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleDeleteSelections = async (groupId: string) => {
    if (!user) return;
    
    try {
      setDeleteError(null);
      await deleteUserSelections(user.id, groupId);
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

  const handleDeleteAllSelections = async () => {
    if (!user) return;
    
    try {
      setDeleteError(null);
      await deleteAllUserSelections(user.id);
      setDeleteSuccess(true);
      
      // Reload data after deletion
      loadStatsData();
      
      // Clear success message after a delay
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error deleting all selections:', error);
      setDeleteError(error.message || 'Failed to delete all selections. Please try again.');
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
  
  const togglePatternExpand = (patternId: string) => {
    setExpandedPatterns(prevExpanded => 
      prevExpanded.includes(patternId)
        ? prevExpanded.filter(id => id !== patternId)
        : [...prevExpanded, patternId]
    );
  };

  // Calculate total selections
  const totalSelections = candidateStats.reduce((sum, candidate) => sum + candidate.selection_count, 0);
  
  // Total count of saved lists
  const totalSavedLists = selectionHistory.length;

  if (isLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!isAllowed) {
    return null; // This will be handled by the useAdminAuth hook (redirecting to not-authorized)
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Election Statistics</h1>
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
        
        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6 bg-gray-100 p-1">
          <a 
            className={`tab ${activeTab === 'candidates' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('candidates')}
          >
            Candidate Statistics
          </a>
          <a 
            className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Saved Lists History
          </a>
          <a 
            className={`tab ${activeTab === 'patterns' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            Selection Patterns
          </a>
        </div>
        
        {/* Candidate Statistics Tab */}
        {activeTab === 'candidates' && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black">Candidate Statistics</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selection Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidateStats
                    .sort((a, b) => b.selection_count - a.selection_count)
                    .map((candidate) => (
                      <tr key={`${candidate.name}-${candidate.list_name}`} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            candidate.list_name === 'List A' 
                              ? 'bg-blue-500' 
                              : 'bg-purple-500'
                          }`}></span>
                          <span className="font-medium text-black">{candidate.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({candidate.list_name})</span>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          {candidate.selection_count > 0 ? (
                            <span className="font-semibold text-black">{candidate.selection_count}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-semibold text-right">Total Selections:</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-bold text-black">{totalSelections}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        {/* Saved Lists History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-black">Saved Lists History</h2>
                <p className="text-gray-500 mt-1">Total Lists: <span className="font-semibold text-black">{totalSavedLists}</span></p>
              </div>
              
              {selectionHistory.length > 0 && (
                <button
                  onClick={handleDeleteAllSelections}
                  className="btn btn-error btn-sm sm:btn-md"
                >
                  Delete All Lists
                </button>
              )}
            </div>
            
            {selectionHistory.length === 0 ? (
              <div className="text-gray-500 py-4 text-center">No selection history available.</div>
            ) : (
              <div className="space-y-4">
                {selectionHistory.map((session, sessionIndex) => (
                  <div 
                    key={session.groupId} 
                    className="border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <div 
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer"
                      onClick={() => toggleHistoryExpand(session.groupId)}
                    >
                      <div className="flex items-center">
                        <div className={`transform transition-transform ${expandedHistory.includes(session.groupId) ? 'rotate-90' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-black">Selection #{selectionHistory.length - sessionIndex}</div>
                          <div className="text-sm text-gray-500">{session.selectionCount} candidates selected</div>
                          <div className="text-xs text-gray-400">{formatDate(session.timestamp)}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSelections(session.groupId);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm hover:underline focus:outline-none"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {expandedHistory.includes(session.groupId) && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {session.selections.map((selection) => (
                                <tr 
                                  key={selection.id} 
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs">
                                      {selection.selection_order}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-black">{selection.candidate_name}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Selection Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black">Identical Selection Patterns</h2>
            <p className="text-gray-600 mb-6">
              This section shows patterns where you selected exactly the same candidates in the same order multiple times.
              These patterns indicate consistent preferences across different saved lists.
            </p>
            
            {selectionPatterns.length === 0 ? (
              <div className="text-gray-500 py-4 text-center">No identical selection patterns found. This will appear when you save the same combination of candidates multiple times.</div>
            ) : (
              <div className="space-y-4">
                {selectionPatterns.map((pattern, index) => (
                  <div 
                    key={pattern.patternId} 
                    className="border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <div 
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer"
                      onClick={() => togglePatternExpand(pattern.patternId)}
                    >
                      <div className="flex items-center">
                        <div className={`transform transition-transform ${expandedPatterns.includes(pattern.patternId) ? 'rotate-90' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-black">Pattern #{index + 1}</div>
                          <div className="text-sm text-gray-500">{pattern.selections.length} candidates selected</div>
                        </div>
                      </div>
                      <div className="badge badge-secondary badge-lg">{pattern.count} occurrences</div>
                    </div>
                    
                    {expandedPatterns.includes(pattern.patternId) && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {pattern.selections.map((selection) => (
                                <tr 
                                  key={selection.id} 
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs">
                                      {selection.selection_order}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-black">{selection.candidate_name}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 