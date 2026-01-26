# shadcn/ui Blocks Reference

Blocks are pre-built templates for common UI patterns. Install with `npx shadcn@latest add [block-name]`.

## Table of Contents
- [Dashboard Blocks](#dashboard-blocks)
- [Sidebar Blocks](#sidebar-blocks)
- [Login Blocks](#login-blocks)
- [Usage Examples](#usage-examples)

---

## Dashboard Blocks

### dashboard-01
**Description:** A dashboard with sidebar, charts and data table
**Best for:** Admin panels, analytics dashboards, CRM systems

```bash
npx shadcn@latest add dashboard-01
```

**Included components:**
- `AppSidebar` - Main navigation sidebar
- `SiteHeader` - Top header with search and user menu
- `ChartAreaInteractive` - Interactive area charts (Recharts)
- `DataTable` - Sortable, filterable data table
- `SectionCards` - KPI/metric cards
- `NavUser` - User profile dropdown

**File structure created:**
```
components/
├── app-sidebar.tsx
├── site-header.tsx
├── chart-area-interactive.tsx
├── data-table.tsx
├── section-cards.tsx
└── nav-user.tsx
```

---

## Sidebar Blocks

### sidebar-01
Simple sidebar with navigation grouped by section
```bash
npx shadcn@latest add sidebar-01
```

### sidebar-02
Sidebar with collapsible sections
```bash
npx shadcn@latest add sidebar-02
```

### sidebar-03
Sidebar with submenus
```bash
npx shadcn@latest add sidebar-03
```
**Best for:** Complex navigation with categories

### sidebar-04
Floating sidebar with submenus
```bash
npx shadcn@latest add sidebar-04
```

### sidebar-05
Sidebar with collapsible submenus
```bash
npx shadcn@latest add sidebar-05
```
**Best for:** Enterprise applications

### sidebar-06
Sidebar with submenus as dropdowns
```bash
npx shadcn@latest add sidebar-06
```

### sidebar-07 ⭐ (Recommended)
Sidebar that collapses to icons
```bash
npx shadcn@latest add sidebar-07
```
**Best for:** CRM, admin dashboards - saves space while maintaining usability

### sidebar-08
Inset sidebar with secondary navigation
```bash
npx shadcn@latest add sidebar-08
```
**Best for:** Two-level navigation

### sidebar-09
Collapsible nested sidebars
```bash
npx shadcn@latest add sidebar-09
```

### sidebar-10
Sidebar in a popover
```bash
npx shadcn@latest add sidebar-10
```
**Best for:** Mobile-first designs

### sidebar-11
Sidebar with collapsible file tree
```bash
npx shadcn@latest add sidebar-11
```
**Best for:** File managers, project explorers

### sidebar-12 ⭐
Sidebar with calendar
```bash
npx shadcn@latest add sidebar-12
```
**Best for:** Scheduling apps, agenda modules

### sidebar-13
Sidebar in a dialog
```bash
npx shadcn@latest add sidebar-13
```

### sidebar-14
Sidebar on the right
```bash
npx shadcn@latest add sidebar-14
```
**Best for:** Secondary panels, detail views

### sidebar-15 ⭐
Left and right sidebar
```bash
npx shadcn@latest add sidebar-15
```
**Best for:** CRM with detail panels, email clients, chat apps

### sidebar-16
Sidebar with sticky site header
```bash
npx shadcn@latest add sidebar-16
```

---

## Login Blocks

### login-01
Simple login form (centered)
```bash
npx shadcn@latest add login-01
```

### login-02 ⭐ (Recommended)
Two column login page with cover image
```bash
npx shadcn@latest add login-02
```
**Best for:** Professional applications, branded experiences

### login-03
Login page with muted background color
```bash
npx shadcn@latest add login-03
```

### login-04
Login page with form and image combined
```bash
npx shadcn@latest add login-04
```

### login-05
Simple email-only login (magic link)
```bash
npx shadcn@latest add login-05
```

---

## Usage Examples

### CRM/Dashboard App Setup
```bash
# Install base blocks
npx shadcn@latest add dashboard-01
npx shadcn@latest add sidebar-07
npx shadcn@latest add sidebar-15  # For detail panel
npx shadcn@latest add login-02

# Install additional components
npx shadcn@latest add chart
npx shadcn@latest add calendar
npx shadcn@latest add command
npx shadcn@latest add sonner
npx shadcn@latest add data-table
```

### Email/Chat App Setup
```bash
npx shadcn@latest add sidebar-15  # Left nav + right detail
npx shadcn@latest add login-02
```

### Scheduling App Setup
```bash
npx shadcn@latest add dashboard-01
npx shadcn@latest add sidebar-12  # With calendar
npx shadcn@latest add login-02
```

### File Manager Setup
```bash
npx shadcn@latest add sidebar-11  # File tree
npx shadcn@latest add login-01
```

---

## Customizing Blocks

After installation, blocks are copied to your project and can be modified:

1. Components go to `components/` directory
2. Edit directly - they're your code now
3. Use `cn()` to add/override classes
4. Swap out icons, colors, content

Example customization:
```tsx
// Modify app-sidebar.tsx
const navItems = [
  { title: "Dashboard", icon: HomeIcon, href: "/" },
  { title: "Leads", icon: UsersIcon, href: "/leads" },
  // Add your own items
]
```
