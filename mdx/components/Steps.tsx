"use client";

import React from "react";

export function Steps({ children }: { children: React.ReactNode }) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="my-8 relative">
      <div
        className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"
        aria-hidden
      />

      <div className="space-y-7">
        {childrenArray.map((child, index) => (
          <div key={index} className="flex gap-4 group relative">
            {/* Step number circle */}
            <div className="flex-shrink-0 relative z-10">
              <div
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground
                         flex items-center justify-center text-sm font-bold
                         shadow-md group-hover:shadow-lg group-hover:scale-110
                         transition-all duration-300"
              >
                {index + 1}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 pb-3 text-[15px] leading-7 text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {child}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
