"use client";

import { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

type TabsProps = {
  items?: Tab[];
  // Legacy alias in case existing content uses a different prop name.
  tabs?: Tab[];
  children?: React.ReactNode;
};

export function Tabs({ items, tabs, children }: TabsProps) {
  const resolvedItems = Array.isArray(items)
    ? items
    : Array.isArray(tabs)
      ? tabs
      : [];

  if (resolvedItems.length === 0) {
    return children ? (
      <div className="my-8 rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="text-[15px] leading-7 text-foreground">{children}</div>
      </div>
    ) : null;
  }

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="my-8 rounded-xl border border-border bg-card overflow-hidden shadow-md">
      {/* Tab headers */}
      <div
        className="flex border-b border-border bg-muted/30 overflow-x-auto scrollbar-none"
        role="tablist"
      >
        {resolvedItems.map((tab, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`tabpanel-${index}`}
            onClick={() => setActiveTab(index)}
            className={`
              px-6 py-3 text-sm font-medium whitespace-nowrap
              transition-all duration-200 relative
              ${
                activeTab === index
                  ? "text-primary bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            {tab.label}
            {/* Active indicator */}
            {activeTab === index && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {resolvedItems.map((tab, index) => (
        <div
          key={index}
          role="tabpanel"
          id={`tabpanel-${index}`}
          hidden={activeTab !== index}
          className={`p-6 ${activeTab === index ? "animate-fade-in" : ""}`}
        >
          <div className="text-[15px] leading-7 text-foreground">
            {tab.content}
          </div>
        </div>
      ))}
    </div>
  );
}
