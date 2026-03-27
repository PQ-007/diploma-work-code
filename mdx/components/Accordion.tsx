"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="my-8 space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="rounded-lg border border-border bg-card overflow-hidden
                       hover:border-primary/50 transition-all duration-200 shadow-sm"
          >
            {/* Accordion header */}
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 flex items-center justify-between
                         text-left font-medium text-foreground
                         hover:bg-muted/30 transition-colors"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform duration-300
                           ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Accordion content */}
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}
              `}
            >
              <div className="px-6 py-4 border-t border-border bg-muted/10">
                <div className="prose prose-sm max-w-none text-foreground">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
