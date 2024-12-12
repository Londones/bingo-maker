import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <html suppressHydrationWarning>
            <body className={inter.className + " w-full h-screen flex justify-center"}>
                <ThemeProvider attribute={"class"} defaultTheme='system' enableSystem>
                    <div className='absolute top-0 z-[-2] h-screen w-screen bg-background bg-[radial-gradient(circle_at_center_top,#A9C9FF_5%,#B4C3FF_10%,#D4B8FF_20%,#FFBBEC_30%,rgba(255,255,255,0)_50%)] dark:bg-[radial-gradient(circle_at_center_top,rgba(252,70,239,0.5)_0%,rgba(180,70,240,0.4)_15%,rgba(100,50,235,0.3)_25%,rgba(7,0,227,0.2)_35%,rgba(0,0,0,0)_50%)]'></div>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
