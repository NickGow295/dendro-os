// Parejas nombradas y armas (04-lore.md §5.1 y §6). a, b, agresor y armas usan códigos de rama. Δω₀ no se escribe: sale de las firmas ω.
// contacto: instante local en la zona de config.
window.DENDRO_DATOS = window.DENDRO_DATOS || {};

window.DENDRO_DATOS.armas = {
  "misil-interrama": { nombre: "Misil interrama", descripcion: "Proyectil balístico con cabeza de disrupción de firma: sintonizado a la ω enemiga." },
  "enjambre-drones": { nombre: "Enjambre de drones de fase", descripcion: "Miles de drones que desestabilizan el aislante de fase." },
  "artilleria-chatarra": { nombre: "Artillería de chatarra", descripcion: "Cañones reconstruidos, poco precisos, muy numerosos." },
  "lanza-solar": { nombre: "Lanza solar", descripcion: "Haz divino canalizado por el panteón a través de la Morada del Sol." },
  "lluvia-juicio": { nombre: "Lluvia de juicio", descripcion: "Bombardeo de luz consagrada desde el Cielo de Cristal." },
  "marea-muertos": { nombre: "Marea de los muertos", descripcion: "Ejército que cruza por el inframundo abierto." },
  "raices-estranguladoras": { nombre: "Raíces estranguladoras", descripcion: "Los dioses de Arbórea empujan raíces a través del contacto." },
};

window.DENDRO_DATOS.colisiones = [
  { id: "C-01", a: "MYTH·4K·7A2·R9", b: "MYTH·4K·7A2·T3", contacto: "2026-10-27T03:17", postura: "hostil", agresor: "MYTH·4K·7A2·T3",
    armas: { "MYTH·4K·7A2·T3": ["misil-interrama"] }, desenlace: "superviviente:MYTH·4K·7A2·R9" },
  { id: "C-02", a: "MYTH·2C·H51·0A", b: "MYTH·2C·H51·0B", contacto: "2026-11-09T11:40", postura: "negociacion", agresor: null,
    armas: {}, desenlace: "fusion" },
  { id: "C-03", a: "MYTH·9F·E07·K4", b: "MYTH·9F·E07·W1", contacto: "2026-11-18T22:05", postura: "mutua-hostil", agresor: "MYTH·9F·E07·K4",
    armas: { "MYTH·9F·E07·K4": ["artilleria-chatarra"], "MYTH·9F·E07·W1": ["raices-estranguladoras"] }, desenlace: "aniquilacion" },
  { id: "C-04", a: "MYTH·5T·32M·N8", b: "MYTH·5T·32M·X6", contacto: "2026-11-25T07:52", postura: "evacuacion", agresor: null,
    armas: {}, desenlace: "fusion" },
  { id: "C-05", a: "MYTH·7Y·A4R·G2", b: "MYTH·7Y·A4R·L7", contacto: "2026-11-30T19:26", postura: "hostil", agresor: "MYTH·7Y·A4R·L7",
    armas: { "MYTH·7Y·A4R·L7": ["lanza-solar"] }, desenlace: "aniquilacion" },
  { id: "C-06", a: "MYTH·3H·W8C·F5", b: "MYTH·3H·W8C·V1", contacto: "2026-12-04T02:13", postura: "aislamiento", agresor: null,
    armas: {}, desenlace: "superviviente:MYTH·3H·W8C·V1" },
  { id: "C-07", a: "MYTH·KX·0R9·M3", b: "MYTH·KX·0R9·M4", contacto: "2026-12-07T16:48", postura: "mutua-hostil", agresor: "MYTH·KX·0R9·M4",
    armas: { "MYTH·KX·0R9·M4": ["lluvia-juicio"], "MYTH·KX·0R9·M3": ["marea-muertos"] }, desenlace: "aniquilacion" },
  { id: "C-08", a: "MYTH·E2·N6P·A7", b: "MYTH·E2·N6P·A7·Y", contacto: "2026-12-09T09:31", postura: "negociacion", agresor: null,
    armas: {}, desenlace: "aniquilacion" },
  { id: "C-09", a: "MYTH·L6·T2K·B8", b: "MYTH·L6·T2K·C0", contacto: "2026-12-11T21:07", postura: "hostil", agresor: "MYTH·L6·T2K·C0",
    armas: { "MYTH·L6·T2K·C0": ["misil-interrama", "enjambre-drones"] }, desenlace: "superviviente:MYTH·L6·T2K·C0" },
  { id: "C-10", a: "MYTH·R4·J9E·E1", b: "MYTH·R4·J9E·T6", contacto: "2026-12-12T13:44", postura: "ignorancia", agresor: null,
    armas: {}, desenlace: "aniquilacion" },
  { id: "C-11", a: "MYTH·8N·F3W·H2", b: "MYTH·8N·F3W·N9", contacto: "2026-12-13T05:20", postura: "evacuacion", agresor: null,
    armas: {}, desenlace: "fusion" },
  { id: "C-12", a: "MYTH·01", b: "MYTH·ZZ", contacto: "2026-12-14T23:58", postura: "ignorancia", agresor: null,
    armas: {}, desenlace: "colapso" },
];
