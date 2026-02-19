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
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.href === pathname)
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/10 bg-[#050b16]/95 backdrop-blur-xl lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="relative grid h-20 grid-cols-3 px-2 pt-1.5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1.5 top-1.5 left-2 rounded-xl border border-white/12 bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_10px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out"
          style={{
            width: "calc((100% - 1rem) / 3)",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative z-10 inline-flex flex-col items-center justify-center gap-1.5 rounded-xl text-[11px] font-medium transition-colors duration-200",
                active
                  ? "text-sky-100"
                  : "text-slate-300 hover:text-sky-100 active:scale-[0.99]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "transition-all duration-200",
                  active
                    ? "h-5 w-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]"
                    : "h-4 w-4 text-slate-300"
                )}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
