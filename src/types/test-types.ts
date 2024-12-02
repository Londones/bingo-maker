export interface Bingo {
    id: string;
    title: string;
    cells: { id: string; content: string; position: number }[];
    authorToken?: string;
}

export interface Error {
    code: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    nextCursor?: string;
    hasMore: boolean;
}

export interface MigrationStatus {
    success: boolean;
    migratedCount: number;
}

export interface Suggestion {
    id: string;
    content: string;
    status: "pending" | "added" | "rejected";
}
