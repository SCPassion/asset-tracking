"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, LineChart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/price-feeds", label: "Feeds", icon: LineChart },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/about", label: "About", icon: CircleHelp },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/10 bg-[#050b16]/95 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-16 grid-cols-3 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors duration-150",
                active
                  ? "text-sky-200"
                  : "text-slate-300 hover:text-sky-200"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
