"use client";

import React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const NavBar = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const ProfileOrLoginButton = () => {
    if (session) {
      return <Button onClick={() => router.push("/me")}>Profile</Button>;
    } else {
      return <Button onClick={() => router.push("/signin")}>Login</Button>;
    }
  };

  return (
    <div className="w-full flex justify-between items-center pt-8">
      <div className="flex items-center">
        <Link href={"/"} className="font-extrabold italic">
          Starfire
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <ProfileOrLoginButton />
        <ModeToggle />
      </div>
    </div>
  );
};

export default NavBar;
