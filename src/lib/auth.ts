import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, DefaultSession } from "next-auth";
import NextAuth from "next-auth";
import { cache } from "react";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/schemas";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                try {
                    const { email, password } = await signInSchema.parseAsync(credentials);

                    const user = await prisma.user.findUnique({
                        where: { email },
                    });

                    let passwordMatch = false;

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    passwordMatch = await bcrypt.compare(password, user?.password ?? "");

                    if (!passwordMatch) {
                        return null;
                    }

                    return user;
                } catch (error) {
                    return null;
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        session: ({ session, token }) => ({
            ...session,
            user: {
                ...session.user,
                id: token.sub,
            },
        }),
        async jwt({ token, user }) {
            try {
                const dbUser = await prisma.user.findFirst({
                    where: { email: token.email! },
                    select: { id: true, name: true, email: true },
                });

                if (!dbUser) {
                    if (user) {
                        token.id = user?.id;
                    }
                    return token;
                }

                return {
                    id: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email,
                };
            } catch (error) {
                console.error("JWT callback error:", error);
                return token;
            }
        },
    },
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { auth: uncachedAuth, signIn, signOut } = NextAuth(authOptions);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const auth = cache(uncachedAuth);

export { auth, signIn, signOut };
