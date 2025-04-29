import { Inter } from "next/font/google";
import LayoutClient from "@/components/layout-client";
import QueryProvider from "@/lib/query-provider";
import "@/app/globals.css";
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Starfire | Create Custom Bingo Cards",
  description: "Create customizable bingo cards for game nights, watch parties, or any event with Starfire.",
  keywords: ["bingo", "custom bingo", "bingo cards", "game night", "starfire"],
  openGraph: {
    title: "Starfire | Custom Bingo Cards Creator",
    description: "Create stunning, customizable bingo cards for any event. Personalize every cell your way.",
    url: "https://starfire.lol",
    siteName: "Starfire",
    images: [
      {
        url: "https://starfire.lol/og-image.png",
        width: 1200,
        height: 628,
        alt: "Starfire Bingo Card Creator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starfire",
    description: "Design and share custom bingo cards for game nights, watch parties, and more.",
    images: ["https://starfire.lol/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={inter.className}>
        <QueryProvider>
          <LayoutClient>{children}</LayoutClient>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
