// Degradación visual (RF-07): episodios de glitch que corrompen o desplazan filas de la rejilla y hacen
// temblar, cortar o desfasar la capa vectorial; y el reloj τ irregular de la fase 4 (RF-14).
// Los episodios salen de un PRNG sembrado por la franja de tiempo (nunca de Math.random()) y son más
// frecuentes y largos con la intensidad del Estado. Solo afectan al dibujo: el búfer de la rejilla y
// el texto que leen el espejo y las pruebas no cambian. Con movimiento reducido no hay episodios.
(function (DENDRO) {
  "use strict";

  const FRANJA_MS = 90;           // resolución de los episodios
  const DURACION_MAX = 4;         // franjas que puede durar un episodio
  const TASA = 0.12;              // probabilidad por franja con intensidad 1 (crece con i²)
  const TASA_MAX = 0.9;
  const RAFAGA_MAX = 2.6;         // intensidad que alcanza la ráfaga del colapso en vivo
  const TEMBLOR_PX = 3;           // desplazamiento máximo de la capa vectorial, en px CSS
  const RUIDO = Array.from("▒░▓#%&@$?¿§¤◊/\\|<>");
  const TIPOS = ["corrupto", "corrupto", "desfase", "apagada", "vector", "vector"];

  const e = {
    intensidad: 0, rafaga: null, reducido: false,
    clave: "", filas: new Map(), temblor: null, bandas: [], vectorialAntes: false,
  };

  const limitar = (x, a, b) => Math.max(a, Math.min(b, x));

  function intensidadEn(ahora) {
    if (!e.rafaga) return e.intensidad;
    const k = limitar((ahora - e.rafaga.desde) / e.rafaga.ms, 0, 1);
    return e.intensidad + (RAFAGA_MAX - e.intensidad) * k * k;
  }

  // Episodios que empiezan en la franja k (mismos en cada fotograma de la franja).
  function episodiosDe(k, i) {
    const rng = DENDRO.prng.crear("glitch", k);
    if (rng() >= Math.min(TASA_MAX, TASA * i * i)) return [];
    const n = 1 + Math.floor(rng() * (1 + i * 1.5));
    const lista = [];
    for (let j = 0; j < n; j++) {
      lista.push({
        tipo: DENDRO.prng.elegir(rng, TIPOS),
        dura: 1 + Math.floor(rng() * DURACION_MAX * Math.min(1.5, 0.5 + i)),
        fila: rng(), filas: 1 + Math.floor(rng() * (1 + i * 3)),
        desfase: (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * (2 + i * 4))),
        densidad: 0.15 + rng() * 0.5,
        semilla: Math.floor(rng() * 4294967296),
        alto: 0.02 + rng() * 0.12 * Math.min(1.5, i),
        dx: (rng() - 0.5) * 2, dy: (rng() - 0.5) * 2,
      });
    }
    return lista;
  }

  // Sustitución de caracteres de una fila corrupta: determinista por episodio y columna.
  function corruptor(semilla, densidad) {
    return (x, cp) => {
      if (cp === 32) return cp;
      const h = DENDRO.prng.mulberry32(semilla ^ Math.imul(x + 1, 0x9e3779b1))();
      return h < densidad ? RUIDO[Math.floor(h / densidad * RUIDO.length)].codePointAt(0) : cp;
    };
  }

  // Llamar en cada fotograma, antes de renderizar. Devuelve true si la capa vectorial debe redibujarse.
  function actualizar(ahora) {
    const filasTotales = DENDRO.pantalla.filas;
    const k = Math.floor(ahora / FRANJA_MS);
    const activos = [];
    if (!e.reducido && filasTotales) {
      for (let j = k - DURACION_MAX * 2 + 1; j <= k; j++) {
        for (const ep of episodiosDe(j, intensidadEn(j * FRANJA_MS))) if (j + ep.dura > k) activos.push(ep);
      }
    }
    const clave = activos.map((ep) => ep.semilla).join(",");
    if (clave !== e.clave) {
      e.clave = clave;
      const filas = new Map();
      e.temblor = null; e.bandas = [];
      for (const ep of activos) {
        if (ep.tipo === "vector") {
          const fuerza = TEMBLOR_PX * Math.min(1.5, intensidadEn(ahora));
          e.temblor = { dx: ep.dx * fuerza, dy: ep.dy * fuerza * 0.5 };
          e.bandas.push({ y: ep.fila, alto: ep.alto, dx: ep.desfase * 0.006, corte: ep.densidad > 0.5 });
          continue;
        }
        const y0 = Math.floor(ep.fila * filasTotales);
        for (let y = y0; y < Math.min(filasTotales, y0 + ep.filas); y++) {
          filas.set(y, {
            apagada: ep.tipo === "apagada",
            desfase: ep.tipo === "desfase" ? ep.desfase : 0,
            caracter: ep.tipo === "corrupto" ? corruptor(ep.semilla + y, ep.densidad) : null,
          });
        }
      }
      e.filas = filas;
      DENDRO.pantalla.perturbar(filas);
    }
    if (e.rafaga) DENDRO.crt.fijarIntensidad(Math.min(1, intensidadEn(ahora)));
    const vectorial = !!(e.temblor || e.bandas.length);
    const redibujar = vectorial || e.vectorialAntes;
    e.vectorialAntes = vectorial;
    return redibujar;
  }

  // Ráfaga del colapso en vivo: la intensidad sube hasta RAFAGA_MAX en ms y la promesa se cumple al final.
  function rafaga(ms) {
    const duracion = e.reducido ? Math.min(ms, 400) : ms;
    e.rafaga = { desde: performance.now(), ms: duracion };
    return new Promise((ok) => setTimeout(ok, duracion));
  }

  // Sin episodios ni ráfaga (pantalla de colapso).
  function calmar() {
    e.intensidad = 0;
    e.rafaga = null;
  }

  // Reloj τ de la fase 4: a ratos tartamudea (repite latidos), salta con cifras corruptas o se borra.
  function relojIrregular(ms) {
    const latido = DENDRO.tau.latido();
    const rng = DENDRO.prng.crear("tau-irregular", Math.floor(ms / latido));
    const r = rng();
    if (r < 0.12) return DENDRO.tau.reloj(ms - latido * (1 + Math.floor(rng() * 3)));
    const texto = DENDRO.tau.reloj(ms);
    if (r < 0.2) return texto.replace(/\d/g, (d) => (rng() < 0.35 ? DENDRO.prng.elegir(rng, RUIDO) : d));
    if (r < 0.24) return texto.replace(/\d/g, "▒");
    return texto;
  }

  DENDRO.glitch = {
    actualizar, rafaga, calmar, relojIrregular,
    iniciar({ reducido }) { e.reducido = !!reducido; },
    fijarIntensidad(x) { e.intensidad = Math.max(0, x); },
    // Para la capa vectorial: desplazamiento del fotograma y bandas cortadas o desfasadas (fracciones del alto).
    temblor: () => e.temblor,
    bandas: () => e.bandas,
  };
})(window.DENDRO = window.DENDRO || {});
