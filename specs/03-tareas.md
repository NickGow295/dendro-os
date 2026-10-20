# 03 — Tareas

> Fase SDD: **Dividir en tareas**. Cada tarea es pequeña, tiene un resultado verificable y referencia el requisito que cumple. Marca `[x]` al terminar.
> Al final de cada fase: verificar, hacer commit, detenerse, resumir lo hecho y esperar revisión.

## Fase 0-P — Prototipo de render (decisión A/B) ✔ opción B aprobada

- [x] **TP.1** Renderizador de rejilla de caracteres con API pequeña (`escribir(x, y, texto, color)`, regiones/ventanas, cursor, celda bajo el puntero) para que las vistas no dependan de su implementación.
- [x] **TP.2** Shader CRT (curvatura, persistencia, aberración, ruido, parpadeo) con respaldo CSS.
- [x] **TP.3** Monitor apagado con botón de encendido evidente, encendido/apagado y pantalla de arranque sobre la rejilla.

## Fase 0 — Base de render y configuración

- [x] **T0.1** Estructura de carpetas de `02-diseno.md §2` y `index.html` con el orden de carga de scripts. *(RNF-01)*
- [x] **T0.2** `config.js` completo según el contrato de `02-diseno.md §3` (incluidos `pantalla` y `vectores`), con los valores de `04-lore.md`. *(RF-09)*
- [x] **T0.3** `tema.js`: aplicar `config.colores` a variables CSS, canvas y shader. *(RF-09)*
- [x] **T0.4** `crt.css` + `base.css`: carcasa del monitor y respaldo sin WebGL (clase `crt-css`), incluida la capa vectorial con `mix-blend-mode: screen`; respeta `prefers-reduced-motion`. *(RNF-03, RF-12)*
- [x] **T0.5** `prng.js` y `reloj.js` (fecha real en la zona horaria de config, override `?fecha=`). *(RF-10, RNF-06)*
- [x] **T0.6** `crt.js`: tubo WebGL (curvatura, persistencia, aberración, ruido, parpadeo, banda, máscara, reflejo) con detección de fallo → respaldo CSS. *(RF-12)*
- [x] **T0.7** `monitor.js`: monitor apagado con botón evidente; encendido (punto → línea → imagen); versión reducida con `prefers-reduced-motion`. *(RF-11)*
- [x] **T0.8** `vectores.js`: capa vectorial con las primitivas de `02-diseno.md §7.3` en unidades de celda; composición `min(1, A + B)` en la pasada de fósforo, subiendo cada textura solo cuando cambia; `pantalla.puntoEn()`; `region.vectores()`. *(RF-12, RF-04)*
- [x] **T0.9** `ruido.js` (fBm 3D con semilla) y `globo.js`: modelo procedural en caché (malla de ruido, umbral por `mar`, costas por *marching squares*, trama de Fibonacci), proyección ortográfica con rotación e inclinación, nivel de detalle por radio y opciones `halo`, `danos`, `fragmentacion`, `fusion`, `inestable`. *(RF-13)*
- [x] **T0.10** Ampliar el patrón de prueba temporal con la capa vectorial: primitivas, texto grande, una fila de globos de distintas semillas y una página con 24 globos pequeños para medir. *(RNF-02)*

**Verificación:** el patrón de prueba muestra vectores y globos curvados, con brillo y estela del tubo; dos cargas dan los mismos globos; con `?fps=1`, 24 globos a ≥ 60 fps en escritorio; con `?webgl=0`, la capa vectorial se ve sobre la rejilla sin errores.

## Fase 1 — Motor de cronología y datos

- [x] **T1.1** `data/tierras.js` (con `omega` y `globo`) y `data/colisiones.js` (con `armas`) con las 24 tierras y 12 parejas de `04-lore.md`. *(RF-06, RF-13)*
- [x] **T1.2** `data/tierra-gris.js`: máscara equirectangular de baja resolución de los continentes de nuestra Tierra; `globo.js` la usa para B-0x09. *(RF-13)*
- [x] **T1.3** `cronologia.js`: `calcularEstado(fecha)` con progreso, ramas afectadas, fases, intensidad, estados de pareja, Δω₀ derivado de ω, Δω, `separacion`, `hostil`, `parejaPrincipal`, ataques desde dd −2, estabilidad por tierra y fusiones (`02-diseno.md §4.5`). *(RF-01, RF-06, RF-07)*
- [x] **T1.4** `data/eventos.js` y generación del registro del día (fijos + parejas + ruido sembrado por el día de cada entrada, horas deterministas; `02-diseno.md §4.6`). *(RF-01)*
- [x] **T1.5** `tests/cronologia.test.html` que comprueba los criterios de fechas de `01-requisitos.md §5`, la monotonía día a día del 20/10 al 31/12 y la pareja principal en fechas clave. *(RF-01)*
- [x] **T1.6** Panel de depuración opcional (`debug.mostrarPanelDebug`) que imprime el Estado del día. *(RF-10)*

**Verificación:** todas las pruebas en verde (skill `verificar-cronologia` y `tests/cronologia.test.html`).

## Rebanada vertical (adelantada a petición del autor, tras la Fase 1)

> Valida el diseño de la interfaz cuanto antes. No sustituye a T2.4 ni a T3.1: son sus primeras versiones, que se completan en sus fases.

- [x] **RV.1** Marco del escritorio: pestañas de las 10 vistas (las no construidas muestran su título y `EN CONSTRUCCIÓN`), barra de estado con datos reales, teclas 1–9/0/F y Esc, táctil en pestañas, barrido al cambiar de vista. Se entra directamente tras el arranque (el acceso llega en T2.3). *(parte de T2.4)*
- [x] **RV.2** V1 COLISIÓN, primera versión funcional con el `Estado` real: selector de pareja, globos con separación, regla de Δω, arcos rojos con proyectiles e impactos, desenlaces, estado en texto grande, paneles, minigráfica de Δω y versión vertical. *(parte de T3.1)*

**Verificación:** revisión del autor con `?fecha=` 2026-10-19, 10-25, 10-27, 11-12, 11-20, 12-05 y 12-15.

## Fase 2 — Flujo de pantallas y escritorio

- [x] **T2.1** `escritor.js` (consola desplazable + máquina de escribir saltable); los marcos los da `region.caja()`.
- [x] **T2.2** Pantalla de arranque variable por fase; saltable si ya se vio hoy. *(RF-02)*
- [x] **T2.3** Pantalla de acceso con ID de operador en `localStorage`; campo de entrada oculto para el teclado móvil. *(RF-03, RNF-04)*
- [x] **T2.4** `escritorio.js` + `teclado.js`: marco con pestañas de vistas y barra de estado, registro `DENDRO.vistas`, contrato de vista (`02-diseno.md §6`), estado de interfaz compartido, teclas 1–9/0/F, Esc → COLISIÓN, táctil, barrido al cambiar de vista. *(RF-04, RNF-04)*
- [x] **T2.5** `sonido.js`: tecla, beep, alarma; ambiente de transformador + ventilador según intensidad; sonidos de encendido/apagado; activación tras el encendido; botón silenciar. *(RNF-05, RF-07)*
- [x] **T2.6** Apagado del monitor al cerrar sesión (`salir` o botón), con resplandor residual y vuelta a MONITOR APAGADO. *(RF-11)* — el escritorio expone `ctx.salir()`; el comando `salir` lo conecta T4.5.

**Verificación:** recorrer encendido → arranque → acceso → escritorio (vistas vacías con su título) → apagado solo con teclado en tres fechas distintas; el ambiente suena más fuerte en la fecha más tardía.

## Fase 3 — Vistas visuales

- [x] **T3.1** V1 COLISIÓN: globos de la pareja, separación, regla de Δω, arcos rojos con proyectiles e impactos, desenlaces (fusión, fragmentación, superviviente), estado en texto grande, paneles, minigráfica de Δω, selector ←/→, versión vertical. *(RF-05, RF-06, RF-13)*
- [x] **T3.2** V2 ÁRBOL: árbol fractal determinista, nodos azules, ramas que se curvan al acercarse, ataques, aniquiladas apagadas, grietas por fase, selección → EXPEDIENTE, leyenda. *(RF-05, RF-06)*
- [x] **T3.3** V3 MONITOR: cuadrícula de 24 globos en miniatura con estado y estabilidad (paginada en móvil) y gráfica logarítmica de ramas afectadas con proyección. *(RF-05)*
- [x] **T3.4** V4 OSCILOSCOPIO: retícula, trazas ω_a / ω_b, suma y envolvente `cos(Δω·t)` según `separacion`, variantes por estado, lecturas. *(RF-05)*
- [x] **T3.5** V5 EXPEDIENTE: globo, paneles de datos, barra de estabilidad, línea temporal dibujada con eventos y tramo futuro rayado. *(RF-05)*
- [x] **T3.6** Borrar `js/pantallas/prueba.js`.

**Verificación:** con `?fecha=2026-10-25`, COLISIÓN muestra Velmora/Ostrakh con arcos rojos de Ostrakh; con `?fecha=2026-11-20`, C-03 en hostilidades con misiles en ambos sentidos, MONITOR con C-01 resuelta y C-02 fusionada; OSCILOSCOPIO con latidos más largos el 11-16 que el 11-12 para C-03.

## Fase 4 — Vistas de texto y secundarias

- [ ] **T4.1** V6 REGISTRO con filtros e histograma por día. *(RF-05)*
- [ ] **T4.2** V7 COMUNICACIONES con `data/mensajes.js`. *(RF-05)*
- [ ] **T4.3** V8 ARCHIVO con `data/archivo.js` y documento desbloqueable. *(RF-05)*
- [ ] **T4.4** V9 CONTENCIÓN (acciones locales, sin afectar la cronología). *(RF-05)*
- [ ] **T4.5** V0 TERMINAL: registro de comandos, historial, Tab, comandos de `01-requisitos.md RF-05` y ocultos de `04-lore.md §8` (incluidos los de varias palabras), enlaces a vistas, latencia deliberada (`02-diseno.md §6`). *(RF-05, RF-07)*

## Fase 5 — Degradación y colapso

- [ ] **T5.1** `glitch.js`: corrupción de texto en la rejilla y temblor/cortes/desfases en la capa vectorial según `intensidad`. *(RF-07)*
- [ ] **T5.2** Vistas caídas por umbral (`02-diseno.md §4.4`), tachadas en las pestañas. *(RF-07)*
- [ ] **T5.3** Pantalla de colapso del 16/12 justo tras el encendido con la secuencia de `04-lore.md §9` (Árbol desintegrándose en vectores); franja ámbar con texto oscuro y cuerpo blanco; `{ramas}` desde config; terminal limitada a `comandosPermitidos`; días desde el colapso. *(RF-08)*

**Verificación:** recorrer `?fecha=` 2026-10-19, 10-20, 10-27, 11-15, 12-05, 12-15, 12-16 y 12-25.

## Fase 6 — Pulido y entrega

- [ ] **T6.1** Revisión móvil (pestañas táctiles, vistas en vertical, teclado en pantalla). *(RNF-04)*
- [ ] **T6.2** Revisión de rendimiento de las vistas, el shader y el audio (60 fps; la escritura no se bloquea). *(RNF-02)*
- [ ] **T6.3** Comprobar todos los criterios de `01-requisitos.md §5`.
- [ ] **T6.4** `README.md` del proyecto: cómo editar `config.js` y `data/`, cómo probar fechas, cómo publicar en GitHub Pages.
