# Component Visual Style Guide

This document showcases the visual design and styling details for all MDX components.

## 🎨 Color System

All components use your theme's color palette:

### Dark Mode

- **Background**: `#0a0a0f` (Deep blue-black)
- **Foreground**: `#f8fafc` (Soft white)
- **Primary**: `#1e40af` (Rich blue)
- **Accent**: `#1d4ed8` (Bright blue)
- **Muted**: `#27272a` (Dark gray)
- **Border**: `#27272a` (Subtle border)

### Light Mode

- **Background**: `#faf9f7` (Warm off-white)
- **Foreground**: `#2c2926` (Deep brown-gray)
- **Primary**: `#2563eb` (Vibrant blue)
- **Accent**: `#719be2` (Soft blue)
- **Muted**: `#f7f5f3` (Warm gray)
- **Border**: `#e7e5e4` (Gentle border)

---

## 📐 Spacing & Layout

### Border Radius

- **Default**: `12px` (rounded-xl)
- **Small**: `8px` (rounded-lg)
- **Medium**: `10px` (rounded-xl)
- **Large**: `16px` (rounded-2xl)

### Shadows

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1) --shadow-md: 0 10px 15px
  rgba(0, 0, 0, 0.1) --shadow-lg: 0 20px 25px rgba(0, 0, 0, 0.1);
```

### Typography

- **Font Family**: Inter (sans-serif)
- **Mono Font**: JetBrains Mono
- **Base Size**: 14px (text-sm)
- **Line Height**: 1.6-1.7 (leading-relaxed)

---

## 🎭 Component Styles

### Alert Variants

#### Info (Blue)

```
Background: bg-blue-500/10
Border: border-blue-500/30
Icon: Info circle
Text: Blue tones
```

#### Success (Green)

```
Background: bg-green-500/10
Border: border-green-500/30
Icon: Check circle
Text: Green tones
```

#### Warning (Yellow)

```
Background: bg-yellow-500/10
Border: border-yellow-500/30
Icon: Alert triangle
Text: Yellow/orange tones
```

#### Error (Red)

```
Background: bg-red-500/10
Border: border-red-500/30
Icon: X circle
Text: Red tones
```

---

### Badge Variants

| Variant | Background      | Text               | Border          |
| ------- | --------------- | ------------------ | --------------- |
| Default | `muted`         | `muted-foreground` | `transparent`   |
| Primary | `primary/10`    | `primary`          | `primary/20`    |
| Success | `green-500/10`  | `green-600`        | `green-500/20`  |
| Warning | `yellow-500/10` | `yellow-700`       | `yellow-500/20` |
| Danger  | `red-500/10`    | `red-600`          | `red-500/20`    |
| Outline | `transparent`   | `foreground`       | `border`        |

---

### Card Variants

#### Default

```
Border: border-border
Background: bg-card
Hover: border-muted-foreground
Shadow: shadow-md → shadow-lg on hover
Transform: translateY(-2px) on hover
```

#### Primary

```
Border: border-primary/30
Background: bg-primary/5
Hover: border-primary
Glow effect on hover
```

#### Success

```
Border: border-green-500/30
Background: bg-green-500/5
Hover: border-green-500
```

---

### Interactive States

#### Hover Effects

```css
/* Lift */
transform: translateY(-2px);
transition: transform 0.2s ease;

/* Shadow */
shadow-md → shadow-lg

/* Border */
border-color: primary

/* Scale */
transform: scale(1.05)
```

#### Focus States

```css
outline: 2px solid var(--ring);
outline-offset: 2px;
```

#### Active States

```css
transform: scale(0.98);
opacity: 0.9;
```

---

## 🎬 Animations

### Duration Standards

- **Fast**: 150ms (button clicks, toggles)
- **Normal**: 200-300ms (cards, hover states)
- **Slow**: 500ms (page transitions, complex animations)

### Easing Functions

- **ease-out**: Most interactions
- **ease-in-out**: Smooth bidirectional
- **cubic-bezier(0.4, 0, 0.2, 1)**: Custom smooth

### Available Animations

```css
@keyframes fadeIn
@keyframes slideInUp
@keyframes slideInLeft
@keyframes scaleIn
@keyframes float
@keyframes glow;
```

---

## 🖼️ Component Dimensions

### Steps

- Circle size: `w-8 h-8` (32px)
- Connector line: `w-0.5 h-6` (2px × 24px)
- Gap between items: `space-y-6` (1.5rem)

### Timeline

- Dot size: `w-8 h-8` (32px)
- Line width: `w-0.5` (2px)
- Gap between items: `space-y-8` (2rem)

### Badges

- Small: `text-xs px-1.5 py-0.5`
- Medium: `text-sm px-2 py-1`
- Large: `text-base px-3 py-1.5`

### Kbd (Keyboard)

- Small: `text-xs px-1.5 py-0.5 min-w-[20px]`
- Medium: `text-sm px-2 py-1 min-w-[24px]`
- Large: `text-base px-3 py-1.5 min-w-[32px]`

---

## 🎯 Spacing Patterns

### Component Margins

```css
my-6  /* 1.5rem top/bottom - Small components */
my-8  /* 2rem top/bottom - Standard components */
my-10 /* 2.5rem top/bottom - Large components */
```

### Internal Padding

```css
p-4  /* 1rem - Compact */
p-5  /* 1.25rem - Standard */
p-6  /* 1.5rem - Comfortable */
```

### Gap Between Elements

```css
gap-2  /* 0.5rem - Tight */
gap-3  /* 0.75rem - Normal */
gap-4  /* 1rem - Comfortable */
gap-6  /* 1.5rem - Spacious */
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first */
default: < 640px

sm: >= 640px   /* Small tablets */
md: >= 768px   /* Tablets */
lg: >= 1024px  /* Laptops */
xl: >= 1280px  /* Desktops */
```

### Grid Patterns

```css
/* FeatureGrid */
grid: 1 column (mobile)
md:grid-cols-2
lg:grid-cols-3

/* ImageGrid (3 columns) */
grid: 1 column (mobile)
md:grid-cols-2
lg:grid-cols-3
```

---

## 🔍 Accessibility Features

### Color Contrast

- All text meets WCAG AA standards (4.5:1)
- Interactive elements clearly distinguishable
- Focus indicators visible (2px outline)

### Keyboard Navigation

- All interactive components keyboard accessible
- Logical tab order maintained
- Visual focus indicators

### ARIA Labels

```html
<!-- Tabs -->
role="tablist" role="tab" aria-selected="true/false"

<!-- Accordion -->
aria-expanded="true/false"

<!-- Alert -->
role="alert"
```

### Screen Reader Support

- Proper semantic HTML elements
- Descriptive alt text required
- Status announcements for dynamic content

---

## 💅 Design Tokens

### Font Weights

```css
font-normal     /* 400 - Body text */
font-medium     /* 500 - Subheadings */
font-semibold   /* 600 - Headings */
font-bold       /* 700 - Emphasis */
```

### Letter Spacing

```css
tracking-tight    /* Headings */
tracking-normal   /* Body */
tracking-wide     /* Labels, badges */
```

### Opacity Levels

```css
/10  /* 10% - Subtle backgrounds */
/20  /* 20% - Hover states */
/30  /* 30% - Borders */
/50  /* 50% - Medium emphasis */
```

---

## 🎨 Best Practices

### Color Usage

1. ✅ Use semantic colors (primary, success, warning, error)
2. ✅ Maintain consistent opacity levels
3. ✅ Test in both light and dark modes
4. ❌ Don't use hardcoded colors
5. ❌ Avoid color-only information (use icons too)

### Typography

1. ✅ Use appropriate font sizes
2. ✅ Maintain proper line heights (1.6-1.7)
3. ✅ Keep heading hierarchy logical
4. ❌ Don't mix too many font sizes
5. ❌ Avoid all-caps for long text

### Spacing

1. ✅ Use consistent spacing scale
2. ✅ Add breathing room with margins
3. ✅ Align elements properly
4. ❌ Don't use arbitrary values
5. ❌ Avoid cramped layouts

### Interactions

1. ✅ Add hover states to clickable elements
2. ✅ Show loading/disabled states
3. ✅ Provide visual feedback
4. ❌ Don't use subtle interactions
5. ❌ Avoid instant state changes (use transitions)

---

## 🔧 Customization Guide

### Changing Colors

Edit `globals.css`:

```css
:root {
  --primary: #1e40af; /* Change to your brand color */
  --accent: #1d4ed8; /* Complementary color */
}
```

### Adjusting Spacing

```typescript
// In component props
<Card className="my-12 p-8">  {/* Override defaults */}
```

### Custom Variants

```typescript
// Extend component props
<Badge variant="custom" className="bg-purple-500/10 text-purple-600">
```

---

## 📊 Performance Considerations

### Bundle Size

- Components are tree-shakeable
- Use only what you need
- Lazy load when possible

### Runtime Performance

- Minimal re-renders with React.memo
- Efficient event handlers
- Optimized animations (transform/opacity)

### Loading Strategy

```typescript
// Lazy load heavy components
const ImageGrid = lazy(() => import("@/components/ImageGrid"));
const VideoEmbed = lazy(() => import("@/components/VideoEmbed"));
```

---

## 🎓 Design Philosophy

1. **Simplicity First** - Clean, minimal interfaces
2. **Consistency** - Unified design language
3. **Accessibility** - Inclusive by default
4. **Performance** - Fast and responsive
5. **Flexibility** - Easy to customize
6. **Quality** - Production-ready code

---

This style guide ensures all components maintain visual consistency and professional quality across your application.
