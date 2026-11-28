"use client";

import { Button } from "@/components/ui/button";
import { signout } from "@/app/actions/auth";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

export default function SignOutButton() {
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      queryClient.clear();
      await signOut({
        redirect: false,
        callbackUrl: "/signin",
      });
      await signout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-10 rounded-xl border-border bg-card/80 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/40"
      onClick={() => void handleSignOut()}
    >
      Sign out
    </Button>
  );
}
