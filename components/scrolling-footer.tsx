"use client";

import { dataProviders } from "@/lib/mock-price-data";

export function ScrollingFooter() {
  // Duplicate the providers array to create seamless loop
  const duplicatedProviders = [...dataProviders, ...dataProviders];

  return (
    <div className="mt-auto border-t border-white/10 bg-black/80 backdrop-blur-md py-4 overflow-hidden">
      <div className="flex gap-12 animate-scroll">
        {duplicatedProviders.map((provider, index) => (
          <div
            key={`${provider}-${index}`}
            className="shrink-0 text-gray-300 text-sm font-medium whitespace-nowrap hover:text-purple-400 transition-colors"
          >
            {provider}
          </div>
        ))}
      </div>
    </div>
  );
}
