export interface BingoCell {
    id?: string;
    content: string;
    position: number;
    validated: boolean;
    cellStyle?: CellStyle | null;
    hovered?: boolean;
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
    color?: string | null;
    fontSize?: number | null;
    fontFamily?: string | null;
    fontWeight?: string | null;
    fontStyle?: string | null;
    cellBorderColor?: string | null;
    cellBorderWidth?: number | null;
    cellBackgroundColor?: string | null;
    cellBackgroundImage?: string | null;
    cellBackgroundOpacity?: number | null;
    cellBackgroundImageOpacity?: number | null;
    cellBackgroundImagePosition?: string | null;
    cellBackgroundImageSize?: number | null;
}

export interface Background {
    value: string;
    backgroundImage?: string | null;
    backgroundImageOpacity?: number | null;
    backgroundImagePosition?: string | null;
    backgroundImageSize?: number | null;
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
    titleWidth?: number;
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

export interface BingoPatch {
    title?: string;
    titleWidth?: number;
    status?: "draft" | "published";
    gridSize?: number;
    style?: Partial<Style>;
    background?: Partial<Background>;
    stamp?: Partial<Stamp>;
    cells?: Partial<BingoCell>[];
    authorToken?: string;
}

export interface RadialGradientStop {
    position: {
        x: number;
        y: number;
    };
    color: string;
    opacity?: number | null;
    radius?: number | null;
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

export interface ChangeTracker {
    title?: boolean;
    titleWidth?: boolean;
    gridSize?: boolean;
    style?: Partial<Style>;
    background?: Partial<Background>;
    stamp?: Partial<Stamp>;
    cells?: { [id: string]: Partial<BingoCell> };
    status?: boolean;
}

export interface EditorState {
    history: EditorHistory;
    canUndo: boolean;
    canRedo: boolean;
    canSave: boolean;
    changes?: ChangeTracker;
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

export interface BingoPreview {
    id: string;
    title: string;
    status?: string;
    background: {
        value: string;
        backgroundImage: string | null;
        backgroundImageOpacity: number | null;
        backgroundImagePosition: string | null;
        backgroundImageSize: number | null;
    } | null;
    createdAt: Date;
}

export interface BingoPreviewResponse {
    bingos: BingoPreview[];
    totalPages: number;
    hasMore: boolean;
}

export interface LatestBingosResponse {
    items: BingoPreview[];
    nextCursor: string | undefined;
    hasMore: boolean;
    total: number;
}
