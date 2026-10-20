# 01 — Requisitos

> Fase SDD: **Especificar**. Define qué se construye y por qué. No habla de implementación.

## 1. Visión

DENDRO-OS es una página web que simula el computador de operaciones de una agencia que vigila un multiverso con forma de árbol. Debe sentirse como una terminal de los años 70-80 vista desde el futuro: fósforo ámbar, tubo CRT, teclado como forma principal de uso.

La página **cuenta una historia en tiempo real**: desde el 20 de octubre de 2026 el sistema detecta anomalías, el 27 de octubre chocan las dos primeras ramas, y a partir de ahí las colisiones crecen de forma exponencial hasta el colapso total del 16 de diciembre de 2026. Cada día que el visitante vuelve, la situación está peor.

## 2. Usuarios

- **Visitante**: entra al enlace, explora como si fuera un operador de la agencia, vuelve otros días para ver el avance.
- **Autor (Nicolas)**: edita colores, logo, fechas, tierras y eventos sin tocar la lógica.

## 3. Requisitos funcionales

### RF-01 Cronología determinista por fecha real
- El estado del sistema depende **solo de la fecha del calendario** (zona horaria configurable, por defecto `America/Bogota`), no del navegador ni de visitas previas.
- Dos personas que entran el mismo día ven el mismo estado.
- Hitos fijos (configurables en `config.js`):
  | Fecha | Hito |
  | --- | --- |
  | 2026-10-20 | Alerta inicial: anomalías de firma, ninguna colisión |
  | 2026-10-27 | Primera colisión: 2 ramas |
  | 2026-10-28 → 2026-12-15 | Crecimiento exponencial de ramas en colisión |
  | 2026-12-16 | Colapso total |
- Antes del día de inicio: el sistema funciona en estado "nominal" (todo estable).
- Desde el 16 de diciembre en adelante: estado de colapso permanente.

### RF-02 Secuencia de arranque
- Al entrar se muestra un arranque tipo BIOS/mainframe con texto que se escribe carácter por carácter, verificación de módulos y conexión al sustrato.
- Se puede saltar con cualquier tecla tras la primera visita del día.
- El arranque cambia según la fase: más errores y advertencias a medida que avanza el colapso.

### RF-03 Pantalla de acceso
- Pide un "ID de operador" (cualquier texto). No hay contraseña real ni se guarda nada sensible.
- El ID se recuerda en el navegador y aparece en los registros ("OPERADOR NTT-0451 CONECTADO").

### RF-04 Escritorio de módulos
- Tras el acceso hay un menú principal con los módulos, navegable con teclado (flechas, números, teclas F) y con ratón.
- Barra de estado permanente: fecha y hora de la agencia, fase actual, ramas en colisión, nivel de alerta.

### RF-05 Módulos
| ID | Módulo | Qué permite |
| --- | --- | --- |
| M1 | TERMINAL | Escribir comandos (`ayuda`, `estado`, `escanear`, `examinar <id>`, `colisiones`, `aislar <id>`, `registro`, `limpiar`, `salir`, más comandos ocultos). |
| M2 | MAPA DEL ÁRBOL | Ver el Árbol: tronco y ramas en blanco, tierras en azul, ataques y misiles en rojo. Seleccionar una tierra abre su expediente. |
| M3 | EXPEDIENTES | Ficha de cada tierra: designación, nombre, firma ω, régimen mágico, planos anexos, nivel tecnológico, postura, estabilidad, y su **línea temporal** (eventos fechados hasta hoy). |
| M4 | MONITOR DE COLISIONES | Pares de ramas convergiendo, Δω cayendo, tiempo estimado al contacto, estado (aproximación, contacto, hostilidades, aniquilación). |
| M5 | REGISTRO DE INCIDENTES | Bitácora del sistema con todos los eventos hasta la fecha actual, del más reciente al más antiguo. |
| M6 | COMUNICACIONES | Mensajes de agentes de campo y de las propias tierras que se desbloquean por fecha. |
| M7 | ARCHIVO | Documentos clasificados del lore (protocolos, el informe del Árbol, manual del operador). |
| M8 | CONTENCIÓN | Acciones del operador (reforzar aislante, sellar puerta, aislar rama). Dan respuesta visual y quedan en el registro local, pero **no alteran la cronología global**. |

### RF-06 Conflicto entre tierras
- Algunas tierras (no todas) al acercarse a su pareja de colisión **intentan destruirla** para sobrevivir.
- Esto se ve en el mapa (trayectorias de misiles y armas en rojo), en el monitor de colisiones (estado "HOSTILIDADES") y en los registros y expedientes.
- Otras tierras eligen evacuar, aislarse, negociar o simplemente no se enteran.

### RF-07 Degradación progresiva
A medida que avanza la fase, el sistema se deteriora:
- Más frecuencia de glitches visuales (desplazamiento de líneas, parpadeos, caracteres corruptos).
- Texto corrupto aleatorio en registros (determinista por día).
- Módulos que se caen o responden con errores a partir de umbrales.
- Alarmas sonoras más frecuentes (si el sonido está activado).

### RF-08 Colapso final (16 de diciembre)
- Al entrar, en vez del arranque normal aparece un **mensaje de error fatal** a pantalla completa en ámbar con texto blanco.
- Tras el error, el sistema puede mostrar un arranque fallido, un mapa con el Árbol desintegrándose y un último mensaje.
- Configurable: el texto del error final y lo que se puede hacer después.

### RF-09 Configuración centralizada
- Un único archivo **`config.js`** contiene: nombre y siglas de la agencia, logo ASCII, paleta de colores, fechas de los hitos, zona horaria, intensidad de efectos CRT, sonido, velocidad de escritura, modo depuración.
- El contenido del mundo vive en **`data/`** (tierras, eventos, mensajes, documentos), separado de la lógica.
- Cambiar un color o una fecha **no requiere tocar ningún otro archivo**.

### RF-10 Modo depuración
- Con `?fecha=AAAA-MM-DD` en la URL (si `config.debug.permitirFechaURL` es `true`) se simula cualquier día.
- Permite revisar todas las fases sin esperar.

## 4. Requisitos no funcionales

- **RNF-01 Sin dependencias ni compilación**: HTML, CSS y JavaScript puros. Se abre con doble clic en `index.html` y también funciona en GitHub Pages.
- **RNF-02 Rendimiento**: 60 fps en el mapa en un portátil común; los efectos CRT no deben bloquear la escritura.
- **RNF-03 Accesibilidad**: respetar `prefers-reduced-motion` (desactiva parpadeos fuertes y glitches); opción en config para desactivar efectos; contraste suficiente del texto blanco sobre el fondo.
- **RNF-04 Responsivo**: usable en móvil (sin teclado físico: menú táctil y botones de comando rápidos).
- **RNF-05 Sonido**: generado con Web Audio, nunca automático; se activa tras la primera interacción y se puede silenciar.
- **RNF-06 Determinismo**: todo lo "aleatorio" usa un PRNG con semilla derivada de la fecha.
- **RNF-07 Originalidad**: la agencia, su símbolo, terminología y personajes son originales. No usar nombres, logos ni elementos de franquicias existentes.

## 5. Criterios de aceptación globales

- [ ] Con `?fecha=2026-10-19` el sistema está en estado nominal.
- [ ] Con `?fecha=2026-10-20` hay alerta de anomalías y 0 colisiones.
- [ ] Con `?fecha=2026-10-27` hay exactamente 2 ramas en colisión.
- [ ] El número de ramas en colisión nunca baja de un día al siguiente y crece de forma exponencial.
- [ ] Con `?fecha=2026-12-16` aparece el error fatal al entrar.
- [ ] Cambiar `colores.ambar` en `config.js` cambia la interfaz entera.
- [ ] En el mapa: ramas blancas, tierras azules, armas rojas.
- [ ] Al menos 4 tierras son hostiles y atacan a su pareja en algún momento.
- [ ] Todos los módulos se pueden usar solo con teclado.
- [ ] Recargar el mismo día da exactamente el mismo estado.
