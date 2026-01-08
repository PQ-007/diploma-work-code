"use client";

import { useEffect, useState } from "react";

type TocItemProps = {
  item: any;
  level?: number;
};

export default function TocItem({ item, level = 2 }: TocItemProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0% -80% 0%" }
    );

    const headings = document.querySelectorAll("h2[id], h3[id]");
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, []);

  const isActive = activeId === item.id;
  const isChild = level > 2;

  return (
    <div className="relative">
      <a
        href={`#${item.id}`}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className={`
          group flex items-center py-2 transition-colors duration-200
          ${isChild ? "pl-6 text-xs" : "text-sm"}
          ${isActive
            ? "text-primary font-medium"
            : "text-muted-foreground hover:text-foreground"}
        `}
      >
        {!isChild && isActive && (
          <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
        )}
        {isChild && (
          <div
            className={`
              absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-colors
              ${isActive ? "bg-primary" : "bg-border"}
            `}
          />
        )}
        {item.text}
      </a>

      {item.children?.map((child: any) => (
        <TocItem key={child.id} item={child} level={level + 1} />
      ))}
    </div>
  );
}