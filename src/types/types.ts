export interface BingoCell {
    id?: string;
    content: string;
    position: number;
    validated: boolean;
    cellStyle?: CellStyle;
}

export interface Style {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    cellBorderColor: string;
    cellBorderWidth: number;
    cellBackgroundColor: string;
    cellBackgroundOpacity: number;
    color: string;
    cellSize: number;
    gap: number;
}

export interface CellStyle {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    cellBorderColor?: string;
    cellBorderWidth?: number;
    cellBackgroundColor?: string;
    cellBackgroundImage?: string;
    cellBackgroundOpacity?: number;
    cellBackgroundImageOpacity?: number;
}

export interface Background {
    value: string;
    backgroundImage?: string;
    backgroundImageOpacity?: number;
    backgroundImagePosition?: string;
}

export interface Stamp {
    type: "text" | "image";
    value: string;
    size: number;
    opacity: number;
}

export interface Bingo {
    id?: string;
    title: string;
    gridSize: number;
    status: "draft" | "published";
    cells: BingoCell[];
    style: Style;
    background: Background;
    stamp: Stamp;
    authorToken?: string;
    userId?: string;
    localImages?: LocalImage[];
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
    id?: string;
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

// export interface BingoState {
//     id: string;
//     title: string;
//     gridSize: number;
//     cells: BingoCell[];
//     style: Style;
//     background: Background;
//     stamp: Stamp;
//     status: "draft" | "published";
// }

export interface EditorHistory {
    past: Bingo[];
    present: Bingo;
    future: Bingo[];
}

export interface EditorState {
    history: EditorHistory;
    canUndo: boolean;
    canRedo: boolean;
    canSave: boolean;
}

export interface BaseLocalImage {
    url: string;
    fileInfo: {
        name: string;
        size: number;
        type: string;
    };
}

export interface CellLocalImage extends BaseLocalImage {
    type: "cell";
    position: number;
}

export interface OtherLocalImage extends BaseLocalImage {
    type: "background" | "stamp";
    position?: never;
}

export type LocalImage = CellLocalImage | OtherLocalImage;

export type PopoverType = "textColor" | "borderColor" | "cellBackgroundColor" | null;

export interface ImageUploadResponse {
    cellImages?: { position: number; url: string }[];
    backgroundImage?: string;
    stampImage?: string;
}
