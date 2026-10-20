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
| Tiempo | El motor trabaja con **instantes** (ms desde la época Unix) truncados al minuto; la interfaz solo muestra meta-tiempo τ (§4.2) | RF-01, RF-14 |
| Aleatoriedad | PRNG `mulberry32` con semilla = hash(clave + fecha, minuto o semilla fija del catálogo) | RNF-06 |
| Multiverso | Catálogo generado una vez por carga con semilla fija (§4.4), en caché; el `Estado` lo referencia por código | RF-15: no cambia con el día |
| Credencial | Hash SHA-256 (implementación propia, síncrona) con sal; solo el hash vive en `config.js` | RF-18; `crypto.subtle` no está garantizado con `file://` |
| Persistencia | `localStorage` solo para: ID de operador, sonido on/off, mensajes leídos, acciones de contención locales, desbloqueos, credencial de dirección (su hash), "ya vio el arranque hoy" | Nada de la cronología depende de esto; la credencial solo cambia lo que se puede ver |

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
│   ├── myth.js             # MYTH, las 13 ramas primarias (joven/salto) y los cinco guardianes
│   ├── tierras.js          # las 24 tierras nombradas, con su código y aspecto de globo
│   ├── tierra-gris.js      # máscara de continentes de nuestra Tierra
│   ├── generacion.js       # tablas para generar ramas: regímenes, tecnologías, posturas
│   ├── colisiones.js       # parejas nombradas (instantes de contacto, posturas) y armas
│   ├── eventos.js          # eventos fijos del registro por instante
│   ├── revelaciones.js     # instantes de los hitos de la historia (órdenes ocultas, silueta, vislumbres)
│   ├── mensajes.js         # canales general y de dirección
│   ├── archivo.js          # manuales, procedimientos y clasificados
│   └── protocolos.js       # protocolos de contención
├── css/
│   ├── base.css            # carcasa del monitor y layout (colores vía variables de config.js)
│   └── crt.css             # respaldo CSS sin WebGL
├── js/
│   ├── nucleo/
│   │   ├── prng.js         # mulberry32 + hash de cadenas
│   │   ├── ruido.js        # ruido 3D con semilla (fBm) para los continentes
│   │   ├── reloj.js        # instante actual (real o ?fecha=, corriendo o congelado), zona horaria
│   │   ├── tau.js          # conversión instante → τ y formatos (§4.2)
│   │   ├── multiverso.js   # ★ catálogo de ramas y parejas generadas (§4.4–4.5)
│   │   ├── cronologia.js   # ★ calcula el ESTADO de un instante (§4)
│   │   ├── sha256.js       # hash de la credencial
│   │   ├── tema.js         # colores de config a variables CSS, canvas, shader y rampa rama→arma
│   │   ├── sonido.js       # Web Audio: beeps, alarmas, ambiente (transformador + ventilador)
│   │   ├── teclado.js      # campo oculto de texto, foco, teclas que no se tocan
│   │   ├── glitch.js       # corrupción de texto y de trazos según intensidad
│   │   ├── local.js        # estado local del operador: registro de acciones, leídos, desbloqueos, credencial
│   │   └── crt.js          # shader WebGL del tubo (§7.1); si falla, activa el respaldo CSS
│   ├── ui/
│   │   ├── rejilla.js      # rejilla de caracteres + regiones (§7.2)
│   │   ├── vectores.js     # capa vectorial: líneas, lotes, arcos, polígonos, texto grande (§7.3)
│   │   ├── globo.js        # modelo y dibujo de los globos de alambre (§7.4), caché limitada
│   │   ├── lista.js        # lista filtrable reutilizable (selector de parejas, objetivos)
│   │   ├── monitor.js      # encendido / apagado del tubo (RF-11)
│   │   └── escritor.js     # consola desplazable + máquina de escribir
│   ├── pantallas/
│   │   ├── arranque.js     # RF-02
│   │   ├── acceso.js       # RF-03
│   │   ├── escritorio.js   # RF-04: marco, enrutador de vistas, actualización por minuto
│   │   └── colapso.js      # RF-08
│   ├── vistas/             # cada vista se registra en DENDRO.vistas (§6)
│   │   ├── comun.js        # colores y abreviaturas de estado, barra de estabilidad, gráfica de historia de pareja
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
│   └── main.js             # arranque de la app, bucle de fotogramas, gestos, reloj por minuto
└── README.md
```

Orden de carga en `index.html`: `config.js` → `data/*.js` → `js/nucleo/*` (prng, ruido, reloj, tau, multiverso, cronologia, …) → `js/ui/*` → `js/pantallas/*` → `js/vistas/*` → `js/main.js`.

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
    inicioAlerta: "2026-10-20T00:00",     // instantes locales en zonaHoraria
    primeraColision: "2026-10-27T03:17",
    inicioRectaFinal: "2026-12-16T00:00",
    colapsoTotal: "2026-12-16T14:00",
    ramasAfectadasFinal: 1048576,          // contador estadístico al llegar al colapso
    refrescoSegundos: 60,                  // recálculo del Estado con la página abierta
  },
  tau: {                                   // meta-tiempo (§4.2, 04-lore.md §1.2)
    epoca: "2006-03-14T00:00",             // τ 0.000, en zonaHoraria
    segundosPorCiclo: 86400,
    pulsosPorCiclo: 1000,
    latidosPorPulso: 100,
  },
  multiverso: {                            // catálogo generado (§4.4) y cascada (§4.5)
    semilla: "DENDRO·CATALOGO·1",          // fija: el catálogo no cambia con el día
    hijosPorNivel: { 2: [4, 7], 3: [4, 6], 4: [3, 5] }, // el nivel 1 son las 13 primarias de data/myth.js
    ramasMin: 1500, ramasMax: 2000,
    regimen: { "Mundana": 0.40, "Mágica baja": 0.25, "Mágica alta": 0.25, "Inestable": 0.10 },
    regimenJoven: { "Mundana": 0.20, "Mágica baja": 0.25, "Mágica alta": 0.25, "Inestable": 0.30 },
    postura: { "hostil": 0.22, "mutua-hostil": 0.08, "evacuacion": 0.15, "aislamiento": 0.15, "negociacion": 0.15, "ignorancia": 0.25 },
    desenlace: { "aniquilacion": 0.40, "superviviente": 0.35, "fusion": 0.25 },
    cascada: {
      parejasGeneradas: 780,               // contactos catalogados generados hasta el colapso
      curvatura: 10,                       // b de §4.5: más alto, más concentrados al final
      fraccionPrimas: 0.15,                // parejas entre primas en vez de hermanas
    },
    ventanas: {                            // en ciclos; se comprimen cerca del colapso (§4.5)
      aproximacionMax: 7, factorAproximacion: 3,
      tramoMax: 4, factorTramo: 0.5,       // contacto + hostilidades / interferencia
      contactoMax: 1,                      // duración máxima del estado CONTACTO
      inicioAtaque: 2 / 7,                 // fracción final de la aproximación en que el agresor dispara
    },
    cacheGlobos: 64,                       // modelos de globo de ramas generadas en memoria
  },
  acceso: {
    sal: "DENDRO·DIR·",
    hashDireccion: "…",                    // sha256(sal + clave normalizada), en hexadecimal
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
    rampaPasos: 8,            // tonos de la rampa rama → arma (§7)
    globo: {
      puntos: 1400,           // puntos de la trama de tierra en un globo grande (se reduce con el radio)
      resolucion: [96, 48],   // malla lon × lat donde se evalúa el ruido de continentes
      octavas: 4,
      nivelMarPorDefecto: 0.55, // fracción de océano si la tierra no define la suya
      meridianos: 12, paralelos: 7,
      gradosPorSegundo: 6,    // rotación
      inclinacion: 18,        // grados del eje hacia el observador
    },
    arbol: {
      zoomMax: 40,            // aumento máximo del ÁRBOL
      misilesMax: 80,         // trazos de misil animados a la vez
    },
    osciloscopio: {
      divisiones: [10, 8],    // retícula
      ciclosEnPantalla: 18,   // ciclos de la portadora visibles
      latidosEnDeltaInicial: 4, // latidos visibles cuando Δω = Δω₀ (§6, V4)
      gananciaMin: 0.35,      // amplitud de la suma lejos del contacto (sube a 1)
      saturacion: 0.8,        // recorte de la señal en el contacto
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
    colapsoEnVivo: { rafagaMs: 2200 }, // glitches antes del error cuando el colapso llega con la página abierta
  },
  contencion: {
    mejoraMs: 30000,          // cuánto dura la mejora visual de un protocolo
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
    mensajeError: [ /* líneas, ver 04-lore.md §13; {ramas} se sustituye por ramasAfectadasFinal */ ],
    comandosPermitidos: ["semilla"],          // lo único que acepta la terminal tras el colapso
  },
  debug: {
    permitirFechaURL: true,      // ?fecha=AAAA-MM-DD[Thh:mm] y &congelar=1
    permitirParametrosURL: true, // ?webgl=0, ?fps=1 y ?debug=1 para revisar en móvil sin editar config.js
    mostrarPanelDebug: false,
    mostrarFPS: false,
  },
};
```

`tema.js` copia los colores a variables CSS (`--ambar`, `--texto`, `--tierra`, `--rama`, `--arma`, …) y calcula la rampa `rampa0…rampa7` entre `rama` y `arma`. Ningún archivo CSS ni JS usa colores literales: siempre variables CSS, `DENDRO_CONFIG.colores` o los nombres de la rampa.

## 4. Motor de cronología

`DENDRO.cronologia.calcularEstado(instante) → Estado`. `instante` es un número (ms Unix) o una cadena local `"AAAA-MM-DDThh:mm"` en la zona de config; se trunca al minuto. Función pura: el mismo minuto da el mismo `Estado`. No toca `document` a nivel superior, para poder ejecutarse en Node (skill `verificar-cronologia`). `fase` es un número (0–5) y `nombreFase` su texto. Todo módulo lee de `Estado`; ninguna vista hace aritmética de fechas.

### 4.1 Reloj (`reloj.js`)

- `instanteActual()`: el real o el simulado, truncado al minuto. Con `?fecha=`, el reloj **arranca** en ese instante y sigue corriendo al ritmo real (`base + (Date.now() − carga)`); con `&congelar=1`, queda fijo. Sin hora se usa las 12:00.
- `aInstante("AAAA-MM-DDThh:mm")`: cadena local de `zonaHoraria` → ms Unix. El desfase de la zona se obtiene con `Intl.DateTimeFormat` (dos iteraciones, por si cambia la hora oficial), sin bibliotecas.
- `diaLocal(ms)`: `"AAAA-MM-DD"` en la zona de config (para semillas por día y para "ya vio el arranque hoy").
- `alCambiarMinuto(fn)` y `alLlegar(ms, fn)`: temporizadores alineados al minuto y al instante exacto del colapso.

### 4.2 Meta-tiempo τ (`tau.js`)

```
τ(ms) = (ms − aInstante(tau.epoca)) / (1000 · segundosPorCiclo)       # ciclos con decimales
```

- `tau.de(ms)` → número. `tau.instante(ms)` → `"τ 7532.137"`. `tau.reloj(ms)` → `"τ 7532.137·42"` (con latidos, para la barra).
- `tau.duracion(ms)` → `"3.208 c"` (≥ 1 ciclo), `"412 p"` (< 1 ciclo), `"37 l"` (< 1 pulso). `tau.cuenta(restante)` → `"T−3.208 c"` si `restante > 0` (falta) y `"T+412 p"` si ya pasó; `restante` es, p. ej., `pareja.paraContacto`.
- `tau.corto(ms)` → `"7532.137"` (registro).
- Es la **única** vía por la que un instante llega a la pantalla. El panel de depuración puede mostrar además la fecha real.

### 4.3 Progreso, fases e intensidad

```
t0 = inicioAlerta, t1 = primeraColision, tr = inicioRectaFinal, tf = colapsoTotal, t = instante

p = clamp((t − t1) / (tf − t1), 0, 1)          # continuo, por minutos
```

| Fase | Condición | Nivel de alerta |
| --- | --- | --- |
| 0 NOMINAL | t < t0 | VERDE |
| 1 ANOMALÍA | t0 ≤ t < t1 | ÁMBAR |
| 2 CONTACTO | t1 ≤ t y p < 0.35 | NARANJA |
| 3 CASCADA | 0.35 ≤ p < 0.8 | ROJO |
| 4 CRÍTICO | 0.8 ≤ p, t < tf | NEGRO |
| 5 COLAPSO | t ≥ tf | — |

`rectaFinal = tr ≤ t < tf` (dentro de la fase 4).

```
intensidad = fase < 2 ? 0.05 · fase : rectaFinal ? 1 : 0.1 + 0.9 · p²      (× efectos.glitchMaximo)
ramas afectadas = t < t1 ? 0 : round(2 · (R/2)^p)                            (R = ramasAfectadasFinal)
```

Usos de la intensidad: corrupción de líneas de registro, glitches, fallos de órdenes. Umbrales de módulos caídos (constantes con nombre en `cronologia.js`): p ≥ 0.5 COMUNICACIONES pierde mensajes (algunos llegan corruptos); p ≥ 0.7 MONITOR con lecturas erráticas a ratos; p ≥ 0.9 CONTENCIÓN responde "SIN ENERGÍA EN EL SUSTRATO".

### 4.4 Catálogo del multiverso (`multiverso.js`)

`DENDRO.multiverso.catalogo()` → `{ nodos, porCodigo, total, parejas }`, calculado una vez (memoizado) a partir de `config.multiverso.semilla`, `data/myth.js`, `data/tierras.js`, `data/generacion.js` y `data/colisiones.js`. No depende del instante.

**Árbol**:
1. Raíz `MYTH`. Nivel 1: las 13 primarias de `data/myth.js`, con su código y su origen (`antigua` o `joven`, con `salto` 1–7).
2. Niveles 2–4: cada nodo recibe entre `hijosPorNivel[n]` hijos (PRNG con semilla `hash(semilla + código del padre)`). Las hojas son el nivel 4.
3. **Códigos**: segmentos de 2, 3, 2 y 1 caracteres del alfabeto `0-9A-Z` sin `I` ni `O`, generados con la semilla del padre y sin repetir entre hermanos.
4. **Reservas**: antes de generar los hijos de un nodo, se insertan los caminos de las 24 tierras nombradas (y el de Sarmiento, que se marca `baja: true` y no se dibuja). Los hijos generados evitan esos segmentos. Las nombradas que no sean hojas reciben hijos como cualquier nodo.
5. El total debe quedar entre `ramasMin` y `ramasMax` (contando MYTH y sin Sarmiento); una prueba lo comprueba (§8).

**Datos de cada nodo**: `{ codigo, padre, nivel, hijos, primaria, joven, salto, omega, regimen, tecnologia, semillaGlobo, globo, nombrada, nombre? }`. Las nombradas copian sus datos de `data/tierras.js`. Las generadas:
- `omega` = ω del padre + desviación sembrada que se reduce con el nivel (las primarias: dispersas en 0.3–9.5); hermanas entre 0.0003 y 0.05 de distancia.
- `regimen` según `regimen` o `regimenJoven` en los niveles 1–3; en el nivel 4 (ramillas de Everett, misma X₇) se hereda del padre (`00-arbol-imaginario.md §3 y §7`). `tecnologia` de la tabla (en el nivel 4, la del padre con probabilidad 0.7); `globo` con `mar`, `rugosidad` e `inestable` sembrados.

**Disposición** (`DENDRO.multiverso.disposicion()`, memoizada): coordenadas normalizadas para el ÁRBOL, tronco abajo en el centro. Las primarias se reparten el abanico en proporción a sus hojas; por debajo, cada nodo abre a sus hijos alrededor de su propia dirección (semiabertura creciente por nivel), también según sus hojas; largo decreciente por nivel y una pequeña desviación sembrada para que parezca orgánico. Incluye los segmentos (con nivel y nodo hijo), la posición de cada nodo y una rejilla espacial para buscar el nodo más cercano a un punto.

### 4.5 Parejas y cadena exponencial

**Parejas nombradas**: las 12 de `data/colisiones.js`, con `contacto` como instante local `"AAAA-MM-DDThh:mm"`:

```js
{ id: "C-01", a: "MYTH·4K·7A2·R9", b: "MYTH·4K·7A2·T3", contacto: "2026-10-27T03:17",
  postura: "hostil" | "mutua-hostil" | "evacuacion" | "aislamiento" | "negociacion" | "ignorancia",
  agresor: "MYTH·4K·7A2·T3" | null,
  armas: { "MYTH·4K·7A2·T3": ["misil-interrama"] },
  desenlace: "aniquilacion" | "fusion" | "superviviente:<código>" | "colapso" }
```

**Parejas generadas** (`catalogo().parejas`, memoizado):
1. Candidatas: pares de hermanas sin pareja (y, con probabilidad `fraccionPrimas`, de primas de la misma primaria), excluyendo MYTH, las 13 primarias, las nombradas, Sarmiento y los nudos por los que pasa el camino de una nombrada (para que el padre de Halcyon no se aniquile antes que Halcyon). Cada rama entra en una pareja como mucho. Cada pareja guarda su `grupo` (0–6 por salto, 7–12 las antiguas).
2. **Orden**: por grupo de su primaria (salto 1, 2, …, 7 y después las antiguas) y, dentro del grupo, barajado con semilla. Se toman las `parejasGeneradas` primeras. Este orden es el patrón que descubre la Sección de Firmas.
3. **Instante de contacto** de la j-ésima (j = 1…K):
   ```
   x_j = log2(1 + j · (2^b − 1) / K) / b          # b = cascada.curvatura
   contacto_j = t1 + x_j · (tf − t1)              # redondeado al minuto, siempre < tf
   ```
   Así el número de contactos generados hasta t es `K · (2^(b·x) − 1) / (2^b − 1)`: exponencial. Con K = 780 y b = 10, la primera toca ~6 c después de C-01 y en las últimas 14 horas tocan ~60.
4. Postura, desenlace y armas con las proporciones de config y semilla `hash(id)`. Ids `C-0013`, `C-0014`… por orden de contacto.

**Ventanas** (iguales para nombradas y generadas; se comprimen cerca del colapso). Con `r = tf − contacto`:

```
A = min(aproximacionMax, factorAproximacion · r)     # aproximación
H = min(tramoMax, factorTramo · r)                   # contacto + hostilidades/interferencia
K = min(contactoMax, H / 4)                          # parte de H con estado CONTACTO
```

Para C-01 (r ≈ 50 c) son 7 c, 4 c y 1 c: igual que antes en días (un día de contacto, tres de hostilidades, desenlace al cuarto). Para C-12 (r ≈ 1.58 c), A ≈ 4.75 c (empieza el 10/12, como dice el registro) y H ≈ 0.79 c.

**Estado de una pareja** según `dt = t − contacto`:

| dt | Estado |
| --- | --- |
| < −A | ESTABLE |
| −A ≤ dt < 0 | APROXIMACIÓN (Δω cayendo) |
| 0 ≤ dt < K | CONTACTO |
| K ≤ dt < H | HOSTILIDADES (si postura hostil) / INTERFERENCIA (resto) |
| ≥ H | desenlace (ANIQUILADA, FUSIONADA, SUPERVIVIENTE; COLAPSO para C-12) |

Desde `tf` el colapso prevalece sobre cualquier estado.

- `Δω = Δω₀ · clamp(−dt / A, 0, 1)`; `Δω₀ = |ω_a − ω_b|` (nunca se escribe). `separacion = Δω / Δω₀`.
- **Ataques**: postura hostil y `−inicioAtaque · A ≤ dt < H`. En `hostil` solo ataca el agresor; en `mutua-hostil`, el otro responde desde el contacto. Cada ataque es `{ pareja, desde, hacia, tipo, progreso }` con `progreso` en 0..1 dentro de la ventana de ataque.
- **Estabilidad** (0–100): ESTABLE 100; APROXIMACIÓN `100 − 60 · (1 + dt/A)`; CONTACTO 25; HOSTILIDADES / INTERFERENCIA 10; ANIQUILADA o perdedora 0; superviviente 35; FUSIONADA 40.
- **Fusión**: desde el desenlace, las dos ramas se muestran como un único nodo con nombre compuesto (o `código ∪ código`) y ω medio.
- **Desvanecimiento** (para el OSCILOSCOPIO y las gráficas): `desvanecimiento = clamp((dt − H) / (H / 2), 0, 1)` desde el desenlace.

**Pareja principal** (la que abre COLISIÓN), en este orden: la nombrada activa (CONTACTO, HOSTILIDADES, INTERFERENCIA) de contacto más reciente; si no hay, cualquier activa de contacto más reciente; la de APROXIMACIÓN más próxima al contacto (nombradas primero); la ESTABLE de contacto más próximo; si todo está resuelto, la de desenlace más reciente.

**Serie de firmas** para las gráficas (§6): `DENDRO.cronologia.serieFirmas(pareja, n)` → `{ puntos: [{ tau, instante, wa, wb, futuro }], marcas: { aproximacion, contacto, tramo, desenlace, destruidas, fusion } }` entre `contacto − 1.3·A` y `contacto + 2·H`. Las firmas convergen hacia el ω medio: `wa = ω̄ + s·Δω/2`, `wb = ω̄ − s·Δω/2` (s = signo de ω_a − ω̄). Tras el desenlace: en fusión, `wa = wb = ω̄`; la rama destruida pasa a `null` (la curva se corta) con una marca roja en su último punto. Es pura: se puede llamar desde las vistas. Desde `tf` las dos pasan a `null`. `serieDeltaOmega(pareja, n)` da la minigráfica de Δω de COLISIÓN con el mismo criterio.

### 4.6 Cohesión de MYTH

```
C(t)   = contactos catalogados (nombrados + generados) con contacto ≤ t
Cf     = contactos catalogados totales antes de tf
base   = 1 − C(t) / (Cf + 1)                           # baja un escalón con cada contacto; sigue la curva exponencial
N̂(t)  = base · (t ≥ contacto de C-12 ? 0.5 : 1) · (rectaFinal ? (tf − t) / (tf − tr) : 1)
N̂ = 0 desde tf
```

Con los valores de config: N̂ ≈ 0.99 a principios de noviembre, cruza 0.60 el 12-09 a las 21:05 (el evento fijo y la caída de Calcina están en ese minuto), ≈ 0.19 justo antes de C-12, ≈ 0.10 después y 0 a las 14:00 del 16/12. Monótona no creciente. Los instantes de los eventos fijos que citan N̂ se ajustan al cruce real al implementar. `Estado.myth = { cohesion, guardianes: [{ id, nombre, titulo, cae, caido }] }` con los instantes de caída de `data/myth.js`.

### 4.7 Eventos, registro y revelaciones

El registro de un instante = eventos fijos de `data/eventos.js` con instante ≤ t + eventos de las parejas + ruido sembrado por día, todo filtrado a `instante ≤ t`. Se regenera desde cero, determinista, sin guardarse.

- **Fijos**: `{ instante, tipo, texto, tierras }`. Algunos ya traen el texto con `░` (corruptos fijos, pistas de §7 del lore).
- **De pareja**: nombradas, todos (convergencia, ataques, contacto, interferencia u hostilidades, desenlace); generadas, solo contacto, primer ataque y desenlace. Si en un mismo pulso coinciden más de 3 contactos generados, se agrupan en una línea.
- **Ruido**: el de cada día `x` usa la semilla `hash(x + "ruido")` y horas sembradas; solo aparece al pasar su minuto, así que el registro crece en vivo.
- **Corrupción visual**: semilla `hash(díaLocal(t) + "corrupcion")` con probabilidad `intensidad · 0.35`. El texto original no cambia.

**Revelaciones**: `data/revelaciones.js` define los hitos de la historia (`omegaI`, `viaIII`, `sarmiento`, `injertador`, `vislumbres`, `eficacia`, `manifiesto`, `silueta`). `Estado.hitos` los resuelve a booleanos y `Estado.silueta` da `{ visible, opacidad }` (0.15 al aparecer, 1 en el último minuto, nada desde `tf`); las vistas y la terminal preguntan `estado.hitos.sarmiento`, nunca fechas.

**Mensajes y archivo**: cada mensaje tiene `canal` (`general` | `direccion`) e `instante`; cada documento, `carpeta`, `codigo`, `rev`, `emitido` / `revisado` en τ, `clasificacion`, `aprobado`, `clasificado` (necesita credencial), opcionalmente `desde` (no existe antes; su revisión es ese instante), `desbloqueo` (orden de la terminal) y `revision: { desde, rev, texto }` (una revisión que llega en vivo). Una línea puede ser `{ direccion, sello }`: solo se lee con credencial. Las líneas de mensaje que empiezan por `──` son filetes de anexo. `Estado.mensajes` contiene los ya emitidos de ambos canales; `Estado.archivo`, los ya emitidos. Qué se puede **leer** lo decide la vista con `DENDRO.local.credencial()`, no el motor.

### 4.8 Estado resultante

```js
Estado = {
  instante, tau,                                 // ms truncado al minuto y su τ en ciclos
  dia,                                           // "AAAA-MM-DD" local: solo semilla de PRNG por día, nunca se muestra
  fase, nombreFase, nivelAlerta, rectaFinal, p, intensidad,
  ramasAfectadas, ramasCatalogadas,              // contador estadístico / total del catálogo
  enColision,                                    // ramas catalogadas en contacto o después
  paraColapso,                                   // ms hasta tf (0 tras el colapso)
  myth: { cohesion, guardianes },
  tierras: { porCodigo(c), nombradas: [...] },   // estado, estabilidad, pareja, fusionadaCon, eventos
  parejas: [{ ...datos, nombrada, estado, hostil, deltaOmega0, deltaOmega, separacion,
              paraContacto,                      // ms con signo
              ventanas: { A, H, K }, desvanecimiento }],
  activas: [...ids],                             // en aproximación, contacto, hostilidades o interferencia
  parejaPrincipal: "C-03",
  ataques: [{ pareja, desde, hacia, tipo, progreso }],
  armas: { [tipo]: { nombre, descripcion } },
  registro: [{ instante, tau, tipo, texto, tierras, origen, corrupta }],
  mensajes: [...], archivo: [...], protocolos: [...],
  hitos: { omegaI, sarmiento, vislumbres, silueta, … },
  silueta: { visible, opacidad },                // RF-17, lore §3.1
  ejes: { desde: t0, hasta: tf, serieRamas: [{ tau, valor, futuro }], serieCohesion: [{ tau, valor, futuro }] },
  modulosCaidos: [...]
}
```

Para no recorrer ~1 900 ramas cada minuto, las ramas sin pareja activa no se copian: `tierras.porCodigo(c)` devuelve el nodo del catálogo con su estado (ESTABLE si no tiene pareja; `null` para Sarmiento o un código desconocido; MYTH con su `cohesion`), calculado al pedirlo y memoizado en ese `Estado`. `tierras.nombradas` trae las 24 con su estado y sus eventos. Las parejas llevan `nombrada`. El registro base (todo lo que ocurre hasta `tf`) se calcula una vez y cada minuto solo se recorta.

## 5. Pantallas y flujo

```
carga → MONITOR APAGADO ──(botón o tecla: habilita audio)──→ ENCENDIDO (RF-11)
                                                                  │
                     ┌──────────── ¿fase 5? ──────────────────────┘
                     │
                     ├─ sí ─→ COLAPSO (error fatal → [tecla] → arranque fallido → Árbol desintegrándose → semilla [+ τ desde el colapso])
                     │
                     └─ no ─→ ARRANQUE (saltable si ya se vio hoy) → ACCESO (ID operador) → ESCRITORIO [COLISIÓN] ⇄ VISTAS
                                                                                                 │
                                    cada minuto: nuevo Estado → escritorio.actualizar(estado)    │
                                    al llegar a tf: ráfaga de glitches → COLAPSO (error fatal)   │
                                                          `salir` / botón ─→ APAGADO ─→ MONITOR APAGADO
```

**Reloj vivo** (`main.js`): `reloj.alCambiarMinuto` recalcula el `Estado` y lo entrega a la pantalla activa (`actualizar(estado)`); el CRT y el sonido reciben la nueva intensidad. `reloj.alLlegar(tf)` dispara el colapso en vivo aunque el minuto no haya cambiado aún: `efectos.colapsoEnVivo.rafagaMs` de glitches crecientes, el tubo se contrae a una línea y se abre con el error fatal. Si el monitor está apagado, al encender ya entra en COLAPSO.

**Arranque por fase** (`pantallas/arranque.js`, RF-02). Todo sale del `Estado` y del PRNG con semilla del día, y las esperas se alargan con `1 + intensidad` (como mucho el doble):

| Fase | Variante |
| --- | --- |
| 0 | Todo en `[ OK ]` |
| 1 | Añade `ADVERTENCIA: ANOMALÍA DE FIRMA` |
| ≥ 2 | Sectores degradados, convergencias activas, ramas afectadas y algún `[ AVISO ]` |
| ≥ 3 | `[ ERROR ]` con reintento, la calibración se atasca una vez y los aislantes quedan por debajo del 100 %; enlace `DEGRADADO` |
| 4 | Meta-tiempo `IRREGULAR`, enlace `INESTABLE`, advertencia de pérdida de cohesión de MYTH con su N̂ |

Las vistas caídas (§4.3) salen en `[ FALLO ]`. El arranque muestra τ, nunca fechas, y precalcula el catálogo y los modelos de MYTH y las 24 nombradas.

**Acceso** (`pantallas/acceso.js`, RF-03): ID de 1–12 caracteres (A-Z, 0-9, guion), recordado en `localStorage`. El texto entra por el campo oculto de `teclado.js`, que también abre el teclado del móvil.

## 6. Escritorio y vistas

**Marco del escritorio** (`pantallas/escritorio.js`):
- Fila superior: pestañas de las vistas (`1 COLISIÓN  2 ÁRBOL  …  0 TERMINAL`). La activa va en inverso ámbar; las caídas por umbral (§4.3), tachadas. Con menos de 80 columnas se abrevian (`1 COL 2 ÁRB …`).
- Fila inferior, barra de estado: `τ 7532.137·42 │ FASE 2 CONTACTO │ ALERTA NARANJA │ RAMAS 2 │ N̂ 0.94 │ OPERADOR NT7 ◆DIR` (`◆DIR` con credencial). El reloj τ se redibuja cada latido (0.864 s). En estrecho: `7532.137 │ F2 │ NARANJA │ 2 │ N̂.94`.
- Centro: la región de la vista activa. Al cambiar de vista hay un barrido de línea en la capa vectorial (`vectores.transicionMs`), sin fundidos.
- **Teclado global**: 1–9 y 0 abren vistas; F1–F4 y F6–F9 las ocho primeras (con `preventDefault`); Esc vuelve a COLISIÓN (o cierra la lista o el diálogo abierto en la vista); F5, F11 y F12 no se interceptan. Táctil: tocar una pestaña.
- **Estado de interfaz compartido** (no es cronología; vive en memoria): `parejaSeleccionada` (por defecto `estado.parejaPrincipal`), `tierraSeleccionada`, `efectosContencion` (mejoras transitorias, §6 V9) y la cámara del ÁRBOL. COLISIÓN, OSCILOSCOPIO y CONTENCIÓN comparten pareja; ÁRBOL, MONITOR, EXPEDIENTE y CONTENCIÓN comparten tierra.

**Contrato de una vista** (`js/vistas/*.js`):

```js
DENDRO.vistas.registrar({
  id: "colision", tecla: "1", titulo: "COLISIÓN", tituloCorto: "COL",
  crear(ctx) {          // ctx = { estado (getter: siempre el último), ui, abrir(idVista), region(), redibujar(), salir() }
    return {
      iniciar(),                  // tras el primer dibujar(): pide texto, arranca temporizadores
      dibujar(region),            // texto y marcos en la rejilla; al abrir, al redimensionar y cuando la vista lo pide
      vectores(v, ahora),         // diagramas en la capa vectorial; cada fotograma si animada, si no, solo al marcarse sucia
      animada: true,
      actualizar(estado),         // opcional: nuevo minuto. Si no existe, el escritorio vuelve a crear la vista
                                  // con el nuevo Estado (el estado de interfaz compartido se conserva)
      tecla(ev), toque(punto), movimiento(punto),  // punto = { x, y } en celdas (decimales), relativo a la región de la vista
      gesto(g),                   // opcional: { tipo: "rueda" | "arrastre" | "pellizco", punto, dx, dy, factor }
      capturaTeclado: false,      // true: las cifras llegan a la vista en vez de cambiar de pestaña (TERMINAL, filtros)
      usaTab: false,              // true: Tab llega a la vista (listas, carpetas, canales, tierras del ÁRBOL)
      capturaEscape(),            // opcional: true si Esc debe cerrar algo de la vista en vez de volver a COLISIÓN
      detener(),
    };
  },
});
```

Las vistas leen **solo** del `Estado` que reciben (al crearse o en `actualizar`), del estado de interfaz y de las funciones puras del motor (`serieFirmas`, `multiverso.disposicion`, `tau.*`). Las que tienen estado local que no debe perderse cada minuto (TERMINAL, COMUNICACIONES, ARCHIVO, CONTENCIÓN, REGISTRO, EXPEDIENTE) implementan `actualizar`. Nunca muestran fechas ni tocan el canvas.

**Gestos** (`main.js`): un puntero que se mueve más de media celda con el botón pulsado es `arrastre` (y deja de ser toque); dos punteros táctiles son `pellizco`; la rueda es `rueda`. Solo los reciben las vistas que implementan `gesto`.

**Lista filtrable** (`ui/lista.js`, la usan COLISIÓN y CONTENCIÓN): ventana sobre la vista con un campo de filtro (texto libre por código, nombre o id; entra por `teclado.pedirTexto`, así que funciona en móvil), chips de estado (`APROX`, `CONTACTO`, `HOSTIL`, `INTERF`, `RESUELTAS`, `NOMBRADAS`) que se alternan con Tab o tocándolos, filas navegables con ↑/↓ y RePág/AvPág, Enter elige, Esc cierra. Mientras está abierta, la vista declara `capturaTeclado`.

**V1 COLISIÓN** (principal):
- Arriba, el selector `◄ C-03 · CENIZA ⟷ ARBÓREA ►`. ←/→ recorre las parejas **activas** (o todas si no hay activas); `L` o tocar el centro del selector abren la **lista filtrable** con todas las activas (`ACTIVAS: 214`) y, con el chip, las resueltas.
- Centro: los dos globos a izquierda y derecha, a distancia proporcional a `separacion`; entre ellos, una regla discontinua con la lectura de Δω.
- Si la pareja es hostil, arcos rojos del atacante a la víctima, con proyectiles animados y destellos de impacto. En `mutua-hostil`, en ambos sentidos.
- Desenlaces: fusión (los globos se superponen en uno), aniquilación (ambos se fragmentan y se apagan), superviviente (un globo dañado y restos).
- Texto vectorial grande con el estado y la cuenta atrás en τ (`T−3.208 c`, `CONTACTO`, `HOSTILIDADES` en rojo, `FUSIONADA`, …).
- Paneles: código y nombre de cada rama, Δω actual / Δω₀, cuenta atrás, postura, agresor, armas.
- **Gráfica de la historia de la pareja** (componente de `comun.js`, también en MONITOR): las dos firmas ω de `serieFirmas` en azul (una normal, otra tenue) convergiendo; línea vertical ámbar con `CONTACTO`; tramo de hostilidades sombreado con rayado rojo; en el desenlace, la curva de la rama destruida se corta y cae a cero con una marca `✕` roja; en fusión, las dos se unen en una sola más gruesa. Marca de "ahora" y tramo futuro discontinuo.
- En vertical (móvil) los globos van uno encima del otro.
- Sin convergencias activas (fase 0), muestra la pareja principal ESTABLE y `SIN CONVERGENCIAS ACTIVAS`.
- Si hay una mejora de contención activa sobre la pareja, se aplica (anillo, separación algo mayor, misiles interceptados) con el rótulo `PROTOCOLO PC-xx EN CURSO`.

**V2 ÁRBOL**:
- Cabecera: `RAMAS CATALOGADAS: 1 862 / ∞ · EN COLISIÓN 214` y la tierra seleccionada.
- **Geometría**: la disposición de §4.4. MYTH es el tronco, más grueso, desde abajo; debajo, una franja del sustrato con el símbolo de la Estación Raíz. Las 13 primarias salen de él.
- **Dibujo por lotes** (60 fps con ~1 900 ramas): los segmentos visibles se agrupan por color (blanco, los 8 tonos de la rampa, tenue para aniquiladas) y cada grupo se traza en una sola llamada (`v.trazos`). Recorte por la ventana visible y nivel de detalle: con poco zoom, los niveles 3–4 van más finos y tenues y los nodos generados no se dibujan; con zoom, aparecen como puntos y, más cerca, con su código.
- **Acercamiento**: para cada pareja en aproximación o contacto, los segmentos desde su antecesor común hasta cada rama toman el tono de la rampa `rama → arma` según `1 − separacion` (blanco lejos, rojo en el contacto).
- **Misiles**: para cada ataque, un trazo rojo animado (curva cuadrática de una tierra a otra, con proyectil y destello) sobre el diagrama, hasta `arbol.misilesMax`, priorizando los visibles y las nombradas.
- Aniquiladas: nodo apagado y ramas tenues. Fusionadas: un solo nodo. Grietas desde la fase 3 y partículas en la fase 4, con semilla del día.
- **Navegación**: zoom 1×–`zoomMax` con `+`/`-`, rueda o pellizco (hacia el punto señalado); desplazamiento con flechas o arrastre; `Inicio` vuelve a la vista completa; Tab / Mayús+Tab recorren las tierras nombradas (la cámara las sigue); `A` salta a la siguiente pareja activa; clic o toque elige el nodo más cercano (rejilla espacial); Enter abre su EXPEDIENTE.
- **MYTH siempre visible**: si la base del tronco sale de la ventana, se dibuja en el borde inferior un tronco fantasma con `▼ MYTH` que apunta hacia él; en la esquina, un minimapa con la silueta del árbol y el rectángulo de la ventana.
- **Silueta del Injertador** (`estado.silueta`): en la franja del sustrato, con el diseño de `04-lore.md §3.1`, sus ramas propias en `rama` subiendo hasta la base de MYTH y los puntos de contacto en `arma`. Vislumbres desde `hitos.vislumbres`: un trazo de un solo fotograma, con semilla del minuto.
- Leyenda abajo: `── RAMA ● TIERRA ⌒ ATAQUE ▬ CONVERGENCIA ✕ ANIQUILADA`.

**V3 MONITOR**:
- Cuadrícula de las 24 nombradas en miniatura (6 × 4 en escritorio; 3 × 4 por página en móvil) y una página `ACTIVAS` con las parejas generadas en contacto u hostilidades (globos creados al mostrarse).
- Cada celda: globo pequeño, código abreviado o nombre, estado y barra de estabilidad. Las hostiles parpadean en rojo y las aniquiladas aparecen apagadas.
- Flechas mueven la selección, Tab cambia de página, Enter abre el EXPEDIENTE.
- Al lado (o debajo en móvil), la **gráfica de ramas afectadas**: eje X en τ de `t1` a `tf`, eje Y logarítmico de 1 a R, curva hasta ahora y `PROYECCIÓN` discontinua; superpuesta, la **curva de N̂** (escala lineal 0–1 a la derecha) con las caídas de los guardianes marcadas (solo con credencial). Hasta la fase 4, R y el τ del colapso se muestran como `???` corruptos (semilla del día y del fotograma); desde la fase 4 se revelan. Debajo, la gráfica de historia de la pareja seleccionada.

**V4 OSCILOSCOPIO**, para la pareja seleccionada (con el selector de COLISIÓN):
- Retícula en `ambarTenue` (`vectores.osciloscopio.divisiones`).
- Frecuencias: `f_a = ciclosEnPantalla` por ancho de pantalla; `f_b = f_a + latidosEnDeltaInicial · separacion`. **Convergen**: al acercarse, `f_b → f_a` y los latidos se alargan hasta desaparecer.
- Ganancia: `g = gananciaMin + (1 − gananciaMin) · (1 − separacion)`; los latidos crecen en amplitud al acercarse.
- Trazas: `y_a` en `tierra`, `y_b` en `tierra` tenue, la suma `g · (y_a + y_b) / 2` en `ambar` con su envolvente discontinua.
- **Contacto e interferencia**: la suma se recorta en `±saturacion` (techos planos) y aparece `SATURACIÓN`.
- **Hostilidades**: además, picos rojos (`arma`) en posiciones sembradas con `hash(pareja + segundo)`, más densos con el progreso del ataque.
- **Desenlace**: la onda de la rama destruida se multiplica por `1 − desvanecimiento` hasta quedar plana (`SEÑAL PERDIDA`); en aniquilación, las dos; en fusión, una sola traza; el superviviente conserva su traza con ruido.
- Lecturas: ω_a, ω_b, Δω, Δω₀, latidos por pantalla y ganancia. ←/→ y la lista cambian de pareja.

**V5 EXPEDIENTE**:
- Selector de rama (←/→ entre nombradas y MYTH; la seleccionada en ÁRBOL, MONITOR o COLISIÓN si es generada).
- Globo grande con su estado.
- **Nombradas**: designación (código), nombre, firma ω, régimen, planos anexos, tecnología, carácter, origen (antigua o joven, salto), pareja, postura y armas; barra de estabilidad; línea temporal en τ de `t0` a `tf` con marcas cada 7 c y los eventos de la rama. Mayús+←/→ recorre los eventos; el tramo futuro va rayado con `[DATOS NO DISPONIBLES]`.
- **Generadas** (corto): código, `DENOMINACIÓN LOCAL: NO CATALOGADA`, ω, régimen, tecnología, origen, pareja, estado y estabilidad.
- **MYTH**: tronco, ω ≡ 1, régimen, barra de **cohesión N̂** en lugar de estabilidad, número de ramas que brotan de él; bloque `GUARDIANES` sellado sin credencial y, con ella, los cinco con `EN PIE` / `CAÍDO EN τ …`.

**V6 REGISTRO**:
- Entradas del más reciente arriba, con su instante en τ (`7532.137`); las del operador, en ámbar.
- Filtros por tipo (SISTEMA, COLISIÓN, HOSTIL, CONTENCIÓN).
- Histograma vectorial de eventos por ciclo en la cabecera. Crece en vivo.

**V7 COMUNICACIONES**:
- Dos pestañas: `GENERAL` y `DIRECCIÓN` (Tab o ←/→ cambia de canal; tocar la pestaña). Cada una con su bandeja y su contador de no leídos; los no leídos parpadean y los leídos se guardan en `localStorage`.
- Mensajes con instante τ, remitente y asunto. Los anexos (informes reenviados) van dentro del cuerpo con un filete.
- Sin credencial, `DIRECCIÓN` muestra `CANAL SELLADO · REQUIERE CREDENCIAL DE DIRECCIÓN` y `▒ N MENSAJES CIFRADOS`, salvo los mensajes marcados `visibleSinCredencial` (D-14).
- Con COMUNICACIONES degradada (§4.3), algunos cuerpos llegan con líneas corruptas (semilla del día).

**V8 ARCHIVO**:
- Carpetas `MANUALES`, `PROCEDIMIENTOS`, `CLASIFICADOS` (Tab, ←/→ o tocar la pestaña). Lista con código, título y revisión.
- Lector con la cabecera de documentación interna (código, revisión, emisión y revisión en τ, clasificación, aprobaciones) y el cuerpo; desplazable.
- Clasificados ya emitidos sin credencial: `CLAS-INJ-01 · ░░░░░░░░░░ · SELLADO`. Los que aún no se han emitido no aparecen. El NEGRO sigue dependiendo de `semilla`.
- Fragmentos dentro de documentos visibles que solo se ven con credencial (el paso 3 de PROC-MYT-00): `[ELIMINADO POR DIRECCIÓN]` sin ella.

**V9 CONTENCIÓN**:
- Tres zonas: **protocolos** (lista con código y nombre de `data/protocolos.js`), **objetivo** (universo, pareja o MYTH según el protocolo; lista filtrable con los objetivos válidos para su estado) y **ejecución** (descripción, duración, efecto esperado, escena vectorial y barra de progreso). Debajo, el historial local.
- Flujo: elegir protocolo → elegir objetivo → confirmar (S/Enter; PC-40 pide confirmar dos veces) → progreso (`duracion · (1 + intensidad)`) → resultado `APLICADO · MEJORA DETECTADA`.
- **Mejora transitoria**: al terminar se guarda en `ui.efectosContencion` `{ objetivo, protocolo, hasta }` durante `contencion.mejoraMs`. COLISIÓN, ÁRBOL, OSCILOSCOPIO y EXPEDIENTE la aplican solo a su dibujo (estabilidad +15, Δω mostrada +8 %, separación algo mayor, misiles interceptados, N̂ +0.05); al acabar, la lectura vuelve en silencio a la del `Estado`. **El `Estado` no cambia nunca.**
- Queda en el registro local: `PC-14 REFORZAR AISLANTE · C-03 · APLICADO`. Con credencial y `hitos.eficacia`, el resultado añade `EFICACIA MEDIDA 0.000 %`.
- Con p ≥ 0.9: `SIN ENERGÍA EN EL SUSTRATO`.

**V0 TERMINAL** (secundaria):
- Registro de órdenes `{ nombre, alias, uso, ayuda, oculto, ejecutar(args, estado, ctx, sesion) }`; historial con ↑/↓ y autocompletado con Tab; acepta escritura nada más abrirse.
- Órdenes y ocultas de `04-lore.md §12`. `examinar` acepta código completo, sufijo (`7A2·R9`) o nombre. `colisiones` lista las activas (paginado `colisiones 2`).
- `credencial`: pide la clave con eco `*` (petición de texto con máscara), calcula `sha256(sal + normalizar(clave))` y la compara con `acceso.hashDireccion`. Si coincide, `DENDRO.local.credencial(hash)` la guarda y responde `CREDENCIAL DE DIRECCIÓN ACEPTADA`; si no, `CLAVE INCORRECTA` y una espera creciente. `credencial cerrar` / `revocar` la borra. `normalizar` = mayúsculas, sin tildes ni espacios.
- `contener <PC-xx> <objetivo>` abre CONTENCIÓN con protocolo y objetivo preparados.
- Con intensidad alta, a veces responde con basura o "TIEMPO DE ESPERA AGOTADO". El parser prueba primero la coincidencia más larga de palabras (`quien vigila`, `omega i`).
- **Latencia deliberada**: espera `minMs + (maxMs − minMs) · intensidad` ±30 % (PRNG con semilla `hash(día + nº de orden de la sesión)`); cursor ocupado (`▒`) y solo Esc.
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
- Ramas del Árbol en blanco; al converger, la **rampa** `rampa0…rampa7` de blanco (`rama`) a rojo (`arma`), calculada por `tema.js` a partir de config.
- Todo lo bélico (misiles, impactos, hostilidades) en rojo.
- La silueta del Injertador: contorno y ramas en `rama`, puntos de contacto con el Árbol en `arma`, interior vacío.

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

**Sonidos**: tecla (clic mecánico en cada pulsación o toque), beep de confirmación y de cambio de vista, alarma de dos tonos al entrar al escritorio desde la fase 3 y al cruzar de fase en vivo. Se silencian con el **interruptor SONIDO** del marco, que recuerda su posición en `localStorage`.

**Ambiente** (`sonido.js`), solo tras interacción y respetando silenciar:
- Transformador: senoidal a `frecuenciaRed` más armónicos 2.º y 3.º, filtrada por un pasa-bajos.
- Ventilador: ruido marrón por un pasa-banda (~300–600 Hz) con una modulación lenta de 0.2–0.5 Hz.
- La ganancia de cada uno es `base + (maximo − base) · intensidad`, recalculada con cada nuevo `Estado`.
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
- Colores **por nombre** de `config.colores` (y de la rampa).
- Los caracteres de caja y de bloque se dibujan con trazos propios para que unan sin huecos. Los glifos más anchos que la celda se comprimen.

### 7.3 Capa vectorial (`vectores.js`)

`region.vectores()` devuelve un contexto ligado a la región: el origen está en su esquina y recorta a sus bordes. **Unidades**:
- Posiciones en **celdas** (x en columnas, y en filas, con decimales), así los diagramas encajan con el texto.
- Longitudes (radios, tamaños de texto) en **altos de celda**; los círculos son redondos aunque la celda no sea cuadrada.
- Grosores en px CSS (`vectores.grosorLinea` por defecto).

Primitivas (modo inmediato, se llaman dentro de `vista.vectores(v, ahora)`):
- `linea(x1, y1, x2, y2, color, o)`, `polilinea(puntos, color, o)`, `poligono(puntos, color, o)`.
- **`trazos(segmentos, color, o)`**: lote de segmentos `[x1, y1, x2, y2, …]` (array plano) en un solo trazo, para el ÁRBOL.
- **`puntos(lista, color, o)`**: lote de puntos `[x, y, …]`.
- `circulo(cx, cy, r, color, o)`, `arco(cx, cy, r, desde, hasta, color, o)` en radianes.
- `curva(x1, y1, cx, cy, x2, y2, color, o)`: cuadrática, para las trayectorias de misiles.
- `punto(x, y, color, o)`.
- `texto(x, y, texto, color, { tam, alinear })`: VT323 vectorial; `tam` en altos de celda.
- `globo(cx, cy, r, rama, o)` (§7.4).

Opciones comunes `o`: `{ grosor, alfa, discontinua: [a, b], relleno: color, rellenoAlfa }`. Colores **por nombre**, como en la rejilla. `glitch.js` puede envolver el contexto para añadir temblor, cortes y desfases según la intensidad (RF-07).

### 7.4 Globos (`globo.js`)

**Modelo** (una vez por rama, en caché; determinista):
- Semilla `hash(semillaGlobo)` (por defecto el código; las 24 nombradas conservan su designación antigua). Se evalúa el ruido fBm 3D (`ruido.js`, `globo.octavas`) sobre la esfera en una malla `globo.resolucion` de lon × lat, y se umbraliza en el nivel que deja la fracción de océano `globo.mar` (o `nivelMarPorDefecto`).
- **Tierra Gris** usa la máscara equirectangular de `data/tierra-gris.js` en vez del ruido.
- **Costas**: *marching squares* sobre la malla, convertidas a polilíneas de vectores 3D unitarios.
- **Trama de tierra**: `globo.puntos` puntos en espiral de Fibonacci sobre la esfera, marcados si caen en tierra.
- `rugosidad` ajusta la escala del ruido. `inestable` deforma el limbo y las costas con ruido animado.
- **Caché**: los modelos de MYTH y las 24 nombradas se quedan siempre; los de ramas generadas se crean al dibujarse por primera vez y se descartan por antigüedad por encima de `multiverso.cacheGlobos`.

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

- `tests/cronologia.test.html` (y la skill `verificar-cronologia`, que admite instantes) comprueban:
  - Los criterios de `01-requisitos.md §5` con instantes: 10-19, 10-20, 10-27T03:16 / 10-27, 12-16T13:59, 12-16T14:00, 12-25.
  - Monotonía cada hora del 20/10 al 16/12 14:00 de: ramas afectadas, ramas en colisión y N̂ (no creciente); `fase` nunca baja.
  - Catálogo: total entre `ramasMin` y `ramasMax`, idéntico en dos llamadas, códigos únicos con el formato de §4.4, las 24 nombradas en su código, las parejas nombradas como hermanas (C-08, madre e hija).
  - Cadena: C-01 es el primer contacto; la primera generada toca después; los contactos generados por día crecen; ~60 en las últimas 14 horas; todos antes de `tf`; el orden sigue los saltos.
  - `serieFirmas`: convergen al contacto, se cortan en la destruida, se unen en la fusión.
  - El hash de la credencial: la clave del lore coincide con `acceso.hashDireccion`; otra no.
  - Ninguna cadena del `Estado` destinada a pantalla contiene fechas de nuestro calendario (`/20\d\d-\d\d/`, nombres de meses).
  - Rendimiento: `calcularEstado` < 20 ms de media en escritorio.
- Revisión manual de cada fase con `?fecha=`, incluido `?fecha=2026-12-16T13:58` esperando al colapso en vivo.
- Respaldo CSS: probar con `efectos.webgl: false` o `?webgl=0`.
- Globos: misma rama → mismo globo en dos cargas; las 24 son distintas; Tierra Gris reconocible.
- Rendimiento: `?fps=1` en MONITOR (24 globos) y en ÁRBOL (todas las ramas, con zoom y misiles) ≥ 60 fps en escritorio.
- Móvil: emulación táctil real (CDP `Input.dispatchTouchEvent`), no solo el tamaño: el campo oculto conserva el foco tras tocar; pellizco y arrastre en el ÁRBOL.
