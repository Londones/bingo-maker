export interface BingoData {
    id?: string;
    title: string;
    gridSize: number;
    cells: Array<{
        id?: string;
        content: string;
        position: number;
        validated: boolean;
    }>;
    style: {
        fontSize: number;
        fontFamily: string;
        color: string;
        cellSize: number;
        gap: number;
    };
    background?: {
        type: "image" | "gradient";
        value: string;
    };
    stamp: {
        type: "text" | "image";
        value: string;
        size: number;
        opacity: number;
    };
    authorToken?: string;
}

export interface RadialGradientStop {
    position: {
        x: number;
        y: number;
    };
    color: string;
    opacity?: number;
    radius?: number;
}

export interface GradientConfig {
    backgroundColor: string;
    stops: RadialGradientStop[];
}

export interface Suggestion {
    id: string;
    content: string;
    status: "pending" | "added" | "rejected";
}

export interface PaginatedResponse<T> {
    items: T[];
    nextCursor?: string;
    hasMore: boolean;
}

export interface MigrateRequest {
    bingoIds: string[];
    authorToken: string;
    userId: string;
}

export interface SuggestionPatchRequest {
    suggestionId: string;
    status: "pending" | "added" | "rejected";
    position: number;
}
