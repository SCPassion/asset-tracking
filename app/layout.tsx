import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ScrollingFooter } from "@/components/scrolling-footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Track Any - Asset Monitoring Dashboard",
  description:
    "Track any asset, anywhere, anytime. Real-time price feeds and market monitoring powered by advanced oracle technology.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        {children}
        <ScrollingFooter />
      </body>
    </html>
  );
}
