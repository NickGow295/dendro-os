# Kit SDD — DENDRO-OS

Kit de desarrollo guiado por especificación (Spec-Driven Development) para construir **DENDRO-OS**, la terminal retrofuturista del *Directorio de Estabilidad y Normalización de Ramas y Orígenes* (DENDRO), la agencia que vigila el Árbol Imaginario.

## Contenido

```
dendro-os-kit/
├── README.md                  ← este archivo
├── PROMPT-CLAUDE-CODE.md      ← el prompt que le pegas a Claude Code
├── CLAUDE.md                  ← memoria del proyecto (Claude Code la lee sola)
├── specs/
│   ├── 01-requisitos.md       ← QUÉ se construye y POR QUÉ (historias + criterios de aceptación)
│   ├── 02-diseno.md           ← CÓMO: arquitectura, modelo de datos, cronología, módulos
│   ├── 03-tareas.md           ← tareas por fases, cada una verificable
│   └── 04-lore.md             ← la agencia, las 24 tierras, armas, mensajes
└── .claude/skills/
    ├── agregar-contenido/     ← skill para añadir tierras, eventos o comandos
    └── verificar-cronologia/  ← skill para probar cómo se ve la página en cualquier fecha
```

## Cómo usarlo

1. Descomprime el .zip en una carpeta vacía, por ejemplo `~/proyectos/dendro-os`.
2. Ábrela en la terminal y ejecuta `git init` (opcional pero recomendado).
3. Ejecuta `claude` dentro de esa carpeta.
4. Pega el contenido de `PROMPT-CLAUDE-CODE.md`.
5. Claude Code trabajará fase por fase y se detendrá al final de cada una para que revises.

## Flujo SDD

```
requisitos → diseño → tareas → implementación → verificación
   (qué)      (cómo)   (pasos)     (código)       (criterios)
```

Si quieres cambiar algo grande, **cambia primero la spec** y luego pídele a Claude Code que la implemente. Así la spec sigue siendo la fuente de verdad.

## Skills recomendadas

- Las dos de `.claude/skills/` vienen incluidas y Claude Code las detecta solas.
- **frontend-design** (de Anthropic): ayuda a que la estética sea distintiva y no genérica. Si aparece en `/plugin` dentro de Claude Code, instálala; si no, el proyecto funciona igual.

## Para editar después

Todo lo visual y ajustable está en **`config.js`**: nombre, logo ASCII, colores, fechas, efectos, sonido. El contenido del mundo (tierras, eventos, mensajes) está en **`data/`**.
