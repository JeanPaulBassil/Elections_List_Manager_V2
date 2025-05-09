'use client';

import { useState } from 'react';

interface Selection {
  id: string;
  candidate_name: string;
  list_name: string;
  selection_order: number;
}

interface SelectionSession {
  groupId: string;
  timestamp: string;
  selectionCount: number;
  selections: Selection[];
}

interface ClientHistorySectionProps {
  selectionHistory: SelectionSession[];
}

export default function ClientHistorySection({ 
  selectionHistory
}: ClientHistorySectionProps) {
  const [expandedHistory, setExpandedHistory] = useState<string[]>([]);
  // Limit initial display to avoid rendering too many items at once
  const [displayLimit, setDisplayLimit] = useState(20);
  
  const toggleHistoryExpand = (groupId: string) => {
    setExpandedHistory(prevExpanded => 
      prevExpanded.includes(groupId)
        ? prevExpanded.filter(id => id !== groupId)
        : [...prevExpanded, groupId]
    );
  };
  
  // Format date for client-side rendering
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
  
  const loadMore = () => {
    setDisplayLimit(prevLimit => prevLimit + 20);
  };

  // Limit the number of sessions to display
  const displayedHistory = selectionHistory.slice(0, displayLimit);
  const hasMore = selectionHistory.length > displayLimit;

  return (
    <div className="space-y-4">
      {displayedHistory.map((session) => (
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
      
      {hasMore && (
        <div className="text-center py-4">
          <button 
            onClick={loadMore}
            className="btn btn-primary"
          >
            Load More History
          </button>
          <p className="text-sm text-base-content/60 mt-2">
            Showing {displayLimit} of {selectionHistory.length} selections
          </p>
        </div>
      )}
    </div>
  );
} 