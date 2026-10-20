# 02 — Diseño técnico

> Fase SDD: **Planificar**. Define cómo se cumplen los requisitos de `01-requisitos.md`.

## 1. Decisiones de arquitectura

| Decisión | Elección | Motivo |
| --- | --- | --- |
| Stack | HTML + CSS + JavaScript puro | RNF-01: sin compilación, abre con doble clic |
| Carga de scripts | `<script>` clásicos (no módulos ES) con un espacio de nombres global `window.DENDRO` | Los módulos ES fallan con `file://`; así funciona con doble clic y en GitHub Pages |
| Render | Todo dentro del tubo se dibuja en canvas: una **rejilla de caracteres** (texto, marcos, paneles) y una **capa vectorial** (diagramas, globos, gráficas), compuestas en el shader CRT (§7.1) | RF-12: curvatura, persistencia y aberración reales sobre todo el contenido |
| Interfaz | Principalmente visual (RF-04): vistas con diagramas; la terminal es secundaria | Sensación de equipo de operaciones, no de consola |
| Desacoplamiento | Las vistas solo usan la API de regiones (§7.2): `escribir`, `caja`, `region`, `vectores()`; nunca el canvas | Cambiar el renderizador no obliga a reescribir vistas |
| Efectos CRT | Shader WebGL con respaldo CSS (ver §7.1) | RF-12; sin WebGL la página sigue funcionando |
| Accesibilidad | Espejo de texto oculto (`aria`) con el contenido de la rejilla y un campo de entrada oculto para el teclado móvil | El canvas no es accesible por sí mismo |
| Fuente | `VT323` local (`fonts/VT323-Regular.ttf`, licencia OFL en `fonts/OFL.txt`) vía `@font-face`; respaldo: Google Fonts `VT323` y luego `monospace` | Aspecto de terminal; funciona sin conexión |
| Aleatoriedad | PRNG `mulberry32` con semilla = hash(fecha + clave) | RNF-06 |
| Persistencia | `localStorage` solo para: ID de operador, sonido on/off, mensajes leídos, acciones de contención locales, "ya vio el arranque hoy" | Nada de la cronología depende de esto |

## 2. Estructura de archivos

```
dendro-os/
├── index.html              # carcasa física del monitor, carga scripts en orden
├── config.js               # ★ TODO lo editable visual/temporal (ver §3)
├── fonts/
│   ├── VT323-Regular.ttf   # fuente local (OFL)
│   └── OFL.txt
├── tests/
│   └── cronologia.test.html # pruebas del motor en el navegador (§8)
├── data/
│   ├── tierras.js          # las 24 tierras nombradas (ver 04-lore.md), con su aspecto de globo
│   ├── tierra-gris.js      # máscara de continentes de nuestra Tierra (solo para B-0x09)
│   ├── colisiones.js       # parejas, fechas de contacto, posturas
│   ├── eventos.js          # eventos fijos por fecha (narrativa)
│   ├── mensajes.js         # comunicaciones que se desbloquean por fecha
│   └── archivo.js          # documentos clasificados (texto)
├── css/
│   ├── base.css            # carcasa del monitor y layout (colores vía variables de config.js)
│   └── crt.css             # respaldo CSS sin WebGL
├── js/
│   ├── nucleo/
│   │   ├── prng.js         # mulberry32 + hash de cadenas
│   │   ├── ruido.js        # ruido 3D con semilla (fBm) para los continentes
│   │   ├── reloj.js        # fecha actual (real o ?fecha=), zona horaria, días entre fechas
│   │   ├── cronologia.js   # ★ calcula el ESTADO del día (ver §4)
│   │   ├── tema.js         # colores de config a variables CSS, canvas y shader
│   │   ├── sonido.js       # Web Audio: beeps, alarmas, ambiente (transformador + ventilador)
│   │   ├── teclado.js      # atajos globales, foco, navegación
│   │   ├── glitch.js       # corrupción de texto y de trazos según intensidad
│   │   └── crt.js          # shader WebGL del tubo (§7.1); si falla, activa el respaldo CSS
│   ├── ui/
│   │   ├── rejilla.js      # rejilla de caracteres + regiones (§7.2)
│   │   ├── vectores.js     # capa vectorial: líneas, arcos, polígonos, texto grande (§7.3)
│   │   ├── globo.js        # modelo y dibujo de los globos de alambre (§7.4)
│   │   ├── monitor.js      # encendido / apagado del tubo (RF-11)
│   │   └── escritor.js     # consola desplazable + máquina de escribir
│   ├── pantallas/
│   │   ├── arranque.js     # RF-02
│   │   ├── acceso.js       # RF-03
│   │   ├── escritorio.js   # RF-04: marco (barra de vistas + barra de estado) y enrutador de vistas
│   │   ├── colapso.js      # RF-08
│   │   └── prueba.js       # TEMPORAL: patrón de prueba del renderizador; se borra en la Fase 3
│   ├── vistas/             # cada vista se registra en DENDRO.vistas (§6)
│   │   ├── colision.js     # V1
│   │   ├── arbol.js        # V2
│   │   ├── monitor.js      # V3
│   │   ├── osciloscopio.js # V4
│   │   ├── expediente.js   # V5
│   │   ├── registro.js     # V6
│   │   ├── comunicaciones.js # V7
│   │   ├── archivo.js      # V8
│   │   ├── contencion.js   # V9
│   │   └── terminal.js     # V0
│   └── main.js             # arranque de la app, bucle de fotogramas, enrutador de pantallas
└── README.md
```

Orden de carga en `index.html`: `config.js` → `data/*.js` → `js/nucleo/*` → `js/ui/*` → `js/pantallas/*` → `js/vistas/*` → `js/main.js`.

## 3. Contrato de `config.js`

```js
window.DENDRO_CONFIG = {
  agencia: {
    siglas: "DENDRO",
    nombre: "Directorio de Estabilidad y Normalización de Ramas y Orígenes",
    sistema: "DENDRO-OS",
    version: "4.7.2",
    lema: "Toda rama sostiene al Árbol",
    sede: "Estación Raíz",
    terminal: "UNIDAD DE OPERACIONES DR-7", // serigrafía del marco del monitor
    logoASCII: [ /* líneas del logo, ver 04-lore.md */ ],
  },
  colores: {
    ambar: "#FFB000",        // interfaz: bordes, títulos, resaltados
    ambarTenue: "#7A5200",   // bordes secundarios, rejillas, escalas de gráficas
    texto: "#F2F2F2",        // texto principal (blanco)
    textoTenue: "#B8B8B8",
    fondo: "#0A0703",
    tierra: "#3FA7FF",       // tierras: globos, nodos, trazas de firma ω
    rama: "#FFFFFF",         // tronco y ramas del árbol
    arma: "#FF2A2A",         // misiles, armas, impactos, hostilidades
    peligro: "#FF2A2A",
    exito: "#9BE564",
    carcasa: "#1C1A16",      // plástico del monitor
    carcasaLuz: "#2E2A23",   // biseles y relieves de la carcasa
    rotulo: "#8C8473",       // serigrafía del marco
  },
  cronologia: {
    zonaHoraria: "America/Bogota",
    inicioAlerta: "2026-10-20",
    primeraColision: "2026-10-27",
    colapsoTotal: "2026-12-16",
    ramasAfectadasFinal: 1048576, // contador estadístico al llegar al colapso
  },
  pantalla: {                 // rejilla de caracteres (§7.2)
    filas: 36,                // filas objetivo en escritorio
    columnasMin: 44,          // por debajo, se reduce la fuente (móvil)
    columnasMax: 112,
    margen: 0.04,             // sobrebarrido en cada borde (la curvatura come las esquinas)
    altoLinea: 1.0,           // alto de celda en múltiplos del tamaño de fuente
    escalaMax: 2,             // tope de devicePixelRatio
    pixelesMax: 2600000,      // tope de píxeles internos del tubo
    calidadAdaptativa: true,  // baja la resolución interna (mín. 60 %) si los fps caen
  },
  vectores: {                 // capa vectorial (§7.3) y globos (§7.4)
    grosorLinea: 1.25,        // px CSS de un trazo normal
    grosorActivo: 2.2,        // trazo de lo seleccionado o activo
    transicionMs: 260,        // barrido de línea al cambiar de vista
    globo: {
      puntos: 1400,           // puntos de la trama de tierra en un globo grande (se reduce con el radio)
      resolucion: [96, 48],   // malla lon × lat donde se evalúa el ruido de continentes
      octavas: 4,
      nivelMarPorDefecto: 0.55, // fracción de océano si la tierra no define la suya
      meridianos: 12, paralelos: 7,
      gradosPorSegundo: 6,    // rotación
      inclinacion: 18,        // grados del eje hacia el observador
    },
    osciloscopio: {
      divisiones: [10, 8],    // retícula
      ciclosEnPantalla: 18,   // ciclos de la portadora visibles
      latidosEnDeltaInicial: 4, // latidos visibles cuando Δω = Δω₀ (§6, V4)
    },
  },
  efectos: {
    scanlines: true, curvatura: true, brillo: 0.6, parpadeo: true,
    glitchMaximo: 1.0,          // multiplicador de la intensidad de glitches
    respetarMovimientoReducido: true,
    webgl: true,                // false fuerza el respaldo CSS
    crt: {                      // parámetros del shader (§7.1); 0 desactiva cada efecto
      curvaturaBarril: 0.08,
      persistencia: 0.82,       // 0..1, cuánto queda de la imagen anterior en cada fotograma
      aberracion: 0.0025,       // desplazamiento RGB máximo, solo crece hacia los bordes
      ruido: 0.06,              // ruido de señal (nieve)
      parpadeo: 0.03,           // variación de brillo fotograma a fotograma
      bandaRodante: 0.05,       // franja de interferencia que sube despacio
      intensidadScanlines: 0.45,
      mascara: 0.12,            // rejilla de apertura RGB (solo con devicePixelRatio ≥ 1.5)
      vineta: 0.55,
      reflejo: 0.035,           // reflejo de la sala en el vidrio
      escalaConIntensidad: 1.0, // cuánto empeoran ruido/aberración con la intensidad del día
    },
    encendido: { duracionMs: 1400 },
    apagado:   { duracionMs: 700, resplandorMs: 2500 },
  },
  texto: {
    velocidadEscritura: 18,                       // ms por carácter
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
  debug: {
    permitirFechaURL: true,
    permitirParametrosURL: true, // ?webgl=0 y ?fps=1 para revisar en móvil sin editar config.js
    mostrarPanelDebug: false,
    mostrarFPS: false,
  },
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

Cada tierra de `data/tierras.js` tiene su firma `omega` (número) y, opcionalmente, su aspecto de globo `globo: { mar, rugosidad, inestable }` (ver `04-lore.md §2.1`; la semilla del globo es siempre `hash(id)`). El Δω inicial de una pareja **no se escribe**: `Δω₀ = |ω_a − ω_b|`, así no puede contradecir a las firmas.

"Postura hostil" significa `hostil` o `mutua-hostil` en todo este documento. `colapso` (solo C-12) no llega a aplicarse: su dd = 4 cae después de `colapsoTotal`.

Las fechas de contacto de las parejas se acumulan hacia el final (la primera el 27/10, la última el 14/12). Desde el 16/12 el colapso total prevalece sobre cualquier estado de pareja. Estado de una pareja según `dd = d - contacto` (días):

| dd | Estado |
| --- | --- |
| < −7 | ESTABLE |
| −7 a −1 | APROXIMACIÓN (Δω cayendo) |
| 0 | CONTACTO |
| 1 a 3 | HOSTILIDADES (si postura hostil) / INTERFERENCIA (resto) |
| ≥ 4 | desenlace (ANIQUILADA, FUSIONADA, SUPERVIVIENTE) |

Δω de una pareja en aproximación: `Δω = Δω₀ · max(0, −dd) / 7` (en ESTABLE vale Δω₀; desde el contacto, 0).

**Separación** (para dibujar la distancia entre globos): `separacion = Δω / Δω₀`, de 1 (lejos) a 0 (contacto).

**Pareja principal** (la que abre COLISIÓN): la primera según este orden:
1. En CONTACTO, HOSTILIDADES o INTERFERENCIA (la de contacto más reciente).
2. En APROXIMACIÓN (la de menos días al contacto).
3. ESTABLE (la de contacto más próximo).
4. Si todas están resueltas, la de desenlace más reciente.

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
  parejas: [{ ...datos, estado, hostil, deltaOmega0, deltaOmega, separacion, diasParaContacto }],
  parejaPrincipal: "C-03",                       // ver §4.5
  ataques: [{ desde, hacia, tipo, progreso }],   // para COLISIÓN y ÁRBOL (rojo), ver §4.5
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
                     ├─ sí ─→ COLAPSO (error fatal inmediato → arranque fallido → Árbol desintegrándose → semilla [+ días desde el colapso])
                     │
                     └─ no ─→ ARRANQUE (saltable si ya se vio hoy) → ACCESO (ID operador) → ESCRITORIO [COLISIÓN] ⇄ VISTAS
                                                                                                 │
                                                          `salir` / botón ─→ APAGADO ─→ MONITOR APAGADO
```

## 6. Escritorio y vistas

**Marco del escritorio** (`pantallas/escritorio.js`):
- Fila superior: pestañas de las vistas (`1 COLISIÓN  2 ÁRBOL  …  0 TERMINAL`). La activa va en inverso ámbar; las caídas por umbral (§4.4), tachadas. Con menos de 80 columnas se abrevian (`1 COL 2 ÁRB …`).
- Fila inferior: barra de estado (fecha y hora de la agencia, fase, nivel de alerta, ramas afectadas, operador).
- Centro: la región de la vista activa. Al cambiar de vista hay un barrido de línea en la capa vectorial (`vectores.transicionMs`), sin fundidos.
- **Teclado global** (`teclado.js`): 1–9 y 0 abren vistas; F1–F4 y F6–F9 las ocho primeras (con `preventDefault`); Esc vuelve a COLISIÓN; F5, F11 y F12 no se interceptan. Táctil: tocar una pestaña. Las flechas, Enter y la escritura pertenecen a la vista activa.
- **Estado de interfaz compartido** (no es cronología; vive en memoria): `parejaSeleccionada` (por defecto `estado.parejaPrincipal`) y `tierraSeleccionada`. COLISIÓN y OSCILOSCOPIO comparten pareja; ÁRBOL, MONITOR y EXPEDIENTE comparten tierra.

**Contrato de una vista** (`js/vistas/*.js`):

```js
DENDRO.vistas.registrar({
  id: "colision", tecla: "1", titulo: "COLISIÓN", tituloCorto: "COL",
  crear(ctx) {          // ctx = { estado, ui, abrir(idVista, params), region() }
    return {
      dibujar(region),            // texto y marcos en la rejilla; se llama al abrir, al redimensionar y cuando la vista lo pide
      vectores(v, ahora),         // diagramas en la capa vectorial; cada fotograma si animada, si no, solo al marcarse sucia
      animada: true,
      tecla(ev), toque(punto), movimiento(punto),  // punto = { x, y } en celdas (decimales), ver §7.2
      detener(),
    };
  },
});
```

Las vistas leen **solo** del `Estado` del día (§4.7) y del estado de interfaz. Nunca calculan fechas ni tocan el canvas.

**V1 COLISIÓN** (principal):
- Arriba, el selector `◄ C-03 · CENIZA ⟷ ARBÓREA ►` (←/→ recorre las 12 parejas).
- Centro: los dos globos (§7.4) a izquierda y derecha. Su distancia horizontal es proporcional a `separacion`: de lejos hasta tocarse en el contacto. Entre ellos, una regla discontinua con la lectura de Δω.
- Si la pareja es hostil, arcos rojos (curvas cuadráticas por encima) del atacante a la víctima, con proyectiles animados y destellos de impacto. En `mutua-hostil`, en ambos sentidos.
- Desenlaces:
  - **Fusión**: los globos se superponen en uno solo.
  - **Aniquilación**: ambos globos se fragmentan y se apagan.
  - **Superviviente**: un globo dañado y, en el lugar del otro, restos.
- Texto vectorial grande con el estado (`T−3 DÍAS`, `CONTACTO`, `HOSTILIDADES` en rojo, `FUSIONADA`, …).
- Paneles en la rejilla: Δω actual / Δω₀, días al contacto, postura, agresor, armas.
- Una minigráfica vectorial de Δω de los 7 días de aproximación, con hoy marcado.
- En vertical (móvil) los globos van uno encima del otro.
- Sin convergencias activas (fase 0), muestra la pareja principal ESTABLE y el rótulo `SIN CONVERGENCIAS ACTIVAS`.

**V2 ÁRBOL**:
- Árbol fractal determinista (semilla fija, no cambia por día) en vectores blancos. El tronco nace abajo en el centro y las 24 tierras son nodos azules en las puntas.
- Parejas en aproximación: sus ramas se curvan una hacia otra en proporción a `1 − separacion`.
- Ataques: arcos rojos con proyectiles.
- Aniquiladas: nodo apagado y ramas que se desvanecen. Fusionadas: un solo nodo.
- Grietas en las ramas desde la fase 3, con semilla del día; en la fase 4, además partículas que se desprenden.
- Flechas recorren las tierras y Enter o clic abre su EXPEDIENTE. La leyenda de los cuatro colores va abajo.

**V3 MONITOR**:
- Cuadrícula de las 24 tierras en miniatura: 6 × 4 en escritorio y 3 × 4 por página en móvil (2 páginas).
- Cada celda lleva un globo pequeño, la designación, el estado abreviado y la barra de estabilidad. Las hostiles parpadean en rojo y las aniquiladas aparecen apagadas.
- Flechas mueven la selección y Enter abre el EXPEDIENTE.
- Al lado (o debajo en móvil), la **gráfica de ramas afectadas**:
  - eje X de `t1` a `tf` y eje Y logarítmico de 1 a R;
  - curva continua hasta hoy y `PROYECCIÓN` discontinua después, que se dibuja siempre;
  - **hasta la fase CRÍTICO** (fase < 4), el valor final del eje Y (R) y la fecha del colapso en el eje X se muestran como `???` con corrupción visual: algunos caracteres cambian, con la semilla del día y del fotograma;
  - desde la fase 4 se revelan (`1 048 576` y la fecha de `colapsoTotal`);
  - marca de hoy y la cifra grande en notación científica desde 10⁶.

**V4 OSCILOSCOPIO**, para la pareja seleccionada:
- Retícula en `ambarTenue` (`vectores.osciloscopio.divisiones`).
- Trazas:
  - `y_a = sin(2π·f_a·τ)`, en `tierra`.
  - `y_b = sin(2π·f_b·τ)`, en `tierra` tenue.
  - La suma `(y_a + y_b)/2`, en `ambar`, con su envolvente `|cos(π·Δf·τ)|` discontinua.
- Fórmulas:
  - `f_a = ciclosEnPantalla` por ancho de pantalla.
  - `f_b = f_a + latidosEnDeltaInicial · separacion`.
  - `τ` avanza con el tiempo real para que la onda corra.
- Al acercarse la pareja, los latidos se alargan. En el contacto (`separacion = 0`) las ondas quedan en fase y la envolvente es plana.
- Por estado:
  - Hostilidades: las trazas pasan a `arma`, con ruido sembrado.
  - Aniquilación: línea plana.
  - Fusión: una sola traza.
  - Superviviente: una traza con ruido.
- Lecturas en la rejilla: ω_a, ω_b, Δω, Δω₀ y latidos por pantalla. ←/→ cambia de pareja.

**V5 EXPEDIENTE**:
- Selector de tierra (←/→ o lista con ↑/↓).
- Globo grande con su estado (§7.4).
- Paneles de datos en la rejilla: designación, nombre, firma ω, régimen mágico, planos anexos, tecnología, carácter, pareja, postura y armas.
- **Barra de estabilidad** vectorial segmentada (0–100).
- **Línea temporal dibujada**: eje de `t0` a `tf` con marcas semanales y los eventos de la tierra como marcadores coloreados por tipo. ←/→ con Mayúsculas recorre los eventos y muestra su texto. El tramo futuro va rayado con `[DATOS NO DISPONIBLES]`.

**V6 REGISTRO**:
- Desplazamiento de eventos, del más reciente arriba.
- Filtros por tipo (SISTEMA, COLISIÓN, HOSTIL, CONTENCIÓN).
- Texto en la rejilla, con un histograma vectorial de eventos por día en la cabecera.

**V7 COMUNICACIONES**:
- Bandeja de mensajes; los no leídos parpadean.
- Los leídos se guardan en `localStorage`.

**V8 ARCHIVO**: carpetas y documentos con niveles de autorización decorativos.

**V9 CONTENCIÓN**:
- Acciones con barra de progreso vectorial y confirmación.
- Escriben en el registro local del operador.

**V0 TERMINAL** (secundaria):
- Registro de comandos `{ nombre, alias, ayuda, ejecutar(args, estado, ctx) }`.
- Historial con ↑/↓ y autocompletado con Tab.
- Comandos ocultos documentados en `04-lore.md`.
- `examinar <id>` y `colisiones` responden en texto y ofrecen abrir EXPEDIENTE y COLISIÓN (`ctx.abrir`).
- Con intensidad alta, a veces responde con basura o "TIEMPO DE ESPERA AGOTADO".
- El parser prueba primero la coincidencia más larga de palabras, para admitir comandos de varias palabras (`quien vigila`).
- **Latencia deliberada**:
  - Antes de responder, espera `minMs + (maxMs − minMs) · intensidad` con una variación de ±30 %.
  - Mientras espera, el cursor queda ocupado (`▒`) y no se admite otra entrada salvo Esc.
  - La variación usa el PRNG con semilla `hash(fecha + nº de comando de la sesión)`, nunca `Math.random()`.
- Tras el colapso solo acepta `colapso.comandosPermitidos`.

## 7. Estética

**Principios**:
- **Diseño propio de DENDRO** (RNF-07): no imitar interfaces, logos, tipografías de marca ni rótulos de películas o series.
- El lenguaje visual sale del propio mundo: el Árbol, las firmas ω, la instrumentación de fósforo.

**Monitor**: carcasa física (CSS) con botón de encendido, LED y serigrafía. Todo lo que va dentro del vidrio pasa por el tubo (§7.1).

**Paleta en uso**:
- Marcos, títulos, escalas y retículas en ámbar (`ambar` y `ambarTenue`).
- Datos y texto de contenido en blanco.
- Tierras, globos y trazas de firma en azul.
- Ramas del Árbol en blanco.
- Todo lo bélico (misiles, impactos, hostilidades) en rojo.

**Trazo de fósforo**:
- Líneas finas (`vectores.grosorLinea`); lo activo, más grueso.
- Contornos, tramas de puntos y rayados en vez de rellenos sólidos grandes.
- El brillo y la estela los pone el shader.

**Rejilla**:
- Bordes de paneles con caracteres de caja (`╔═╗║╚╝`, `┌─┐`).
- Cursor de bloque parpadeante.
- Texto vectorial grande (VT323 escalado) para las cifras y estados principales.

**Transiciones**: barrido de línea al cambiar de vista, no fundidos modernos.

**Error fatal (RF-08)**: franja de título con fondo `--ambar` y texto `--fondo`; cuerpo en `--texto` sobre `--fondo` con marco `--ambar`. Nunca texto blanco sobre ámbar.

**Sonidos**: tecla, beep de confirmación, alarma de dos tonos.

**Ambiente** (`sonido.js`), solo tras interacción y respetando silenciar:
- Transformador: senoidal a `frecuenciaRed` más armónicos 2.º y 3.º, filtrada por un pasa-bajos.
- Ventilador: ruido marrón por un pasa-banda (~300–600 Hz) con una modulación lenta de 0.2–0.5 Hz.
- La ganancia de cada uno es `base + (maximo − base) · intensidad`, recalculada al cargar el día.
- Al encender hay un golpe grave y el silbido agudo del fly-back (~15.7 kHz, muy bajo); al apagar, una caída del zumbido.

**Encendido y apagado** (`monitor.js`, RF-11): uniforms del haz en el shader o, en el respaldo, `transform: scale` + `filter: brightness` en CSS. Duraciones en `efectos.encendido` / `efectos.apagado`.

### 7.1 Tubo CRT (opción B, aprobada tras el prototipo)

Canalización por fotograma (`main.js` → `crt.js`):

1. **Rejilla** (`rejilla.js`): canvas 2D A, opaco, con fondo `fondo`. Se redibujan solo las filas sucias. Se sube a textura solo si cambió.
2. **Vectores** (`vectores.js`): canvas 2D B, transparente, del mismo tamaño. Se limpia y lo redibuja la vista activa cada fotograma si es `animada` (o si se marcó sucio). Se sube a textura solo si se redibujó.
3. **Fósforo**: `combinado = min(1, A + B)` (suma de luz; B está premultiplicado). Después `salida = max(combinado, previo · decaimiento − 1.5/255)`, en ping-pong entre dos framebuffers. El decaimiento es `persistencia^(dt·60)`, independiente de los fps.
4. **Tubo**: curvatura de barril, aberración que crece hacia los bordes, resplandor (8 muestras), scanlines que siguen la curva, máscara RGB, banda rodante, parpadeo, ruido, viñeta, reflejo y haz de encendido. Todo sale de `efectos.crt`. Ruido, parpadeo y banda se multiplican por la energía del haz, así que el tubo apagado no tiene nieve.

Además:
- **Resolución**: `min(devicePixelRatio, escalaMax) · calidad`, limitada a `pixelesMax`. Con `calidadAdaptativa`, si los fps bajan de 45 durante 3 s, la calidad baja un 20 % (mínimo 60 %).
- **Respaldo CSS** (sin WebGL, contexto perdido o `?webgl=0`): A y B se ven directamente, B encima con `mix-blend-mode: screen`. `crt.css` aporta scanlines, viñeta, reflejo, resplandor y parpadeo; la curvatura es solo de borde.
- **Movimiento reducido**: sin parpadeo, banda ni ruido animado. La persistencia se limita a 0.5 y la curvatura se mantiene.
- El ruido y la aberración se multiplican por `1 + escalaConIntensidad · intensidad`.

### 7.2 Rejilla y regiones (`rejilla.js`)

- La rejilla se dimensiona sola: `filas` objetivo, columnas entre `columnasMin` y `columnasMax`, y sobrebarrido `margen`.
- API pública (`DENDRO.pantalla`):
  - `raiz()`, `region(x, y, ancho, alto)`.
  - Por región: `escribir(x, y, texto, color, estilo)`, `centrar`, `derecha`, `rellenar`, `limpiar`, `caja(x, y, an, al, { titulo, doble, color })` (devuelve su interior como región), `region(...)` anidada con recorte, `desplazar(n)` y `vectores()` (§7.3).
  - Generales: `ponerCursor`, `ocultarCursor`, `leer(x, y)`, `textoPlano()`.
  - Puntero: `puntoEn(clientX, clientY)` → `{ x, y }` en celdas con decimales, deshaciendo la curvatura del tubo. `celdaEn` es su versión entera.
  - `alRedimensionar(fn)`, `info()`.
- Estilos: `{ inverso, tenue, parpadeo }`.
- Colores **por nombre** de `config.colores`.
- Los caracteres de caja y de bloque se dibujan con trazos propios para que unan sin huecos. Los glifos más anchos que la celda se comprimen.

### 7.3 Capa vectorial (`vectores.js`)

`region.vectores()` devuelve un contexto ligado a la región: el origen está en su esquina y recorta a sus bordes. **Unidades**:
- Posiciones en **celdas** (x en columnas, y en filas, con decimales), así los diagramas encajan con el texto.
- Longitudes (radios, tamaños de texto) en **altos de celda**; los círculos son redondos aunque la celda no sea cuadrada.
- Grosores en px CSS (`vectores.grosorLinea` por defecto).

Primitivas (modo inmediato, se llaman dentro de `vista.vectores(v, ahora)`):
- `linea(x1, y1, x2, y2, color, o)`, `polilinea(puntos, color, o)`, `poligono(puntos, color, o)`.
- `circulo(cx, cy, r, color, o)`, `arco(cx, cy, r, desde, hasta, color, o)` en radianes.
- `curva(x1, y1, cx, cy, x2, y2, color, o)`: cuadrática, para las trayectorias de misiles.
- `punto(x, y, color, o)`.
- `texto(x, y, texto, color, { tam, alinear })`: VT323 vectorial; `tam` en altos de celda.
- `globo(cx, cy, r, tierra, o)` (§7.4).

Opciones comunes `o`: `{ grosor, alfa, discontinua: [a, b], relleno: color, rellenoAlfa }`. Colores **por nombre**, como en la rejilla. `glitch.js` puede envolver el contexto para añadir temblor, cortes y desfases según la intensidad (RF-07).

### 7.4 Globos (`globo.js`)

**Modelo** (una vez por tierra, en caché; determinista):
- Semilla `hash(id)`. Se evalúa el ruido fBm 3D (`ruido.js`, `globo.octavas`) sobre la esfera en una malla `globo.resolucion` de lon × lat, y se umbraliza en el nivel que deja la fracción de océano `tierra.globo.mar` (o `nivelMarPorDefecto`).
- **Tierra Gris** (B-0x09) usa la máscara equirectangular de `data/tierra-gris.js` en vez del ruido.
- **Costas**: *marching squares* sobre la malla, convertidas a polilíneas de vectores 3D unitarios.
- **Trama de tierra**: `globo.puntos` puntos en espiral de Fibonacci sobre la esfera, marcados si caen en tierra.
- `rugosidad` ajusta la escala del ruido. `inestable` deforma el limbo y las costas con ruido animado.

**Dibujo** (cada fotograma):
- Rotación `t · gradosPorSegundo` más un desfase propio de la semilla, con inclinación `globo.inclinacion`. Proyección **ortográfica**.
- Se dibujan el limbo, la retícula (`meridianos` / `paralelos`, cara oculta omitida), las costas y la trama visibles, en `tierra`.
- El número de puntos baja con el radio (∝ r²), para que la cuadrícula de 24 globos siga a 60 fps.
- Opciones de estado (`o`):
  - `halo`: 0..1, pulso en la aproximación.
  - `danos`: 0..1. Impactos rojos (anillos y cruces en `arma`) en posiciones sembradas con `hash(pareja.id + "impactos")`; aparecen más con el progreso del ataque.
  - `fragmentacion`: 0..1. El globo se rompe en placas que se separan y se apagan.
  - `fusion`: el segundo modelo se dibuja superpuesto, con alfa.
  - `alfa`.

## 8. Pruebas

- `cronologia.js` es una función pura: incluir `tests/cronologia.test.html` que se abre en el navegador y verifica los criterios de aceptación de fechas (ver skill `verificar-cronologia`).
- Revisión manual de cada fase con `?fecha=`.
- Respaldo CSS: probar con `efectos.webgl: false` o `?webgl=0`.
- Globos: misma tierra → mismo globo en dos cargas; las 24 son distintas; Tierra Gris reconocible.
- Rendimiento: `?fps=1` en MONITOR (24 globos) ≥ 60 fps en escritorio.
