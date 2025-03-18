export interface Bingo {
  id: string;
  title?: string;
  cells?: { id: string; content: string; position: number; validated: boolean }[];
  authorToken?: string;
  style?: {
    fontSize: number;
    cellSize: number;
    gap: number;
    fontFamily: string;
    color: string;
  };
  isAuthor?: boolean;
  status?: "draft" | "published";
  background?: { type: "color" | "gradient"; value: string };
  stamp?: { type: "emoji" | "text"; value: string; size: number; opacity: number };
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
