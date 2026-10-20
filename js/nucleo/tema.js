// Copia config.colores a variables CSS (--ambar, --ambar-tenue, …) y ofrece los colores al canvas y al shader.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;

  function nombreVariable(clave) {
    return "--" + clave.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  }

  function aplicar() {
    const raiz = document.documentElement.style;
    for (const [clave, valor] of Object.entries(cfg().colores)) {
      raiz.setProperty(nombreVariable(clave), valor);
    }
  }

  function color(nombre) {
    const colores = cfg().colores;
    return colores[nombre] || colores.texto;
  }

  // "#FFB000" → [1, 0.69, 0] para uniforms de WebGL.
  function rgb(nombre) {
    let h = color(nombre).replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  DENDRO.tema = { aplicar, color, rgb, nombreVariable };
})(window.DENDRO = window.DENDRO || {});
