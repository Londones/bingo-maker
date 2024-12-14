"use server";

import { ZodError } from "zod";
import { signUpSchema } from "@/schemas";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";

export async function signout() {
    await signOut();
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        throw error;
    }
}

export async function register(prevState: string | undefined, formData: FormData) {
    try {
        const { email, password } = await signUpSchema.parseAsync({
            email: formData.get("email"),
            password: formData.get("password"),
        });

        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (user) {
            return "User already exists";
        }

        const hash = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email: email,
                password: hash,
            },
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return error.errors.map((error) => error.message).join(", ");
        }
    }

    redirect("/signin");
}
