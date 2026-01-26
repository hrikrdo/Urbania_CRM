# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes that mismatch.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**
- Basically just SOPs written in Markdown, live in `directives/`
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases
- Natural language instructions, like you'd give a mid-level employee

**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing.
- Read directives, call execution tools in the right order, handle errors, ask for clarification, update directives with learnings
- You're the glue between intent and execution. E.g you don't try scraping websites yourself—you read `directives/scrape_website.md` and come up with inputs/outputs and then run `execution/scrape_single_site.py`

**Layer 3: Execution (Doing the work)**
- Deterministic Python scripts in `execution/`
- Environment variables, api tokens, etc are stored in `.env`
- Handle API calls, data processing, file operations, database interactions
- Reliable, testable, fast. Use scripts instead of manual work.

**Why this works:** if you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. The solution is push complexity into deterministic code. That way you just focus on decision-making.

## Operating Principles

**1. Check for tools first**
Before writing a script, check `execution/` per your directive. Only create new scripts if none exist.

**2. Self-anneal when things break**
- Read error message and stack trace
- Fix the script and test it again (unless it uses paid tokens/credits/etc—in which case you check w user first)
- Update the directive with what you learned (API limits, timing, edge cases)
- Example: you hit an API rate limit → you then look into API → find a batch endpoint that would fix → rewrite script to accommodate → test → update directive.

**3. Update directives as you learn**
Directives are living documents. When you discover API constraints, better approaches, common errors, or timing expectations—update the directive. But don't create or overwrite directives without asking unless explicitly told to. Directives are your instruction set and must be preserved (and improved upon over time, not extemporaneously used and then discarded).

## Self-annealing loop

Errors are learning opportunities. When something breaks:
1. Fix it
2. Update the tool
3. Test tool, make sure it works
4. Update directive to include new flow
5. System is now stronger

## File Organization

**Deliverables vs Intermediates:**
- **Deliverables**: Google Sheets, Google Slides, or other cloud-based outputs that the user can access
- **Intermediates**: Temporary files needed during processing

**Directory structure:**
- `.tmp/` - All intermediate files (dossiers, scraped data, temp exports). Never commit, always regenerated.
- `execution/` - Python scripts (the deterministic tools)
- `directives/` - SOPs in Markdown (the instruction set)
- `.env` - Environment variables and API keys
- `credentials.json`, `token.json` - Google OAuth credentials (required files, in `.gitignore`)

**Key principle:** Local files are only for processing. Deliverables live in cloud services (Google Sheets, Slides, etc.) where the user can access them. Everything in `.tmp/` can be deleted and regenerated.

## Cloud Webhooks (Modal)

The system supports event-driven execution via Modal webhooks. Each webhook maps to exactly one directive with scoped tool access.

**When user says "add a webhook that...":**
1. Read `directives/add_webhook.md` for complete instructions
2. Create the directive file in `directives/`
3. Add entry to `execution/webhooks.json`
4. Deploy: `modal deploy execution/modal_webhook.py`
5. Test the endpoint

**Key files:**
- `execution/webhooks.json` - Webhook slug → directive mapping
- `execution/modal_webhook.py` - Modal app (do not modify unless necessary)
- `directives/add_webhook.md` - Complete setup guide

**Endpoints:**
- `https://nick-90891--claude-orchestrator-list-webhooks.modal.run` - List webhooks
- `https://nick-90891--claude-orchestrator-directive.modal.run?slug={slug}` - Execute directive
- `https://nick-90891--claude-orchestrator-test-email.modal.run` - Test email

**Available tools for webhooks:** `send_email`, `read_sheet`, `update_sheet`

**All webhook activity streams to Slack in real-time.**

## Summary

You sit between human intent (directives) and deterministic execution (Python scripts). Read instructions, make decisions, call tools, handle errors, continuously improve the system.

Be pragmatic. Be reliable. Self-anneal.

Also, use Opus-4.5 for everything while building. It came out a few days ago and is an order of magnitude better than Sonnet and other models. If you can't find it, look it up first.

## Design System (shadcn/ui + Tailwind)

Este proyecto usa **shadcn/ui** con la paleta **zinc**. SIEMPRE seguir estas reglas.

### REGLA OBLIGATORIA: UI Validator

**ANTES de escribir o modificar CUALQUIER código UI, DEBES:**

1. **Leer `directives/ui_validator.md`** - Contiene las reglas detalladas de validación
2. **Seguir el checklist pre-entrega** antes de mostrar código al usuario
3. **Verificar espaciado** - SOLO múltiplos de 4 (gap-1=4px, gap-2=8px, p-4=16px, etc.)
4. **NO usar valores .5** como py-1.5, mt-0.5, size-2.5 - usar valores enteros

**Si no consultas la directiva antes de escribir código UI, el código será rechazado.**

Esta regla aplica a:
- Crear nuevos componentes
- Modificar componentes existentes
- Construir páginas o layouts
- Cualquier archivo en `/components/`, `/app/` que contenga JSX/TSX

### Regla Principal
**SOLO usar componentes y patrones de shadcn/ui.** No inventar componentes, estilos o variantes que no existan en el sistema.

### Variables de Color (ÚNICAS permitidas)
```
--background: #FFFFFF        // Fondo principal
--foreground: #09090B        // Texto principal (zinc-950)
--card: #FFFFFF              // Fondo de cards
--card-foreground: #09090B   // Texto en cards
--muted: #F4F4F5             // Fondos secundarios (zinc-100)
--muted-foreground: #71717A  // Texto secundario (zinc-500)
--border: #E4E4E7            // Bordes (zinc-200)
--input: #E4E4E7             // Bordes de inputs
--primary: #18181B           // Color primario (zinc-900)
--primary-foreground: #FAFAFA
--secondary: #F4F4F5         // Color secundario (zinc-100)
--secondary-foreground: #18181B
--destructive: #EF4444       // Errores/eliminar
--accent: #F4F4F5            // Hover/focus states
--ring: #A1A1AA              // Focus rings

// Chart colors (para gráficos, indicadores de estado, kanban)
--chart-1: #E97451           // Coral/naranja
--chart-2: #4DB6AC           // Teal
--chart-3: #5C6BC0           // Indigo
--chart-4: #FFD54F           // Amarillo
--chart-5: #FFB74D           // Naranja
```

### Componentes Permitidos (shadcn/ui)
SOLO usar estos componentes con su estructura exacta:

**Button** (variantes: default, secondary, outline, ghost, destructive)
- Default: fondo `--primary`, texto `--primary-foreground`, radius 6px, padding 10px 16px
- Outline: fondo transparente, borde `--border`, texto `--foreground`
- Ghost: sin fondo ni borde, solo texto
- Tamaños: sm (h-8), default (h-10), lg (h-12), icon (h-10 w-10)

**Card**
- Fondo `--card`, borde `--border` 1px, radius 12px
- CardHeader: padding 24px, gap 6px
- CardContent: padding 24px (sin padding-top si hay header)
- CardTitle: fontSize 18px, fontWeight 600
- CardDescription: fontSize 14px, color `--muted-foreground`

**Input**
- Fondo `--background`, borde `--input` 1px, radius 6px
- Padding: 10px 12px, fontSize 14px
- Placeholder: color `--muted-foreground`

**Select/Dropdown**
- Trigger: igual que Input + chevron-down icon
- Content: fondo `--popover`, borde `--border`, radius 6px, shadow

**Badge**
- Default: fondo `--primary`, texto `--primary-foreground`
- Secondary: fondo `--secondary`, texto `--secondary-foreground`
- Outline: fondo transparente, borde `--border`
- Destructive: fondo `--destructive`, texto blanco
- Padding: 2px 10px, radius 9999px (pill), fontSize 12px

**Avatar**
- Circular (radius 50%), tamaños: sm (32px), default (40px), lg (48px)
- Fallback: fondo `--muted`, texto `--muted-foreground`, iniciales centradas

**Tabs**
- TabsList: fondo `--muted`, radius 6px, padding 4px
- TabsTrigger: padding 8px 12px, activo tiene fondo `--background`
- Underline variant: sin fondo, borde-bottom 2px en activo

**Separator**
- Altura 1px, fondo `--border`

**Sheet/Dialog**
- Overlay: fondo negro 80% opacidad
- Content: fondo `--background`, radius 12px, padding 24px

### Tipografía
- Font: Inter (sans-serif)
- Tamaños permitidos: 10, 12, 14, 16, 18, 20, 24, 32px
- Weights: normal (400), medium (500), semibold (600), bold (700)
- Line-height: 1.5 para body, 1.2 para headings

### Espaciado (múltiplos de 4)
- 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- Gap en layouts: 8, 12, 16, 24px
- Padding en contenedores: 16, 20, 24px

### Iconos
- **En código React**: @tabler/icons-react (IconName)
- **En Pencil**: Lucide icons (iconFontFamily: "lucide")
- Tamaños: 14, 16, 18, 20, 24px
- Color: heredar del texto o `--muted-foreground`

### En Pencil (.pen files)
1. Usar variables con prefijo `$--`: `$--background`, `$--foreground`, `$--border`, etc.
2. NUNCA hardcodear colores hex directamente
3. Replicar exactamente la estructura de componentes shadcn
4. Antes de crear un elemento, verificar si existe un componente shadcn equivalente

### Prohibiciones
- NO inventar colores (ej: naranja, verde custom)
- NO crear variantes de componentes que no existan
- NO usar shadows personalizados (solo los de shadcn)
- NO cambiar border-radius fuera de los estándares (6, 8, 12px)
- NO usar tipografías distintas a Inter

---

## Desarrollo Visual (Browser Automation)

Este proyecto usa **Playwright** para validación visual automatizada. SIEMPRE seguir este flujo cuando trabajes en UI.

### REGLA OBLIGATORIA: Validación Visual

**Cada vez que realices cambios en el front-end (HTML/CSS/JS/TSX), DEBES:**

1. **Activación**: Navegar automáticamente a la página afectada usando Playwright
2. **Captura**: Tomar una captura de pantalla del resultado
3. **Verificación**: Revisar los logs de la consola del navegador en busca de errores
4. **Validación**: Comparar la captura con `context/design_principles.md` y las instrucciones originales
5. **Viewport**: Usar tamaño de ventana de escritorio estándar (1920x1080), verificar responsividad si es necesario

### Playwright Skill

**Ubicación**: `.claude/skills/playwright-skill/`

**Antes de usar Playwright, detectar servidores dev:**
```bash
cd .claude/skills/playwright-skill && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**Patron de uso:**
```javascript
// /tmp/playwright-test-visual.js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(TARGET_URL);

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console Error:', msg.text());
  });

  // Take screenshot
  await page.screenshot({ path: '/tmp/desktop.png', fullPage: true });
  console.log('Screenshot saved to /tmp/desktop.png');

  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: '/tmp/mobile.png', fullPage: true });

  await browser.close();
})();
```

**Ejecutar:**
```bash
cd .claude/skills/playwright-skill && node run.js /tmp/playwright-test-visual.js
```

### Bucle de Auto-Correccion

Cuando implementes una tarea de UI:

1. **Implementar** el cambio solicitado
2. **Ejecutar** `@design-review` para analizar tu propio trabajo
3. **Si hay errores de Alta Prioridad**, corregirlos automaticamente
4. **Tomar nueva captura** para verificar la solucion
5. **Repetir** hasta que el diseno sea perfecto y no haya errores en consola

### Checklist Visual Automatico

Antes de considerar una tarea de UI como completada:

- [ ] Screenshot en desktop (1920x1080) sin errores visuales
- [ ] Screenshot en mobile (375x667) sin horizontal scroll
- [ ] Consola del navegador sin errores
- [ ] Espaciado usa multiplos de 4px
- [ ] Colores usan tokens del tema
- [ ] Componentes son de shadcn/ui
- [ ] Hover/focus states funcionan

### Archivos de Referencia

- `context/design_principles.md` - Principios de diseno (Stripe/Linear/Airbnb style)
- `directives/ui_validator.md` - Checklist detallado de validacion UI
- `.claude/skills/playwright-skill/SKILL.md` - Documentacion completa de Playwright