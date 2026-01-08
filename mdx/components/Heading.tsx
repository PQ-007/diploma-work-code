import React from "react";

export function slugify(str: React.ReactNode): string {
  return String(str)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    const slug = slugify(children);

    const headingClasses =
      {
        1: "text-2xl font-bold tracking-tight mt-12 mb-4 pb-2 border-b-2 border-border text-foreground",
        2: "text-xl font-bold tracking-tight mt-12 mb-4 pt-8 border-t border-border/50 text-foreground",
        3: "text-lg font-semibold mt-10 mb-3 text-foreground",
        4: "text-base font-semibold mt-8 mb-2 text-foreground",
        5: "text-sm font-semibold mt-6 mb-2 text-foreground",
        6: "text-xs font-semibold mt-4 mb-1 text-foreground",
      }[level] || "";

    return React.createElement(
      `h${level}`,
      {
        id: slug,
        className: `group flex items-center scroll-mt-24 ${headingClasses}`,
      },
      [
        children,
        React.createElement(
          "a",
          {
            href: `#${slug}`,
            key: `link-${slug}`,
            className:
              "anchor ml-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary",
            "aria-hidden": "true",
          },
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1 .195 1.414.586l8 8a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-8-8A2 2 0 017 10V3z"
            />
          </svg>
        ),
      ]
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}
