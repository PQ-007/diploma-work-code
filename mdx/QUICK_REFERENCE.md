# MDX Components Quick Reference

Fast lookup for all component syntax. Copy and paste these examples directly into your MDX files.

---

## 🚨 Alerts

```mdx
<Alert variant="info" title="Title">
  Content
</Alert>
<Alert variant="success">Success message</Alert>
<Alert variant="warning" title="Warning">
  Warning message
</Alert>
<Alert variant="error">Error message</Alert>
```

---

## 📋 Accordion

```mdx
<Accordion
  items={[
    { title: "Question 1", content: "Answer 1" },
    { title: "Question 2", content: "Answer 2" },
  ]}
/>
```

---

## 🏷️ Badge

```mdx
<Badge>Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success" size="sm">
  Small Success
</Badge>
<Badge variant="warning" size="lg">
  Large Warning
</Badge>
```

---

## 🎴 Card

```mdx
import { Rocket } from "lucide-react";

<Card>Simple card</Card>
<Card title="With Title">Content here</Card>
<Card icon={Rocket} title="With Icon" variant="primary">
  Content
</Card>
<Card href="/link">Clickable card</Card>
```

---

## 💬 Callout

```mdx
<Callout type="note">Note content</Callout>
<Callout type="tip">Tip content</Callout>
<Callout type="warning">Warning content</Callout>
<Callout type="danger">Danger content</Callout>
```

---

## 💻 Code

````mdx
```typescript
const code = "automatically highlighted";
```
````

---

## ⚖️ CodeComparison

```mdx
<CodeComparison
  language="typescript"
  before="const old = 'code';"
  after="const new = 'code';"
/>
```

---

## 📊 ComparisonTable

```mdx
<ComparisonTable
  columns={[
    { name: "Free" },
    { name: "Pro", highlight: true },
    { name: "Enterprise" },
  ]}
  rows={[
    { feature: "Users", values: ["5", "50", "Unlimited"] },
    { feature: "Support", values: [false, true, true] },
  ]}
/>
```

---

## 🎯 FeatureGrid

```mdx
import { Zap, Shield, Rocket } from "lucide-react";

<FeatureGrid
  features={[
    {
      icon: Zap,
      title: "Fast",
      description: "Lightning fast performance",
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Enterprise security",
    },
    {
      icon: Rocket,
      title: "Easy",
      description: "Simple to use",
    },
  ]}
/>
```

---

## 📁 FileTree

```mdx
<FileTree
  tree={[
    {
      name: "src",
      type: "folder",
      children: [
        { name: "index.ts", type: "file" },
        { name: "utils.ts", type: "file" },
      ],
    },
    { name: "package.json", type: "file" },
  ]}
/>
```

---

## 🖼️ ImageGrid

```mdx
<ImageGrid
  columns={3}
  images={[
    { src: "/img1.jpg", alt: "Image 1", caption: "Caption 1" },
    { src: "/img2.jpg", alt: "Image 2", caption: "Caption 2" },
    { src: "/img3.jpg", alt: "Image 3" },
  ]}
/>
```

---

## ⌨️ Kbd

```mdx
Press <Kbd>Ctrl+C</Kbd> to copy
Quick action: <Kbd size="lg">Cmd+Shift+P</Kbd>
Small: <Kbd size="sm">Esc</Kbd>
```

---

## 💭 Quote

```mdx
<Quote>Simple quote</Quote>

<Quote author="John Doe">Quote with author</Quote>

<Quote author="Jane Smith" role="CEO" avatar="/avatar.jpg">
  Full attribution quote
</Quote>
```

---

## 📸 Screenshot

```mdx
<Screenshot
  src="/screenshot.png"
  alt="Screenshot description"
  caption="Optional caption"
/>

<Screenshot src="/image.png" alt="No borders" bordered={false} shadow={false} />
```

---

## 🪜 Steps

```mdx
<Steps>

### Step 1

First step content

### Step 2

Second step content

### Step 3

Final step content

</Steps>
```

---

## 📑 Tabs

```mdx
<Tabs
  items={[
    {
      label: "Tab 1",
      content: <>Content for tab 1</>,
    },
    {
      label: "Tab 2",
      content: <>Content for tab 2</>,
    },
  ]}
/>
```

---

## 📅 Timeline

```mdx
<Timeline
  items={[
    {
      date: "Jan 2024",
      title: "Event Title",
      description: "Event description",
    },
    {
      date: "Feb 2024",
      title: "Another Event",
      description: "More details here",
    },
  ]}
/>
```

---

## 🎥 VideoEmbed

```mdx
<VideoEmbed url="https://youtube.com/watch?v=..." />

<VideoEmbed url="https://vimeo.com/..." title="Video title" aspectRatio="4/3" />
```

---

## 🎨 Variant Quick Reference

### Alert Variants

- `info` (blue)
- `success` (green)
- `warning` (yellow)
- `error` (red)

### Badge Variants

- `default` (gray)
- `primary` (blue)
- `success` (green)
- `warning` (yellow)
- `danger` (red)
- `outline` (bordered)

### Card Variants

- `default` (neutral)
- `primary` (blue)
- `success` (green)
- `warning` (yellow)
- `danger` (red)

### Callout Types

- `note` (blue)
- `tip` (green)
- `warning` (yellow)
- `info` (blue)
- `danger` (red)

---

## 📏 Size Reference

### Badge Sizes

- `sm` - Small (text-xs)
- `md` - Medium (text-sm) [default]
- `lg` - Large (text-base)

### Kbd Sizes

- `sm` - Small (20px min)
- `md` - Medium (24px min) [default]
- `lg` - Large (32px min)

### Grid Columns

- ImageGrid: `2`, `3` [default], `4`

---

## 🎬 Video Aspect Ratios

- `16/9` - Widescreen [default]
- `4/3` - Standard
- `1/1` - Square

---

## 💡 Common Patterns

### Feature Section

```mdx
import { Zap, Shield, Code } from "lucide-react";

## Features

<FeatureGrid
  features={[
    { icon: Zap, title: "Fast", description: "..." },
    { icon: Shield, title: "Secure", description: "..." },
    { icon: Code, title: "Simple", description: "..." },
  ]}
/>
```

### Tutorial with Steps

```mdx
## Getting Started

<Alert variant="info" title="Prerequisites">
  Node.js 18+ required
</Alert>

<Steps>
### Install
\`\`\`bash
npm install package
\`\`\`

### Configure

Create your config file

### Run

\`\`\`bash
npm start
\`\`\`

</Steps>
```

### Comparison Section

```mdx
## Plans

<ComparisonTable
  columns={[{ name: "Free" }, { name: "Pro", highlight: true }]}
  rows={[
    { feature: "Feature 1", values: [true, true] },
    { feature: "Feature 2", values: [false, true] },
  ]}
/>
```

### FAQ Section

```mdx
## Frequently Asked Questions

<Accordion
  items={[
    { title: "How do I...?", content: "You can..." },
    { title: "What is...?", content: "It is..." },
  ]}
/>
```

---

## 🔗 Import Statement

```typescript
import {
  Alert,
  Accordion,
  Badge,
  Card,
  Callout,
  CodeComparison,
  ComparisonTable,
  FeatureGrid,
  FileTree,
  ImageGrid,
  Kbd,
  Quote,
  Screenshot,
  Steps,
  Tabs,
  Timeline,
  VideoEmbed,
} from "@/mdx/components";
```

---

## 📦 NPM Packages Required

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "next": "^14.0.0",
    "lucide-react": "^0.300.0",
    "next-mdx-remote": "^4.0.0",
    "react-syntax-highlighter": "^15.0.0"
  }
}
```

---

## ⚡ Quick Tips

1. **Icons**: Import from `lucide-react`
2. **Styling**: All components use your theme colors automatically
3. **Mobile**: All components are responsive by default
4. **A11y**: ARIA labels and keyboard nav built-in
5. **Dark Mode**: Automatic theme switching

---

## 🐛 Common Issues

### Component not rendering?

```mdx
✅ Import the component first
❌ Using without import
```

### Styling looks off?

```mdx
✅ Check your globals.css is imported
✅ Verify CSS variables are defined
```

### Icons not showing?

```mdx
✅ Import from lucide-react
✅ Pass icon component (not string)
import { Rocket } from "lucide-react";

<Card icon={Rocket} /> // Correct
```

---

Need more details? See the [full documentation](./MDX_COMPONENTS_GUIDE.md).
