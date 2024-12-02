import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextApiHandler } from "next";

const handler = NextAuth(authOptions) as NextApiHandler;
export { handler as GET, handler as POST };
