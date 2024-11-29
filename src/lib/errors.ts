export class APIError extends Error {
    constructor(public message: string, public code: APIErrorCode, public status: number = 500) {
        super(message);
        this.name = "APIError";
    }
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
}

export const errorStatusMap: Record<APIErrorCode, number> = {
    [APIErrorCode.BINGO_NOT_FOUND]: 444,
    [APIErrorCode.INVALID_REQUEST]: 400,
    [APIErrorCode.UNAUTHORIZED]: 401,
    [APIErrorCode.DATABASE_ERROR]: 500,
    [APIErrorCode.MIGRATION_ERROR]: 556,
    [APIErrorCode.FAILED_TO_CREATE_BINGO]: 557,
    [APIErrorCode.FAILED_TO_GET_BINGOS]: 558,
    [APIErrorCode.MISSING_ID_OR_SHARE_TOKEN]: 445,
};
