"use client";

import Link from "next/link";
import { useActionState, useEffect, useCallback } from "react";
import { authenticate, authenticateGoogle } from "@/app/actions/auth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { useRouter } from "next/navigation";

const Page = () => {
  const { authorToken, isClient } = useBingoStorage();
  const router = useRouter();

  const getBingoIdsFromStorage = useCallback(() => {
    if (isClient) {
      const ownedBingos = localStorage.getItem("ownedBingos");
      if (ownedBingos) {
        const bingoIds = JSON.parse(ownedBingos);
        if (bingoIds && bingoIds.length > 0) {
          localStorage.removeItem("ownedBingos");
          return JSON.stringify(bingoIds);
        }
      }
    }
    return undefined;
  }, [isClient]);

  const customFormAction = useCallback(
    async (state: string | undefined, formData: FormData) => {
      const bingoIds = getBingoIdsFromStorage();
      return authenticate(state, formData, bingoIds, authorToken || undefined);
    },
    [authorToken, getBingoIdsFromStorage]
  );

  const [result, formAction, isPending] = useActionState(customFormAction, undefined);
  const [, , isGooglePending] = useActionState(() => authenticateGoogle(), undefined);

  const handleGoogleSignIn = useCallback(() => {
    const bingoIds = getBingoIdsFromStorage();
    void authenticateGoogle(bingoIds, authorToken || undefined);
  }, [getBingoIdsFromStorage, authorToken]);

  useEffect(() => {
    if (result && typeof result === "string" && !result.includes("Invalid") && !result.includes("wrong")) {
      router.push(result);
    }
  }, [result, router]);

  if (result === "Invalid credentials" || result === "Something went wrong") {
    const errorMessage = result === "Invalid credentials" ? "Invalid email or password" : "Something went wrong";
    toast.error(errorMessage);
  }

  return (
    <div className="flex h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold">Sign in</h1>
        <form action={formAction} className="space-y-4">
          <div className="relative h-fit">
            <Label htmlFor="email" className="">
              Email
            </Label>
            <Input id="email" className="w-full rounded-md" type="email" name="email" required />
          </div>

          <div className="relative h-fit">
            <Label htmlFor="password">Password</Label>
            <Input
              className="w-full rounded-md border"
              type="password"
              name="password"
              required
              minLength={8}
              id="password"
            />
          </div>

          <Button disabled={isPending} className="w-full rounded-md" type="submit">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex items-center justify-center gap-1">
            <div className="flex w-full items-center">
              <span className="border-t w-full" />
            </div>
            <div className="flex justify-center text-nowrap text-xs w-full uppercase">
              <span className=" px-2 text-muted-foreground">Or continue with</span>
            </div>
            <div className="flex w-full items-center">
              <span className="border-t w-full" />
            </div>
          </div>

          <Button
            type="button"
            disabled={isGooglePending}
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isGooglePending ? "Signing in with Google..." : "Google"}
          </Button>

          <p className="text-center text-xs text-gray-600">
            No account?
            <Link className="text-blue-400 hover:text-blue-600" href="/signup">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Page;
