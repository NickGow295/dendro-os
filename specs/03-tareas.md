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

- [x] **T4.1** V6 REGISTRO con filtros e histograma por día. *(RF-05)*
- [x] **T4.2** V7 COMUNICACIONES con `data/mensajes.js`. *(RF-05)*
- [x] **T4.3** V8 ARCHIVO con `data/archivo.js` y documento desbloqueable. *(RF-05)*
- [x] **T4.4** V9 CONTENCIÓN (acciones locales, sin afectar la cronología). *(RF-05)*
- [x] **T4.5** V0 TERMINAL: registro de comandos, historial, Tab, comandos de `01-requisitos.md RF-05` y ocultos de `04-lore.md §8` (incluidos los de varias palabras), enlaces a vistas, latencia deliberada (`02-diseno.md §6`). *(RF-05, RF-07)*

## Fallos previos a la Fase 5 (commit propio)

- [x] **TF.1** TERMINAL: `escritorio.abrir()` no llamaba a `vista.iniciar()`; la terminal no aceptaba escritura hasta el primer Enter. *(RF-05)*
- [x] **TF.2** MÓVIL: el `mousedown` de compatibilidad tras un toque quitaba el foco al campo oculto y cerraba el teclado. Se cancela en `#vidrio` y el foco se pide también en `click` (iOS). Probado con emulación táctil por CDP. *(RNF-04)*

## Fase 5 — Tiempo por minutos y meta-tiempo τ

> Migración: el motor pasa de fechas `AAAA-MM-DD` a instantes. Las vistas se migraron a la vez, así que no hizo falta el adaptador `estado.fecha` previsto.

- [x] **T5.1** `config.js`: `cronologia` con instantes y `inicioRectaFinal`, `refrescoSegundos`, bloque `tau`; `colapsoTotal: "2026-12-16T14:00"`. *(RF-01, RF-09, RF-14)*
- [x] **T5.2** `reloj.js`: `instanteActual`, `aInstante` con la zona de config, `diaLocal`, `?fecha=` con hora que sigue corriendo, `&congelar=1`, `alCambiarMinuto`, `alLlegar`. *(RF-01, RF-10)*
- [x] **T5.3** `tau.js`: `de`, `instante`, `reloj`, `corto`, `duracion`, `cuenta` (`02-diseno.md §4.2`). *(RF-14)*
- [x] **T5.4** `cronologia.js` por instantes: progreso continuo, fases con recta final, intensidad, ventanas A/H/K, `paraContacto`, `paraColapso`, registro con instantes y filtrado al minuto. Parejas nombradas con hora de contacto (`04-lore.md §5.1`). *(RF-01, RF-06)*
- [x] **T5.5** Estado vivo: `main.js` recalcula cada minuto; `ctx.estado` como getter; `actualizar(estado)` en el escritorio y en las vistas con estado propio (TERMINAL, COMUNICACIONES, ARCHIVO, CONTENCIÓN); las demás se redibujan. *(RF-01)*
- [x] **T5.6** Sustituir toda fecha u hora visible por τ: barra de estado (con latidos), arranque, registro, expedientes, gráficas, cuentas atrás, terminal, mensajes. Quitar el adaptador `estado.fecha`. *(RF-14)*
- [x] **T5.7** Pruebas y skill `verificar-cronologia` con instantes: criterios de §5, monotonía por hora, 13:59 / 14:00, ninguna fecha en el texto de pantalla. *(RF-01, RF-14)*

**Verificación:** `?fecha=2026-10-27T03:16` sin colisiones y `03:17` con Velmora/Ostrakh en contacto; con `?fecha=2026-12-16T13:58` el escritorio pasa solo a fase 5 a las 14:00 (la pantalla de colapso en vivo completa llega en T9.3); en el tubo no aparece ninguna fecha en las fechas clave.

## Fase 6 — Multiverso masivo y MYTH

- [x] **T6.1** `data/myth.js` (MYTH, 13 primarias con origen y salto, cinco guardianes con instante de caída), `data/generacion.js` y `config.multiverso`. *(RF-15, RF-16)*
- [x] **T6.2** Migrar `data/tierras.js` y `data/colisiones.js` a códigos (`04-lore.md §4.2`), con `semillaGlobo` = designación antigua; textos de `data/eventos.js` sin designaciones hexadecimales. *(RF-15, RF-13)*
- [x] **T6.3** `multiverso.js`: catálogo determinista (reservas, códigos, datos generados, 1 500–2 000 ramas) y disposición normalizada con rejilla espacial. *(RF-15)*
- [x] **T6.4** Parejas generadas: candidatas, orden por saltos, contactos exponenciales, postura/desenlace/armas; integración en `calcularEstado` (`activas`, `enColision`, `ataques`, registro agrupado por pulso). *(RF-15, RF-06)*
- [x] **T6.5** Cohesión N̂ y guardianes en el `Estado` (`02-diseno.md §4.6`); `serieFirmas`. *(RF-16, RF-19)*
- [x] **T6.6** `globo.js`: caché limitada para ramas generadas; MYTH y las 24 fijas. *(RF-13, RNF-02)*
- [x] **T6.7** Pruebas del catálogo y de la cadena (`02-diseno.md §8`); `calcularEstado` < 20 ms. *(RNF-02, RNF-06)*

> Decisiones: las primarias y los nudos del camino de una nombrada no forman parejas generadas, y las primas son siempre de la misma primaria (`02-diseno.md §4.5`). N̂ cruza 0.60 a las 21:05 del 12-09; el evento fijo y la caída de Calcina se movieron a ese minuto. Hasta la Fase 8, ÁRBOL, MONITOR, EXPEDIENTE y CONTENCIÓN siguen mostrando solo las 24 nombradas; COLISIÓN y OSCILOSCOPIO recorren con ←/→ las parejas activas (o las nombradas si no hay), y `colisiones` lista las activas por páginas.

**Verificación:** dos cargas dan el mismo catálogo y el mismo `N`; el 10-27 solo C-01 está en contacto; las ramas en colisión crecen exponencialmente hasta el colapso; N̂ cruza 0.60 el 12-09.

## Fase 7 — Historia: canales, archivo, credencial y revelaciones

- [x] **T7.1** `sha256.js`, `config.acceso`, `DENDRO.local.credencial()`; orden `credencial` con eco `*`, `credencial cerrar` / `revocar`; `◆DIR` en la barra. *(RF-18)*
- [x] **T7.2** `data/mensajes.js` con canales: G-01…G-09, G-X y D-01…D-17 (`04-lore.md §9`), integrando los antiguos M-001…M-008. *(RF-17)*
- [x] **T7.3** V7 COMUNICACIONES con dos pestañas, canal de dirección sellado y `visibleSinCredencial`. *(RF-17)*
- [x] **T7.4** `data/archivo.js` ampliado (`04-lore.md §10`): cabeceras de documentación interna, manuales y procedimientos, clasificados con `desde`, fragmentos solo con credencial, pista de la clave en PROC-ADM-01. *(RF-17, RF-18)*
- [x] **T7.5** V8 ARCHIVO con carpetas, cabecera, sellado y clasificados ocultos hasta su emisión. *(RF-17)*
- [x] **T7.6** `data/revelaciones.js` y `Estado.hitos`; eventos fijos nuevos y corruptos fijos (`04-lore.md §7–8`); órdenes ocultas `omega i`, `sarmiento`, `escarda`, `myth`, `injertador` y `n-hat` con la N̂ de MYTH. *(RF-17)*
- [x] **T7.7** EXPEDIENTE: fichas cortas de ramas generadas y ficha de MYTH con cohesión y guardianes sellados. *(RF-05, RF-16)*

> Notas: `Estado.mensajesDisponibles` pasa a `Estado.mensajes`. En COMUNICACIONES y ARCHIVO, ←/→ cambia de canal o carpeta (desde la Fase 8, también Tab). Las órdenes ocultas que esperan su hito responden `ORDEN DESCONOCIDA`. El aviso de contenciones suspendidas de CONTENCIÓN remite a D-12 y solo se ve con credencial; el resto de CONTENCIÓN llega con T8.8. PROC-FIR-02 pasa de la rev. 3 a la 4 en vivo (10-30 09:00).

**Verificación:** recorrer el calendario de revelaciones con `?fecha=` en cada hito, con y sin credencial; la clave del lore abre el canal y los clasificados, y siguen abiertos al recargar.

## Fase 8 — Vistas rediseñadas

- [x] **T8.1** `vectores.js`: `trazos` y `puntos` por lotes; rampa `rampa0…7` en `tema.js`. *(RNF-02)*
- [x] **T8.2** Gestos en `main.js` (rueda, arrastre, pellizco) y `gesto(g)` en el contrato de vista. *(RNF-04)*
- [x] **T8.3** `ui/lista.js`: lista filtrable con chips, filtro por texto y táctil. *(RF-05)*
- [x] **T8.4** V2 ÁRBOL: catálogo completo por lotes, rampa de convergencia, misiles animados, zoom y desplazamiento, MYTH siempre visible y minimapa, sustrato con la Estación Raíz, selección por rejilla espacial. ≥ 60 fps. *(RF-05, RF-15, RNF-02)*
- [x] **T8.5** V1 COLISIÓN: selector de parejas activas con lista y filtro; gráfica de historia de pareja (componente común). *(RF-05, RF-19)*
- [x] **T8.6** V4 OSCILOSCOPIO: convergencia de frecuencias, ganancia, saturación, picos rojos, desvanecimiento. *(RF-19)*
- [x] **T8.7** V3 MONITOR: página de activas generadas, curva de N̂ y gráfica de historia de pareja. *(RF-05, RF-19)*
- [x] **T8.8** `data/protocolos.js` y V9 CONTENCIÓN rediseñada; `ui.efectosContencion` aplicado en COLISIÓN, ÁRBOL, OSCILOSCOPIO y EXPEDIENTE; orden `contener` (alias `aislar`). *(RF-20)*

> Notas: la lista de parejas se abre con L o tocando el centro del selector (Enter quedó libre: tras el acceso abría la lista sin querer). Las vistas pueden declarar `usaTab` y `capturaEscape`. La disposición del ÁRBOL abre los hijos alrededor de la dirección de su padre (niveles 2–4), no en ángulos absolutos: así parece un árbol y no una escoba. `aislar <objetivo>` es ahora alias de `contener PC-40 <objetivo>`. Medido en Edge sin cabeza: ÁRBOL completo con `?fecha=2026-12-12&fps=1` a 75 fps (el tope del modo) con 2.6 ms de CPU por fotograma. Cierre: la suma del OSCILOSCOPIO sigue ámbar en hostilidades para que los picos rojos se distingan; confirmado el 11-20 con C-03, y PC-30 sobre C-03 se ve en COLISIÓN (PROTOCOLO EN CURSO, misiles interceptados) con el `Estado` idéntico. En ARCHIVO, con la credencial abierta, los documentos de nivel negro dicen que la credencial de dirección no basta.

**Verificación:** con `?fecha=2026-11-20`, C-03 en hostilidades con misiles en el ÁRBOL y picos rojos en el OSCILOSCOPIO; con `?fecha=2026-12-12` y `?fps=1`, el ÁRBOL a ≥ 60 fps con zoom; aplicar PC-14 mejora la pareja ~30 s y el `Estado` es idéntico antes y después.

## Fase 9 — Degradación y colapso

- [ ] **T9.1** `glitch.js`: corrupción de texto en la rejilla y temblor/cortes/desfases en la capa vectorial según `intensidad`; reloj τ irregular en la fase 4. *(RF-07, RF-14)*
- [ ] **T9.2** Vistas caídas por umbral (`02-diseno.md §4.3`), tachadas en las pestañas. *(RF-07)*
- [ ] **T9.3** Pantalla de colapso: al encender tras `tf` y **en vivo a las 14:00** (ráfaga de glitches → error fatal), con la secuencia de `04-lore.md §13` tras una tecla (Árbol desintegrándose en vectores; las ramas de la silueta, las últimas); franja ámbar con texto oscuro y cuerpo blanco; `{ramas}` desde config; terminal limitada a `comandosPermitidos`; τ desde el colapso. *(RF-08)*
- [ ] **T9.4** Silueta del Injertador en el ÁRBOL el 16/12 y vislumbres desde el 12-06 (`04-lore.md §3.1`). *(RF-17)*

**Verificación:** recorrer `?fecha=` 2026-10-19, 10-20, 10-27, 11-15, 12-05, 12-15, 12-16T00:01, 12-16T13:58 (esperando al colapso), 12-16T14:00 y 12-25.

## Fase 10 — Pulido y entrega

- [ ] **T10.1** Revisión móvil con emulación táctil real (pestañas, vistas en vertical, teclado del sistema, pellizco y arrastre en el ÁRBOL, listas filtrables). *(RNF-04)*
- [ ] **T10.2** Revisión de rendimiento de las vistas, el shader, el audio y el recálculo por minuto (60 fps; la escritura no se bloquea). *(RNF-02)*
- [ ] **T10.3** Comprobar todos los criterios de `01-requisitos.md §5`.
- [ ] **T10.4** `README.md` del proyecto: cómo editar `config.js` y `data/`, cómo cambiar la clave de dirección (generar su hash), cómo probar instantes, cómo publicar en GitHub Pages.
