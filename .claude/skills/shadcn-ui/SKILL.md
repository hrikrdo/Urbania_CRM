---
name: shadcn-ui
description: "Build UI with shadcn/ui components - a collection of reusable, customizable React components built on Radix UI and Tailwind CSS. Use when: (1) Creating new UI components, (2) Building forms, dialogs, menus, (3) Implementing design systems, (4) Adding accessible components, (5) Working with React + Tailwind projects. Triggers: 'shadcn', 'ui components', 'button component', 'form component', 'dialog', 'modal', 'dropdown', 'tailwind components'."
---

# shadcn/ui Components

Build beautiful, accessible UI with copy-paste components.

## Setup

### Initialize in Project

```bash
npx shadcn@latest init
```

Select options:
- Style: New York (recommended) or Default
- Base color: Zinc, Slate, Stone, Gray, or Neutral
- CSS variables: Yes (recommended)

### Add Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card dialog form input
npx shadcn@latest add --all  # Add all components
```

## Core Utilities

### cn() - Class Merger

Always use `cn()` from `@/lib/utils` to merge Tailwind classes:

```tsx
import { cn } from "@/lib/utils"

<div className={cn("base-classes", conditional && "conditional-class", className)} />
```

### cva - Class Variance Authority

For components with variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "base-classes-always-applied",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-white",
        outline: "border bg-background",
        ghost: "hover:bg-accent",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Component Patterns

### Basic Component Structure

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function ComponentName({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="component-name"
      className={cn("base-tailwind-classes", className)}
      {...props}
    />
  )
}

export { ComponentName }
```

### With Variants

```tsx
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
}
```

### Compound Components (Card Example)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

## Common Components

See [references/components.md](references/components.md) for full list.

**Layout**: Card, Separator, ScrollArea, Resizable, AspectRatio
**Forms**: Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form
**Feedback**: Alert, AlertDialog, Dialog, Drawer, Sheet, Sonner (toast)
**Navigation**: Tabs, NavigationMenu, Menubar, Breadcrumb, Pagination
**Data Display**: Table, Avatar, Badge, Calendar, Carousel, Chart
**Overlay**: Popover, Tooltip, HoverCard, ContextMenu, DropdownMenu, Command

## Styling Conventions

### Color Tokens

```
bg-background, text-foreground        # Main bg/text
bg-card, text-card-foreground         # Card surfaces
bg-primary, text-primary-foreground   # Primary actions
bg-secondary, text-secondary-foreground
bg-muted, text-muted-foreground       # Subdued content
bg-accent, text-accent-foreground     # Highlights
bg-destructive                        # Danger/delete
border, input, ring                   # Borders and focus
```

### Common Utilities

```
rounded-md, rounded-lg, rounded-xl    # Border radius
shadow-sm, shadow-xs                  # Shadows
transition-all, transition-colors     # Animations
disabled:pointer-events-none disabled:opacity-50
focus-visible:ring-2 focus-visible:ring-ring
```

## Form Integration

Use with react-hook-form and zod:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
})

<Form {...form}>
  <FormField
    control={form.control}
    name="fieldName"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

## Best Practices

1. **Use semantic data-slot attributes** - Components use `data-slot="name"` for styling hooks
2. **Preserve className prop** - Always spread className with cn() for customization
3. **Use asChild for composition** - Render as different element with Slot from @radix-ui/react-slot
4. **Keep components accessible** - Radix primitives handle ARIA automatically
5. **Customize at component level** - Copy component to `components/ui/` and modify directly

## Blocks (Pre-built Templates)

Blocks are full-page templates. Install with `npx shadcn@latest add [block-name]`.

See [references/blocks.md](references/blocks.md) for complete list.

### Dashboard Blocks
```bash
npx shadcn@latest add dashboard-01  # Sidebar + charts + data table
```

Includes: `AppSidebar`, `SiteHeader`, `ChartAreaInteractive`, `DataTable`, `SectionCards`

### Sidebar Blocks (16 variants)
```bash
npx shadcn@latest add sidebar-01    # Simple with sections
npx shadcn@latest add sidebar-07    # Collapses to icons (recommended)
npx shadcn@latest add sidebar-12    # With calendar
npx shadcn@latest add sidebar-15    # Left and right sidebars
```

### Login Blocks (5 variants)
```bash
npx shadcn@latest add login-02      # Two columns with image
npx shadcn@latest add login-04      # Form + image combined
```

### Recommended for CRM/Dashboard Apps
```bash
# Base setup
npx shadcn@latest add dashboard-01
npx shadcn@latest add sidebar-07
npx shadcn@latest add login-02

# Additional useful components
npx shadcn@latest add chart
npx shadcn@latest add calendar
npx shadcn@latest add command        # Cmd+K search
npx shadcn@latest add sonner         # Toast notifications
```
