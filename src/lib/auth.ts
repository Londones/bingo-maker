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
        async session({ token, session }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.image = token.picture as string;
            }

            return session;
        },
        async jwt({ token, user }) {
            const dbUser = await prisma.user.findFirst({
                where: {
                    email: token.email,
                },
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
                picture: dbUser.image,
            };
        },
    },
};
