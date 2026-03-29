import { Link as LinkIcon } from "lucide-react";
import React from "react";

const extractTextContent = (node: React.ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join(" ");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractTextContent(node.props.children);
  }

  return "";
};

export function slugify(str: React.ReactNode): string {
  return extractTextContent(str)
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
  const Heading = ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const slug = slugify(children);

    const headingClasses =
      {
        1: "text-2xl font-bold tracking-tight   text-foreground",
        2: "text-xl font-bold tracking-tight mt-10 mb-4 text-foreground",
        3: "text-lg font-semibold mt-10 mb-3 text-foreground",
        4: "text-base font-semibold mt-8 mb-2 text-foreground",
        5: "text-sm font-semibold mt-6 mb-2 text-foreground",
        6: "text-xs font-semibold mt-4 mb-1 text-foreground",
      }[level] || "";

    return React.createElement(
      `h${level}`,
      {
        id: slug,
        className: `group flex items-center scroll-mt-24 ${headingClasses} ${className || ""}`,
        ...props,
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
          <LinkIcon className="h-4 w-4" />,
        ),
      ],
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}
