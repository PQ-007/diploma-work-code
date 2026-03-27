"use client";

import React from "react";

export function Steps({ children }: { children: React.ReactNode }) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="my-8 space-y-6">
      {childrenArray.map((child, index) => (
        <div key={index} className="flex gap-4 group">
          {/* Step number circle */}
          <div className="flex-shrink-0 relative">
            <div
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground
                         flex items-center justify-center text-sm font-bold
                         shadow-md group-hover:shadow-lg group-hover:scale-110
                         transition-all duration-300"
            >
              {index + 1}
            </div>
            {/* Connecting line */}
            {index < childrenArray.length - 1 && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-border" />
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 pb-6">
            <div className="prose prose-sm max-w-none text-foreground">
              {child}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
