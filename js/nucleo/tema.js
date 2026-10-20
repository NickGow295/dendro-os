// Copia config.colores a variables CSS (--ambar, --ambar-tenue, …) y ofrece los colores al canvas y al shader.
// También calcula la rampa rampa0…rampaN-1 entre "rama" (blanco) y "arma" (rojo) para las convergencias.
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
    rampa().forEach((valor, i) => raiz.setProperty(`--rampa${i}`, valor));
  }

  // Interpolación lineal en RGB de rama a arma, en vectores.rampaPasos tonos (recalculada si cambia config).
  let rampaCache = null;
  function rampa() {
    const c = cfg().colores, n = cfg().vectores.rampaPasos || 8, clave = c.rama + c.arma + n;
    if (rampaCache && rampaCache.clave === clave) return rampaCache.tonos;
    const a = hexARgb(c.rama), b = hexARgb(c.arma), tonos = [];
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 1 : i / (n - 1);
      tonos.push("#" + a.map((x, j) => Math.round(x + (b[j] - x) * k).toString(16).padStart(2, "0")).join(""));
    }
    rampaCache = { clave, tonos };
    return tonos;
  }

  function hexARgb(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function color(nombre) {
    const colores = cfg().colores;
    if (colores[nombre]) return colores[nombre];
    if (nombre && nombre.startsWith("rampa")) return rampa()[Number(nombre.slice(5))] || colores.arma;
    return colores.texto;
  }

  // Nombre del tono de la rampa para k en 0..1 (0 = rama, 1 = arma).
  function tonoRampa(k) {
    const n = rampa().length;
    return "rampa" + Math.max(0, Math.min(n - 1, Math.round(k * (n - 1))));
  }

  // "#FFB000" → [1, 0.69, 0] para uniforms de WebGL.
  function rgb(nombre) {
    return hexARgb(color(nombre)).map((x) => x / 255);
  }

  DENDRO.tema = { aplicar, color, rgb, nombreVariable, rampa, tonoRampa };
})(window.DENDRO = window.DENDRO || {});
