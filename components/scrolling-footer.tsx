"use client";

import { dataProviders } from "@/lib/mock-price-data";

export function ScrollingFooter() {
  // Duplicate the providers array to create seamless loop
  const duplicatedProviders = [...dataProviders, ...dataProviders];

  return (
    <div className="mt-auto border-t border-slate-300/10 glass py-4 overflow-hidden">
      <div className="flex gap-12 animate-scroll">
        {duplicatedProviders.map((provider, index) => (
          <div
            key={`${provider}-${index}`}
            className="shrink-0 text-slate-300 text-sm font-medium whitespace-nowrap hover:text-sky-200 transition-colors duration-300"
          >
            {provider}
          </div>
        ))}
      </div>
    </div>
  );
}
