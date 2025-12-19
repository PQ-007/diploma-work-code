import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { highlight } from 'sugar-high';
import React from 'react';

// Enhanced Table with better styling and accessibility
function Table({ data }: { data: { headers: string[]; rows: (string | number)[][] } }) {
  const headers = data.headers.map((header, index) => (
    <th key={index} className="px-4 py-3 text-left text-sm font-medium text-foreground bg-muted/50">
      {header}
    </th>
  ));

  const rows = data.rows.map((row, index) => (
    <tr key={index} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
      {row.map((cell, cellIndex) => (
        <td key={cellIndex} className="px-4 py-3 text-sm text-muted-foreground">
          {cell}
        </td>
      ))}
    </tr>
  ));

  return (
    <div className="my-8 overflow-x-auto rounded-lg border border-border/50 shadow-sm">
      <table className="w-full min-w-full divide-y divide-border/50">
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody className="divide-y divide-border/30">{rows}</tbody>
      </table>
    </div>
  );
}

// Improved CustomLink with better external link indicators
function CustomLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children, ...rest } = props;

  if (!href) return <a {...rest}>{children}</a>;

  if (href.startsWith('/')) {
    return (
      <Link href={href} {...rest} className="text-primary hover:underline underline-offset-4">
        {children}
      </Link>
    );
  }

  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        {...rest}
        className="text-primary hover:underline underline-offset-4 transition-colors"
      />
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
      className="inline-flex items-center gap-1 text-primary hover:underline underline-offset-4 transition-colors"
    >
      {children}
      <span aria-hidden="true" className="text-xs">↗</span>
    </a>
  );
}

// Enhanced image with responsive handling and better classes
function RoundedImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { alt = '', src, width, height, ...rest } = props;
  
  if (!src || typeof src !== 'string') {
    return <img alt={alt} src="" {...rest} className="rounded-lg border border-border/50 shadow-md my-8 w-full object-cover" />;
  }

  const resolvedWidth = width || 800;
  const resolvedHeight = height || 600;

  return (
    <Image
      alt={alt}
      src={src}
      width={typeof resolvedWidth === 'number' ? resolvedWidth : Number(resolvedWidth)}
      height={typeof resolvedHeight === 'number' ? resolvedHeight : Number(resolvedHeight)}
      className="rounded-lg border border-border/50 shadow-md my-8 w-full object-cover"
    />
  );
}

// Improved inline code with Sugar High highlighting
function Code({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const codeString = React.useMemo(() => {
    return typeof children === 'string' ? children : String(children);
  }, [children]);

  const codeHTML = highlight(codeString);

  return (
    <code
      className={`px-1.5 py-0.5 rounded-md bg-muted/70 text-sm font-medium ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      {...props}
    />
  );
}

// Block-level pre with syntax highlighting and copy button
function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = React.useState(false);
  const codeRef = React.useRef<HTMLElement>(null);

  const handleCopy = async () => {
    if (codeRef.current?.innerText) {
      await navigator.clipboard.writeText(codeRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <pre
      className="my-8 overflow-x-auto rounded-xl border border-border/50 bg-muted/30 p-6 relative group"
      {...props}
    >
      <button
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border border-border/50 rounded-md p-2 hover:bg-muted"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      {children}
    </pre>
  );
}

// Improved slugify with better handling of special characters
function slugify(str: React.ReactNode): string {
  return String(str)
    .toLowerCase()
    .trim()
    .normalize('NFD') // Handle accented characters
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Enhanced heading with anchor link and hover effect
function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    const slug = slugify(children);

    return React.createElement(
      `h${level}`,
      {
        id: slug,
        className: `group flex items-center scroll-mt-24 font-bold tracking-tight mt-12 mb-4
          ${level === 1 ? 'text-4xl' : level === 2 ? 'text-3xl border-t border-border/50 pt-8' : 'text-2xl'}`,
      },
      [
        children,
        React.createElement(
          'a',
          {
            href: `#${slug}`,
            key: `link-${slug}`,
            className: 'anchor ml-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary',
            'aria-hidden': 'true',
          },
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1 .195 1.414.586l8 8a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-8-8A2 2 0 017 10V3z" />
          </svg>
        ),
      ]
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}

// Callout/Note component (optional addition)
function Callout({ children, type = 'note' }: { children: React.ReactNode; type?: 'note' | 'warning' | 'tip' }) {
  const icons = {
    note: 'ℹ️',
    warning: '⚠️',
    tip: '💡',
  };

  const colors = {
    note: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    tip: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
  };

  return (
    <div className={`my-8 rounded-xl border-l-4 p-6 ${colors[type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="prose prose-sm max-w-none">{children}</div>
      </div>
    </div>
  );
}

// Final components object with improvements
const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  pre: Pre,
  Table,
  Callout, // Optional: expose for use in MDX as <Callout type="tip">...</Callout>
};

export function CustomMDX(props: any) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}