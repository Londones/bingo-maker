import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
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
        session({ token, session }) {
            try {
                if (token) {
                    session.user.id = token.id as string;
                    session.user.name = token.name as string;
                    session.user.email = token.email as string;
                }
                return session;
            } catch (error) {
                console.error("Session callback error:", error);
                return session;
            }
        },
        async jwt({ token, user }) {
            try {
                const dbUser = await prisma.user.findFirst({
                    where: { email: token.email },
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
