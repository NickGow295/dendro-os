# 03 — Tareas

> Fase SDD: **Dividir en tareas**. Cada tarea es pequeña, tiene un resultado verificable y referencia el requisito que cumple. Marca `[x]` al terminar.
> Al final de cada fase: detenerse, resumir lo hecho y esperar revisión.

## Fase 0-P — Prototipo de render (decisión A/B de `02-diseno.md §7.1`)

- [x] **TP.1** Renderizador de rejilla de caracteres con API pequeña (`escribir(x, y, texto, color)`, regiones/ventanas, cursor, celda bajo el puntero) para que los módulos no dependan de su implementación.
- [x] **TP.2** Shader CRT (curvatura, persistencia, aberración, ruido, parpadeo) con respaldo CSS.
- [x] **TP.3** Monitor apagado con botón de encendido evidente, encendido/apagado y pantalla de arranque sobre la rejilla.

**Verificación:** revisión del autor en escritorio y móvil, incluido el rendimiento. Si se aprueba, se reescriben §1, §7.1 y estas tareas para la opción B; si no, se vuelve a la opción A.

## Fase 0 — Base y configuración

- [ ] **T0.1** Crear la estructura de carpetas de `02-diseno.md §2` y `index.html` con el orden de carga de scripts. *(RNF-01)*
- [ ] **T0.2** Escribir `config.js` completo según el contrato de `02-diseno.md §3`, con los valores de `04-lore.md`. *(RF-09)*
- [x] **T0.3** `tema.js`: aplicar `config.colores` a variables CSS. Verificar: cambiar `ambar` cambia toda la interfaz. *(RF-09)*
- [ ] **T0.4** `crt.css` + `base.css`: monitor, scanlines, curvatura, viñeta, brillo, cursor de bloque; respeta `prefers-reduced-motion`. Es también el respaldo sin WebGL (clase `crt-css`). *(RNF-03, RF-12)*
- [x] **T0.5** `prng.js` y `reloj.js` (fecha real en la zona horaria de config, override `?fecha=`). *(RF-10, RNF-06)*
- [ ] **T0.6** `crt.js`: capa WebGL con curvatura de barril, persistencia del fósforo, aberración cromática en los bordes, ruido y parpadeo, leyendo `efectos.crt`; detección de fallo → respaldo CSS. *(RF-12)* — **arquitectura pendiente, `02-diseno.md §7.1`**
- [x] **T0.7** `monitor.js`: estado de monitor apagado con botón de encendido en el marco; animación de encendido (punto → línea → imagen); versión reducida con `prefers-reduced-motion`. *(RF-11)*

**Verificación:** abrir `index.html` con doble clic muestra el monitor apagado; al pulsar una tecla se enciende y aparece la pantalla ámbar vacía con el cursor parpadeando y los efectos CRT. Con `efectos.webgl: false` se ve el respaldo CSS. Sin errores en consola en ambos casos.

## Fase 1 — Motor de cronología

- [ ] **T1.1** `data/tierras.js` (con `omega`) y `data/colisiones.js` (con `armas`) con las 24 tierras y 12 parejas de `04-lore.md`. *(RF-06)*
- [ ] **T1.2** `cronologia.js`: `calcularEstado(fecha)` con progreso, ramas afectadas, fases, intensidad, estados de pareja, Δω₀ derivado de ω, Δω, `hostil`, ataques desde dd −2, estabilidad por tierra y fusiones (`02-diseno.md §4.5`). *(RF-01, RF-06, RF-07)*
- [ ] **T1.3** `data/eventos.js` y generación del registro del día (fijos + parejas + ruido sembrado por el día de cada entrada, horas deterministas; `02-diseno.md §4.6`). *(RF-01)*
- [ ] **T1.4** `tests/cronologia.test.html` que comprueba los criterios de fechas de `01-requisitos.md §5` y la monotonía día a día del 20/10 al 31/12. *(RF-01)*
- [ ] **T1.5** Panel de depuración opcional (`debug.mostrarPanelDebug`) que imprime el Estado del día. *(RF-10)*

**Verificación:** todas las pruebas en verde.

## Fase 2 — Flujo de pantallas

- [ ] **T2.1** `escritor.js` (máquina de escribir saltable) y `ventana.js` (marco ASCII). 
- [ ] **T2.2** Pantalla de arranque variable por fase; saltable si ya se vio hoy. *(RF-02)*
- [ ] **T2.3** Pantalla de acceso con ID de operador en `localStorage`. *(RF-03)*
- [ ] **T2.4** Escritorio con menú de módulos (teclado + ratón + táctil) y barra de estado. *(RF-04, RNF-04)*
- [ ] **T2.5** `sonido.js`: tecla, beep, alarma; ambiente de transformador + ventilador con volumen según intensidad; sonidos de encendido/apagado; activación tras el encendido; botón silenciar. *(RNF-05, RF-07)*
- [ ] **T2.6** Apagado del monitor al cerrar sesión (`salir` o botón), con resplandor residual y vuelta a MONITOR APAGADO. *(RF-11)*

**Verificación:** recorrer encendido → arranque → acceso → escritorio → apagado solo con teclado en tres fechas distintas; el ambiente suena más fuerte en la fecha más tardía.

## Fase 3 — Módulos principales

- [ ] **T3.1** M1 TERMINAL: registro de comandos, historial, Tab, comandos de `01-requisitos.md RF-05` y ocultos de `04-lore.md §8` (incluidos los de varias palabras); latencia deliberada según intensidad (`02-diseno.md §6`). *(RF-05, RF-07)*
- [ ] **T3.2** M2 MAPA: árbol fractal determinista (ramas blancas), tierras azules, parejas acercándose, ataques rojos animados, tierras aniquiladas apagadas, selección → expediente, leyenda. *(RF-05, RF-06)*
- [ ] **T3.3** M3 EXPEDIENTES: lista + ficha + línea temporal por tierra. *(RF-05)*
- [ ] **T3.4** M4 MONITOR DE COLISIONES. *(RF-05)*
- [ ] **T3.5** M5 REGISTRO con filtros. *(RF-05)*

**Verificación:** con `?fecha=2026-11-20` se ve C-01 resuelta, C-02 fusionada, C-03 en hostilidades con misiles rojos en ambos sentidos.

## Fase 4 — Módulos secundarios

- [ ] **T4.1** M6 COMUNICACIONES con `data/mensajes.js`. *(RF-05)*
- [ ] **T4.2** M7 ARCHIVO con `data/archivo.js` y documento desbloqueable. *(RF-05)*
- [ ] **T4.3** M8 CONTENCIÓN (acciones locales, sin afectar la cronología). *(RF-05)*

## Fase 5 — Degradación y colapso

- [ ] **T5.1** `glitch.js`: corrupción de texto y efectos de pantalla según `intensidad`. *(RF-07)*
- [ ] **T5.2** Módulos caídos por umbral (`02-diseno.md §4.4`). *(RF-07)*
- [ ] **T5.3** Pantalla de colapso del 16/12 con la secuencia completa de `04-lore.md §9`; franja ámbar con texto oscuro y cuerpo blanco sobre fondo oscuro; `{ramas}` desde config; terminal limitada a `comandosPermitidos`. *(RF-08)*

**Verificación:** recorrer `?fecha=` 2026-10-19, 10-20, 10-27, 11-15, 12-05, 12-15, 12-16 y 12-25.

## Fase 6 — Pulido y entrega

- [ ] **T6.1** Revisión móvil (botones de comando rápido, mapa táctil). *(RNF-04)*
- [ ] **T6.2** Revisión de rendimiento del mapa, del shader CRT y del audio de ambiente (60 fps; la escritura no se bloquea). *(RNF-02)*
- [ ] **T6.3** Comprobar todos los criterios de `01-requisitos.md §5`.
- [ ] **T6.4** `README.md` del proyecto: cómo editar `config.js` y `data/`, cómo probar fechas, cómo publicar en GitHub Pages.
