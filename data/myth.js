// MYTH, el tronco (04-lore.md §2): sus datos, las 13 ramas primarias y los cinco guardianes.
// primarias: orden de dibujo; origen "antigua" o "joven" con el salto de los MYTHS que la creó.
// omega: firma de referencia de la primaria (sus ramas generadas heredan de ella).
// guardianes.cae: instante local fijo de su caída (no sale de N̂, para cuadrar con los mensajes).
window.DENDRO_DATOS = window.DENDRO_DATOS || {};
window.DENDRO_DATOS.myth = {
  codigo: "MYTH",
  nombre: "MYTH",
  omega: 1.0,
  magia: "Magia antigua",
  tecnologia: "Toda la que ha existido",
  planos: ["Pozo de Thul", "Salón del Primer Rito", "Cielo Viejo"],
  caracter: "La rama mayor más antigua, nacida en la primera Ignición Beta. No converge con ninguna: si su cohesión cae, el Árbol entero pierde el soporte.",
  semillaGlobo: "MYTH",
  globo: { mar: 0.5, rugosidad: 1.1 },

  primarias: [
    { segmento: "01", origen: "antigua", omega: 1.0000 },
    { segmento: "2C", origen: "antigua", omega: 5.0060 },
    { segmento: "5T", origen: "antigua", omega: 6.0400 },
    { segmento: "3H", origen: "antigua", omega: 4.6900 },
    { segmento: "E2", origen: "antigua", omega: 7.3880 },
    { segmento: "8N", origen: "antigua", omega: 3.8300 },
    { segmento: "4K", origen: "joven", salto: 1, omega: 3.1650 },
    { segmento: "R4", origen: "joven", salto: 2, omega: 9.0150 },
    { segmento: "9F", origen: "joven", salto: 3, omega: 2.7300 },
    { segmento: "KX", origen: "joven", salto: 4, omega: 0.5900 },
    { segmento: "L6", origen: "joven", salto: 5, omega: 2.2580 },
    { segmento: "7Y", origen: "joven", salto: 6, omega: 1.6350 },
    { segmento: "ZZ", origen: "joven", salto: 7, omega: 1.0009 },
  ],

  // Rama dada de baja: reserva su camino en el catálogo, pero no se dibuja ni cuenta.
  bajas: [
    { codigo: "MYTH·4K·7A2·S5", nombre: "Sarmiento", omega: 3.1702 },
  ],

  guardianes: [
    { id: "calcina", nombre: "Calcina", titulo: "el fénix", cae: "2026-12-09T21:05" },
    { id: "maresa", nombre: "Maresa Thul", titulo: "la atlante", cae: "2026-12-13T18:00" },
    { id: "hisame", nombre: "Hisame", titulo: "la shinigami", cae: "2026-12-15T21:00" },
    { id: "odalys", nombre: "Odalys Vey", titulo: "la Viajera", cae: "2026-12-16T10:00" },
    { id: "ilvane", nombre: "Ilvane", titulo: "la sacerdotisa", cae: "2026-12-16T14:00" },
  ],
};
