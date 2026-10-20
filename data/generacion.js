// Tablas para generar las ramas catalogadas sin nombre (04-lore.md §4.4).
// Las proporciones (régimen, postura, desenlace) viven en config.multiverso.
window.DENDRO_DATOS = window.DENDRO_DATOS || {};
window.DENDRO_DATOS.generacion = {
  tecnologias: [
    "Agraria", "Medieval", "Medieval arcana", "Industrial a vapor", "Atómica temprana", "Digital",
    "Ciberpunk corporativa", "Espacial", "Orbital", "Post-escasez", "Postapocalíptica", "Nómada",
    "Submarina", "Subterránea", "Glacial", "Fluvial", "Biomágica", "Arcana", "Teocrática", "Desconocida",
  ],
  // Armas de las parejas generadas hostiles: ids de DENDRO_DATOS.armas (data/colisiones.js).
  armas: [
    "misil-interrama", "enjambre-drones", "artilleria-chatarra", "lanza-solar",
    "lluvia-juicio", "marea-muertos", "raices-estranguladoras",
  ],
  globo: { mar: [0.3, 0.85], rugosidad: [0.7, 2.0] },
};
