import { Inter } from "next/font/google";
import LayoutClient from "@/components/layout-client";
import QueryProvider from "@/lib/query-provider";
import "@/app/globals.css";
//import { ReactScan } from "@/components/react-scan";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html suppressHydrationWarning>
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        {/* rest of your scripts go under */}
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <LayoutClient>{children}</LayoutClient>
        </QueryProvider>
      </body>
    </html>
  );
}
