"use server";

import { ZodError } from "zod";
import { signUpSchema } from "@/schemas";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function signout() {
    await signOut();
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials";
                default:
                    return "Something went wrong";
            }
        }
        throw error;
    }

    redirect("/");
}

export async function authenticateGoogle() {
    await signIn("google", { callbackUrl: `${window.location.origin}/` });
}

export async function register(prevState: string | undefined, formData: FormData) {
    try {
        const {
            email,
            username: name,
            password,
        } = await signUpSchema.parseAsync({
            email: formData.get("email"),
            username: formData.get("username"),
            password: formData.get("password"),
        });

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: email }, { name: name }],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return "Email already in use";
            }
            if (existingUser.name === name) {
                return "Username already taken";
            }
        }

        const hash = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email: email,
                name: name,
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
