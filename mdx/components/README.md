# MDX Components

Production-quality MDX components for modern web applications, designed to seamlessly integrate with your theme and design system.

## 🎨 Design Principles

- **Theme-Aware**: Automatically adapts to light/dark modes
- **Accessible**: WCAG compliant with proper ARIA labels
- **Responsive**: Mobile-first design that works on all devices
- **Performance**: Optimized for fast loading and smooth interactions
- **Type-Safe**: Full TypeScript support

## 📦 Available Components

### Interactive Components

- **Steps** - Numbered step-by-step guides
- **Tabs** - Tabbed content sections
- **Accordion** - Collapsible content

### Content Display

- **Card** - Flexible content containers
- **Alert** - Contextual alerts and notifications
- **Quote** - Enhanced blockquotes with attribution
- **Image** - Images with captions and click-to-zoom preview

### Data Presentation

- **Table** - Styled data tables
- **ComparisonTable** - Feature comparison tables
- **Timeline** - Chronological event display
- **FileTree** - File/folder structure visualization

### Media

- **ImageGrid** - Responsive image galleries
- **VideoEmbed** - Embedded video player

### Code

- **Code** - Syntax-highlighted code blocks

### UI Elements

- **FeatureGrid** - Feature showcase grid

## 🚀 Quick Start

```mdx
import { Alert, Card, Steps } from "@/mdx/components";

<Alert variant="info" title="Getting Started">
  Welcome to our component library!
</Alert>

<Card icon={Rocket} title="Quick Setup">
  Get started in just a few steps.
</Card>

<Steps>
  ### Step 1
  Install the dependencies

### Step 2

Import the components

### Step 3

Start building!

</Steps>
```

## 📚 Documentation

- **[Component Guide](./MDX_COMPONENTS_GUIDE.md)** - Detailed usage examples for all components
- **[Demo](./DEMO.mdx)** - Live examples of all components in action

## 🎯 Features

✅ Zero configuration - works out of the box
✅ Fully typed with TypeScript
✅ Accessible by default
✅ Smooth animations and transitions
✅ Dark mode support
✅ Mobile responsive
✅ Customizable through props

## 🛠️ Customization

All components use your theme's CSS variables defined in `globals.css`:

```css
--primary
--secondary
--muted
--accent
--border
--foreground
--background
```

## 💡 Best Practices

1. **Semantic HTML** - Components use appropriate semantic elements
2. **Alt Text** - Always provide alt text for images
3. **Heading Hierarchy** - Maintain proper heading levels
4. **Color Contrast** - Theme colors ensure WCAG AA compliance
5. **Keyboard Navigation** - All interactive components are keyboard accessible

## 🤝 Contributing

When adding new components:

1. Follow existing naming conventions
2. Use theme CSS variables for colors
3. Include TypeScript types
4. Add hover states and transitions
5. Ensure keyboard accessibility
6. Update documentation

## 📝 License

Part of the Future Hub project.
