// PRNG determinista: toda la "aleatoriedad" de DENDRO-OS sale de aquí (RNF-06).
(function (DENDRO) {
  "use strict";

  // FNV-1a de 32 bits: misma cadena → misma semilla en cualquier navegador.
  function hash(texto) {
    let h = 0x811c9dc5;
    const s = String(texto);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function mulberry32(semilla) {
    let a = semilla >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // crear("2026-10-20", "ruido") → función que devuelve [0, 1)
  function crear(...partes) {
    return mulberry32(hash(partes.join("|")));
  }

  function entero(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function elegir(rng, lista) {
    return lista[Math.floor(rng() * lista.length)];
  }

  DENDRO.prng = { hash, mulberry32, crear, entero, elegir };
})(window.DENDRO = window.DENDRO || {});
