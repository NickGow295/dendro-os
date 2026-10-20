# 01 — Requisitos

> Fase SDD: **Especificar**. Define qué se construye y por qué. No habla de implementación.

## 1. Visión

DENDRO-OS es una página web que simula el computador de operaciones de una agencia que vigila un multiverso con forma de árbol. Debe sentirse como una terminal de los años 70-80 vista desde el futuro: fósforo ámbar, tubo CRT, teclado como forma principal de uso.

El Árbol tiene infinitas ramas. Su tronco es **MYTH**, el universo principal, del que brotan todas las demás; por debajo de todo, en el sustrato M11, está la Estación Raíz de DENDRO. DENDRO solo tiene catalogadas unas pocas miles de ramas.

La página **cuenta una historia en tiempo real, minuto a minuto**: desde el 20 de octubre de 2026 el sistema detecta anomalías, el 27 de octubre chocan las dos primeras ramas, y a partir de ahí las colisiones se encadenan de forma exponencial hasta que MYTH pierde la cohesión y el Árbol colapsa el **16 de diciembre de 2026 a las 14:00 (hora de Colombia)**. Por debajo de la cascada hay un responsable, el **Injertador**, que la página revela poco a poco. Cada vez que el visitante vuelve, la situación está peor; si deja la página abierta, empeora delante de él.

## 2. Usuarios

- **Visitante**: entra al enlace, explora como si fuera un operador de la agencia, vuelve otros días para ver el avance. Si investiga (archivo, registro, terminal), descubre la credencial de dirección y la historia oculta.
- **Autor (Nicolas)**: edita colores, logo, fechas, tierras, mensajes y documentos sin tocar la lógica.

## 3. Requisitos funcionales

### RF-01 Cronología determinista por instante real
- El estado del sistema depende **solo del instante real** con resolución de un minuto, en la zona horaria configurable (por defecto `America/Bogota`). No depende del navegador ni de visitas previas.
- Dos personas que entran en el mismo minuto ven el mismo estado.
- Hitos fijos (configurables en `config.js`):
  | Instante | Hito |
  | --- | --- |
  | 2026-10-20 00:00 | Alerta inicial: anomalías de firma, ninguna colisión |
  | 2026-10-27 03:17 | Primera colisión: Velmora / Ostrakh |
  | 2026-10-27 → 2026-12-16 14:00 | Cadena exponencial de colisiones |
  | 2026-12-16 00:00 → 14:00 | Recta final: degradación máxima |
  | 2026-12-16 14:00 | Colapso total (MYTH pierde la cohesión) |
- Antes del inicio de la alerta: estado "nominal" (todo estable). Desde el colapso: estado de colapso permanente.
- **Actualización en vivo**: con la página abierta, el estado se recalcula cada minuto y las vistas se actualizan sin recargar. A las 14:00 exactas del 16/12 la interfaz colapsa aunque esté abierta (RF-08).

### RF-02 Secuencia de arranque
- Al entrar se muestra un arranque tipo BIOS/mainframe con texto que se escribe carácter por carácter, verificación de módulos y conexión al sustrato.
- Se puede saltar con cualquier tecla tras la primera visita del día.
- El arranque cambia según la fase: más errores y advertencias a medida que avanza el colapso.

### RF-03 Pantalla de acceso
- Pide un "ID de operador" (cualquier texto, sin contraseña). El ID se recuerda en el navegador y aparece en los registros ("OPERADOR NTT-0451 CONECTADO").
- La credencial de dirección es aparte y se obtiene desde la TERMINAL (RF-18).

### RF-04 Escritorio de vistas
- La interfaz es **principalmente visual**: diagramas, globos, gráficas y paneles de datos, no una consola de texto. La terminal es una vista secundaria.
- Tras el acceso se abre directamente la vista **COLISIÓN** dentro del marco del escritorio: una barra superior con las vistas, la vista activa en el centro y una barra de estado permanente abajo.
- Navegación con teclado (1–9 y 0 abren las vistas en el orden de RF-05; F1–F4 y F6–F9 las ocho primeras; flechas y Enter dentro de cada vista; Esc vuelve a COLISIÓN), con ratón y táctil. F5, F11 y F12 no se interceptan para no romper el navegador.
- Barra de estado permanente: meta-tiempo τ de la agencia (RF-14), fase, nivel de alerta, ramas en colisión, cohesión N̂ de MYTH y operador (con la marca de dirección si está activa).

### RF-05 Vistas
| Tecla | ID | Vista | Qué muestra / permite |
| --- | --- | --- | --- |
| 1 | V1 | COLISIÓN | **Vista principal.** Los dos globos de una pareja, su distancia, Δω, cuenta atrás en τ y estado; arcos rojos de misiles si es hostil. **Selector de todas las parejas activas** (aproximación, contacto, hostilidades, interferencia) con lista navegable y filtro, además de ←/→. Gráfica de la historia de la pareja (RF-19). |
| 2 | V2 | ÁRBOL | El diagrama completo: MYTH como tronco y las ~1 800 ramas catalogadas. Ramas blancas que enrojecen al acercarse a su pareja; trazos rojos animados (misiles) entre tierras en hostilidades; **zoom y desplazamiento**, con MYTH siempre visible. Rótulo `RAMAS CATALOGADAS: N / ∞`. Seleccionar una tierra abre su expediente. |
| 3 | V3 | MONITOR | Cuadrícula de las 24 tierras nombradas en miniatura (globo + estado + estabilidad), página de parejas activas generadas, gráfica exponencial de ramas afectadas y curva de N̂ de MYTH. El valor final y el instante del colapso aparecen como `???` corruptos hasta la fase CRÍTICO. |
| 4 | V4 | OSCILOSCOPIO | Las firmas ω de la pareja seleccionada y su interferencia: la aproximación se ve sin explicación (RF-19). |
| 5 | V5 | EXPEDIENTE | Ficha de una rama: completa para las 24 nombradas y para MYTH, corta para las generadas. Globo, datos, barra de estabilidad (o de cohesión en MYTH) y línea temporal dibujada en τ. |
| 6 | V6 | REGISTRO | Bitácora del sistema hasta el minuto actual, del más reciente al más antiguo, con filtros. |
| 7 | V7 | COMUNICACIONES | Dos canales (RF-17): **general** (visible) y **dirección** (sellado sin credencial). |
| 8 | V8 | ARCHIVO | Manuales y procedimientos del operador y documentos clasificados (RF-17). |
| 9 | V9 | CONTENCIÓN | Panel de **protocolos de contención** con código que el operador aplica a un universo o a una pareja (RF-20). |
| 0 | V0 | TERMINAL | Vista secundaria: órdenes (`ayuda`, `estado`, `escanear`, `examinar <código>`, `colisiones`, `contener <protocolo> <objetivo>`, `credencial`, `registro`, `limpiar`, `salir`, más órdenes ocultas). `examinar` y `colisiones` pueden abrir la vista correspondiente. |

### RF-06 Conflicto entre tierras
- Algunas parejas (no todas) intentan destruir a la otra rama para sobrevivir: al menos 4 de las nombradas y una fracción configurable de las generadas.
- Los ataques empiezan al final de la aproximación (antes del contacto) y siguen durante las hostilidades.
- Esto se ve en COLISIÓN (arcos rojos e impactos), en el ÁRBOL (trazos rojos animados de una tierra a otra), en el OSCILOSCOPIO (picos rojos), en el MONITOR (estado "HOSTILIDADES") y en el registro y los expedientes.
- Otras parejas eligen evacuar, aislarse, negociar o simplemente no se enteran.

### RF-07 Degradación progresiva
A medida que avanza la fase, el sistema se deteriora:
- Más frecuencia de glitches visuales (desplazamiento de líneas, parpadeos, caracteres corruptos), también en los diagramas: temblor de los trazos, cortes y desfases.
- Texto corrupto aleatorio en registros (determinista por día).
- Vistas que se caen o responden con errores a partir de umbrales.
- Alarmas sonoras más frecuentes (si el sonido está activado).
- La terminal tarda más en responder: latencia deliberada que crece con la fase.
- El zumbido del transformador y el ventilador del equipo suben de volumen con la intensidad (si el sonido está activado).
- El 16/12 desde las 00:00 la degradación es máxima (recta final).

### RF-08 Colapso final (16 de diciembre, 14:00)
- **En vivo**: si la página está abierta a las 14:00, la interfaz se rompe en ese minuto (ráfaga de glitches, el tubo se contrae) y queda solo el **mensaje de error fatal**.
- **Al entrar después**: justo tras el encendido del monitor (sin arranque previo) aparece el mismo mensaje.
- El mensaje va a pantalla completa: franja de título en ámbar con texto oscuro y cuerpo en texto blanco sobre fondo oscuro con marco ámbar (contraste de RNF-03).
- En los dos casos, el error fatal se queda solo en pantalla hasta que se pulsa una tecla; entonces aparece el **epílogo**: arranque fallido, el diagrama del Árbol desintegrándose y la semilla.
- Configurable: el texto del error final (con el número de ramas tomado de la configuración, no escrito a mano) y los comandos que la terminal acepta después.
- Después del colapso la pantalla final muestra cuánto meta-tiempo ha pasado desde el colapso, en τ.

### RF-09 Configuración centralizada
- Un único archivo **`config.js`** contiene: nombre y siglas de la agencia, logo ASCII, paleta de colores, instantes de los hitos, zona horaria, parámetros del meta-tiempo τ, del multiverso generado y de la cascada, hash de la credencial de dirección, parámetros de los efectos CRT (WebGL y respaldo CSS), encendido y apagado, sonido y ambiente, velocidad de escritura, latencia de la terminal, modo depuración.
- El contenido del mundo vive en **`data/`** (tierras, MYTH, parejas, tablas para generar ramas, eventos, mensajes, documentos, protocolos), separado de la lógica.
- Cambiar un color o un instante **no requiere tocar ningún otro archivo**.

### RF-10 Modo depuración
- Con `?fecha=AAAA-MM-DD` o `?fecha=AAAA-MM-DDThh:mm` en la URL (si `config.debug.permitirFechaURL` es `true`) se simula cualquier instante. Sin hora se usa las 12:00.
- El reloj simulado **sigue corriendo** desde ese instante (para ver, por ejemplo, el colapso con `?fecha=2026-12-16T13:58`). Con `&congelar=1` se queda fijo.
- El panel de depuración puede mostrar la fecha real; la interfaz del tubo, nunca.

### RF-11 Encendido y apagado del monitor
- Al cargar, el monitor está apagado. Se enciende con un botón de encendido en el marco del monitor o con cualquier tecla; esa interacción es la que habilita el audio (RNF-05).
- El botón de encendido debe ser **muy evidente** en escritorio y en móvil: grande, rotulado, con LED, con una indicación visible en el marco ("PULSE ⏻ O CUALQUIER TECLA") y un área táctil de al menos 64 px.
- Encendido: punto brillante → línea horizontal que se expande → la imagen se abre en vertical → el fósforo se calienta y el contenido aparece.
- Apagado al cerrar sesión (`salir` o botón de encendido): la imagen se contrae a una línea, luego a un punto, y queda un resplandor residual que se desvanece.
- Con `prefers-reduced-motion`, ambos se reducen a un fundido corto.

### RF-12 Simulación física del CRT
- La pantalla se ve a través de un tubo CRT simulado: curvatura de barril, persistencia del fósforo (estela al moverse o borrarse el contenido), aberración cromática leve en los bordes, ruido de señal y parpadeo.
- Si WebGL no está disponible, se usan los efectos CSS de respaldo y la página sigue funcionando sin errores.
- Todos los parámetros se ajustan en `config.efectos` y se pueden desactivar.

### RF-13 Globos procedurales
- Cada rama se dibuja como un **globo de alambre** (proyección ortográfica, meridianos y paralelos) con **continentes propios** generados con su semilla mediante ruido sobre la esfera: el mismo globo en cada carga y en cada navegador.
- Solo **Tierra Gris** usa los continentes de nuestra Tierra (máscara de baja resolución en `data/`).
- Los globos de las ramas generadas se crean **solo cuando se ven** y se guardan en una caché limitada.
- Los globos giran despacio. Tierra y contornos en azul (`tierra`); impactos, cráteres y armas en rojo (`arma`).
- El estado se ve en el globo: estable, aproximación (halo), contacto, daños crecientes en hostilidades, y desenlace (aniquilada: el globo se fragmenta y se apaga; fusionada: los dos globos se funden en uno; superviviente: un globo dañado). Las tierras "inestables" deforman su contorno.

### RF-14 Meta-tiempo τ
- En la interfaz **no aparece ninguna fecha ni hora de nuestro calendario**. Todo instante se muestra en meta-tiempo τ, con unidades propias de DENDRO (ciclos, pulsos, latidos; ver `04-lore.md §1.2`): barra de estado, registro, mensajes, documentos, expedientes, gráficas, cuentas atrás y terminal.
- Internamente se usa la fecha real; la conversión vive en el motor y sus parámetros en `config.js`.
- Desde la fase 4 el reloj τ muestra irregularidades visuales; tras el colapso, `τ DETENIDO`.

### RF-15 Multiverso masivo
- El Árbol tiene infinitas ramas; el diagrama dibuja las **catalogadas**: entre 1 500 y 2 000, generadas de forma determinista con una semilla fija (no cambian con el día). La interfaz lo deja claro: `RAMAS CATALOGADAS: N / ∞`.
- **Designación jerárquica**: cada rama tiene un código alfanumérico que refleja su posición en el árbol, un segmento por nivel (p. ej. `MYTH·4K·7A2·R9`). Sin formatos de franquicias existentes.
- Las 24 tierras nombradas conservan nombre, lore y parejas, y ganan su código. El resto tiene datos generados por semilla (ω, régimen mágico, tecnología, postura, origen) y un expediente más corto.
- **Cadena exponencial**: la primera colisión sigue siendo Velmora / Ostrakh. Desde ahí colisionan cada vez más parejas generadas, con instantes de contacto que se acumulan de forma exponencial hasta el colapso. Una fracción son hostiles y se disparan.

### RF-16 MYTH y sus guardianes
- MYTH es el tronco: no colisiona con ninguna rama, pero su **cohesión N̂** baja con cada contacto. El colapso final es MYTH fallando (N̂ = 0).
- En MYTH viven los cinco guardianes que también se llaman MYTH (`04-lore.md §2`). Sus viajes al pasado (vía II) llenaron el Árbol de ramas jóvenes e inestables. Al caer N̂ por debajo de ciertos umbrales, caen uno a uno.
- MYTH tiene su propio expediente en EXPEDIENTE; la parte de los guardianes está sellada sin credencial de dirección.

### RF-17 Revelación progresiva: canales y archivo
- **Canal general** (visible por defecto): un mensaje semanal a todo el personal desde el 20/10, con tono de empresa que finge control (optimismo forzado, eufemismos, recordatorios de procedimiento, felicitaciones vacías, peticiones de aplicar protocolos de contención concretos). Cada vez más difícil de sostener.
- **Canal de dirección** (solo con credencial): empieza después de la primera colisión y revela poco a poco lo que pasa de verdad, a los MYTHS, la firma imposible y al Injertador.
- Los dos canales **se contradicen a propósito**.
- **ARCHIVO**: manuales y procedimientos internos con aspecto real (código, revisión, aprobación); documentos clasificados que se abren con credencial de dirección y algunos, además, a partir de un instante.
- **El Injertador** no se nombra al principio. Las pistas aparecen por fecha (registro, canal de dirección, archivo, órdenes ocultas) según el calendario de `04-lore.md §5`. El 16/12, antes de las 14:00, su **silueta** aparece en el ÁRBOL.

### RF-18 Credencial de dirección
- En la TERMINAL, la orden `credencial` pide una clave, que no distingue mayúsculas de minúsculas. La clave se guarda **solo como hash** en `config.js`; la pista para descubrirla está escondida en el lore (`04-lore.md §10.3`).
- La credencial se recuerda en el navegador y se cierra con `credencial cerrar` (o `revocar`).
- Con credencial se abren el canal de dirección y los documentos clasificados; sin ella aparecen como sellados.
- La credencial solo cambia lo que se puede **ver**; nunca altera la cronología.

### RF-19 Gráficas que cuentan la historia de cada pareja
- Las gráficas de COLISIÓN, MONITOR y OSCILOSCOPIO muestran, para cada pareja: el acercamiento (las firmas convergen, Δω cae), el contacto (marca en la curva), las hostilidades (tramo rojo) y el desenlace: si una rama destruye a la otra, la curva de la perdedora se corta y cae a cero con una marca roja; si se aniquilan, caen las dos; si se fusionan, las dos curvas se unen en una.
- OSCILOSCOPIO: las dos ondas convergen en frecuencia; los latidos se alargan y crecen en amplitud; la señal se satura en el contacto; hay picos rojos durante las hostilidades; la onda del universo destruido se apaga hasta quedar plana.

### RF-20 Protocolos de contención
- CONTENCIÓN es un panel de protocolos reales de la agencia (código, nombre, objetivo admitido, duración): estabilizar firma, reforzar aislante, desacoplar ramas, sellar garganta, interdicción de fase, poda preventiva, transfusión de cohesión.
- El operador elige protocolo y objetivo (un universo, una pareja o MYTH), confirma y lo ve ejecutarse. Al terminar **parece que funciona** (una mejora visual breve en la vista y en la pareja afectada), pero la cronología no cambia. Queda en el registro local.
- El canal general pide aplicar protocolos concretos; el canal de dirección acaba revelando que nunca sirvieron.

## 4. Requisitos no funcionales

- **RNF-01 Sin dependencias ni compilación**: HTML, CSS y JavaScript puros. Se abre con doble clic en `index.html` y también funciona en GitHub Pages.
- **RNF-02 Rendimiento**: 60 fps en las vistas visuales en un portátil común, incluidos el ÁRBOL con todas las ramas catalogadas y la cuadrícula de 24 globos; los efectos CRT no deben bloquear la escritura; recalcular el estado cada minuto no debe notarse.
- **RNF-03 Accesibilidad**: respetar `prefers-reduced-motion` (desactiva parpadeos fuertes y glitches); opción en config para desactivar efectos; contraste suficiente del texto blanco sobre el fondo.
- **RNF-04 Responsivo**: usable en móvil (sin teclado físico: menú táctil, gestos de zoom y desplazamiento en el ÁRBOL, y el teclado del sistema para escribir).
- **RNF-05 Sonido**: generado con Web Audio, nunca automático; se activa tras la primera interacción (el encendido del monitor, RF-11) y se puede silenciar. Incluye el ambiente del equipo: zumbido del transformador y ventilador.
- **RNF-06 Determinismo**: todo lo "aleatorio" usa un PRNG con semilla derivada de la fecha, del instante o, para el multiverso, de una semilla fija.
- **RNF-07 Originalidad**: la agencia, su símbolo, terminología, personajes y antagonista son originales. No usar nombres, logos ni elementos de franquicias existentes. **Todo el diseño visual es propio de DENDRO**: no imitar interfaces, logos, tipografías de marca ni rótulos de películas o series.

## 5. Criterios de aceptación globales

- [ ] Con `?fecha=2026-10-19` el sistema está en estado nominal.
- [ ] Con `?fecha=2026-10-20` hay alerta de anomalías y 0 colisiones.
- [ ] Con `?fecha=2026-10-27` hay exactamente 2 ramas en colisión (Velmora y Ostrakh); con `?fecha=2026-10-27T03:16`, ninguna.
- [ ] El número de ramas en colisión nunca baja de un minuto al siguiente y crece de forma exponencial.
- [ ] Con `?fecha=2026-12-16T13:59` el sistema está en recta final; con `?fecha=2026-12-16T13:58` y el reloj corriendo, a las 14:00 la interfaz colapsa sola y queda el error fatal.
- [ ] Con `?fecha=2026-12-16T14:00` y `?fecha=2026-12-25` aparece el error fatal al encender.
- [ ] En el tubo no aparece ninguna fecha ni hora de nuestro calendario en ningún instante.
- [ ] Cambiar `colores.ambar` en `config.js` cambia la interfaz entera.
- [ ] En el ÁRBOL: ramas blancas, tierras azules, armas rojas; ramas de parejas en aproximación que pasan de blanco a rojo; `RAMAS CATALOGADAS: N / ∞` con 1 500 ≤ N ≤ 2 000, igual en cada carga.
- [ ] El ÁRBOL sigue a ≥ 60 fps con todas las ramas a la vista y durante el zoom.
- [ ] Tras el acceso se abre COLISIÓN; con `?fecha=2026-10-25` muestra Velmora y Ostrakh acercándose con arcos rojos de Ostrakh hacia Velmora.
- [ ] Cada tierra tiene un globo distinto, idéntico en cada carga; Tierra Gris muestra los continentes de nuestra Tierra.
- [ ] Los diagramas y globos pasan por el shader (se curvan, brillan y dejan estela como el texto).
- [ ] En OSCILOSCOPIO, las frecuencias convergen y los latidos se alargan y crecen hasta saturar en el contacto.
- [ ] En las gráficas se ve el contacto, las hostilidades y el desenlace de cada pareja.
- [ ] Al menos 4 tierras nombradas son hostiles y atacan a su pareja en algún momento.
- [ ] Sin credencial, el canal de dirección y los clasificados aparecen sellados; con la clave correcta se abren y siguen abiertos al recargar; `credencial cerrar` los vuelve a sellar.
- [ ] La clave no aparece en texto plano en ningún archivo.
- [ ] Aplicar un protocolo de contención muestra una mejora breve y no cambia ningún dato del `Estado`.
- [ ] Todas las vistas se pueden usar solo con teclado.
- [ ] Recargar en el mismo minuto da exactamente el mismo estado.
- [ ] Sin WebGL (o con `efectos.webgl: false`) la página funciona con los efectos CSS de respaldo y sin errores en consola.
- [ ] La terminal acepta escritura nada más abrirse, y en móvil el teclado del sistema se queda abierto al tocar para escribir.
- [ ] La terminal tarda visiblemente más en responder en fase 4 que en fase 1.
- [ ] El error fatal es legible: el texto cumple un contraste de al menos 4.5:1.
