// Ruido de gradiente 3D con semilla (Perlin mejorado) y fBm, para los continentes de los globos.
// Determinista: misma semilla → mismo campo en cualquier navegador. No toca el DOM.
(function (DENDRO) {
  "use strict";

  const GRADIENTES = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1],
    [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
  ];

  const suavizar = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const mezclar = (a, b, t) => a + (b - a) * t;

  function crear(semilla) {
    const rng = DENDRO.prng.mulberry32(semilla >>> 0);
    const base = [];
    for (let i = 0; i < 256; i++) base.push(i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = base[i & 255];

    function grad(h, x, y, z) {
      const g = GRADIENTES[h % 12];
      return g[0] * x + g[1] * y + g[2] * z;
    }

    // Valor aproximado en [-1, 1].
    function ruido(x, y, z) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = suavizar(x), v = suavizar(y), w = suavizar(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
      const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return mezclar(
        mezclar(mezclar(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
                mezclar(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
        mezclar(mezclar(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
                mezclar(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v),
        w);
    }

    // Suma de octavas normalizada a [-1, 1] aproximadamente.
    function fbm(x, y, z, octavas, lacunaridad, ganancia) {
      lacunaridad = lacunaridad || 2;
      ganancia = ganancia || 0.5;
      let suma = 0, amplitud = 1, frecuencia = 1, total = 0;
      for (let o = 0; o < (octavas || 4); o++) {
        suma += amplitud * ruido(x * frecuencia, y * frecuencia, z * frecuencia);
        total += amplitud;
        amplitud *= ganancia;
        frecuencia *= lacunaridad;
      }
      return suma / total;
    }

    return { ruido, fbm };
  }

  DENDRO.ruido = { crear };
})(window.DENDRO = window.DENDRO || {});
