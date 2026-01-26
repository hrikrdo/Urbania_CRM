# Directive: UI Validator

## Objetivo
Garantizar que todo código UI siga el sistema de diseño shadcn/ui + Tailwind sin errores de espaciado, superposición, o estilos inconsistentes. Esta directiva es OBLIGATORIA antes de entregar cualquier componente o pantalla de UI.

## Cuándo Aplicar
- Crear nuevos componentes
- Modificar componentes existentes
- Construir páginas o layouts
- Revisar código UI existente

## Inputs
- Componente o pantalla a crear/modificar
- Contexto de uso (modal, página, sidebar, etc.)

---

## REGLAS ESTRICTAS

### 1. Sistema de Espaciado (Solo múltiplos de 4)

```
PERMITIDO: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
PROHIBIDO: 5, 6, 10, 14, 18, 22, 25, 30, etc.
```

| Uso | Tailwind Class | Valor |
|-----|----------------|-------|
| Gap mínimo | `gap-1` | 4px |
| Gap entre elementos | `gap-2`, `gap-3` | 8px, 12px |
| Padding interno cards | `p-4`, `p-5`, `p-6` | 16px, 20px, 24px |
| Margin entre secciones | `my-8`, `my-12`, `my-16` | 32px, 48px, 64px |
| Padding contenedores | `px-4`, `px-5`, `px-6` | 16px, 20px, 24px |

**ERRORES COMUNES:**
```tsx
// ❌ MAL - valores arbitrarios
<div className="p-[15px] gap-[10px] mt-[25px]">

// ✅ BIEN - múltiplos de 4
<div className="p-4 gap-2 mt-6">
```

### 2. Componentes Permitidos (Solo shadcn/ui)

**USAR ESTOS:**
```
Button, Card, Input, Select, Badge, Avatar, Tabs,
Separator, Sheet, Dialog, Popover, Tooltip, Table,
Form, Checkbox, RadioGroup, Switch, Slider, Calendar,
DropdownMenu, ContextMenu, Command, ScrollArea
```

**NO INVENTAR:**
- Variantes que no existen (Button type="rounded", Card variant="glow")
- Componentes custom que replican shadcn (usar el de shadcn)
- Wrappers innecesarios

### 3. Variables de Color (ÚNICAS)

```tsx
// ✅ USAR variables del tema
bg-background, bg-card, bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive
text-foreground, text-card-foreground, text-primary-foreground, text-muted-foreground
border-border, border-input

// ❌ NUNCA hardcodear colores
bg-[#FF5733], text-[#333], border-gray-300
```

**Excepción:** Chart colors para gráficos y estados visuales:
```tsx
// Solo para gráficos/indicadores de estado
bg-chart-1, bg-chart-2, bg-chart-3, bg-chart-4, bg-chart-5
```

### 4. Tipografía

| Uso | Tamaño | Class |
|-----|--------|-------|
| Body text | 14px | `text-sm` |
| Subtítulos | 16px | `text-base` |
| Títulos cards | 18px | `text-lg` |
| Títulos página | 20-24px | `text-xl`, `text-2xl` |
| Headings grandes | 32px | `text-3xl` |

**Weights:**
```tsx
font-normal   // 400 - body text
font-medium   // 500 - labels, buttons
font-semibold // 600 - títulos cards
font-bold     // 700 - headings principales
```

### 5. Border Radius (Solo 3 valores)

```tsx
rounded-md   // 6px  - inputs, buttons, badges
rounded-lg   // 8px  - cards pequeñas
rounded-xl   // 12px - cards principales, modals
```

**PROHIBIDO:**
```tsx
// ❌ No usar
rounded-sm, rounded, rounded-2xl, rounded-3xl, rounded-full (excepto avatares)
```

### 6. Prevención de Superposición

**Z-Index Scale:**
```tsx
z-0   // Base
z-10  // Elementos elevados (cards hover)
z-20  // Dropdowns, popovers
z-30  // Modals, sheets
z-50  // Tooltips, notificaciones
```

**Elementos fixed/sticky:**
```tsx
// ✅ Siempre dejar espacio para navbars/headers
<main className="pt-16"> // Si navbar es h-16

// ✅ Floating navbar
<nav className="fixed top-4 left-4 right-4 z-30">

// ❌ MAL - contenido oculto tras navbar
<main className="pt-0">
```

### 7. Layouts Responsivos

**Breakpoints estándar:**
```tsx
sm:  // 640px+  móvil landscape
md:  // 768px+  tablet
lg:  // 1024px+ desktop
xl:  // 1280px+ desktop grande
```

**Container widths consistentes:**
```tsx
// ✅ Usar el mismo max-width en toda la app
max-w-6xl  // 1152px - contenido principal
max-w-7xl  // 1280px - layouts amplios

// ❌ No mezclar
max-w-4xl en una página, max-w-7xl en otra
```

**Grid responsivo:**
```tsx
// ✅ Patrón estándar
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ MAL - sin responsive
<div className="grid grid-cols-4 gap-4">
```

---

## CHECKLIST PRE-ENTREGA (OBLIGATORIO)

Antes de entregar código UI, verificar CADA punto:

### Espaciado
- [ ] Todos los paddings/margins son múltiplos de 4
- [ ] No hay valores arbitrarios como `p-[15px]`
- [ ] Gap consistente entre elementos similares

### Colores
- [ ] Solo variables del tema (bg-background, text-foreground, etc.)
- [ ] No colores hardcodeados
- [ ] Contraste suficiente (4.5:1 mínimo para texto)

### Componentes
- [ ] Uso de componentes shadcn/ui existentes
- [ ] No variantes inventadas
- [ ] Props correctas según documentación shadcn

### Layout
- [ ] Responsive en móvil (375px), tablet (768px), desktop (1024px)
- [ ] No scroll horizontal en ningún breakpoint
- [ ] Contenido no oculto tras elementos fixed

### Interacción
- [ ] `cursor-pointer` en elementos clickeables
- [ ] Hover states visibles
- [ ] Focus states para accesibilidad

### Z-Index
- [ ] Escala correcta (10, 20, 30, 50)
- [ ] No conflictos de superposición
- [ ] Modals/sheets sobre todo el contenido

---

## PATRONES CORRECTOS

### Card estándar
```tsx
<Card className="p-6 rounded-xl">
  <CardHeader className="p-0 pb-4">
    <CardTitle className="text-lg font-semibold">Título</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Descripción
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    {/* Contenido */}
  </CardContent>
</Card>
```

### Button group
```tsx
<div className="flex gap-2">
  <Button variant="default">Primario</Button>
  <Button variant="outline">Secundario</Button>
</div>
```

### Form field
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="tu@email.com" />
</div>
```

### Responsive grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>
```

### Page layout
```tsx
<div className="min-h-screen bg-background">
  <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur z-30">
    {/* Navbar */}
  </nav>
  <main className="pt-16 px-4 md:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto py-8">
      {/* Contenido */}
    </div>
  </main>
</div>
```

---

## ANTI-PATRONES (NUNCA HACER)

```tsx
// ❌ Valores arbitrarios
className="p-[13px] mt-[27px] gap-[9px]"

// ❌ Colores hardcodeados
className="bg-[#F5F5F5] text-[#333333]"

// ❌ Border radius inconsistente
className="rounded-sm" // en un lugar
className="rounded-2xl" // en otro

// ❌ Z-index aleatorio
className="z-[999] z-[1000] z-[9999]"

// ❌ Componentes inventados
<Button variant="glow" rounded="full">

// ❌ Ignorar responsive
className="grid grid-cols-4" // sin breakpoints

// ❌ Falta cursor pointer
<div onClick={handleClick}> // sin cursor-pointer

// ❌ Contenido tras navbar
<main className="mt-0"> // cuando hay navbar fixed
```

---

## Proceso de Trabajo

1. **Antes de codificar:**
   - Identificar qué componentes shadcn usar
   - Definir estructura de espaciado
   - Planificar breakpoints responsive

2. **Durante:**
   - Seguir patrones de esta directiva
   - Usar SOLO variables del tema
   - Verificar cada sección contra el checklist

3. **Antes de entregar:**
   - Ejecutar checklist completo
   - Probar en móvil, tablet, desktop
   - Verificar que no hay superposición

---

## Aprendizajes
<!-- Actualizar cuando se descubran nuevos patrones o errores comunes -->

### Errores descubiertos (2026-01-25)

1. **Valores .5 de Tailwind NO son múltiplos de 4:**
   - `py-1.5` = 6px ❌ → usar `py-1` (4px) o `py-2` (8px)
   - `mt-0.5` = 2px ❌ → usar `mt-1` (4px)
   - `size-2.5` = 10px ❌ → usar `size-2` (8px) o `size-3` (12px)
   - `gap-1.5` = 6px ❌ → usar `gap-1` (4px) o `gap-2` (8px)
   - `pl-7` = 28px ❌ → usar `pl-6` (24px) o `pl-8` (32px)

2. **Valores permitidos de Tailwind (todos múltiplos de 4):**
   ```
   1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 5 = 20px, 6 = 24px
   8 = 32px, 10 = 40px, 12 = 48px, 16 = 64px
   ```

3. **Para dimensiones de ancho fijo de layout** (sidebar, modal) se permiten valores arbitrarios como `w-[320px]` cuando son necesarios para el diseño.
