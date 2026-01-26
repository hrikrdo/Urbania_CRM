# Design Principles

> Principios de diseño web moderno para Urbania CRM. Estética limpia, profesional y consistente inspirada en Stripe, Linear y Airbnb.

## 1. Visual Hierarchy

### Jerarquia Tipografica
```
Headings:     32px (text-3xl) - bold, zinc-950
Page titles:  24px (text-2xl) - semibold, zinc-950
Card titles:  18px (text-lg)  - semibold, zinc-900
Body:         14px (text-sm)  - normal, zinc-700
Captions:     12px (text-xs)  - normal, zinc-500
```

### Escala de Peso Visual
1. **Primario**: Acciones principales, CTAs - fondo solid, alto contraste
2. **Secundario**: Acciones de soporte - outline o ghost
3. **Terciario**: Links inline, acciones menores - solo texto

### Espaciado Proporcional
- Elementos relacionados: 8-12px gap
- Secciones distintas: 24-32px gap
- Grupos de contenido: 16-20px gap

## 2. Consistency Rules

### Componentes Identicos
- Botones del mismo tipo = mismo estilo en toda la app
- Cards = mismo border-radius (12px), mismo shadow
- Inputs = misma altura (40px), mismo padding

### Spacing System (4px grid)
```
Valores permitidos: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
NUNCA usar: 5, 6, 10, 14, 18, 22, 25, 30, etc.
```

### Color Tokens
```css
--background: #FFFFFF      /* Fondo principal */
--foreground: #09090B      /* Texto principal (zinc-950) */
--muted: #F4F4F5            /* Fondos secundarios */
--muted-foreground: #71717A /* Texto secundario */
--border: #E4E4E7           /* Bordes */
--primary: #18181B          /* Acciones primarias */
--destructive: #EF4444      /* Errores/eliminar */
```

## 3. Accessibility Standards

### Contraste Minimo
- Texto normal: 4.5:1 ratio
- Texto grande (18px+): 3:1 ratio
- Iconos interactivos: 3:1 ratio

### Focus States
- **Visible**: ring de 2px con color `--ring`
- **Consistente**: mismo estilo en todos los elementos focusables
- **Never remove**: outline:none sin alternativa

### Touch Targets
- Minimo 44x44px para elementos touch
- Espaciado minimo 8px entre targets

### Semantic HTML
- Buttons para acciones, links para navegacion
- Headings en orden (h1 > h2 > h3)
- Labels asociados a inputs

## 4. Responsive Design

### Mobile-First Breakpoints
```
Base:     < 640px  (mobile)
sm:       >= 640px  (mobile landscape)
md:       >= 768px  (tablet)
lg:       >= 1024px (desktop)
xl:       >= 1280px (desktop wide)
```

### Content Adaptation
- **Mobile**: Stack vertical, full-width cards
- **Tablet**: 2 columnas, sidebar colapsable
- **Desktop**: 3+ columnas, sidebar visible

### No Horizontal Scroll
- max-width con overflow hidden
- Imagenes responsive con object-fit
- Tables con scroll horizontal contenido

## 5. Component Patterns

### Card Pattern
```tsx
<Card className="rounded-xl border bg-card">
  <CardHeader className="p-6 pb-4">
    <CardTitle className="text-lg font-semibold">Title</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {/* Content */}
  </CardContent>
</Card>
```

### Button Variants
```tsx
// Primary action
<Button>Save Changes</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Subtle action
<Button variant="ghost">Learn more</Button>
```

### Form Pattern
```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" />
  </div>
  <Button className="w-full">Submit</Button>
</div>
```

## 6. Animation Guidelines

### Transitions
- Duration: 150-200ms para micro-interactions
- Duration: 300ms para cambios de estado
- Easing: ease-out para entradas, ease-in para salidas

### Hover States
```css
/* Buttons */
hover:bg-primary/90

/* Cards */
hover:shadow-md hover:border-border/80

/* Links */
hover:underline
```

### Loading States
- Skeleton placeholders para contenido
- Spinners para acciones
- Progress bars para procesos largos

## 7. Layout Principles

### Container Widths
```tsx
max-w-6xl  // 1152px - contenido principal
max-w-7xl  // 1280px - layouts amplios
max-w-md   // 448px - forms, modals pequenos
```

### Z-Index Scale
```tsx
z-0   // Base content
z-10  // Elevated cards, dropdowns
z-20  // Popovers, tooltips
z-30  // Modals, sheets
z-40  // Overlays
z-50  // Notifications, toasts
```

### Fixed Elements
```tsx
// Navbar
<nav className="fixed top-0 left-0 right-0 h-16 z-30 bg-background/95 backdrop-blur">

// Main content with offset
<main className="pt-16">
```

## 8. Quality Checklist

### Before Shipping
- [ ] Espaciado usa multiplos de 4px
- [ ] Colores usan tokens del tema
- [ ] Componentes son de shadcn/ui
- [ ] Responsive en mobile/tablet/desktop
- [ ] No horizontal scroll
- [ ] Focus states visibles
- [ ] Cursor pointer en clickeables
- [ ] No errores en consola
- [ ] Contraste cumple WCAG AA

### Visual Review
- [ ] Alineacion consistente
- [ ] Jerarquia clara
- [ ] Espaciado uniforme
- [ ] Tipografia legible
- [ ] Estados hover funcionan
