# Directive: Visual Development Loop

## Objetivo
Automatizar la validación visual de cambios de UI usando un bucle de auto-corrección. El agente implementa, valida, corrige y repite hasta que el diseño sea perfecto.

## Cuándo Aplicar
- Al implementar nuevas features de UI
- Al modificar componentes existentes
- Al corregir bugs visuales
- Al hacer refactoring de estilos

## Inputs
- Descripción de la tarea de UI a implementar
- URL de la página a validar (o auto-detectar)
- Criterios de aceptación específicos (si aplica)

---

## El Bucle Mágico

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   1. IMPLEMENTAR                                            │
│      └── Escribir el código UI                              │
│                                                             │
│   2. VALIDAR                                                │
│      └── Ejecutar @design-review                            │
│      └── Tomar screenshots (desktop/tablet/mobile)          │
│      └── Capturar errores de consola                        │
│                                                             │
│   3. ANALIZAR                                               │
│      └── Comparar con design_principles.md                  │
│      └── Verificar checklist de ui_validator.md             │
│      └── Identificar issues de alta prioridad               │
│                                                             │
│   4. CORREGIR (si hay issues)                               │
│      └── Arreglar issues de alta prioridad                  │
│      └── Volver al paso 2                                   │
│                                                             │
│   5. COMPLETAR (si no hay issues)                           │
│      └── Confirmar que el diseño es perfecto                │
│      └── Documentar cambios realizados                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Paso 1: Implementar

Escribir el código UI siguiendo las reglas de:
- `directives/ui_validator.md` - Espaciado, colores, componentes
- `context/design_principles.md` - Jerarquía visual, patrones

**Checklist rápido antes de validar:**
- [ ] Espaciado en múltiplos de 4px
- [ ] Solo componentes shadcn/ui
- [ ] Colores del tema (no hardcoded)
- [ ] Responsive básico

---

## Paso 2: Validar con Playwright

### 2.1 Detectar servidor dev

```bash
cd .claude/skills/playwright-skill && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

### 2.2 Tomar screenshots

Crear script en `/tmp/playwright-validate.js`:

```javascript
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Test viewports
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `/tmp/${vp.name}.png`, fullPage: true });
    console.log(`✓ ${vp.name} screenshot saved`);
  }

  if (errors.length) {
    console.log('\n⚠️ Console Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('\n✓ No console errors');
  }

  await browser.close();
})();
```

Ejecutar:
```bash
cd .claude/skills/playwright-skill && node run.js /tmp/playwright-validate.js
```

### 2.3 Ver screenshots

Usar Read tool para ver las imágenes:
- `/tmp/desktop.png`
- `/tmp/tablet.png`
- `/tmp/mobile.png`

---

## Paso 3: Analizar

Revisar cada screenshot contra:

### Criterios de `design_principles.md`
1. **Jerarquía visual** - ¿Hay un punto focal claro?
2. **Consistencia** - ¿Los elementos similares lucen igual?
3. **Espaciado** - ¿Es uniforme y usa el grid de 4px?
4. **Contraste** - ¿El texto es legible?
5. **Responsividad** - ¿Se adapta bien a cada viewport?

### Criterios de `ui_validator.md`
1. **Espaciado** - Solo múltiplos de 4px
2. **Colores** - Solo variables del tema
3. **Componentes** - Solo shadcn/ui
4. **Layout** - Sin scroll horizontal
5. **Interacción** - Cursor pointer, hover states

### Clasificar Issues

| Prioridad | Criterio | Acción |
|-----------|----------|--------|
| **Alta** | Bloquea uso, error de consola, layout roto | Corregir inmediatamente |
| **Media** | UX subóptima pero funcional | Corregir antes de entregar |
| **Baja** | Nice-to-have, mejoras menores | Documentar para después |

---

## Paso 4: Corregir

Si hay issues de **Alta Prioridad**:

1. Identificar el archivo y línea específica
2. Hacer la corrección mínima necesaria
3. **NO** hacer cambios adicionales no solicitados
4. Volver al Paso 2 para revalidar

**Máximo 3 iteraciones.** Si después de 3 ciclos siguen habiendo issues, reportar al usuario y pedir dirección.

---

## Paso 5: Completar

Cuando el diseño pase todas las validaciones:

1. **Confirmar** que no hay issues de alta prioridad
2. **Documentar** los cambios realizados
3. **Notificar** al usuario con:
   - Screenshot final
   - Lista de cambios hechos
   - Issues menores pendientes (si los hay)

---

## Ejemplo de Uso

```
Usuario: "Implementa el nuevo botón de login"

Agente:
1. Lee ui_validator.md y design_principles.md
2. Implementa el botón siguiendo shadcn/ui patterns
3. Detecta servidor en localhost:3000
4. Toma screenshots en 3 viewports
5. Analiza: encuentra hover state faltante (Alta) y spacing inconsistente (Media)
6. Corrige hover state
7. Re-toma screenshots
8. Analiza: spacing inconsistente persiste
9. Corrige spacing
10. Re-toma screenshots
11. Analiza: todo OK
12. Reporta: "Botón implementado. 2 correcciones automáticas realizadas."
```

---

## Herramientas Requeridas

| Herramienta | Ubicación | Uso |
|-------------|-----------|-----|
| Playwright | `.claude/skills/playwright-skill/` | Screenshots, console logs |
| UI Validator | `directives/ui_validator.md` | Reglas de validación |
| Design Principles | `context/design_principles.md` | Estándares visuales |
| Design Review | `.claude/skills/design-review/` | Análisis completo |

---

## Aprendizajes
<!-- Actualizar cuando se descubran patrones o errores comunes -->

### Errores comunes detectados
1. Olvidar verificar mobile viewport
2. No capturar errores de consola
3. Hacer demasiados cambios en una iteración
4. No documentar correcciones realizadas
