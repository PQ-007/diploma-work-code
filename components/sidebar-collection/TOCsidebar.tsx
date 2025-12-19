"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- Types ---
interface TocItem {
  id: string;
  text: string;
  level: number;
  children?: TocItem[];
}

interface TocProps {
  toc: TocItem[];
}

// --- Hook for Scroll Spy Logic ---
// This hook finds which heading is currently active in the viewport
const useActiveItem = (itemIds: string[]) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    itemIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0) {
                setActiveId(id);
              }
            });
          },
          {
            // Trigger when the element is 10% from the top of the viewport
            rootMargin: "0% 0% -80% 0%", 
          }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [itemIds]);

  return activeId;
};

// --- Recursive Tree Component ---
const TocTree = ({
  items,
  activeId,
  level = 1,
}: {
  items: TocItem[];
  activeId: string | null;
  level?: number;
}) => {
  if (!items?.length) return null;

  return (
    <ul className="relative space-y-2 text-sm">
      {items.map((item) => {
        const isActive = activeId === item.id;
        
        return (
          <li key={item.id} className="relative">
            {/* The Line Logic:
               We render a container that includes the vertical line, 
               the connector, and the link text.
            */}
            <div className="flex items-start">
              
              {/* Indentation & Vertical Lines Container */}
              <div 
                className="relative flex flex-col items-center mr-3" 
                style={{ width: '20px', minHeight: '24px' }}
              >
                {/* 1. Continuous Vertical Line (Gray Background)
                   This creates the tree trunk effect 
                */}
                <div className="absolute top-0 bottom-0 left-[10px] w-[1px] bg-neutral-800 h-full -z-10" />

                {/* 2. Active Vertical Highlight (Blue Overlay) 
                   Only visible if this specific item is active
                */}
                {isActive && (
                  <div className="absolute top-0 h-full left-[10px] w-[2px] bg-blue-500 z-0" />
                )}

                {/* 3. Horizontal Connector (L-Shape) 
                   This connects the vertical line to the text.
                   Inactive: Hidden (or faint gray if you prefer)
                   Active: Bright Blue
                */}
                {isActive && (
                  <div className="absolute top-1/2 left-[10px] w-[10px] h-[2px] bg-blue-500 -translate-y-1/2 z-10" />
                )}
              </div>

              {/* The Link Text */}
              <div className="flex-1 pt-0.5">
                <Link
                  href={`#${item.id}`}
                  className={`block transition-colors duration-200 ${
                    isActive
                      ? "text-blue-400 font-medium"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(`#${item.id}`)?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  {item.text}
                </Link>

                {/* Recursive Children (Nested List) */}
                {item.children && item.children.length > 0 && (
                   // Indent children slightly
                  <div className="ml-1 mt-2">
                    <TocTree 
                      items={item.children} 
                      activeId={activeId} 
                      level={level + 1} 
                    />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

// --- Main Exported Component ---
export default function MdxTocSidebar({ toc }: TocProps) {
  // Helper to extract all IDs for the observer
  const getAllIds = (items: TocItem[]): string[] => {
    return items.reduce((acc: string[], item) => {
      acc.push(item.id);
      if (item.children) {
        acc.push(...getAllIds(item.children));
      }
      return acc;
    }, []);
  };

  const itemIds = React.useMemo(() => getAllIds(toc), [toc]);
  const activeId = useActiveItem(itemIds);

  return (
    <nav className="w-64 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <h3 className="text-sm font-semibold text-neutral-100 mb-4 pl-8">
        On This Page
      </h3>
      
      {/* Outer wrapper adds the main left "trunk" line if you want the 
        top-level items connected, or we leave it to the recursive tree.
      */}
      <div className="relative">
        <TocTree items={toc} activeId={activeId} />
      </div>
    </nav>
  );
}