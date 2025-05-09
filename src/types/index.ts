export interface Selection {
    id: string;
    user_id: string;
    candidate_name: string;
    list_name: 'List A' | 'List B';
    selection_order: number; // 1-9 representing priority
    created_at: string;
}

export interface User {
    id: string;
    email: string;
}

export interface CandidateWithStats {
    name: string;
    list_name: 'List A' | 'List B';
    selection_count: number;
} 