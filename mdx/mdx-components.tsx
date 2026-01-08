import { MDXRemote } from "next-mdx-remote/rsc";
import { createHeading } from "./components/Heading";
import { RImage } from "./components/Image";
import { CLink } from "./components/CustomLink";
import { Code } from "./components/Code";
import { Pre } from "./components/Pre";
import { Table } from "./components/Table";
import { Callout } from "./components/Callout";

export const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RImage,
  a: CLink,
  code: Code,
  Table,
  Callout,
  // Enhanced paragraph
  p: (props: any) => (
    <p className="mb-6 leading-relaxed text-sm text-foreground" {...props} />
  ),
  // Enhanced blockquote
  blockquote: (props: any) => (
    <blockquote
      className="pl-4 py-3 my-6 border-l-4 border-primary bg-muted/30 rounded-r-lg italic text-muted-foreground"
      {...props}
    />
  ),
  // Enhanced lists
  ul: (props: any) => (
    <ul className="my-6 ml-6 list-disc space-y-2 text-foreground" {...props} />
  ),
  ol: (props: any) => (
    <ol
      className="my-6 ml-6 list-decimal space-y-2 text-foreground"
      {...props}
    />
  ),
  li: (props: any) => <li className="leading-relaxed" {...props} />,
  // Enhanced horizontal rule
  hr: () => <hr className="my-8 border-t border-border" />,
  // Enhanced strong
  strong: (props: any) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  // Enhanced emphasis
  em: (props: any) => (
    <em className="italic text-muted-foreground" {...props} />
  ),
};

export function CustomMDX(props: any) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}
