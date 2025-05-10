"use client";

import React, { useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";

const NavBar = () => {
    const { data: session } = useSession();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (session) {
            setIsLoggedIn(true);
        }
        if (!session) {
            setIsLoggedIn(false);
        }
    }, [session]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Create stars component to be reused
    const StarIcon = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
        const sizes = {
            sm: "w-3 h-3",
            lg: "w-7 h-7",
        };

        return (
            <span className='relative inline-block ml-1 animate-bounce'>
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    className={`${sizes[size]} text-primary`}
                >
                    <path
                        fillRule='evenodd'
                        d='M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z'
                        clipRule='evenodd'
                    />
                </svg>
            </span>
        );
    };

    return (
        <div className='w-full flex justify-between items-center pt-4'>
            <div className='hidden md:flex items-center'>
                <Link href={"/"} className='font-extrabold z-[60]'>
                    Starfire
                    <StarIcon />
                </Link>
            </div>

            <div className='flex md:hidden items-center'>
                <Link href={"/"} className='z-[60] flex items-center justify-center'>
                    <StarIcon size='lg' />
                </Link>
            </div>

            <div className='hidden md:flex items-center gap-4 z-[60]'>
                {isLoggedIn ? (
                    <Button onClick={() => router.push("/me")}>Profile</Button>
                ) : (
                    <Button onClick={() => router.push("/signin")}>Login</Button>
                )}
                <ModeToggle />
            </div>

            <div className='flex md:hidden'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='outline' size='icon' className='z-[60]'>
                            <Menu className='h-8 w-8' />
                        </Button>
                    </DropdownMenuTrigger>{" "}
                    <DropdownMenuContent
                        align='end'
                        className='p-4 bg-background border border-border rounded-md shadow-md'
                    >
                        {isLoggedIn ? (
                            <DropdownMenuItem
                                className='cursor-pointer justify-center focus:bg-accent hover:bg-accent/50 rounded-md px-2 py-2 mb-1'
                                onClick={() => router.push("/me")}
                            >
                                Profile
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                className='cursor-pointer justify-center focus:bg-accent hover:bg-accent/50 rounded-md px-2 py-2 mb-1'
                                onClick={() => router.push("/signin")}
                            >
                                Login
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className='my-2' />
                        <div className='flex items-center justify-center w-full px-2 py-1'>
                            <ModeToggle />
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default NavBar;
