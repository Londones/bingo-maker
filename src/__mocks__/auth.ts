import { JWT, Session } from "next-auth";

export const mockSession: Session = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
    },
};

export const mockAuthOptions = {
    adapter: {
        createUser: jest.fn(),
        getUser: jest.fn(),
        getUserByEmail: jest.fn(),
        getUserByAccount: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        linkAccount: jest.fn(),
        unlinkAccount: jest.fn(),
        createSession: jest.fn(),
        getSessionAndUser: jest.fn(),
        updateSession: jest.fn(),
        deleteSession: jest.fn(),
    },
    providers: [
        {
            id: "google",
            name: "Google",
            type: "oauth",
            signinUrl: "http://localhost:3000/api/auth/signin/google",
            callbackUrl: "http://localhost:3000/api/auth/callback/google",
        },
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        session: jest.fn().mockImplementation(({ token, session }: { token: JWT; session: Session }) => {
            if (token) {
                session.user.id = mockSession.user.id;
                session.user.name = mockSession.user.name;
                session.user.email = mockSession.user.email;
            }
            return session;
        }),
    },
};

jest.mock("next-auth/providers/google", () => ({
    __esModule: true,
    default: jest.fn(() => ({
        id: "google",
        name: "Google",
        type: "oauth",
    })),
}));

jest.mock("@auth/prisma-adapter", () => ({
    PrismaAdapter: jest.fn(() => mockAuthOptions.adapter),
}));

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(() => Promise.resolve(mockSession)),
}));

export const getServerSession = jest.fn().mockResolvedValue(mockSession);
