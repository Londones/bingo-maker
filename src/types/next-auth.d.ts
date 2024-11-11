import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            image: string;
        };
    }
}

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
    background?: string;
    stamp: string;
    authorToken?: string;
}
