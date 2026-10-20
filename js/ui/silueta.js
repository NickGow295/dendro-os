// Silueta del Injertador (04-lore.md §3.1): figura alta y quieta de unas nueve cabezas, sin rostro,
// con brazos pegados al cuerpo; su contorno se deshace en ramas finas que suben hasta las ramas del
// Árbol. Contorno y ramas en `rama`; los tramos que tocan el Árbol, en `arma`. La usan el ÁRBOL y el
// epílogo del colapso, siempre a través de un contexto vectorial (nunca el canvas).
(function (DENDRO) {
  "use strict";

  const CABEZAS = 9;
  const SUSTRATO = 0.45;          // alto del sustrato con la silueta (normalizado, como la disposición)
  const PIES = 0.86;              // fracción del sustrato donde apoya los pies
  const CABEZA_ARRIBA = 0.03;     // margen entre la cabeza y la base de MYTH
  // Mitad derecha del contorno, en cabezas: u hacia la derecha, w hacia arriba desde los pies.
  const CONTORNO = [
    [0.15, 7.92], [0.17, 7.72], [0.55, 7.55], [0.92, 7.35], [0.96, 6.6], [0.9, 5.4], [0.82, 4.25],
    [0.85, 3.85], [0.72, 3.32], [0.6, 3.72], [0.56, 3.5], [0.42, 2.1], [0.36, 1.5], [0.2, 0.35],
    [0.34, 0], [0.08, 0], [0.08, 0.35], [0.11, 2.1], [0, 4.15],
  ];
  const CABEZA = { w: 8.45, ru: 0.36, rw: 0.58 };
  // Donde nacen sus ramas: hombros, dedos, costados y pies.
  const ORIGENES = [[-0.92, 7.35], [0.92, 7.35], [-0.72, 3.32], [0.72, 3.32], [-0.9, 5.6], [0.9, 5.6], [-0.34, 0], [0.34, 0]];
  const CONTACTO = 0.22;          // fracción final de cada rama que tira del Árbol (en rojo)
  const PUNTOS_ESTATICA = 26;
  const PROB_SALTO = 0.06;        // probabilidad por franja de un salto de glitch de la figura
  const FRANJA_SALTO_MS = 140;

  const contornoCompleto = (() => {
    const izq = CONTORNO.slice().reverse().map(([u, w]) => [-u, w]);
    return [...CONTORNO, ...izq.slice(1)];
  })();

  // Rama principal: de un origen a un objetivo, saliendo hacia fuera y subiendo, con quiebros sembrados.
  function trazarRama(o, d, lado, rng) {
    const cx = o[0] + lado * (6 + Math.abs(d[0] - o[0]) * 0.6), cy = d[1] + (o[1] - d[1]) * 0.8;
    const pts = [];
    const N = 14;
    for (let k = 0; k <= N; k++) {
      const t = k / N, u = 1 - t;
      const x = u * u * o[0] + 2 * u * t * cx + t * t * d[0];
      const y = u * u * o[1] + 2 * u * t * cy + t * t * d[1];
      const ruido = k === 0 || k === N ? 0 : (rng() - 0.5) * 0.9;
      pts.push([x + ruido, y + ruido * 0.5]);
    }
    return pts;
  }

  // Ramillas fractales que salen de un punto y se dividen hacia arriba.
  function ramillas(v, x, y, angulo, largo, nivel, rng, aspecto, segs) {
    if (nivel < 0 || largo < 0.15) return;
    const x2 = x + (Math.cos(angulo) * largo) / aspecto, y2 = y - Math.sin(angulo) * largo;
    segs.push(x, y, x2, y2);
    ramillas(v, x2, y2, angulo + 0.35 + rng() * 0.3, largo * 0.62, nivel - 1, rng, aspecto, segs);
    ramillas(v, x2, y2, angulo - 0.35 - rng() * 0.3, largo * 0.62, nivel - 1, rng, aspecto, segs);
  }

  // o = { x, y: pies en celdas; alto: altos de celda; objetivos: [[x, y]…] en celdas; opacidad;
  //       ahora; reducido; crecimiento 0..1; alfaContorno y alfaRamas (para el epílogo) }
  function dibujar(v, o) {
    const op = o.opacidad === undefined ? 1 : o.opacidad;
    const alfaContorno = op * (o.alfaContorno === undefined ? 1 : o.alfaContorno);
    const alfaRamas = op * (o.alfaRamas === undefined ? 1 : o.alfaRamas);
    if (alfaContorno <= 0.01 && alfaRamas <= 0.01) return;
    const a = v.aspecto, H = o.alto / CABEZAS;
    let x0 = o.x;
    if (!o.reducido) {
      const salto = DENDRO.prng.crear("silueta-salto", Math.floor(o.ahora / FRANJA_SALTO_MS));
      if (salto() < PROB_SALTO) x0 += (salto() < 0.5 ? -1 : 1) * (1 + salto() * 2.5);
    }
    const px = (u) => x0 + (u * H) / a, py = (w) => o.y - w * H;

    if (alfaContorno > 0.01) {
      v.polilinea(contornoCompleto.map(([u, w]) => [px(u), py(w)]), "rama", { alfa: alfaContorno, grosor: 1.5 });
      const cabeza = [];
      for (let k = 0; k <= 28; k++) {
        const t = (k / 28) * Math.PI * 2;
        cabeza.push([px(Math.cos(t) * CABEZA.ru), py(CABEZA.w + Math.sin(t) * CABEZA.rw)]);
      }
      v.polilinea(cabeza, "rama", { alfa: alfaContorno, grosor: 1.5 });
      // Estática dentro del óvalo vacío.
      const rng = DENDRO.prng.crear("silueta-estatica", o.reducido ? 0 : Math.floor(o.ahora / 70));
      const puntos = [];
      for (let k = 0; k < PUNTOS_ESTATICA; k++) {
        const ang = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 0.85;
        puntos.push(px(Math.cos(ang) * CABEZA.ru * r), py(CABEZA.w + Math.sin(ang) * CABEZA.rw * r));
      }
      v.puntos(puntos, "rama", { tam: 0.9, alfa: alfaContorno * 0.6 });
    }

    if (alfaRamas <= 0.01 || !o.objetivos || !o.objetivos.length) return;
    const crecimiento = o.crecimiento === undefined ? 1 : o.crecimiento;
    const blancas = [], rojas = [], finas = [], contactos = [];
    ORIGENES.forEach(([u, w], i) => {
      const destino = o.objetivos[i % o.objetivos.length];
      const rng = DENDRO.prng.crear("silueta-rama", i);
      const pts = trazarRama([px(u), py(w)], destino, Math.sign(u), rng);
      const corte = Math.floor(pts.length * (1 - CONTACTO));
      for (let k = 1; k < pts.length; k++) (k > corte ? rojas : blancas).push(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]);
      contactos.push(destino[0], destino[1]);
      // Ramillas a lo largo de la rama: crecen despacio durante el día y respiran un poco.
      const respira = o.reducido ? 1 : 0.85 + 0.15 * Math.sin(o.ahora / 4000 + i);
      for (let k = 2; k < corte; k += 3) {
        const [x, y] = pts[k];
        ramillas(v, x, y, Math.PI / 2 + (rng() - 0.5) * 1.4, (0.6 + rng() * 0.9) * crecimiento * respira, 2, rng, a, finas);
      }
    });
    v.trazos(finas, "rama", { grosor: 0.7, alfa: alfaRamas * 0.55 });
    v.trazos(blancas, "rama", { grosor: 1.1, alfa: alfaRamas * 0.9 });
    v.trazos(rojas, "arma", { grosor: 1.4, alfa: alfaRamas });
    v.puntos(contactos, "arma", { tam: 1.8, alfa: alfaRamas });
  }

  DENDRO.silueta = { dibujar, CABEZAS, SUSTRATO, PIES, CABEZA_ARRIBA };
})(window.DENDRO = window.DENDRO || {});
