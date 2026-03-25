# MDX Components Documentation

This document provides comprehensive usage examples for all available MDX components in the application.

## Table of Contents

1. [Alert](#alert)
2. [Accordion](#accordion)
3. [Badge](#badge)
4. [Card](#card)
5. [Callout](#callout)
6. [Code & CodeComparison](#code--codecomparison)
7. [ComparisonTable](#comparisontable)
8. [FeatureGrid](#featuregrid)
9. [FileTree](#filetree)
10. [ImageGrid](#imagegrid)
11. [Kbd](#kbd)
12. [Quote](#quote)
13. [Screenshot](#screenshot)
14. [Steps](#steps)
15. [Tabs](#tabs)
16. [Timeline](#timeline)
17. [VideoEmbed](#videoembed)

---

## Alert

Display important messages with different severity levels.

**Props:**

- `variant`: "info" | "success" | "warning" | "error" (default: "info")
- `title`: Optional title string
- `children`: Content to display

**Example:**

```mdx
<Alert variant="info" title="Information">
  This is an informational alert message.
</Alert>

<Alert variant="success">Your operation completed successfully!</Alert>

<Alert variant="warning" title="Warning">
  Please review this important information carefully.
</Alert>

<Alert variant="error" title="Error">
  Something went wrong. Please try again.
</Alert>
```

---

## Accordion

Create collapsible content sections.

**Props:**

- `items`: Array of `{ title: string, content: ReactNode }`

**Example:**

```mdx
<Accordion
  items={[
    {
      title: "What is React?",
      content: "React is a JavaScript library for building user interfaces.",
    },
    {
      title: "What is Next.js?",
      content:
        "Next.js is a React framework for building full-stack web applications.",
    },
    {
      title: "What is MDX?",
      content: "MDX allows you to use JSX in your markdown content.",
    },
  ]}
/>
```

---

## Badge

Small labels for categories, tags, or status indicators.

**Props:**

- `variant`: "default" | "primary" | "success" | "warning" | "danger" | "outline"
- `size`: "sm" | "md" | "lg" (default: "md")
- `children`: Badge content

**Example:**

```mdx
<Badge>Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success" size="sm">
  Success
</Badge>
<Badge variant="warning" size="lg">
  Warning
</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="outline">Outline</Badge>
```

---

## Card

Flexible card component for content grouping.

**Props:**

- `title`: Optional card title
- `icon`: Optional Lucide icon component
- `variant`: "default" | "primary" | "success" | "warning" | "danger"
- `href`: Optional link URL (makes card clickable)
- `children`: Card content

**Example:**

```mdx
import { Rocket, Database, Code } from "lucide-react";

<Card icon={Rocket} title="Quick Start" variant="primary">
  Get started with our platform in minutes. Follow our step-by-step guide.
</Card>

<Card icon={Database} title="Database Setup">
  Configure your database connection and migrations.
</Card>

<Card href="/docs/api">
  Click this card to navigate to the API documentation.
</Card>
```

---

## Callout

Highlight important information with custom styling.

**Props:**

- `type`: "note" | "warning" | "tip" | "info" | "danger" (default: "note")
- `children`: Callout content

**Example:**

```mdx
<Callout type="note">This is a helpful note to keep in mind.</Callout>

<Callout type="tip">💡 Pro tip: Use keyboard shortcuts to work faster!</Callout>

<Callout type="warning">⚠️ This action cannot be undone.</Callout>

<Callout type="danger">🚨 Critical: This will delete all your data!</Callout>
```

---

## Code & CodeComparison

Display syntax-highlighted code blocks or side-by-side comparisons.

### Regular Code Block

```typescript
// Automatically highlighted with language detection
const greeting = "Hello, World!";
console.log(greeting);
```

### CodeComparison

**Props:**

- `before`: Code before changes
- `after`: Code after changes
- `language`: Programming language (default: "typescript")
- `beforeLabel`: Label for before code (default: "Before")
- `afterLabel`: Label for after code (default: "After")

**Example:**

```mdx
<CodeComparison
  language="typescript"
  beforeLabel="Old Implementation"
  afterLabel="New Implementation"
  before={`function fetchData() {
  return fetch('/api/data')
    .then(res => res.json());
}`}
  after={`async function fetchData() {
  const res = await fetch('/api/data');
  return res.json();
}`}
/>
```

---

## ComparisonTable

Create feature comparison tables with highlighted columns.

**Props:**

- `columns`: Array of `{ name: string, highlight?: boolean }`
- `rows`: Array of `{ feature: string, values: (boolean | string)[] }`

**Example:**

```mdx
<ComparisonTable
  columns={[
    { name: "Free" },
    { name: "Pro", highlight: true },
    { name: "Enterprise" },
  ]}
  rows={[
    { feature: "Users", values: ["5", "50", "Unlimited"] },
    { feature: "Storage", values: ["10 GB", "100 GB", "1 TB"] },
    { feature: "API Access", values: [false, true, true] },
    { feature: "24/7 Support", values: [false, false, true] },
  ]}
/>
```

---

## FeatureGrid

Display features in a responsive grid layout.

**Props:**

- `features`: Array of `{ icon: LucideIcon, title: string, description: string }`

**Example:**

```mdx
import { Zap, Shield, Rocket, Globe } from "lucide-react";

<FeatureGrid
  features={[
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance for the best user experience.",
    },
    {
      icon: Shield,
      title: "Secure by Default",
      description: "Enterprise-grade security built into every layer.",
    },
    {
      icon: Rocket,
      title: "Easy to Deploy",
      description: "One-click deployment to your favorite platform.",
    },
    {
      icon: Globe,
      title: "Global CDN",
      description: "Content delivered fast from servers worldwide.",
    },
  ]}
/>
```

---

## FileTree

Display file and folder structures.

**Props:**

- `tree`: Array of `{ name: string, type: "file" | "folder", children?: FileTreeNode[] }`

**Example:**

```mdx
<FileTree
  tree={[
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "components",
          type: "folder",
          children: [
            { name: "Button.tsx", type: "file" },
            { name: "Card.tsx", type: "file" },
          ],
        },
        {
          name: "pages",
          type: "folder",
          children: [
            { name: "index.tsx", type: "file" },
            { name: "about.tsx", type: "file" },
          ],
        },
      ],
    },
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
  ]}
/>
```

---

## ImageGrid

Create responsive image galleries with lightbox.

**Props:**

- `images`: Array of `{ src: string, alt: string, caption?: string }`
- `columns`: 2 | 3 | 4 (default: 3)

**Example:**

```mdx
<ImageGrid
  columns={3}
  images={[
    {
      src: "/images/screenshot1.png",
      alt: "Dashboard view",
      caption: "Modern dashboard interface",
    },
    {
      src: "/images/screenshot2.png",
      alt: "Analytics page",
      caption: "Real-time analytics",
    },
    {
      src: "/images/screenshot3.png",
      alt: "Settings panel",
      caption: "Customizable settings",
    },
  ]}
/>
```

---

## Kbd

Display keyboard shortcuts with proper styling.

**Props:**

- `size`: "sm" | "md" | "lg" (default: "md")
- `children`: Keyboard shortcut (use + for combinations)

**Example:**

```mdx
Press <Kbd>Ctrl+C</Kbd> to copy and <Kbd>Ctrl+V</Kbd> to paste.

Use <Kbd size="lg">Cmd+Shift+P</Kbd> to open the command palette.

Quick save with <Kbd size="sm">Ctrl+S</Kbd>
```

---

## Quote

Enhanced blockquotes with author attribution.

**Props:**

- `author`: Optional author name
- `role`: Optional author role/title
- `avatar`: Optional avatar image URL
- `children`: Quote content

**Example:**

```mdx
<Quote
  author="Steve Jobs"
  role="Co-founder of Apple Inc."
  avatar="/avatars/steve-jobs.jpg"
>
  Design is not just what it looks like and feels like. Design is how it works.
</Quote>

<Quote author="Albert Einstein">
  Imagination is more important than knowledge.
</Quote>

<Quote>Anonymous quote without attribution.</Quote>
```

---

## Screenshot

Display screenshots with optional borders and captions.

**Props:**

- `src`: Image source URL
- `alt`: Alt text for accessibility
- `caption`: Optional caption text
- `bordered`: Show border (default: true)
- `shadow`: Show shadow (default: true)

**Example:**

```mdx
<Screenshot
  src="/images/dashboard.png"
  alt="Application dashboard"
  caption="The main dashboard showing key metrics and analytics"
/>

<Screenshot
  src="/images/ui-mockup.png"
  alt="UI mockup"
  bordered={false}
  shadow={false}
/>
```

---

## Steps

Create numbered step-by-step guides.

**Props:**

- `children`: React nodes representing each step

**Example:**

```mdx
<Steps>

### Install dependencies

Run the following command to install required packages:

\`\`\`bash
npm install next react react-dom
\`\`\`

### Create configuration file

Create a `next.config.js` file in your project root:

\`\`\`javascript
module.exports = {
reactStrictMode: true,
}
\`\`\`

### Start development server

Launch the development server:

\`\`\`bash
npm run dev
\`\`\`

</Steps>
```

---

## Tabs

Interactive tabbed content sections.

**Props:**

- `items`: Array of `{ label: string, content: ReactNode }`

**Example:**

```mdx
<Tabs
  items={[
    {
      label: "npm",
      content: <>Install using npm: \`\`\`bash npm install my-package \`\`\`</>,
    },
    {
      label: "yarn",
      content: <>Install using yarn: \`\`\`bash yarn add my-package \`\`\`</>,
    },
    {
      label: "pnpm",
      content: <>Install using pnpm: \`\`\`bash pnpm add my-package \`\`\`</>,
    },
  ]}
/>
```

---

## Timeline

Display events in a chronological timeline.

**Props:**

- `items`: Array of `{ date: string, title: string, description: ReactNode }`

**Example:**

```mdx
<Timeline
  items={[
    {
      date: "January 2024",
      title: "Project Launch",
      description:
        "Officially launched our platform to the public with core features.",
    },
    {
      date: "February 2024",
      title: "Version 2.0 Release",
      description:
        "Major update with improved performance and new integrations.",
    },
    {
      date: "March 2024",
      title: "Mobile App Launch",
      description: "Released iOS and Android apps for mobile access.",
    },
  ]}
/>
```

---

## VideoEmbed

Embed responsive videos from YouTube, Vimeo, or custom sources.

**Props:**

- `url`: Video URL (YouTube, Vimeo, or direct embed URL)
- `title`: Optional video title (default: "Video")
- `aspectRatio`: "16/9" | "4/3" | "1/1" (default: "16/9")

**Example:**

```mdx
{/* YouTube video */}

<VideoEmbed
  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  title="Introduction Tutorial"
/>

{/* Vimeo video */}

<VideoEmbed url="https://vimeo.com/123456789" aspectRatio="4/3" />

{/* Custom aspect ratio */}

<VideoEmbed
  url="https://www.youtube.com/watch?v=example"
  aspectRatio="1/1"
  title="Square video"
/>
```

---

## Combining Components

You can combine multiple components to create rich, interactive documentation:

```mdx
<Steps>

### Setup your project

<Alert variant="info" title="Prerequisites">
  Make sure you have Node.js 18+ installed on your system.
</Alert>

Install the required dependencies:

<Tabs
  items={[
    {
      label: "npm",
      content: <code>npm install</code>,
    },
    {
      label: "yarn",
      content: <code>yarn install</code>,
    },
  ]}
/>

### Configure environment

<Callout type="warning">
  Never commit your `.env` file to version control!
</Callout>

Create a `.env.local` file:

\`\`\`bash
DATABASE_URL=your_database_url
API_KEY=your_api_key
\`\`\`

### Deploy

<Card icon={Rocket} variant="primary" title="Ready to Deploy">
  Your application is ready! Use <Kbd>Ctrl+D</Kbd> to deploy.
</Card>

</Steps>
```

---

## Accessibility Features

All components are built with accessibility in mind:

- ✅ Proper ARIA roles and labels
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader compatibility
- ✅ Color contrast compliance

---

## Theme Integration

All components automatically adapt to your light/dark theme:

- 🌙 Dark mode support via CSS variables
- ☀️ Light mode with warm, professional colors
- 🎨 Consistent color palette across all components
- ✨ Smooth theme transitions

---

## Best Practices

1. **Use semantic components**: Choose the right component for your content type
2. **Keep it simple**: Don't over-nest components
3. **Provide alt text**: Always include alt text for images
4. **Test responsiveness**: Check how components look on different screen sizes
5. **Use consistent spacing**: Let the components' built-in spacing guide your layout

---

## Need Help?

If you encounter any issues or have questions about using these components, please refer to the main documentation or open an issue on GitHub.
