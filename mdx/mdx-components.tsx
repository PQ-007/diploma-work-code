import { MDXRemote } from "next-mdx-remote/rsc";
import { createHeading } from "./components/Heading";

import { CLink } from "./components/CustomLink";
import { Code } from "./components/Code";
import { Pre } from "./components/Pre";
import { Table } from "./components/Table";
import { Steps } from "./components/Steps";
import { Tabs } from "./components/Tabs";
import { Accordion } from "./components/Accordion";
import { Card } from "./components/Card";
import { Quote } from "./components/Quote";
import { ImageGrid } from "./components/ImageGrid";
import { VideoEmbed } from "./components/VideoEmbed";
import { Timeline } from "./components/Timeline";
import { Image } from "./components/Image";
import { FileTree } from "./components/FileTree";
import { Alert } from "./components/Alert";
import { FeatureGrid } from "./components/FeatureGrid";
import { ComparisonTable } from "./components/ComparisonTable";
import { Chart } from "./components/Chart";
import { DataTable } from "./components/DataTable";
import { ProTip } from "./components/ProTip";
import { cn } from "@/lib/utils";

export const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: Image,
  img: (props: any) => <Image inline {...props} />,
  a: ({ className, ...props }: any) => (
    <CLink
      className={cn(
        "font-medium text-primary underline underline-offset-4 decoration-primary/50 hover:decoration-primary",
        className,
      )}
      {...props}
    />
  ),
  code: Code,
  pre: Pre,
  Table,
  table: (props: any) => <Table {...props} />,
  thead: (props: any) => (
    <thead className="bg-muted/50 text-foreground" {...props} />
  ),
  tbody: (props: any) => <tbody className="bg-card" {...props} />,
  tr: (props: any) => (
    <tr
      className="border-t border-border/60 odd:bg-muted/20 even:bg-card hover:bg-muted/30 transition-colors"
      {...props}
    />
  ),
  th: (props: any) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-foreground bg-muted/60 border-b border-border/70"
      {...props}
    />
  ),
  td: (props: any) => (
    <td className="px-4 py-2.5 text-sm text-foreground align-top" {...props} />
  ),
  Steps,
  Tabs,
  Accordion,
  Card,
  Quote,
  ImageGrid,
  VideoEmbed,
  Timeline,
  FileTree,
  Alert,
  FeatureGrid,
  ComparisonTable,
  Chart,
  DataTable,
  ProTip,
  // Enhanced paragraph
  p: (props: any) => (
    <p className="mb-6 text-[15px] leading-7 text-foreground" {...props} />
  ),
  // Enhanced blockquote
  blockquote: (props: any) => (
    <blockquote
      className="px-2 pt-5 pb-0.5 mb-5 border-l-4 border-primary bg-primary/10 rounded-lg italic text-muted-foreground"
      {...props}
    />
  ),
  // Enhanced lists
  ul: (props: any) => (
    <ul
      className="my-6 ml-6 list-disc space-y-2.5 text-[15px] leading-7 text-foreground"
      {...props}
    />
  ),
  ol: (props: any) => (
    <ol
      className="my-6 ml-6 list-decimal space-y-2.5 text-[15px] leading-7 text-foreground"
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
