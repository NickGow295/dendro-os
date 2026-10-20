# 02 — Diseño técnico

> Fase SDD: **Planificar**. Define cómo se cumplen los requisitos de `01-requisitos.md`.

## 1. Decisiones de arquitectura

| Decisión | Elección | Motivo |
| --- | --- | --- |
| Stack | HTML + CSS + JavaScript puro | RNF-01: sin compilación, abre con doble clic |
| Carga de scripts | `<script>` clásicos (no módulos ES) con un espacio de nombres global `window.DENDRO` | Los módulos ES fallan con `file://`; así funciona con doble clic y en GitHub Pages |
| Render del mapa | `<canvas>` 2D | Fluido con muchas líneas y animaciones |
| Resto de la UI | DOM con texto monoespaciado | Seleccionable, accesible y fácil de estilizar |
| Efectos CRT | Shader WebGL con respaldo CSS (ver §7.1) | RF-12; sin WebGL la página sigue funcionando |
| Fuente | `VT323` local (`fonts/VT323-Regular.ttf`, licencia OFL en `fonts/OFL.txt`) vía `@font-face`; respaldo: Google Fonts `VT323` y luego `monospace` | Aspecto de terminal; funciona sin conexión |
| Aleatoriedad | PRNG `mulberry32` con semilla = hash(fecha + clave) | RNF-06 |
| Persistencia | `localStorage` solo para: ID de operador, sonido on/off, mensajes leídos, acciones de contención locales, "ya vio el arranque hoy" | Nada de la cronología depende de esto |

## 2. Estructura de archivos

```
dendro-os/
├── index.html              # carcasa: contenedor CRT, carga scripts en orden
├── config.js               # ★ TODO lo editable visual/temporal (ver §3)
├── fonts/
│   ├── VT323-Regular.ttf   # fuente local (OFL)
│   └── OFL.txt
├── tests/
│   └── cronologia.test.html # pruebas del motor en el navegador (§8)
├── data/
│   ├── tierras.js          # las 24 tierras nombradas (ver 04-lore.md)
│   ├── colisiones.js       # parejas, fechas de contacto, posturas
│   ├── eventos.js          # eventos fijos por fecha (narrativa)
│   ├── mensajes.js         # comunicaciones que se desbloquean por fecha
│   └── archivo.js          # documentos clasificados (texto)
├── css/
│   ├── base.css            # variables CSS (se rellenan desde config.js), layout
│   ├── crt.css             # scanlines, curvatura, viñeta, brillo, parpadeo
│   └── modulos.css         # estilos de cada módulo
├── js/
│   ├── nucleo/
│   │   ├── prng.js         # mulberry32 + hash de cadenas
│   │   ├── reloj.js        # fecha actual (real o ?fecha=), zona horaria, días entre fechas
│   │   ├── cronologia.js   # ★ calcula el ESTADO del día (ver §4)
│   │   ├── tema.js         # aplica config.colores a variables CSS
│   │   ├── sonido.js       # Web Audio: beeps, alarmas, ambiente (transformador + ventilador)
│   │   ├── teclado.js      # atajos globales, foco, navegación
│   │   ├── glitch.js       # corrupción de texto y efectos según intensidad
│   │   └── crt.js          # shader WebGL del tubo (§7.1); si falla, activa el respaldo CSS
│   ├── ui/
│   │   ├── monitor.js      # encendido / apagado del tubo (RF-11)
│   │   ├── escritor.js     # efecto máquina de escribir
│   │   ├── ventana.js      # marco de módulo (título, borde ASCII, cerrar)
│   │   └── barraEstado.js  # barra inferior permanente
│   ├── pantallas/
│   │   ├── arranque.js     # RF-02
│   │   ├── acceso.js       # RF-03
│   │   ├── escritorio.js   # RF-04
│   │   └── colapso.js      # RF-08
│   ├── modulos/
│   │   ├── terminal.js     # M1 + registro de comandos
│   │   ├── mapa.js         # M2
│   │   ├── expedientes.js  # M3
│   │   ├── monitor.js      # M4
│   │   ├── registro.js     # M5
│   │   ├── comunicaciones.js # M6
│   │   ├── archivo.js      # M7
│   │   └── contencion.js   # M8
│   └── main.js             # arranque de la app, enrutador de pantallas
└── README.md
```

Orden de carga en `index.html`: `config.js` → `data/*.js` → `js/nucleo/*` → `js/ui/*` → `js/pantallas/*` → `js/modulos/*` → `js/main.js`.

## 3. Contrato de `config.js`

```js
window.DENDRO_CONFIG = {
  agencia: {
    siglas: "DENDRO",
    nombre: "Directorio de Estabilidad y Normalización de Ramas y Orígenes",
    sistema: "DENDRO-OS",
    version: "4.7.2",
    lema: "Toda rama sostiene al Árbol",
    logoASCII: [ /* líneas del logo, ver 04-lore.md */ ],
  },
  colores: {
    ambar: "#FFB000",        // interfaz: bordes, títulos, resaltados
    ambarTenue: "#7A5200",   // bordes secundarios, rejillas
    texto: "#F2F2F2",        // texto principal (blanco)
    textoTenue: "#B8B8B8",
    fondo: "#0A0703",
    tierra: "#3FA7FF",       // tierras en el mapa
    rama: "#FFFFFF",         // tronco y ramas del árbol
    arma: "#FF2A2A",         // misiles, armas, hostilidades
    peligro: "#FF2A2A",
    exito: "#9BE564",
    carcasa: "#1C1A16",     // plástico del monitor
    carcasaLuz: "#2E2A23",  // biseles y relieves de la carcasa
    rotulo: "#8C8473",      // serigrafía del marco
  },
  cronologia: {
    zonaHoraria: "America/Bogota",
    inicioAlerta: "2026-10-20",
    primeraColision: "2026-10-27",
    colapsoTotal: "2026-12-16",
    ramasAfectadasFinal: 1048576, // contador estadístico al llegar al colapso
  },
  efectos: {
    scanlines: true, curvatura: true, brillo: 0.6, parpadeo: true,
    glitchMaximo: 1.0,          // multiplicador de la intensidad de glitches
    respetarMovimientoReducido: true,
    webgl: true,                // false fuerza el respaldo CSS
    crt: {                      // parámetros del shader (§7.1); 0 desactiva cada efecto
      curvaturaBarril: 0.12,    // distorsión de barril
      persistencia: 0.82,       // 0..1, cuánto queda de la imagen anterior en cada fotograma
      aberracion: 0.0025,       // desplazamiento RGB máximo, solo crece hacia los bordes
      ruido: 0.06,              // ruido de señal (nieve)
      parpadeo: 0.03,           // variación de brillo a la frecuencia de la red
      escalaConIntensidad: 1.0, // cuánto empeoran ruido/aberración con la intensidad del día
    },
    encendido: { duracionMs: 1400 },
    apagado:   { duracionMs: 700, resplandorMs: 2500 },
  },
  texto: {
    velocidadEscritura: 18,                    // ms por carácter
    latenciaTerminal: { minMs: 60, maxMs: 1600 }, // se interpola con la intensidad (§6)
  },
  sonido: {
    activadoPorDefecto: false, volumen: 0.35,
    ambiente: {
      frecuenciaRed: 60,                       // Hz del zumbido del transformador
      zumbido:     { base: 0.015, maximo: 0.08 },
      ventilador:  { base: 0.010, maximo: 0.06 },
    },
  },
  colapso: {
    tituloError: "ERROR FATAL 0x0000DEAD",
    mensajeError: [ /* líneas, ver 04-lore.md; {ramas} se sustituye por ramasAfectadasFinal */ ],
    comandosPermitidos: ["semilla"],          // lo único que acepta la terminal tras el colapso
  },
  debug: { permitirFechaURL: true, mostrarPanelDebug: false },
};
```

`tema.js` copia los colores a variables CSS (`--ambar`, `--texto`, `--tierra`, `--rama`, `--arma`, …). Ningún archivo CSS ni JS usa colores literales: siempre variables CSS o `DENDRO_CONFIG.colores`.

## 4. Motor de cronología (`cronologia.js`)

Función pura: `DENDRO.cronologia.calcularEstado("AAAA-MM-DD") → Estado`. Todo módulo lee de `Estado`; nadie calcula fechas por su cuenta. El archivo no toca `document` a nivel superior, para poder ejecutarse en Node (skill `verificar-cronologia`). `fase` es un número (0–5) y `nombreFase` su texto.

Las fechas de contacto de cada pareja vienen escritas en `data/colisiones.js` (ver `04-lore.md §3`); el motor no las calcula.

### 4.1 Progreso

```
t0 = inicioAlerta, t1 = primeraColision, tf = colapsoTotal, d = fecha de hoy (días enteros)

p = clamp((d - t1) / (tf - t1), 0, 1)       # progreso de la cascada
```

### 4.2 Ramas afectadas (contador estadístico)

```
si d < t1:  ramas = 0
si d ≥ t1:  ramas = round( 2 · (R/2)^p )   con R = ramasAfectadasFinal
```

Con R = 1 048 576: el 27/10 son 2, crece de forma exponencial y llega a R el 16/12. Es monótona no decreciente (criterio de aceptación).

### 4.3 Fases

| Fase | Condición | Nivel de alerta |
| --- | --- | --- |
| 0 NOMINAL | d < t0 | VERDE |
| 1 ANOMALÍA | t0 ≤ d < t1 | ÁMBAR |
| 2 CONTACTO | t1 ≤ d y p < 0.35 | NARANJA |
| 3 CASCADA | 0.35 ≤ p < 0.8 | ROJO |
| 4 CRÍTICO | 0.8 ≤ p < 1 | NEGRO |
| 5 COLAPSO | d ≥ tf | — |

### 4.4 Intensidad de degradación

```
intensidad = fase < 2 ? 0.05 · fase : 0.1 + 0.9 · p²
```

Usos: probabilidad de corrupción de cada línea de registro, frecuencia de glitches, probabilidad de fallo de comandos. Se multiplica por `efectos.glitchMaximo`.

Umbrales de módulos caídos (configurables en `cronologia.js` como constantes con nombre):
- p ≥ 0.5: COMUNICACIONES pierde mensajes (algunos llegan corruptos).
- p ≥ 0.7: MONITOR muestra lecturas erráticas a ratos.
- p ≥ 0.9: CONTENCIÓN responde "SIN ENERGÍA EN EL SUSTRATO".

### 4.5 Tierras nombradas y parejas

Las 24 tierras forman 12 parejas definidas en `data/colisiones.js`. Cada pareja tiene:

```js
{ id: "C-01", a: "B-0x01", b: "B-0x02", contacto: "2026-10-27",
  postura: "hostil" | "mutua-hostil" | "evacuacion" | "aislamiento" | "negociacion" | "ignorancia",
  agresor: "B-0x02" | null,  // quién ataca primero si es hostil
  armas: { "B-0x02": ["misil-interrama"] },  // solo tierras que atacan; ids de la tabla de armas (04-lore §4)
  desenlace: "aniquilacion" | "fusion" | "superviviente:B-0x02" | "colapso" }
```

Cada tierra de `data/tierras.js` tiene su firma `omega` (número). El Δω inicial de una pareja **no se escribe**: `Δω₀ = |ω_a − ω_b|`, así no puede contradecir a las firmas.

"Postura hostil" significa `hostil` o `mutua-hostil` en todo este documento. `colapso` (solo C-12) no llega a aplicarse: su dd = 4 cae después de `colapsoTotal`.

Las fechas de contacto de las parejas se acumulan hacia el final (la primera el 27/10, la última el 14/12). Desde el 16/12 el colapso total prevalece sobre cualquier estado de pareja. Estado de una pareja según `dd = d - contacto` (días):

| dd | Estado |
| --- | --- |
| < −7 | ESTABLE |
| −7 a −1 | APROXIMACIÓN (Δω cayendo) |
| 0 | CONTACTO |
| 1 a 3 | HOSTILIDADES (si postura hostil) / INTERFERENCIA (resto) |
| ≥ 4 | desenlace (ANIQUILADA, FUSIONADA, SUPERVIVIENTE) |

Δω de una pareja en aproximación: `Δω = Δω₀ · max(0, −dd) / 7`.

**Ataques.** Las parejas con postura hostil generan ataques con `−2 ≤ dd ≤ 3`. El estado de la pareja sigue siendo el de la tabla (APROXIMACIÓN en dd −2 y −1), pero la pareja lleva `hostil: true`. En `hostil` solo ataca el agresor. En `mutua-hostil` atacan ambos (el agresor desde dd −2, el otro desde dd 0). Cada ataque es `{ desde, hacia, tipo, progreso }`, donde `tipo` es un id de arma y `progreso = (dd + 2) / 5` es la fracción transcurrida de la ventana de ataque.

**Estabilidad de cada tierra** (0–100), según el estado de su pareja:

| Estado | Estabilidad |
| --- | --- |
| ESTABLE | 100 |
| APROXIMACIÓN | `100 − 60 · (7 + dd) / 7` (de 100 en dd −7 a ~49 en dd −1) |
| CONTACTO | 25 |
| HOSTILIDADES / INTERFERENCIA | 10 |
| ANIQUILADA, o perdedora en SUPERVIVIENTE | 0 |
| superviviente en SUPERVIVIENTE | 35 |
| FUSIONADA | 40 |

**Fusión.** Desde el desenlace, las dos tierras se muestran como un único nodo y una única ficha con nombre compuesto (`Halcyon ∪ Halcyon-Prima`) y ω medio. En los datos ambas siguen existiendo con estado FUSIONADA y `fusionadaCon`.

### 4.6 Eventos y registro

El registro de un día = eventos fijos de `data/eventos.js` con fecha ≤ hoy + eventos generados por las parejas (cambios de estado) + ruido generado con el PRNG de cada día (escaneos, latidos del sistema). Se regeneran desde cero cada vez, deterministas, sin guardarse.

- El ruido de cada día pasado `x` (de `t0` a hoy) usa la semilla `hash(x + "ruido")`, así que el historial no cambia al pasar los días: lo que se vio ayer sigue igual hoy.
- La hora (hh:mm:ss) de cada entrada sale del PRNG de su día. Los eventos fijos y los de parejas también reciben una hora determinista.
- Solo la **corrupción visual** de las líneas (RF-07) usa la semilla de hoy (`hash(hoy + "corrupcion")`), con probabilidad `intensidad`. El texto original no cambia, solo cómo se muestra hoy.

### 4.7 Estado resultante

```js
Estado = {
  fecha, fase, nombreFase, nivelAlerta, p, intensidad,
  ramasAfectadas, diasParaColapso,
  tierras: [{ ...datos, estabilidad, estado, fusionadaCon, eventos: [...] }],
  parejas: [{ ...datos, estado, hostil, deltaOmega0, deltaOmega, diasParaContacto }],
  ataques: [{ desde, hacia, tipo, progreso }],   // para el mapa (rojo), ver §4.5
  registro: [...], mensajesDisponibles: [...],
  modulosCaidos: [...]
}
```

## 5. Pantallas y flujo

```
carga → MONITOR APAGADO ──(botón o tecla: habilita audio)──→ ENCENDIDO (RF-11)
                                                                  │
                     ┌──────────── ¿fase 5? ──────────────────────┘
                     │
                     ├─ sí ─→ COLAPSO (error fatal inmediato → arranque fallido → mapa desintegrándose → semilla [+ días desde el colapso])
                     │
                     └─ no ─→ ARRANQUE (saltable si ya se vio hoy) → ACCESO (ID operador) → ESCRITORIO ⇄ MÓDULOS
                                                                                                 │
                                                          `salir` / botón ─→ APAGADO ─→ MONITOR APAGADO
```

## 6. Diseño de cada módulo

- **Terminal (M1)**: registro de comandos `{ nombre, alias, ayuda, ejecutar(args, estado) }`. Historial con ↑/↓, autocompletado con Tab. Comandos ocultos documentados en `04-lore.md`. Con intensidad alta, a veces responde con basura o "TIEMPO DE ESPERA AGOTADO".
  - El parser prueba primero la coincidencia más larga de palabras, para admitir comandos de varias palabras (`quien vigila`).
  - **Latencia deliberada**: antes de responder, la terminal espera `minMs + (maxMs − minMs) · intensidad` con una variación de ±30 %. Mientras espera, el cursor queda ocupado (`▒`) y no se admite otra entrada salvo Esc. La variación usa el PRNG con semilla `hash(fecha + nº de comando de la sesión)`, nunca `Math.random()`.
  - Tras el colapso solo acepta `colapso.comandosPermitidos`.
- **Teclado global**: 1–8 y F1–F4 / F6–F9 abren módulos (con `preventDefault`), Esc vuelve al escritorio. F5, F11 y F12 no se interceptan.
- **Mapa (M2)**: el tronco nace abajo en el centro; las ramas se generan de forma determinista (semilla fija, no cambia por día) en un árbol fractal en blanco; las 24 tierras son nodos azules en las puntas. Parejas en aproximación: se dibujan acercándose. Hostilidades: trayectorias curvas rojas con proyectiles animados de agresor a víctima. Tierras aniquiladas: nodo apagado y ramas que se desvanecen. En fase 4, partículas y "grietas" en las ramas. Clic o Enter sobre una tierra → abre su expediente. Leyenda abajo con los cuatro colores.
- **Expedientes (M3)**: lista de tierras (navegable) + ficha + **línea temporal** de esa tierra (eventos fechados hasta hoy, con los futuros como `[DATOS NO DISPONIBLES]`). Barra de estabilidad en bloques ASCII `█▓▒░`.
- **Monitor (M4)**: tabla de parejas activas con Δω, días al contacto y estado, ordenada por urgencia. Medidor global de ramas afectadas (número grande, notación científica cuando pase de 10⁶).
- **Registro (M5)**: scroll de eventos, más reciente arriba, filtros por tipo (SISTEMA, COLISIÓN, HOSTIL, CONTENCIÓN).
- **Comunicaciones (M6)**: bandeja de mensajes; los no leídos parpadean. Leídos guardados en `localStorage`.
- **Archivo (M7)**: carpetas y documentos con niveles de autorización decorativos.
- **Contención (M8)**: acciones con barra de progreso y confirmación; escriben en el registro local del operador.

## 7. Estética

- Todo dentro de un "monitor": marco oscuro, pantalla curvada (CSS `border-radius` + `filter`), viñeta, scanlines (`repeating-linear-gradient`), brillo con `text-shadow` ámbar.
- Bordes de ventanas con caracteres de caja (`╔═╗║╚╝`).
- Interfaz en ámbar; texto de contenido en blanco; datos de tierras en azul; todo lo bélico en rojo.
- Cursor de bloque parpadeante.
- Transiciones: barrido de línea al abrir módulos, no fundidos modernos.
- Error fatal (RF-08): franja de título con fondo `--ambar` y texto `--fondo`; cuerpo en `--texto` sobre `--fondo` con marco `--ambar`. Nunca texto blanco sobre ámbar.
- Sonidos: tecla, beep de confirmación, alarma de dos tonos.
- **Ambiente** (`sonido.js`), solo tras interacción y respetando silenciar:
  - Transformador: senoidal a `frecuenciaRed` más armónicos 2.º y 3.º, filtrada por un pasa-bajos.
  - Ventilador: ruido marrón por un pasa-banda (~300–600 Hz) con una modulación lenta de 0.2–0.5 Hz.
  - La ganancia de cada uno es `base + (maximo − base) · intensidad`, recalculada al cargar el día.
  - Al encender hay un golpe grave y el silbido agudo del fly-back (~15.7 kHz, muy bajo); al apagar, una caída del zumbido.
- **Encendido y apagado** (`monitor.js`, RF-11): animación sobre la capa CRT (uniforms del shader o, en el respaldo, `transform: scale` + `filter: brightness` en CSS). Duraciones en `efectos.encendido` / `efectos.apagado`.

### 7.1 Capa CRT (WebGL)

> **PENDIENTE DE DECISIÓN** (ver la conversación de diseño). Un shader WebGL no puede leer el DOM como textura, así que la curvatura, la persistencia y la aberración exigen elegir una arquitectura de render. Esta sección se completa cuando se elija.

Fijo, sea cual sea la arquitectura:
- `crt.js` intenta crear el contexto WebGL. Si falla, o si `efectos.webgl` es `false`, añade la clase `crt-css` a la raíz y el aspecto lo da `crt.css`: scanlines, viñeta, brillo, curvatura por `border-radius`, parpadeo.
- Con `prefers-reduced-motion`: sin parpadeo ni ruido animado. La persistencia se limita y la curvatura se mantiene.
- Los parámetros salen de `efectos.crt`. El ruido y la aberración se multiplican por `1 + escalaConIntensidad · intensidad`.

## 8. Pruebas

- `cronologia.js` es una función pura: incluir `tests/cronologia.test.html` que se abre en el navegador y verifica los criterios de aceptación de fechas (ver skill `verificar-cronologia`).
- Revisión manual de cada fase con `?fecha=`.
- Respaldo CSS: probar con `efectos.webgl: false`.
