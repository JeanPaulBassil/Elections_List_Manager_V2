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
    groupId: string;
    timestamp: string;
    selectionCount: number;
    selections: {
        id: string;
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

    // Get the precise timestamp (to microsecond) from each row
    // This will help identify exactly when each batch of selections was saved
    const allTimestamps = data.map(selection => {
        const date = new Date(selection.created_at);
        // Use the full timestamp without truncation
        return date.toISOString();
    });

    // Find clusters of timestamps that are very close to each other (within 1 second)
    // These represent the same save operation
    const groups: Record<string, string[]> = {};
    let groupCounter = 0;

    allTimestamps.forEach((timestamp, index) => {
        const currentTime = new Date(timestamp).getTime();

        // Check if this timestamp is close to any existing group
        let foundGroup = false;

        for (const groupId in groups) {
            // Check the first timestamp in the group
            const groupTime = new Date(groups[groupId][0]).getTime();

            // If within 1 second, add to this group
            if (Math.abs(currentTime - groupTime) < 1000) {
                groups[groupId].push(timestamp);
                foundGroup = true;
                break;
            }
        }

        // If not close to any group, create a new group
        if (!foundGroup) {
            const newGroupId = `group_${groupCounter++}`;
            groups[newGroupId] = [timestamp];
        }
    });

    // Reverse map from timestamp to group ID for quick lookup
    const timestampToGroup: Record<string, string> = {};
    for (const groupId in groups) {
        groups[groupId].forEach(timestamp => {
            timestampToGroup[timestamp] = groupId;
        });
    }

    // Group selections by their groupId
    const sessionsMap = new Map<string, {
        timestamp: string;
        selections: any[];
    }>();

    data.forEach(selection => {
        const date = new Date(selection.created_at);
        const timestamp = date.toISOString();
        const groupId = timestampToGroup[timestamp] || `fallback_${timestamp}`;

        if (!sessionsMap.has(groupId)) {
            sessionsMap.set(groupId, {
                timestamp: timestamp, // Use the first timestamp in the group
                selections: []
            });
        }

        sessionsMap.get(groupId)?.selections.push({
            id: selection.id,
            candidate_name: selection.candidate_name,
            list_name: selection.list_name,
            selection_order: selection.selection_order
        });
    });

    // Convert the map to an array and sort selections within each session
    const sessions = Array.from(sessionsMap.entries()).map(([groupId, session]) => {
        const sortedSelections = session.selections.sort((a, b) => a.selection_order - b.selection_order);

        return {
            groupId,
            timestamp: session.timestamp,
            selectionCount: sortedSelections.length,
            selections: sortedSelections
        };
    });

    // Sort sessions by timestamp (newest first)
    return sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Delete user selections with a specific groupId
 */
export async function deleteUserSelections(userId: string, groupId: string) {
    try {
        // Get the user's selection history
        const history = await getUserSelectionHistory(userId);

        // Find the group that matches the provided groupId
        const group = history.find(session => session.groupId === groupId);

        if (!group || group.selections.length === 0) {
            console.log('No selections found for this group');
            return { success: true };
        }

        // Extract the IDs from the selections in this group
        const selectionIds = group.selections.map(selection => selection.id);

        // Delete the selections using their IDs
        const { error } = await supabase
            .from('selections')
            .delete()
            .in('id', selectionIds);

        if (error) {
            throw new Error(`Error deleting selections: ${error.message}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in deleteUserSelections:', error);
        throw new Error(`Failed to delete selections: ${error.message}`);
    }
}

// Save user selections - append new selections instead of replacing them
export async function saveUserSelections(
    userId: string,
    selectedCandidates: { name: string; list_name: 'List A' | 'List B'; selection_order?: number }[]
): Promise<void> {
    // Validate selection count
    if (selectedCandidates.length > MAX_SELECTIONS) {
        throw new Error(`Maximum of ${MAX_SELECTIONS} candidates can be selected.`);
    }

    // If no candidates selected, return without doing anything
    if (selectedCandidates.length === 0) {
        return;
    }

    // Prepare selections data with current timestamp
    const selections = selectedCandidates.map((candidate, index) => ({
        user_id: userId,
        candidate_name: candidate.name,
        list_name: candidate.list_name,
        selection_order: index + 1 // Ensure order is sequential and 1-indexed
    }));

    // Insert new selections (append, don't replace)
    const { error: insertError } = await supabase
        .from('selections')
        .insert(selections);

    if (insertError) {
        console.error('Error inserting new selections:', insertError);
        throw insertError;
    }
}

// Get most recent selections for a user (for dashboard display)
export async function getRecentUserSelections(userId: string): Promise<{
    name: string;
    list_name: 'List A' | 'List B';
    selection_order: number
}[]> {
    // Get the user's selection history
    const history = await getUserSelectionHistory(userId);

    // Return the most recent selections (first in the array) or empty array if none
    if (history.length > 0) {
        return history[0].selections.map(s => ({
            name: s.candidate_name,
            list_name: s.list_name as 'List A' | 'List B',
            selection_order: s.selection_order
        }));
    }

    return [];
}

// Get candidate statistics for a specific user
export async function getCandidateStats(userId: string): Promise<CandidateWithStats[]> {
    // Gets all selections for this user
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

// Get all candidates stats (across all saves/users)
export async function getAllCandidateStats(): Promise<CandidateWithStats[]> {
    const { data, error } = await supabase
        .from('selections')
        .select('candidate_name, list_name');

    if (error) {
        console.error('Error fetching all candidate stats:', error);
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

// Find identical selection patterns
export async function findIdenticalSelectionPatterns(userId: string): Promise<{
    patternId: string;
    count: number;
    selections: {
        id: string;
        candidate_name: string;
        list_name: string;
        selection_order: number;
    }[];
}[]> {
    // Get all selection history for this user
    const selectionHistory = await getUserSelectionHistory(userId);

    if (selectionHistory.length <= 1) {
        return []; // Need at least 2 saved lists to have patterns
    }

    // Map to store patterns and their counts
    const patternMap = new Map<string, {
        count: number,
        selections: {
            id: string;
            candidate_name: string;
            list_name: string;
            selection_order: number;
        }[]
    }>();

    // Process each saved selection
    selectionHistory.forEach(session => {
        // Create a string key representing this selection pattern
        // We only care about candidates, their lists, and the selection order
        // We sort to ensure consistent order for pattern detection
        const sortedSelections = [...session.selections]
            .sort((a, b) => a.selection_order - b.selection_order);

        const patternKey = sortedSelections
            .map(s => `${s.selection_order}:${s.candidate_name}:${s.list_name}`)
            .join('|');

        if (patternKey.length > 0) {
            if (!patternMap.has(patternKey)) {
                patternMap.set(patternKey, {
                    count: 1,
                    selections: sortedSelections
                });
            } else {
                const existing = patternMap.get(patternKey)!;
                existing.count += 1;
            }
        }
    });

    // Filter to only include patterns with count > 1 (identical patterns)
    const identicalPatterns = Array.from(patternMap.entries())
        .filter(([_, data]) => data.count > 1)
        .map(([patternId, data]) => ({
            patternId,
            count: data.count,
            selections: data.selections
        }))
        .sort((a, b) => b.count - a.count); // Sort by count desc

    return identicalPatterns;
}

// Get unique user IDs from selections table
export async function getUniqueUserIds(): Promise<string[]> {
    try {
        // Instead of using .distinct() which may not be available,
        // fetch all user_ids and deduplicate them in JavaScript
        const { data, error } = await supabase
            .from('selections')
            .select('user_id');

        if (error) {
            console.error('Error fetching user IDs:', error);
            throw error;
        }

        // Extract user_ids and remove duplicates
        const userIds = [...new Set(data.map(item => item.user_id))];
        return userIds;
    } catch (error) {
        console.error('Error in getUniqueUserIds:', error);
        throw error;
    }
}

/**
 * Delete all selections for a user
 */
export async function deleteAllUserSelections(userId: string) {
    try {
        // Delete all selections for this user
        const { error } = await supabase
            .from('selections')
            .delete()
            .eq('user_id', userId);

        if (error) {
            throw new Error(`Error deleting all selections: ${error.message}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in deleteAllUserSelections:', error);
        throw new Error(`Failed to delete all selections: ${error.message}`);
    }
} 