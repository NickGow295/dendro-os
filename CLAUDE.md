# DENDRO-OS — instrucciones del proyecto

Simulador web retrofuturista del computador de DENDRO, la agencia que vigila el Árbol Imaginario. El estado de la página cambia según la fecha real hasta un colapso total el 16/12/2026.

## Fuente de verdad (SDD)

Antes de escribir código, leer en este orden:
1. `specs/01-requisitos.md` — qué y por qué (RF-xx, RNF-xx, criterios de aceptación)
2. `specs/02-diseno.md` — cómo (arquitectura, contrato de config, motor de cronología)
3. `specs/03-tareas.md` — qué sigue (marcar `[x]` al terminar cada tarea)
4. `specs/04-lore.md` — contenido del mundo

Si una tarea contradice la spec, **no improvisar**: señalarlo y proponer el cambio en la spec primero.

## Reglas duras

- **Sin compilación ni dependencias**: HTML, CSS y JS puros. Debe funcionar abriendo `index.html` con doble clic (`file://`). Por eso: `<script>` clásicos y espacio de nombres `window.DENDRO`, **nunca** `import`/`export`.
- **Colores, logo, fechas, textos de la agencia y efectos solo en `config.js`.** Ningún color literal en CSS o JS: usar variables CSS (`var(--ambar)`) o `DENDRO_CONFIG.colores`.
- **Contenido del mundo solo en `data/`.**
- **La cronología es una función pura de la fecha** (`cronologia.js`). Nada de la historia global depende de `localStorage`, `Math.random()` ni de visitas previas. Aleatoriedad = PRNG con semilla de la fecha.
- **Paleta**: interfaz ámbar, texto blanco, tierras azules, ramas del árbol blancas, armas y hostilidades rojas.
- **Originalidad**: no usar nombres, logos, personajes ni terminología de franquicias existentes (Marvel, etc.).
- Respetar `prefers-reduced-motion`. Audio solo tras interacción del usuario.
- Textos de la interfaz en español.

## Cómo probar

- Simular un día: abrir `index.html?fecha=AAAA-MM-DD`.
- Pruebas del motor: abrir `tests/cronologia.test.html`.
- Fechas clave: 2026-10-19 (nominal), 10-20 (alerta), 10-27 (primera colisión), 11-20, 12-05, 12-15, 12-16 (colapso), 12-25 (post-colapso).

## Forma de trabajo

- Trabajar fase por fase de `03-tareas.md`. Al terminar una fase: verificar, resumir y **detenerse** a esperar revisión.
- Funciones pequeñas y con nombre en español coherente con el dominio (`calcularEstado`, `dibujarRama`).
- Comentarios solo donde la intención no sea obvia.
