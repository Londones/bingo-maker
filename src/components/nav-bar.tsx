"use client";

import React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";

const NavBar = () => {
    const { data: session } = useSession();

    const ProfileOrLoginButton = () => {
        if (session) {
            return <Button>Profile</Button>;
        } else {
            return <Button>Login</Button>;
        }
    };

    return (
        <div className='w-full flex justify-between items-center p-8'>
            <div className='flex items-center'>
                <h1 className='font-extrabold italic'>Starfirr</h1>
            </div>
            <div className='flex items-center gap-4'>
                <ProfileOrLoginButton />
                <ModeToggle />
            </div>
        </div>
    );
};

export default NavBar;
