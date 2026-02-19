import type React from "react";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ScrollingFooter } from "@/components/scrolling-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PWARegister } from "@/components/pwa-register";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Track Any - Asset Monitoring",
  description:
    "Track any asset, anywhere, anytime. Real-time price feeds and market monitoring powered by advanced oracle technology.",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b1220",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Track Any",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <ScrollingFooter />
        <MobileBottomNav />
        <PWARegister />
      </body>
    </html>
  );
}
