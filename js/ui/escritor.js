// Consola desplazable sobre una región de la rejilla y efecto máquina de escribir saltable.
// Una línea es una lista de segmentos { t: texto, c: color, e: estilo } o { relleno: ".", c } (ocupa el ancho sobrante).
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const largo = (t) => Array.from(String(t)).length;

  function normalizar(segmentos) {
    if (typeof segmentos === "string") return [{ t: segmentos }];
    return segmentos.map((s) => (typeof s === "string" ? { t: s } : s));
  }

  // obtenerRegion se llama en cada dibujo para seguir los cambios de tamaño de la pantalla.
  function crearConsola(obtenerRegion) {
    const lineas = [];
    let primeraVisible = 0;

    function dibujarLinea(region, fila, segmentos) {
      const fijo = segmentos.reduce((n, s) => n + (s.relleno ? 0 : largo(s.t)), 0);
      let x = 0;
      region.rellenar(0, fila, region.ancho, 1);
      for (const s of segmentos) {
        const texto = s.relleno ? s.relleno.repeat(Math.max(1, region.ancho - fijo - 1)) : s.t;
        x = region.escribir(x, fila, texto, s.c || "texto", s.e);
      }
    }

    function dibujar() {
      const r = obtenerRegion();
      primeraVisible = Math.max(0, lineas.length - r.alto);
      r.limpiar();
      for (let i = primeraVisible; i < lineas.length; i++) dibujarLinea(r, i - primeraVisible, lineas[i]);
    }

    // Redibuja solo la última línea salvo que haya que desplazar.
    function refrescarUltima() {
      const r = obtenerRegion();
      if (Math.max(0, lineas.length - r.alto) !== primeraVisible) return dibujar();
      dibujarLinea(r, lineas.length - 1 - primeraVisible, lineas[lineas.length - 1]);
    }

    return {
      lineas,
      dibujar,
      agregar(segmentos) { lineas.push(normalizar(segmentos || [])); refrescarUltima(); },
      anexar(segmento) {
        if (!lineas.length) lineas.push([]);
        lineas[lineas.length - 1].push(...normalizar([segmento]));
        refrescarUltima();
      },
      reemplazarUltima(segmentos) {
        if (!lineas.length) lineas.push([]);
        lineas[lineas.length - 1] = normalizar(segmentos);
        refrescarUltima();
      },
      limpiar() { lineas.length = 0; primeraVisible = 0; obtenerRegion().limpiar(); },
      // Posición en pantalla del final de la última línea (para el cursor).
      finalDeLinea() {
        const r = obtenerRegion();
        const ultima = lineas[lineas.length - 1] || [];
        const n = ultima.reduce((s, seg) => s + (seg.relleno ? 0 : largo(seg.t)), 0);
        return { x: r.x + n, y: r.y + Math.max(0, lineas.length - 1 - primeraVisible) };
      },
    };
  }

  const CANCELADO = { cancelado: true };
  const cuadro = () => new Promise((ok) => requestAnimationFrame(ok));

  function crearEscritor(consola) {
    let rapido = false, cancelado = false;

    function comprobar() { if (cancelado) throw CANCELADO; }

    async function esperar(ms) {
      const fin = performance.now() + ms;
      while (!rapido && performance.now() < fin) { comprobar(); await cuadro(); }
      comprobar();
    }

    // Escribe una línea nueva carácter por carácter.
    async function linea(segmentos, opciones) {
      comprobar();
      const o = opciones || {};
      const velocidad = o.velocidad || cfg().texto.velocidadEscritura;
      consola.agregar([]);
      for (const seg of normalizar(segmentos)) {
        if (seg.relleno || rapido || o.instantaneo) { consola.anexar(seg); continue; }
        consola.anexar({ ...seg, t: "" });
        const ultima = consola.lineas[consola.lineas.length - 1];
        const actual = ultima[ultima.length - 1];
        const letras = Array.from(seg.t);
        let escritas = 0, marca = performance.now();
        while (escritas < letras.length) {
          if (rapido) escritas = letras.length;
          else {
            await cuadro();
            comprobar();
            const ahora = performance.now();
            const nuevas = Math.floor((ahora - marca) / velocidad);
            if (nuevas > 0) { escritas = Math.min(letras.length, escritas + nuevas); marca += nuevas * velocidad; }
          }
          actual.t = letras.slice(0, escritas).join("");
          consola.reemplazarUltima(ultima);
        }
      }
      if (o.pausa) await esperar(o.pausa);
    }

    return {
      linea,
      esperar,
      saltar() { rapido = true; },
      cancelar() { cancelado = true; },
      get saltado() { return rapido; },
    };
  }

  DENDRO.escritor = { crearConsola, crearEscritor, CANCELADO, esperar: cuadro };
})(window.DENDRO = window.DENDRO || {});
