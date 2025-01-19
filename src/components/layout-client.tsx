"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { StateProvider } from "@/components/providers/state-provider";
import NavBar from "@/components/nav-bar";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <StateProvider>
                <ThemeProvider attribute={"class"} defaultTheme='system' enableSystem>
                    <AuthProvider>
                        <div className='w-full flex-col items-center mx-auto h-screen overflow-x-hidden flex justify-between'>
                            <div className='absolute top-0 z-[-2] h-screen w-screen bg-background bg-[radial-gradient(circle_at_center_top,#A9C9FF_5%,#B4C3FF_10%,#D4B8FF_20%,#FFBBEC_30%,rgba(255,255,255,0)_50%)] dark:bg-[radial-gradient(circle_at_center_top,rgba(252,70,239,0.5)_0%,rgba(180,70,240,0.4)_15%,rgba(100,50,235,0.3)_25%,rgba(7,0,227,0.2)_35%,rgba(0,0,0,0)_50%)]'></div>
                            <div
                                style={{
                                    backgroundImage: 'url("/img-noise-300x300.png")',
                                    backgroundRepeat: "repeat",
                                    opacity: 0.5,
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                }}
                                className='z-[-1]'
                            ></div>
                            <div className='w-10/12 flex flex-col gap-8'>
                                <NavBar />
                                <main className='flex-grow'>{children}</main>
                            </div>
                        </div>
                    </AuthProvider>
                </ThemeProvider>
            </StateProvider>
            <Toaster />
        </QueryClientProvider>
    );
}
