"use client";

import { Button } from "@/components/ui/button";
import { signout } from "@/app/actions/auth";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
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
    <Button variant="destructive" onClick={() => void handleSignOut()}>
      Sign Out
    </Button>
  );
}
