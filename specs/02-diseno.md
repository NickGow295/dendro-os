# 02 — Diseño técnico

> Fase SDD: **Planificar**. Define cómo se cumplen los requisitos de `01-requisitos.md`.

## 1. Decisiones de arquitectura

| Decisión | Elección | Motivo |
| --- | --- | --- |
| Stack | HTML + CSS + JavaScript puro | RNF-01: sin compilación, abre con doble clic |
| Carga de scripts | `<script>` clásicos (no módulos ES) con un espacio de nombres global `window.DENDRO` | Los módulos ES fallan con `file://`; así funciona con doble clic y en GitHub Pages |
| Render del mapa | `<canvas>` 2D | Fluido con muchas líneas y animaciones |
| Resto de la UI | DOM con texto monoespaciado | Seleccionable, accesible y fácil de estilizar |
| Fuente | `VT323` (Google Fonts, licencia OFL) con respaldo `IBM Plex Mono`, `monospace` | Aspecto de terminal |
| Aleatoriedad | PRNG `mulberry32` con semilla = hash(fecha + clave) | RNF-06 |
| Persistencia | `localStorage` solo para: ID de operador, sonido on/off, acciones de contención locales, "ya vio el arranque hoy" | Nada de la cronología depende de esto |

## 2. Estructura de archivos

```
dendro-os/
├── index.html              # carcasa: contenedor CRT, carga scripts en orden
├── config.js               # ★ TODO lo editable visual/temporal (ver §3)
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
│   │   ├── sonido.js       # Web Audio: beeps, alarmas, zumbido CRT
│   │   ├── teclado.js      # atajos globales, foco, navegación
│   │   └── glitch.js       # corrupción de texto y efectos según intensidad
│   ├── ui/
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
  },
  texto: { velocidadEscritura: 18 /* ms por carácter */ },
  sonido: { activadoPorDefecto: false, volumen: 0.35 },
  colapso: {
    tituloError: "ERROR FATAL 0x0000DEAD",
    mensajeError: [ /* líneas, ver 04-lore.md */ ],
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
  desenlace: "aniquilacion" | "fusion" | "superviviente:B-0x02" }
```

Las fechas de contacto de las parejas se acumulan hacia el final (la primera el 27/10, la última el 14/12). Desde el 16/12 el colapso total prevalece sobre cualquier estado de pareja. Estado de una pareja según `dd = d - contacto` (días):

| dd | Estado |
| --- | --- |
| < −7 | ESTABLE |
| −7 a −1 | APROXIMACIÓN (Δω cayendo) |
| 0 | CONTACTO |
| 1 a 3 | HOSTILIDADES (si postura hostil) / INTERFERENCIA (resto) |
| ≥ 4 | desenlace (ANIQUILADA, FUSIONADA, SUPERVIVIENTE) |

Δω de una pareja en aproximación: `Δω = Δω₀ · max(0, −dd) / 7`.

### 4.6 Eventos y registro

El registro de un día = eventos fijos de `data/eventos.js` con fecha ≤ hoy + eventos generados por las parejas (cambios de estado) + ruido generado con el PRNG de cada día (escaneos, latidos del sistema). Se regeneran desde cero cada vez, deterministas, sin guardarse.

### 4.7 Estado resultante

```js
Estado = {
  fecha, fase, nombreFase, nivelAlerta, p, intensidad,
  ramasAfectadas, diasParaColapso,
  tierras: [{ ...datos, estabilidad, estado, eventos: [...] }],
  parejas: [{ ...datos, estado, deltaOmega, diasParaContacto }],
  ataques: [{ desde, hacia, tipo, progreso }],   // para el mapa (rojo)
  registro: [...], mensajesDisponibles: [...],
  modulosCaidos: [...]
}
```

## 5. Pantallas y flujo

```
carga → ¿fase 5? ── sí ─→ COLAPSO (error fatal → arranque fallido → mapa desintegrándose → mensaje final)
           │
           no
           ↓
       ARRANQUE (saltable si ya se vio hoy) → ACCESO (ID operador) → ESCRITORIO ⇄ MÓDULOS
```

## 6. Diseño de cada módulo

- **Terminal (M1)**: registro de comandos `{ nombre, alias, ayuda, ejecutar(args, estado) }`. Historial con ↑/↓, autocompletado con Tab. Comandos ocultos documentados en `04-lore.md`. Con intensidad alta, a veces responde con basura o "TIEMPO DE ESPERA AGOTADO".
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
- Sonidos: tecla, beep de confirmación, alarma de dos tonos, zumbido de 60 Hz muy bajo.

## 8. Pruebas

- `cronologia.js` es una función pura: incluir `tests/cronologia.test.html` que se abre en el navegador y verifica los criterios de aceptación de fechas (ver skill `verificar-cronologia`).
- Revisión manual de cada fase con `?fecha=`.
