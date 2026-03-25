import { MDXRemote } from "next-mdx-remote/rsc";
import { createHeading } from "./components/Heading";
import { RImage } from "./components/Image";
import { CLink } from "./components/CustomLink";
import { Code } from "./components/Code";
import { Pre } from "./components/Pre";
import { Table } from "./components/Table";
import { Callout } from "./components/Callout";
import { Steps } from "./components/Steps";
import { Tabs } from "./components/Tabs";
import { Accordion } from "./components/Accordion";
import { Card } from "./components/Card";
import { Badge } from "./components/Badge";
import { Quote } from "./components/Quote";
import { CodeComparison } from "./components/CodeComparison";
import { ImageGrid } from "./components/ImageGrid";
import { VideoEmbed } from "./components/VideoEmbed";
import { Timeline } from "./components/Timeline";
import { Kbd } from "./components/Kbd";
import { Screenshot } from "./components/Screenshot";
import { FileTree } from "./components/FileTree";
import { Alert } from "./components/Alert";
import { FeatureGrid } from "./components/FeatureGrid";
import { ComparisonTable } from "./components/ComparisonTable";

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
  Callout,
  Steps,
  Tabs,
  Accordion,
  Card,
  Badge,
  Quote,
  CodeComparison,
  ImageGrid,
  VideoEmbed,
  Timeline,
  Kbd,
  Screenshot,
  FileTree,
  Alert,
  FeatureGrid,
  ComparisonTable,
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
