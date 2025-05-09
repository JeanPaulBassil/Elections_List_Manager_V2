import { supabase } from './supabase';
import { Selection, CandidateWithStats } from '@/types';
import { listA, listB } from './candidates';

// Maximum selections allowed
const MAX_SELECTIONS = 9;

// Get all selections for a specific user
export async function getUserSelections(userId: string): Promise<Selection[]> {
    const { data, error } = await supabase
        .from('selections')
        .select('*')
        .eq('user_id', userId)
        .order('selection_order', { ascending: true });

    if (error) {
        console.error('Error fetching user selections:', error);
        throw error;
    }

    return data || [];
}

// Get user selection history grouped by timestamp
export async function getUserSelectionHistory(userId: string): Promise<{
    timestamp: string;
    selections: {
        candidate_name: string;
        list_name: string;
        selection_order: number;
    }[]
}[]> {
    const { data, error } = await supabase
        .from('selections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user selection history:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        return [];
    }

    // Group selections by created_at timestamp (truncated to minute precision for grouping)
    const sessionsMap = new Map<string, Selection[]>();

    data.forEach(selection => {
        // Convert timestamp to a consistent format for grouping 
        // (truncate to minute precision to group selections made in the same session)
        const date = new Date(selection.created_at);
        const timestampKey = date.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM

        if (!sessionsMap.has(timestampKey)) {
            sessionsMap.set(timestampKey, []);
        }

        sessionsMap.get(timestampKey)?.push(selection);
    });

    // Convert the map to an array and sort selections within each session
    const sessions = Array.from(sessionsMap.entries()).map(([timestamp, selections]) => {
        return {
            timestamp,
            selections: selections
                .sort((a, b) => a.selection_order - b.selection_order)
                .map(s => ({
                    candidate_name: s.candidate_name,
                    list_name: s.list_name,
                    selection_order: s.selection_order
                }))
        };
    });

    // Sort sessions by timestamp (newest first)
    return sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// Delete user selections by timestamp
export async function deleteUserSelections(userId: string, timestamp: string): Promise<void> {
    // First, find all selections with the given timestamp prefix
    const { data, error: fetchError } = await supabase
        .from('selections')
        .select('id, created_at')
        .eq('user_id', userId);

    if (fetchError) {
        console.error('Error fetching selections for deletion:', fetchError);
        throw fetchError;
    }

    if (!data || data.length === 0) {
        return;
    }

    // Filter selections that match the timestamp (truncated to minute precision)
    const idsToDelete = data
        .filter(selection => {
            const selectionDate = new Date(selection.created_at);
            const selectionTimestamp = selectionDate.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
            return selectionTimestamp === timestamp;
        })
        .map(selection => selection.id);

    if (idsToDelete.length === 0) {
        return;
    }

    // Delete the matched selections
    const { error: deleteError } = await supabase
        .from('selections')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('Error deleting selections:', deleteError);
        throw deleteError;
    }
}

// Save user selections - delete existing and insert new ones
export async function saveUserSelections(
    userId: string,
    selectedCandidates: { name: string; list_name: 'List A' | 'List B'; selection_order?: number }[]
): Promise<void> {
    // Validate selection count
    if (selectedCandidates.length > MAX_SELECTIONS) {
        throw new Error(`Maximum of ${MAX_SELECTIONS} candidates can be selected.`);
    }

    // First, delete existing selections
    const { error: deleteError } = await supabase
        .from('selections')
        .delete()
        .eq('user_id', userId);

    if (deleteError) {
        console.error('Error deleting existing selections:', deleteError);
        throw deleteError;
    }

    // If no candidates selected, just return after deleting (allows clearing selections)
    if (selectedCandidates.length === 0) {
        return;
    }

    // Prepare selections data
    const selections = selectedCandidates.map((candidate, index) => ({
        user_id: userId,
        candidate_name: candidate.name,
        list_name: candidate.list_name,
        selection_order: index + 1 // Ensure order is sequential and 1-indexed
    }));

    // Insert new selections
    const { error: insertError } = await supabase
        .from('selections')
        .insert(selections);

    if (insertError) {
        console.error('Error inserting new selections:', insertError);
        throw insertError;
    }
}

// Get candidate statistics for a specific user
export async function getCandidateStats(userId: string): Promise<CandidateWithStats[]> {
    const { data, error } = await supabase
        .from('selections')
        .select('candidate_name, list_name')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching candidate stats:', error);
        throw error;
    }

    // Create a map to count selections for each candidate
    const selectionCounts: Record<string, number> = {};

    // Initialize with all candidates from both lists
    [...listA, ...listB].forEach(name => {
        const listName = listA.includes(name) ? 'List A' : 'List B';
        const key = `${name}-${listName}`;
        selectionCounts[key] = 0;
    });

    // Count the selections
    data.forEach(selection => {
        const key = `${selection.candidate_name}-${selection.list_name}`;
        if (selectionCounts[key] !== undefined) {
            selectionCounts[key]++;
        }
    });

    // Convert to array of CandidateWithStats
    const candidateStats: CandidateWithStats[] = [];

    listA.forEach(name => {
        candidateStats.push({
            name,
            list_name: 'List A',
            selection_count: selectionCounts[`${name}-List A`] || 0
        });
    });

    listB.forEach(name => {
        candidateStats.push({
            name,
            list_name: 'List B',
            selection_count: selectionCounts[`${name}-List B`] || 0
        });
    });

    return candidateStats;
}

// Get unique user IDs from selections table
export async function getUniqueUserIds(): Promise<string[]> {
    const { data, error } = await supabase
        .from('selections')
        .select('user_id')
        .distinct();

    if (error) {
        console.error('Error fetching unique user IDs:', error);
        throw error;
    }

    return data.map(item => item.user_id);
} 