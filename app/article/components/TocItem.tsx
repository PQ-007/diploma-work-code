"use client";

import type { TocEntry } from "../type";

type TocItemProps = {
  item: TocEntry;
  activeId: string;
};

export default function TocItem({ item, activeId }: TocItemProps) {
  const isActive = activeId === item.id;
  const indentPx = Math.max(0, (item.level - 1) * 12);

  return (
    <a
      href={`#${item.id}`}
      onClick={(e) => {
        e.preventDefault();
        document
          .getElementById(item.id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `#${item.id}`);
      }}
      className={`block rounded-md px-2 py-1 text-[13px] leading-4 transition-colors ${
        isActive
          ? "text-primary bg-primary/10 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
      style={{ marginLeft: `${indentPx}px` }}
      title={item.text}
    >
      <span className="line-clamp-2 block">{item.text}</span>
    </a>
  );
}
