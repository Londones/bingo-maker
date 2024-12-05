import { NextResponse } from "next/server";
import { APIError, APIErrorCode } from "./errors";

export function handleAPIError(error: unknown) {
    if (error instanceof APIError) {
        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
            },
            { status: error.status }
        );
    }

    console.error("Unhandled error:", error);
    return NextResponse.json(
        {
            error: "Internal server error",
            code: APIErrorCode.DATABASE_ERROR,
        },
        { status: 500 }
    );
}
