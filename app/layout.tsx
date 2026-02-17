import type React from "react";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ScrollingFooter } from "@/components/scrolling-footer";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Track Any - Asset Monitoring",
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
      <body className={`${spaceGrotesk.className} min-h-screen overflow-x-hidden flex flex-col antialiased`}>
        <Navigation />
        <main className="flex-1">{children}</main>
        <ScrollingFooter />
      </body>
    </html>
  );
}
