# shadcn/ui Components Reference

## Table of Contents
- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Feedback Components](#feedback-components)
- [Navigation Components](#navigation-components)
- [Data Display Components](#data-display-components)
- [Overlay Components](#overlay-components)

---

## Layout Components

### Card
Container with header, content, footer sections.
```bash
npx shadcn@latest add card
```
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/components/ui/card"
```

### Separator
Visual divider between content.
```bash
npx shadcn@latest add separator
```

### ScrollArea
Custom scrollable container with styled scrollbars.
```bash
npx shadcn@latest add scroll-area
```

### Resizable
Draggable resize panels.
```bash
npx shadcn@latest add resizable
```

### AspectRatio
Maintain aspect ratio for media.
```bash
npx shadcn@latest add aspect-ratio
```

### Collapsible
Expandable/collapsible content section.
```bash
npx shadcn@latest add collapsible
```

### Sidebar
Application sidebar with navigation.
```bash
npx shadcn@latest add sidebar
```

---

## Form Components

### Button
Primary interactive element.
```bash
npx shadcn@latest add button
```
Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`, `xs`, `icon-xs`

### Input
Text input field.
```bash
npx shadcn@latest add input
```

### InputOTP
One-time password input.
```bash
npx shadcn@latest add input-otp
```

### Textarea
Multi-line text input.
```bash
npx shadcn@latest add textarea
```

### Select
Dropdown selection.
```bash
npx shadcn@latest add select
```
```tsx
<Select>
  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### NativeSelect
Native HTML select element styled.
```bash
npx shadcn@latest add native-select
```

### Checkbox
Boolean toggle with label.
```bash
npx shadcn@latest add checkbox
```

### RadioGroup
Single selection from options.
```bash
npx shadcn@latest add radio-group
```

### Switch
Toggle switch.
```bash
npx shadcn@latest add switch
```

### Slider
Range input slider.
```bash
npx shadcn@latest add slider
```

### Form
Form wrapper with validation (react-hook-form + zod).
```bash
npx shadcn@latest add form
```
Components: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`

### Label
Form label element.
```bash
npx shadcn@latest add label
```

### Field
Form field wrapper.
```bash
npx shadcn@latest add field
```

### Combobox
Searchable select with autocomplete.
```bash
npx shadcn@latest add combobox
```

### InputGroup
Group input with addons.
```bash
npx shadcn@latest add input-group
```

### ButtonGroup
Group related buttons.
```bash
npx shadcn@latest add button-group
```

---

## Feedback Components

### Alert
Static message display.
```bash
npx shadcn@latest add alert
```
```tsx
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

### AlertDialog
Confirmation dialog requiring action.
```bash
npx shadcn@latest add alert-dialog
```

### Dialog
Modal dialog.
```bash
npx shadcn@latest add dialog
```
```tsx
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter><Button>Save</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

### Drawer
Slide-in panel from edge.
```bash
npx shadcn@latest add drawer
```

### Sheet
Side panel overlay.
```bash
npx shadcn@latest add sheet
```

### Sonner
Toast notifications.
```bash
npx shadcn@latest add sonner
```
```tsx
import { toast } from "sonner"
toast("Event created")
toast.success("Success!")
toast.error("Error occurred")
```

### Progress
Progress indicator bar.
```bash
npx shadcn@latest add progress
```

### Skeleton
Loading placeholder.
```bash
npx shadcn@latest add skeleton
```

### Spinner
Loading spinner animation.
```bash
npx shadcn@latest add spinner
```

### Empty
Empty state placeholder.
```bash
npx shadcn@latest add empty
```

---

## Navigation Components

### Tabs
Tabbed content panels.
```bash
npx shadcn@latest add tabs
```
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### NavigationMenu
Main navigation with dropdowns.
```bash
npx shadcn@latest add navigation-menu
```

### Menubar
Horizontal menu bar.
```bash
npx shadcn@latest add menubar
```

### Breadcrumb
Navigation breadcrumb trail.
```bash
npx shadcn@latest add breadcrumb
```

### Pagination
Page navigation controls.
```bash
npx shadcn@latest add pagination
```

---

## Data Display Components

### Table
Data table with header, body, rows.
```bash
npx shadcn@latest add table
```
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Avatar
User avatar image with fallback.
```bash
npx shadcn@latest add avatar
```

### Badge
Status indicator label.
```bash
npx shadcn@latest add badge
```
Variants: `default`, `secondary`, `destructive`, `outline`

### Calendar
Date picker calendar.
```bash
npx shadcn@latest add calendar
```

### Carousel
Scrollable content carousel.
```bash
npx shadcn@latest add carousel
```

### Chart
Data visualization (uses Recharts).
```bash
npx shadcn@latest add chart
```

### Kbd
Keyboard shortcut indicator.
```bash
npx shadcn@latest add kbd
```

### Accordion
Collapsible content sections.
```bash
npx shadcn@latest add accordion
```

---

## Overlay Components

### Popover
Floating content triggered by element.
```bash
npx shadcn@latest add popover
```

### Tooltip
Hover information tooltip.
```bash
npx shadcn@latest add tooltip
```
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>Tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### HoverCard
Rich content on hover.
```bash
npx shadcn@latest add hover-card
```

### ContextMenu
Right-click menu.
```bash
npx shadcn@latest add context-menu
```

### DropdownMenu
Dropdown action menu.
```bash
npx shadcn@latest add dropdown-menu
```
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild><Button>Menu</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Command
Command palette / search.
```bash
npx shadcn@latest add command
```
Used for command palettes (Cmd+K), autocomplete, search interfaces.

### Toggle
Pressed/unpressed toggle button.
```bash
npx shadcn@latest add toggle
```

### ToggleGroup
Group of toggle buttons.
```bash
npx shadcn@latest add toggle-group
```
