'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Selection } from '@/types';
import CandidateList from '@/components/CandidateList';
import { listA, listB } from '@/lib/candidates';
import { getUserSelections, saveUserSelections } from '@/lib/database';
import useAdminAuth from '@/hooks/useAdminAuth';
import Link from 'next/link';

// Maximum number of candidates that can be selected
const MAX_SELECTIONS = 9;

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading, isAllowed } = useAdminAuth();
  const [selectedCandidates, setSelectedCandidates] = useState<{ name: string; list_name: 'List A' | 'List B'; selection_order?: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && isAllowed) {
      fetchUserSelections();
    }
  }, [user, isLoading, isAllowed]);

  const fetchUserSelections = async () => {
    if (!user) return;

    try {
      const selections = await getUserSelections(user.id);
      
      // Sort selections by selection_order
      selections.sort((a, b) => a.selection_order - b.selection_order);
      
      // Convert to the format needed for the UI
      const formattedSelections = selections.map(selection => ({
        name: selection.candidate_name,
        list_name: selection.list_name as 'List A' | 'List B',
        selection_order: selection.selection_order
      }));
      
      setSelectedCandidates(formattedSelections);
    } catch (error) {
      console.error('Error fetching user selections:', error);
    }
  };

  const handleSelectCandidate = (name: string, listName: 'List A' | 'List B') => {
    // Check if the candidate is already selected
    const existingIndex = selectedCandidates.findIndex(
      c => c.name === name && c.list_name === listName
    );
    
    if (existingIndex !== -1) {
      // Remove if already selected
      const newSelectedCandidates = [...selectedCandidates];
      newSelectedCandidates.splice(existingIndex, 1);
      
      // Update selection_order for remaining candidates
      newSelectedCandidates.forEach((candidate, index) => {
        candidate.selection_order = index + 1;
      });
      
      setSelectedCandidates(newSelectedCandidates);
    } else if (selectedCandidates.length < MAX_SELECTIONS) {
      // Add if less than max candidates are selected
      const newCandidate = {
        name,
        list_name: listName,
        selection_order: selectedCandidates.length + 1
      };
      
      setSelectedCandidates([...selectedCandidates, newCandidate]);
    }
  };

  const handleSaveSelections = async () => {
    if (!user || isSubmitting) return;
    
    // Clear previous messages
    setIsSubmitting(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Validate selection count
      if (selectedCandidates.length === 0) {
        throw new Error('Please select at least one candidate before saving.');
      }
      
      // Save to database
      await saveUserSelections(user.id, selectedCandidates);
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error saving selections:', error);
      setSaveError(error.message || 'Failed to save selections. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAllowed) {
    return null; // This will be handled by the useAdminAuth hook (redirecting to not-authorized)
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Candidate Selection</h1>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Link 
                href="/admin/stats"
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                View Statistics
              </Link>
              <a 
                href={`/viewer/${user?.id}`} 
                target="_blank"
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                View Stats
              </a>
              <button 
                onClick={handleSignOut}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded">
              <h2 className="text-lg font-semibold text-blue-700">Instructions</h2>
              <p className="text-blue-700 mb-2 text-sm sm:text-base">
                Select up to {MAX_SELECTIONS} candidates in order of preference from either list.
                Click a candidate to select, and click again to deselect. The numbers show your selection order.
              </p>
              <ul className="text-blue-700 list-disc pl-5 space-y-1 text-sm sm:text-base">
                <li>First selection will be marked as #1, second as #2, and so on</li>
                <li>When you deselect a candidate, all other selections will be renumbered</li>
                <li>You can select candidates from both List A and List B</li>
                <li>Don't forget to click "Save Selections" when you're done</li>
              </ul>
            </div>
          </div>
          
          {/* Selection progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Selection Progress</span>
              <span>{selectedCandidates.length} of {MAX_SELECTIONS} selected</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(selectedCandidates.length / MAX_SELECTIONS) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          <CandidateList 
            title="List A" 
            listName="List A"
            candidates={listA} 
            selectedCandidates={selectedCandidates} 
            onSelectCandidate={handleSelectCandidate}
            maxSelections={MAX_SELECTIONS}
          />
          <CandidateList 
            title="List B" 
            listName="List B"
            candidates={listB} 
            selectedCandidates={selectedCandidates} 
            onSelectCandidate={handleSelectCandidate}
            maxSelections={MAX_SELECTIONS}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Selections ({selectedCandidates.length}/{MAX_SELECTIONS})</h2>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-md mb-4 overflow-x-auto">
            {selectedCandidates.length === 0 ? (
              <p className="text-gray-500">No candidates selected yet</p>
            ) : (
              <div className="space-y-2 min-w-[300px]">
                {selectedCandidates.map((candidate, idx) => (
                  <div 
                    key={`${candidate.name}-${candidate.list_name}`}
                    className="flex items-center p-2 hover:bg-gray-100 rounded-md transition group"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium mr-3 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.list_name}</div>
                    </div>
                    <button
                      onClick={() => handleSelectCandidate(candidate.name, candidate.list_name as 'List A' | 'List B')}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-gray-200 rounded-full ml-2"
                      title="Remove this candidate"
                      aria-label={`Remove ${candidate.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              {selectedCandidates.length < MAX_SELECTIONS ? (
                <span>You can select {MAX_SELECTIONS - selectedCandidates.length} more candidate{MAX_SELECTIONS - selectedCandidates.length !== 1 ? 's' : ''}.</span>
              ) : (
                <span className="text-green-600 font-medium">Maximum selections reached. You can still change your selections.</span>
              )}
            </div>
            
            <button 
              onClick={handleSaveSelections}
              disabled={isSubmitting || selectedCandidates.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSubmitting ? 'Saving...' : 'Save Selections'}
            </button>
          </div>
        </div>
        
        {saveSuccess && (
          <div className="mb-6 sm:mb-8 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md">
            <div className="font-bold">Success!</div>
            <div>Your candidate selections have been saved successfully.</div>
          </div>
        )}
        
        {saveError && (
          <div className="mb-6 sm:mb-8 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
            <div className="font-bold">Error</div>
            <div>{saveError}</div>
          </div>
        )}
      </div>
    </div>
  );
} 