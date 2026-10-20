// V2 ÁRBOL (02-diseno.md §6): el diagrama completo. Árbol fractal determinista (semilla fija),
// ramas blancas, tierras azules en las puntas, parejas que se curvan al acercarse, ataques rojos,
// aniquiladas apagadas y grietas que aparecen con la fase.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO } = C;
  const LARGOS = [0.2, 0.2, 0.16, 0.12, 0.09];         // por nivel: tronco, ramas, rama de pareja, hoja
  const GROSORES = [3.4, 2.6, 2, 1.5, 1.2];
  const ABERTURA_HOJA = 0.5;
  const RADIO_NODO = 0.45;                                // en altos de celda
  const VELOCIDAD_MISIL = 0.35;

  // Geometría normalizada (x hacia la derecha, y hacia arriba, tronco en el origen). Siempre igual.
  function construir(parejas) {
    const rng = DENDRO.prng.crear("arbol");
    const segmentos = [], nudos = [];
    (function rama(x, y, ang, nivel) {
      const largo = LARGOS[nivel] * (0.9 + rng() * 0.2);
      const x2 = x + Math.sin(ang) * largo, y2 = y + Math.cos(ang) * largo;
      segmentos.push({ x1: x, y1: y, x2, y2, nivel });
      if (nivel === 3) { nudos.push({ x: x2, y: y2, ang }); return; }
      const aperturas = nivel === 0 ? [-0.78, 0, 0.78] : [-(0.55 - nivel * 0.08), 0.55 - nivel * 0.08];
      for (const d of aperturas) rama(x2, y2, ang + d + (rng() - 0.5) * 0.12, nivel + 1);
    })(0, 0, 0, 0);

    // Reparto de parejas: barajado fijo, con el ancla (la última pareja) en el nudo más central.
    const orden = parejas.map((p) => p.id);
    for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
    const ancla = parejas[parejas.length - 1].id;
    const central = nudos.reduce((m, n, i) => (Math.abs(n.x) < Math.abs(nudos[m].x) ? i : m), 0);
    const k = orden.indexOf(ancla);
    [orden[k], orden[central]] = [orden[central], orden[k]];

    const hojas = {};
    nudos.forEach((n, i) => {
      const par = parejas.find((p) => p.id === orden[i]);
      n.pareja = par.id;
      [[par.a, -1], [par.b, 1]].forEach(([id, lado]) => {
        const ang = n.ang + lado * ABERTURA_HOJA;
        hojas[id] = { x: n.x + Math.sin(ang) * LARGOS[4], y: n.y + Math.cos(ang) * LARGOS[4], nudo: n };
      });
    });
    const xs = [...segmentos.map((s) => s.x2), ...Object.values(hojas).map((h) => h.x)];
    const ys = [...segmentos.map((s) => s.y2), ...Object.values(hojas).map((h) => h.y)];
    return { segmentos, nudos, hojas, minX: Math.min(...xs), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }

  function crear(ctx) {
    const { estado, ui } = ctx;
    const arbol = construir(estado.parejas);
    const ordenHojas = Object.keys(arbol.hojas).sort((a, b) => arbol.hojas[a].x - arbol.hojas[b].x);
    if (!ui.tierraSeleccionada) ui.tierraSeleccionada = C.pareja(estado, estado.parejaPrincipal).a;
    let lienzo = null, hover = null, aspecto = 0.5, puntos = {};

    function dibujar(reg) {
      const t = C.tierra(estado, ui.tierraSeleccionada);
      const par = t.pareja ? C.pareja(estado, t.pareja) : null;
      const fin = reg.escribir(1, 0, `${t.id} ${MAYUS(t.nombre)}`, "texto");
      const x = reg.escribir(fin + 1, 0, ` ${t.estado} `, COLOR_ESTADO[t.estado], { inverso: true });
      if (reg.ancho >= 80) {
        reg.escribir(x + 1, 0, `${par ? par.id : "—"} · ESTABILIDAD ${t.estabilidad} %`, "textoTenue");
        reg.derecha(0, "←→ SELECCIONAR · ENTER EXPEDIENTE ", "textoTenue");
      }
      const leyenda = [["── RAMA", "rama"], ["● TIERRA", "tierra"], ["⌒ ATAQUE", "arma"], ["✕ ANIQUILADA", "textoTenue"], ["≈ GRIETA", "texto"]];
      let lx = 1;
      for (const [texto, color] of leyenda) lx = reg.escribir(lx, reg.alto - 1, texto, color) + 3;
      lienzo = reg.region(0, 1, reg.ancho, reg.alto - 2);
    }

    // Normalizado → celdas de la región del lienzo.
    function proyeccion(v) {
      const anchoN = arbol.maxX - arbol.minX + 0.12, altoN = arbol.maxY + 0.08;
      const S = Math.min((v.alto - 1) / altoN, (v.ancho * v.aspecto) / anchoN);
      const cx = v.ancho / 2 - ((arbol.minX + arbol.maxX) / 2) * (S / v.aspecto);
      const base = v.alto - 0.6;
      return (x, y) => [cx + (x * S) / v.aspecto, base - y * S];
    }

    function posicionesHojas(a) {
      const pos = {};
      for (const n of arbol.nudos) {
        const par = C.pareja(estado, n.pareja);
        const ha = arbol.hojas[par.a], hb = arbol.hojas[par.b];
        const mx = (ha.x + hb.x) / 2, my = (ha.y + hb.y) / 2;
        const acerca = par.estado === "FUSIONADA" ? 0.5 : (1 - par.separacion) * 0.42;
        for (const [id, h] of [[par.a, ha], [par.b, hb]]) {
          pos[id] = a(h.x + (mx - h.x) * acerca, h.y + (my - h.y) * acerca);
        }
      }
      return pos;
    }

    function grietas(v, a, segundos) {
      if (estado.fase < 3) return;
      const rng = DENDRO.prng.crear(estado.dia, "grietas");
      const n = Math.round(estado.intensidad * 16);
      for (let i = 0; i < n; i++) {
        const s = arbol.segmentos[Math.floor(rng() * arbol.segmentos.length)];
        const t = 0.2 + rng() * 0.6, largo = 0.8 + rng() * 0.8;
        const [x1, y1] = a(s.x1, s.y1), [x2, y2] = a(s.x2, s.y2);
        const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
        // Perpendicular al segmento, en altos de celda
        const dx = (x2 - x1) * v.aspecto, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l, ny = dx / l;
        const puntosGrieta = [];
        for (let k = 0; k <= 4; k++) {
          const f = (k / 4 - 0.5) * largo, zig = (k % 2 ? 1 : -1) * 0.18;
          puntosGrieta.push([px + ((nx * f + (dx / l) * zig) / v.aspecto), py + ny * f + (dy / l) * zig]);
        }
        const parpadeo = 0.6 + 0.4 * Math.sin(segundos * 3 + i);
        v.polilinea(puntosGrieta, rng() < 0.5 ? "texto" : "arma", { alfa: parpadeo, grosor: 1.1 });
      }
    }

    function particulas(v, a, segundos) {
      if (estado.fase < 4) return;
      const rng = DENDRO.prng.crear(estado.dia, "particulas");
      for (let i = 0; i < 40; i++) {
        const s = arbol.segmentos[Math.floor(rng() * arbol.segmentos.length)];
        const t = rng(), fase = rng(), deriva = (rng() - 0.5) * 2;
        const [x1, y1] = a(s.x1, s.y1), [x2, y2] = a(s.x2, s.y2);
        const k = (segundos * 0.25 + fase) % 1;
        v.punto(x1 + (x2 - x1) * t + deriva * k * 2, y1 + (y2 - y1) * t + k * 5, i % 3 ? "rama" : "tierra", { tam: 1.2, alfa: 1 - k });
      }
    }

    function vectores(raiz, ahora) {
      if (!lienzo) return;
      const v = lienzo.vectores(), segundos = ahora / 1000, a = proyeccion(v);
      aspecto = v.aspecto;

      for (const s of arbol.segmentos) {
        const [x1, y1] = a(s.x1, s.y1), [x2, y2] = a(s.x2, s.y2);
        v.linea(x1, y1, x2, y2, "rama", { grosor: GROSORES[s.nivel] });
      }
      const [tx, ty] = a(0, 0);
      v.texto(tx, ty - 0.2, "TRONCO · M11", "textoTenue", { tam: 0.9, alinear: "center", base: "bottom" });

      puntos = posicionesHojas(a);
      for (const n of arbol.nudos) {
        const par = C.pareja(estado, n.pareja);
        const [nx, ny] = a(n.x, n.y);
        v.texto(nx, ny + 0.4, par.id, "ambarTenue", { tam: 0.8, alinear: "center" });
        for (const id of [par.a, par.b]) {
          const t = C.tierra(estado, id), [hx, hy] = puntos[id];
          const apagada = t.estado === "ANIQUILADA" || t.estado === "COLAPSO";
          // La hoja se curva hacia su pareja: el punto de control sigue la dirección original.
          const h = arbol.hojas[id], [cx, cy] = a(n.x + (h.x - n.x) * 0.5, n.y + (h.y - n.y) * 0.5);
          v.curva(nx, ny, cx, cy, hx, hy, "rama", { grosor: GROSORES[4], alfa: apagada ? 0.15 : 1 });
        }
      }
      grietas(v, a, segundos);
      particulas(v, a, segundos);

      // Ataques
      estado.ataques.forEach((atq, i) => {
        const d = puntos[atq.desde], h = puntos[atq.hacia];
        if (!d || !h) return;
        const cx = (d[0] + h[0]) / 2, cy = Math.min(d[1], h[1]) - 3;
        v.curva(d[0], d[1], cx, cy, h[0], h[1], "arma", { discontinua: [2, 4], alfa: 0.5 });
        for (let k = 0; k < 2; k++) {
          const t = (segundos * VELOCIDAD_MISIL + k / 2 + i * 0.13) % 1;
          const q = DENDRO.vectores.puntoEnCurva(d[0], d[1], cx, cy, h[0], h[1], t);
          v.punto(q.x, q.y, "arma", { tam: 2 });
        }
      });

      // Nodos de tierra
      const pulso = 0.5 + 0.5 * Math.sin(segundos * 4);
      for (const id of Object.keys(puntos)) {
        const t = C.tierra(estado, id), [x, y] = puntos[id];
        const apagada = t.estado === "ANIQUILADA" || t.estado === "COLAPSO";
        if (apagada) {
          const r = RADIO_NODO * 0.8;
          v.linea(x - r / v.aspecto, y - r, x + r / v.aspecto, y + r, "textoTenue", { alfa: 0.6 });
          v.linea(x - r / v.aspecto, y + r, x + r / v.aspecto, y - r, "textoTenue", { alfa: 0.6 });
        } else {
          v.circulo(x, y, RADIO_NODO, "tierra", { relleno: "tierra", rellenoAlfa: 0.35, grosor: 1.6 });
          if (t.estado === "APROXIMACIÓN") v.circulo(x, y, RADIO_NODO + 0.35 + pulso * 0.2, "ambar", { alfa: 0.4 + 0.4 * pulso });
          if (t.estado === "HOSTILIDADES") v.circulo(x, y, RADIO_NODO + 0.4, "arma", { alfa: 0.4 + 0.6 * pulso, grosor: 1.6 });
          if (t.estado === "SUPERVIVIENTE") v.circulo(x, y, RADIO_NODO + 0.3, "arma", { alfa: 0.6 });
        }
        if (id === ui.tierraSeleccionada || id === hover) {
          const seleccion = id === ui.tierraSeleccionada;
          if (seleccion) v.circulo(x, y, RADIO_NODO + 0.8, "ambar", { grosor: window.DENDRO_CONFIG.vectores.grosorActivo });
          v.texto(x, y - 1.4, `${t.id} ${MAYUS(t.nombre)}`, seleccion ? "ambar" : "texto", { tam: 1, alinear: "center", base: "bottom" });
        }
      }
    }

    function seleccionar(paso) {
      const i = ordenHojas.indexOf(ui.tierraSeleccionada);
      ui.tierraSeleccionada = ordenHojas[(i + paso + ordenHojas.length) % ordenHojas.length];
      ctx.redibujar();
    }

    function hojaEn(punto) {
      if (!punto || !lienzo) return null;
      const x = punto.x, y = punto.y - 1;   // el lienzo empieza una fila por debajo de la vista
      let mejor = null, distancia = 1.4;
      for (const [id, [hx, hy]] of Object.entries(puntos)) {
        const d = Math.hypot((x - hx) * aspecto, y - hy);
        if (d < distancia) { distancia = d; mejor = id; }
      }
      return mejor;
    }

    return {
      animada: true,
      dibujar,
      vectores,
      tecla(ev) {
        if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") { ev.preventDefault(); seleccionar(-1); }
        else if (ev.key === "ArrowRight" || ev.key === "ArrowDown") { ev.preventDefault(); seleccionar(1); }
        else if (ev.key === "Enter") { ev.preventDefault(); ctx.abrir("expediente"); }
      },
      toque(punto) {
        const id = hojaEn(punto);
        if (!id) return;
        if (id === ui.tierraSeleccionada) ctx.abrir("expediente");
        else { ui.tierraSeleccionada = id; ctx.redibujar(); }
      },
      movimiento(punto) {
        hover = hojaEn(punto);
      },
    };
  }

  DENDRO.vistas.registrar({ id: "arbol", tecla: "2", titulo: "ÁRBOL", tituloCorto: "ÁRB", crear });
})(window.DENDRO = window.DENDRO || {});
