// Parejas de colisión y armas (04-lore.md §3 y §4). Δω₀ no se escribe: sale de las firmas ω.
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
  { id: "C-01", a: "B-0x01", b: "B-0x02", contacto: "2026-10-27T03:17", postura: "hostil", agresor: "B-0x02",
    armas: { "B-0x02": ["misil-interrama"] }, desenlace: "superviviente:B-0x01" },
  { id: "C-02", a: "B-0x03", b: "B-0x04", contacto: "2026-11-09T11:40", postura: "negociacion", agresor: null,
    armas: {}, desenlace: "fusion" },
  { id: "C-03", a: "B-0x05", b: "B-0x06", contacto: "2026-11-18T22:05", postura: "mutua-hostil", agresor: "B-0x05",
    armas: { "B-0x05": ["artilleria-chatarra"], "B-0x06": ["raices-estranguladoras"] }, desenlace: "aniquilacion" },
  { id: "C-04", a: "B-0x07", b: "B-0x08", contacto: "2026-11-25T07:52", postura: "evacuacion", agresor: null,
    armas: {}, desenlace: "fusion" },
  { id: "C-05", a: "B-0x09", b: "B-0x0A", contacto: "2026-11-30T19:26", postura: "hostil", agresor: "B-0x0A",
    armas: { "B-0x0A": ["lanza-solar"] }, desenlace: "aniquilacion" },
  { id: "C-06", a: "B-0x0B", b: "B-0x0C", contacto: "2026-12-04T02:13", postura: "aislamiento", agresor: null,
    armas: {}, desenlace: "superviviente:B-0x0C" },
  { id: "C-07", a: "B-0x0D", b: "B-0x0E", contacto: "2026-12-07T16:48", postura: "mutua-hostil", agresor: "B-0x0E",
    armas: { "B-0x0E": ["lluvia-juicio"], "B-0x0D": ["marea-muertos"] }, desenlace: "aniquilacion" },
  { id: "C-08", a: "B-0x0F", b: "B-0x10", contacto: "2026-12-09T09:31", postura: "negociacion", agresor: null,
    armas: {}, desenlace: "aniquilacion" },
  { id: "C-09", a: "B-0x11", b: "B-0x12", contacto: "2026-12-11T21:07", postura: "hostil", agresor: "B-0x12",
    armas: { "B-0x12": ["misil-interrama", "enjambre-drones"] }, desenlace: "superviviente:B-0x12" },
  { id: "C-10", a: "B-0x13", b: "B-0x14", contacto: "2026-12-12T13:44", postura: "ignorancia", agresor: null,
    armas: {}, desenlace: "aniquilacion" },
  { id: "C-11", a: "B-0x15", b: "B-0x16", contacto: "2026-12-13T05:20", postura: "evacuacion", agresor: null,
    armas: {}, desenlace: "fusion" },
  { id: "C-12", a: "B-0x17", b: "B-0x18", contacto: "2026-12-14T23:58", postura: "ignorancia", agresor: null,
    armas: {}, desenlace: "colapso" },
];
