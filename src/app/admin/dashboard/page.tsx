'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Selection } from '@/types';
import CandidateList from '@/components/CandidateList';
import { listA, listB } from '@/lib/candidates';
import { getRecentUserSelections, saveUserSelections } from '@/lib/database';
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
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && user && isAllowed) {
      fetchUserSelections();
    }
  }, [user, isLoading, isAllowed]);

  const fetchUserSelections = async () => {
    if (!user) return;

    try {
      const selections = await getRecentUserSelections(user.id);
      setSelectedCandidates(selections);
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

  const handleSelectEntireList = (listName: 'List A' | 'List B') => {
    // Get the list of candidates
    const candidateList = listName === 'List A' ? listA : listB;
    
    // Clear existing selections
    setSelectedCandidates([]);
    
    // Add candidates up to MAX_SELECTIONS
    const candidatesToAdd = candidateList.slice(0, MAX_SELECTIONS);
    
    // Create selections with order
    const newSelections = candidatesToAdd.map((name, index) => ({
      name,
      list_name: listName,
      selection_order: index + 1
    }));
    
    setSelectedCandidates(newSelections);
  };

  const handleClearSelections = () => {
    setSelectedCandidates([]);
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
      
      // Clear the selections after successful save
      setSelectedCandidates([]);
      
      // Scroll to the top of the page
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      
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
    <div className="min-h-screen bg-base-200 px-4 py-6">
      <div ref={topRef} className="max-w-6xl mx-auto">
        <div className="navbar bg-base-100 rounded-box shadow-md mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold px-4 text-primary">Election Admin Dashboard</h1>
          </div>
          <div className="flex-none gap-2">
            <Link 
              href="/admin/stats"
              className="btn btn-primary btn-sm sm:btn-md"
            >
              View Statistics
            </Link>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span>{user?.email?.charAt(0).toUpperCase() || 'A'}</span>
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li>
                  <a 
                    href={`/viewer/${user?.id}`} 
                    target="_blank"
                  >
                    View My Results
                  </a>
                </li>
                <li><a onClick={handleSignOut}>Sign Out</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            {/* Selection progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Selection Progress</span>
                <span>{selectedCandidates.length} of {MAX_SELECTIONS} selected</span>
              </div>
              <progress 
                className="progress progress-primary w-full" 
                value={selectedCandidates.length} 
                max={MAX_SELECTIONS}
              ></progress>
            </div>
          </div>
        </div>

        {/* Clear Selections Button */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body py-3">
            <button
              onClick={handleClearSelections}
              className="btn btn-outline btn-error btn-block"
              disabled={isSubmitting || selectedCandidates.length === 0}
            >
              Clear All Selections
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
          <div className="flex flex-col h-full gap-3">
            <div className="card bg-white shadow-md p-3 flex justify-center">
              <button 
                onClick={() => handleSelectEntireList('List A')}
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                Select List A
              </button>
            </div>
            <CandidateList 
              title="List A" 
              listName="List A"
              candidates={listA} 
              selectedCandidates={selectedCandidates} 
              onSelectCandidate={handleSelectCandidate}
              maxSelections={MAX_SELECTIONS}
            />
          </div>

          <div className="flex flex-col h-full gap-3">
            <div className="card bg-white shadow-md p-3 flex justify-center">
              <button 
                onClick={() => handleSelectEntireList('List B')}
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                Select List B
              </button>
            </div>
            <CandidateList 
              title="List B" 
              listName="List B"
              candidates={listB} 
              selectedCandidates={selectedCandidates} 
              onSelectCandidate={handleSelectCandidate}
              maxSelections={MAX_SELECTIONS}
            />
          </div>
        </div>

        {/* Save button directly under the lists */}
        <div className="card bg-white shadow-md mb-6">
          <div className="card-body">
            {saveSuccess && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Your selections have been saved successfully!</span>
              </div>
            )}
            
            {saveError && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{saveError}</span>
              </div>
            )}
            
            <button
              onClick={handleSaveSelections}
              className="btn btn-success btn-lg btn-block"
              disabled={isSubmitting || selectedCandidates.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : 'Save Selections'}
            </button>
          </div>
        </div>
        
        {/* Your selections section moved below the save button */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl">Your Selections ({selectedCandidates.length}/{MAX_SELECTIONS})</h2>
            
            <div className="bg-base-200 rounded-box p-4 mt-4">
              {selectedCandidates.length === 0 ? (
                <div className="text-center py-4 text-base-content/70">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <p>No candidates selected yet</p>
                  <p className="text-sm mt-1">Select candidates from the lists above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCandidates.map((candidate, idx) => (
                    <div 
                      key={`${candidate.name}-${candidate.list_name}`}
                      className="flex items-center p-2 hover:bg-base-300 rounded-lg transition group"
                    >
                      <div className="badge badge-primary badge-lg mr-3">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm opacity-70">{candidate.list_name}</div>
                      </div>
                      <button
                        onClick={() => handleSelectCandidate(candidate.name, candidate.list_name)}
                        className="btn btn-ghost btn-circle btn-sm"
                        title="Remove this candidate"
                        aria-label={`Remove ${candidate.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 