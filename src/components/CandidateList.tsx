'use client';

import React from 'react';

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
  maxSelections,
}: CandidateListProps) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="card bg-white shadow-md h-full border border-gray-200">
        <div className="card-body">
          <h2 className="card-title text-black">{title}</h2>
          <div className="alert bg-yellow-50 text-yellow-800 border border-yellow-200">No candidates available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-white shadow-md h-full border border-gray-200">
      <div className="card-body">
        <h2 className="card-title text-black">{title}</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-black">Name</th>
                <th className="w-24 text-center text-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((name) => {
                const isSelected = selectedCandidates.some(
                  (c) => c.name === name && c.list_name === listName
                );
                const selectionOrder = isSelected
                  ? selectedCandidates.find(
                      (c) => c.name === name && c.list_name === listName
                    )?.selection_order
                  : undefined;

                return (
                  <tr key={name} className={isSelected ? 'bg-blue-50' : ''}>
                    <td className="flex items-center gap-2">
                      {isSelected && (
                        <div className="badge bg-blue-500 text-white">{selectionOrder}</div>
                      )}
                      <span className={isSelected ? 'font-medium text-black' : 'text-black'}>{name}</span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => onSelectCandidate(name, listName)}
                        className={`btn btn-sm ${
                          isSelected
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : selectedCandidates.length >= maxSelections
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        disabled={!isSelected && selectedCandidates.length >= maxSelections}
                      >
                        {isSelected ? 'Remove' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 