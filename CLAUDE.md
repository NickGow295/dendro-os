# DENDRO-OS — instrucciones del proyecto

Simulador web retrofuturista del computador de DENDRO, la agencia que vigila el Árbol Imaginario (tronco: el universo MYTH). El estado de la página cambia minuto a minuto según el instante real hasta el colapso total del 16/12/2026 a las 14:00 (America/Bogota).

## Fuente de verdad (SDD)

Antes de escribir código, leer en este orden:
0. `specs/00-arbol-imaginario.md` — física del mundo (Bulk, X₇, maná, planos, firmas ω, vías I–III); fuente de verdad del lore
1. `specs/01-requisitos.md` — qué y por qué (RF-xx, RNF-xx, criterios de aceptación)
2. `specs/02-diseno.md` — cómo (arquitectura, contrato de config, motor de cronología)
3. `specs/03-tareas.md` — qué sigue (marcar `[x]` al terminar cada tarea)
4. `specs/04-lore.md` — contenido del mundo

Si una tarea contradice la spec, **no improvisar**: señalarlo y proponer el cambio en la spec primero.

## Reglas duras

- **Sin compilación ni dependencias**: HTML, CSS y JS puros. Debe funcionar abriendo `index.html` con doble clic (`file://`). Por eso: `<script>` clásicos y espacio de nombres `window.DENDRO`, **nunca** `import`/`export`.
- **Colores, logo, fechas, textos de la agencia y efectos solo en `config.js`.** Ningún color literal en CSS o JS: usar variables CSS (`var(--ambar)`) o `DENDRO_CONFIG.colores`.
- **Contenido del mundo solo en `data/`.**
- **Las vistas solo usan la API de regiones** (`escribir`, `caja`, `region`, `vectores()`, colores por nombre); nunca tocan el canvas ni el DOM del tubo.
- **La cronología es una función pura del instante** (`cronologia.js`, resolución de un minuto). Nada de la historia global depende de `localStorage`, `Math.random()` ni de visitas previas. Aleatoriedad = PRNG con semilla del día, del minuto o, para el catálogo del multiverso, de una semilla fija.
- **En el tubo nunca aparece una fecha ni una hora de nuestro calendario**: todo se muestra en meta-tiempo τ con `tau.js`. Las vistas no hacen aritmética de fechas.
- **La clave de dirección solo existe como hash** en `config.js`; nunca en texto plano en ningún archivo. La credencial cambia lo que se ve, nunca la cronología.
- **Paleta**: interfaz ámbar, texto blanco, tierras azules, ramas del árbol blancas, armas y hostilidades rojas. Nunca texto blanco sobre fondo ámbar (sobre ámbar va `--fondo`).
- **Originalidad**: no usar nombres, logos, personajes ni terminología de franquicias existentes (Marvel, etc.), ni imitar interfaces o rótulos de películas o series.
- Respetar `prefers-reduced-motion`. Audio solo tras interacción del usuario.
- Textos de la interfaz en español.

## Cómo probar

- Simular un instante: `index.html?fecha=AAAA-MM-DD` (las 12:00) o `?fecha=AAAA-MM-DDThh:mm`. El reloj sigue corriendo desde ahí; `&congelar=1` lo fija.
- Respaldo sin WebGL: poner `efectos.webgl: false` en `config.js`.
- Pruebas del motor: abrir `tests/cronologia.test.html`.
- Fechas clave: 2026-10-19 (nominal), 10-20 (alerta), 10-27T03:16 / 10-27 (primera colisión), 11-20, 12-05, 12-12 (manifiesto), 12-15, 12-16T00:01 (recta final, silueta), 12-16T13:58 (colapso en vivo a las 14:00), 12-16T14:00, 12-25 (post-colapso).
- Móvil: probar con emulación táctil real (CDP `Input.dispatchTouchEvent`), no solo con el tamaño de pantalla.

## Forma de trabajo

- Trabajar fase por fase de `03-tareas.md`. Al terminar una fase: verificar, hacer commit de git, resumir y **detenerse** a esperar revisión.
- Funciones pequeñas y con nombre en español coherente con el dominio (`calcularEstado`, `dibujarRama`).
- Comentarios solo donde la intención no sea obvia.
