// ★ Todo lo editable de DENDRO-OS: identidad, colores, fechas, efectos, sonido y depuración.
// Cambiar un valor aquí no requiere tocar ningún otro archivo.
window.DENDRO_CONFIG = {
  agencia: {
    siglas: "DENDRO",
    nombre: "Directorio de Estabilidad y Normalización de Ramas y Orígenes",
    sistema: "DENDRO-OS",
    version: "4.7.2",
    lema: "Toda rama sostiene al Árbol",
    sede: "Estación Raíz",
    terminal: "UNIDAD DE OPERACIONES DR-7", // serigrafía del marco del monitor
    logoASCII: [
      String.raw`           .   *   .`,
      String.raw`        *  \\ | //  *`,
      String.raw`      .--\\\\ | ////--.`,
      String.raw`          \\\\|////`,
      String.raw`            \\|//`,
      String.raw`             |||`,
      String.raw`             |||`,
      String.raw`      ═══════╧╧╧═══════`,
      String.raw`       D · E · N · D · R · O`,
    ],
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

  // Rejilla de caracteres del tubo (prototipo opción B).
  pantalla: {
    filas: 36,              // filas objetivo en escritorio
    columnasMin: 44,        // por debajo, se reduce la fuente (móvil)
    columnasMax: 112,
    margen: 0.04,           // fracción de sobrebarrido en cada borde (la curvatura come las esquinas)
    altoLinea: 1.0,         // alto de celda en múltiplos del tamaño de fuente
    escalaMax: 2,           // tope de devicePixelRatio
    pixelesMax: 2600000,    // tope de píxeles internos del tubo
    calidadAdaptativa: true, // baja la resolución interna si los fps caen
  },

  efectos: {
    scanlines: true, curvatura: true, brillo: 0.6, parpadeo: true,
    glitchMaximo: 1.0,          // multiplicador de la intensidad de glitches
    respetarMovimientoReducido: true,
    webgl: true,                // false fuerza el respaldo CSS
    crt: {                      // parámetros del shader; 0 desactiva cada efecto
      curvaturaBarril: 0.08,    // distorsión de barril
      persistencia: 0.82,       // 0..1, cuánto queda de la imagen anterior en cada fotograma
      aberracion: 0.0025,       // desplazamiento RGB máximo, solo crece hacia los bordes
      ruido: 0.06,              // ruido de señal (nieve)
      parpadeo: 0.03,           // variación de brillo fotograma a fotograma
      bandaRodante: 0.05,       // franja de interferencia que sube despacio
      intensidadScanlines: 0.45,
      mascara: 0.12,            // rejilla de apertura RGB (solo en pantallas de alta densidad)
      vineta: 0.55,
      reflejo: 0.035,           // reflejo de la sala en el vidrio
      escalaConIntensidad: 1.0, // cuánto empeoran ruido/aberración con la intensidad del día
    },
    encendido: { duracionMs: 1400 },
    apagado:   { duracionMs: 700, resplandorMs: 2500 },
  },

  texto: {
    velocidadEscritura: 18,                       // ms por carácter
    latenciaTerminal: { minMs: 60, maxMs: 1600 }, // se interpola con la intensidad
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
    mensajeError: [
      "PÉRDIDA TOTAL DE COHESIÓN EN EL SUSTRATO M11",
      "",
      "  ramas afectadas ..... {ramas} / {ramas}",
      "  firma del ancla ..... ω = NaN",
      "  meta-tiempo τ ....... DETENIDO",
      "",
      "LA ESTACIÓN RAÍZ NO PUEDE MANTENER EL ÁRBOL.",
      "GUARDE EL REGISTRO. TODA RAMA SOSTENÍA AL ÁRBOL.",
      "",
      "[ PRESIONE CUALQUIER TECLA ]",
    ],
    comandosPermitidos: ["semilla"],
  },

  debug: {
    permitirFechaURL: true,
    permitirParametrosURL: true, // ?webgl=0 y ?fps=1 para revisar en móvil sin editar este archivo
    mostrarPanelDebug: false,
    mostrarFPS: false,
  },
};
