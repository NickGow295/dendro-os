// Protocolos de contención (04-lore.md §11). Ninguno cambia la cronología: al terminar dan una
// mejora visual transitoria (config.contencion.mejoraMs) y la lectura vuelve en silencio a la real.
//   objetivo: universo | pareja | myth
//   estados: estados válidos del objetivo (de la rama o de la pareja); excluir: estados no válidos.
//   soloHostil: la pareja debe ser hostil. conPlanos: el universo debe tener planos anexos.
//   desde: instante local desde el que el protocolo aparece en el panel.
window.DENDRO_DATOS = window.DENDRO_DATOS || {};
window.DENDRO_DATOS.protocolos = [
  { codigo: "PC-11", nombre: "ESTABILIZAR FIRMA", objetivo: "universo", excluir: ["ANIQUILADA", "COLAPSO"], duracionMs: 4200,
    descripcion: "Recalibra la firma ω del universo contra el ancla de calibración.",
    efecto: "La ω deja de oscilar. Estabilidad +15." },
  { codigo: "PC-14", nombre: "REFORZAR AISLANTE", objetivo: "pareja", estados: ["ESTABLE", "APROXIMACIÓN"], duracionMs: 5000,
    descripcion: "Refuerza el aislante de fase entre las dos ramas de la pareja.",
    efecto: "Anillo de aislante entre los globos. Δω +8 %." },
  { codigo: "PC-21", nombre: "DESACOPLAR RAMAS", objetivo: "pareja", estados: ["APROXIMACIÓN"], duracionMs: 5600,
    descripcion: "Empuja las dos ramas en sentidos opuestos del Bulk.",
    efecto: "Los globos se separan. La cuenta atrás gana tiempo." },
  { codigo: "PC-23", nombre: "SELLAR GARGANTA", objetivo: "universo", conPlanos: true, excluir: ["ANIQUILADA", "COLAPSO"], duracionMs: 5200,
    descripcion: "Cierra los planos anexos del universo para que no perforen el aislante desde dentro.",
    efecto: "Los planos anexos quedan SELLADOS." },
  { codigo: "PC-30", nombre: "INTERDICCIÓN DE FASE", objetivo: "pareja", soloHostil: true, estados: ["APROXIMACIÓN", "HOSTILIDADES"], duracionMs: 4800,
    descripcion: "Desfasa la trayectoria de los proyectiles entre las dos ramas.",
    efecto: "Los misiles se ven interceptados." },
  { codigo: "PC-40", nombre: "PODA PREVENTIVA", objetivo: "universo", estados: ["ESTABLE", "APROXIMACIÓN"], duracionMs: 6400, dobleConfirmacion: true,
    descripcion: "Desconecta la rama del resto del Árbol. Medida extrema e irreversible en teoría.",
    efecto: "La rama se atenúa en el ÁRBOL." },
  { codigo: "PC-90", nombre: "TRANSFUSIÓN DE COHESIÓN", objetivo: "myth", duracionMs: 7000, desde: "2026-12-01T00:00",
    descripcion: "Desvía cohesión del sustrato hacia la base de MYTH.",
    efecto: "La barra de N̂ sube 0.05." },
];
