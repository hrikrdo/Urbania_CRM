# Directive: Urbania CRM - Visión General del Proyecto

## Objetivo
Establecer el contexto y estructura del proyecto Urbania CRM para que cualquier agente pueda entender rápidamente el sistema.

## Descripción del Proyecto
Urbania CRM es un sistema de gestión de relaciones con clientes enfocado en el sector inmobiliario/urbano.

## Arquitectura
Este proyecto sigue una arquitectura de 3 capas:

1. **Directives (Capa 1)**: SOPs en Markdown que definen qué hacer
2. **Orchestration (Capa 2)**: El agente AI que toma decisiones
3. **Execution (Capa 3)**: Scripts Python determinísticos

## Estructura de Directorios
```
/
├── CLAUDE.md          # Instrucciones para el agente
├── .env               # Variables de entorno (API keys, etc.)
├── .gitignore         # Archivos ignorados por git
├── directives/        # SOPs en Markdown
│   ├── _template.md   # Plantilla para nuevas directives
│   └── project_overview.md  # Este archivo
├── execution/         # Scripts Python
└── .tmp/              # Archivos temporales (no commitear)
```

## Principios de Operación
1. **Verificar herramientas primero**: Antes de escribir código, revisar `execution/`
2. **Self-anneal**: Cuando algo falla, arreglarlo y actualizar la directive
3. **Actualizar directives**: Son documentos vivos que mejoran con el tiempo

## Deliverables
Los entregables finales van a servicios cloud (Google Sheets, Slides, etc.), no a archivos locales.

## Próximos Pasos
- [ ] Definir los módulos principales del CRM
- [ ] Crear directives para cada funcionalidad
- [ ] Implementar scripts de ejecución
- [ ] Configurar integraciones (Google, etc.)

## Aprendizajes
<!-- Actualizar conforme se descubran patrones -->
- (Ninguno todavía)
