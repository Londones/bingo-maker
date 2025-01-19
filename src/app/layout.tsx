import { Inter } from "next/font/google";
import LayoutClient from "@/components/layout-client";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <html suppressHydrationWarning>
            <body className={inter.className}>
                <LayoutClient>{children}</LayoutClient>
            </body>
        </html>
    );
}
