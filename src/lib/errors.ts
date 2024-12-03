export class APIError extends Error {
    constructor(public message: string, public code: APIErrorCode, public status: number = 500) {
        super(message);
        this.name = "APIError";
    }
}

export class UploadError extends Error {
    constructor(public message: string, public code: UploadErrorCode, public status: number = 401) {
        super(message);
        this.name = "UploadError";
    }
}

export enum UploadErrorCode {
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    INVALID_FILE_SIZE = "INVALID_FILE_SIZE",
    UPLOAD_ERROR = "UPLOAD_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
}

export enum APIErrorCode {
    BINGO_NOT_FOUND = "BINGO_NOT_FOUND",
    INVALID_REQUEST = "INVALID_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    DATABASE_ERROR = "DATABASE_ERROR",
    MIGRATION_ERROR = "MIGRATION_ERROR",
    FAILED_TO_CREATE_BINGO = "FAILED_TO_CREATE_BINGO",
    MISSING_ID_OR_SHARE_TOKEN = "MISSING_ID_OR_SHARE_TOKEN",
    FAILED_TO_GET_BINGOS = "FAILED_TO_GET_BINGOS",
    FAILED_TO_CREATE_SUGGESTION = "FAILED_TO_CREATE_SUGGESTION",
    FAILED_TO_UPDATE_SUGGESTION = "FAILED_TO_UPDATE_SUGGESTION",
    STREAM_ERROR = "STREAM_ERROR",
    SUGGESTION_FETCH_ERROR = "SUGGESTION_FETCH_ERROR",
    CONTENT_REQUIRED = "CONTENT_REQUIRED",
}

export const errorStatusMap: Record<APIErrorCode, number> = {
    [APIErrorCode.BINGO_NOT_FOUND]: 444,
    [APIErrorCode.CONTENT_REQUIRED]: 402,
    [APIErrorCode.INVALID_REQUEST]: 400,
    [APIErrorCode.UNAUTHORIZED]: 401,
    [APIErrorCode.DATABASE_ERROR]: 500,
    [APIErrorCode.MIGRATION_ERROR]: 556,
    [APIErrorCode.FAILED_TO_CREATE_BINGO]: 557,
    [APIErrorCode.FAILED_TO_GET_BINGOS]: 558,
    [APIErrorCode.FAILED_TO_CREATE_SUGGESTION]: 559,
    [APIErrorCode.FAILED_TO_UPDATE_SUGGESTION]: 560,
    [APIErrorCode.STREAM_ERROR]: 561,
    [APIErrorCode.SUGGESTION_FETCH_ERROR]: 562,
    [APIErrorCode.MISSING_ID_OR_SHARE_TOKEN]: 445,
};
