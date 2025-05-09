'use client';

interface CandidateListProps {
  title: string;
  listName: 'List A' | 'List B';
  candidates: string[];
  selectedCandidates: { name: string; list_name: 'List A' | 'List B'; selection_order?: number }[];
  onSelectCandidate: (name: string, listName: 'List A' | 'List B') => void;
  maxSelections: number;
}

export default function CandidateList({ 
  title, 
  listName,
  candidates, 
  selectedCandidates, 
  onSelectCandidate,
  maxSelections
}: CandidateListProps) {
  const totalSelected = selectedCandidates.length;
  const isMaxReached = totalSelected >= maxSelections;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{title}</h2>
      
      {candidates.length === 0 ? (
        <p className="text-gray-500 text-sm sm:text-base">No candidates available</p>
      ) : (
        <ul className="space-y-2">
          {candidates.map((name) => {
            const isSelected = selectedCandidates.some(
              c => c.name === name && c.list_name === listName
            );
            const selectedCandidate = selectedCandidates.find(
              c => c.name === name && c.list_name === listName
            );
            const position = selectedCandidate?.selection_order;
            
            return (
              <li key={name} className="flex items-center">
                <button
                  onClick={() => onSelectCandidate(name, listName)}
                  disabled={!isSelected && isMaxReached}
                  className={`flex-1 flex items-center justify-between p-2 sm:p-3 rounded-md transition text-sm sm:text-base ${
                    isSelected 
                      ? 'bg-blue-100 hover:bg-blue-200' 
                      : isMaxReached 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'hover:bg-gray-100'
                  }`}
                  title={!isSelected && isMaxReached ? `Maximum of ${maxSelections} candidates already selected` : ''}
                  aria-label={`${isSelected ? 'Deselect' : 'Select'} ${name}`}
                >
                  <span className="truncate pr-2">{name}</span>
                  {isSelected && position && (
                    <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
                      {position}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 