"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { href: "/price-feeds", label: "Price Feeds" },
    { href: "/favorites", label: "Favorites" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 glass">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent hover:from-green-300 hover:via-emerald-300 hover:to-green-300 transition-all duration-300"
          >
            <Image
              src="/TrackAny.png"
              alt="Track Any Logo"
              width={24}
              height={24}
              className="rounded-lg sm:w-8 sm:h-8 ring-2 ring-green-500/20 hover:ring-green-500/40 transition-all"
            />
            <span className="hidden xs:inline">Track Any</span>
            <span className="xs:hidden">Track Any</span>
          </Link>

          <div className="hidden items-center gap-4 sm:gap-6 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-all duration-300 relative",
                  pathname === link.href
                    ? "text-green-300"
                    : "text-gray-400 hover:text-green-300"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search assets..."
              className="w-48 xl:w-64 pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 focus:bg-white/8 transition-all duration-300"
            />
          </div>

          <Button className="hidden sm:inline-flex text-sm">Get Started</Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/10 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-white/10 glass">
          <div className="container mx-auto px-3 sm:px-4 py-4 space-y-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-sm font-medium transition-all duration-300 hover:text-green-300 py-2",
                  pathname === link.href ? "text-green-300" : "text-gray-400"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search assets..."
                  className="w-full pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/50 focus:ring-green-400/20 focus:bg-white/8 transition-all duration-300"
                />
              </div>
              <Button className="w-full">Get Started</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export { Navigation };
export default Navigation;
