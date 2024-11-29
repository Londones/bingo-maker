export interface PaginationResponse<T> {
    items: T[];
    nextCursor?: string;
    hasMore: boolean;
}
