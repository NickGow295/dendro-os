// V2 ÁRBOL (02-diseno.md §6): el catálogo completo con MYTH como tronco y el sustrato debajo.
// Las ramas se dibujan por lotes de color (blanco, rampa de convergencia, tenue para las aniquiladas),
// con recorte por la ventana y nivel de detalle según el zoom. Misiles rojos animados entre las ramas
// en hostilidades. Zoom 1×–zoomMax (+/−, rueda, pellizco), desplazamiento (flechas, arrastre),
// Inicio vuelve a la vista completa, Tab recorre las nombradas, A salta a la siguiente pareja activa,
// tocar elige la rama más cercana y Enter abre su EXPEDIENTE. La cámara vive en ui.camara.
// El 16/12 la silueta del Injertador ocupa el sustrato (más hondo) y tira de las ramas activas;
// desde los vislumbres, a ratos aparece un trazo de un solo fotograma en el sustrato.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO } = C;
  const cfgA = () => window.DENDRO_CONFIG.vectores.arbol;
  const GROSOR_NIVEL = [4.4, 2.6, 1.7, 1.05, 0.8];      // px CSS por nivel (0 = tronco)
  const ZOOM_PUNTOS = 3;                                // desde aquí, las ramas generadas son puntos
  const ZOOM_CODIGOS = 12;                              // y desde aquí, llevan su código
  const ZOOM_SEGUIR = 4;                                // zoom mínimo al saltar a una rama
  const MAX_CODIGOS = 90;
  const RADIO_NODO = 0.42;                              // en altos de celda
  const RADIO_TOQUE = 1.6;                              // celdas
  const VELOCIDAD_MISIL = 0.3;
  const PASO_DESPLAZAMIENTO = 0.12;                     // fracción de la ventana por pulsación
  const SUSTRATO = 0.075;                               // alto de la franja del Bulk bajo MYTH (normalizado)
  const PROB_VISLUMBRE = 0.4;                           // por minuto
  const ANCHO_MINIMAPA = 16, ALTO_MINIMAPA = 8;
  const DESTRUIDAS = ["ANIQUILADA", "COLAPSO"];

  function crear(ctx) {
    const { ui } = ctx;
    let estado = ctx.estado;
    const cat = DENDRO.multiverso.catalogo(), disp = DENDRO.multiverso.disposicion();
    const pos = disp.posiciones;
    const profundidad = () => (estado.silueta.visible ? DENDRO.silueta.SUSTRATO : SUSTRATO);
    const lim = { minX: disp.limites.minX - 0.03, maxX: disp.limites.maxX + 0.03, minY: -profundidad() - 0.02, maxY: disp.limites.maxY + 0.03 };
    const nombradas = cat.nodos.filter((n) => n.nombrada).map((n) => n.codigo).sort((a, b) => pos[a].x - pos[b].x);
    const tronco = disp.segmentos.filter((s) => s.nivel <= 2);
    if (!ui.tierraSeleccionada || !pos[ui.tierraSeleccionada]) ui.tierraSeleccionada = C.parejaNombrada(estado).a;
    if (!ui.camara) ui.camara = vistaCompleta();
    const cam = ui.camara;
    let lienzo = null, hover = null, W = 0, H = 0, S = 1, aspecto = 0.5;
    let colores = null, objetivos = [], vislumbreVisto = -1;

    function vistaCompleta() { return { zoom: 1, x: (lim.minX + lim.maxX) / 2, y: (lim.minY + lim.maxY) / 2 }; }

    // ── Colores por Estado (una vez por minuto) ─────────────────────────────
    // Rampa en el camino desde el antecesor común hasta cada rama de una pareja activa; aniquiladas tenues;
    // en una fusión, la segunda rama no se dibuja como nodo propio.
    function preparar() {
      const rampa = new Map(), apagadas = new Set(), fundidas = new Set();
      const marcar = (desde, hasta, tono) => { for (let c = desde; c && c !== hasta; c = cat.porCodigo[c].padre) rampa.set(c, tono); };
      for (const par of estado.parejas) {
        if (C.ACTIVOS.includes(par.estado)) {
          const tono = DENDRO.tema.tonoRampa(1 - (par.estado === "APROXIMACIÓN" ? par.separacion : 0));
          const ancestros = new Set();
          for (let c = par.a; c; c = cat.porCodigo[c].padre) ancestros.add(c);
          let comun = par.b;
          while (comun && !ancestros.has(comun)) comun = cat.porCodigo[comun].padre;
          marcar(par.a, comun, tono);
          marcar(par.b, comun, tono);
        } else if (par.estado === "FUSIONADA") fundidas.add(par.b);
        else if (C.RESUELTOS.includes(par.estado)) {
          const s = par.desenlace.startsWith("superviviente:") ? par.desenlace.slice(14) : null;
          for (const c of [par.a, par.b]) if (c !== s) apagadas.add(c);
        }
      }
      colores = { rampa, apagadas, fundidas };
      lim.minY = -profundidad() - 0.02;
      objetivos = estado.silueta.visible ? objetivosSilueta() : [];
    }

    // Ocho ramas de las que tira el Injertador: las de las parejas activas (repartidas) y, si faltan,
    // las primarias. Se ordenan para que los orígenes de cada lado tiren de su lado.
    function objetivosSilueta() {
      const activas = [...new Set(estado.parejas.filter((p) => C.ACTIVOS.includes(p.estado)).flatMap((p) => [p.a, p.b]))].filter((c) => pos[c]).sort();
      const elegidas = [];
      for (let i = 0; i < 8 && activas.length; i++) elegidas.push(activas[Math.floor((i * activas.length) / 8)]);
      for (const n of cat.nodos) if (elegidas.length < 8 && n.nivel === 1 && !elegidas.includes(n.codigo)) elegidas.push(n.codigo);
      const porX = [...new Set(elegidas)].sort((a, b) => pos[a].x - pos[b].x);
      const izq = porX.slice(0, Math.ceil(porX.length / 2)), der = porX.slice(Math.ceil(porX.length / 2)).reverse();
      const orden = [];
      for (let i = 0; i < 4; i++) orden.push(izq[i % izq.length], der[i % der.length] || izq[i % izq.length]);
      return orden;
    }
    preparar();

    // ── Proyección ──────────────────────────────────────────────────────────
    // Altos de celda por unidad normalizada con zoom 1: el árbol entero cabe en la ventana.
    const escalaBase = () => Math.min((H - 1) / (lim.maxY - lim.minY), (W * aspecto) / (lim.maxX - lim.minX));
    function ajustar(v) {
      W = v.ancho; H = v.alto; aspecto = v.aspecto;
      S = escalaBase() * cam.zoom;
    }
    const sx = (x) => W / 2 + ((x - cam.x) * S) / aspecto;
    const sy = (y) => H / 2 - (y - cam.y) * S;
    const mundo = (px, py) => ({ x: cam.x + ((px - W / 2) * aspecto) / S, y: cam.y - (py - H / 2) / S });
    const visible = (x, y, m) => x > -m && x < W + m && y > -m && y < H + m;

    function limitarCamara() {
      cam.zoom = Math.max(1, Math.min(cfgA().zoomMax, cam.zoom));
      cam.x = Math.max(lim.minX, Math.min(lim.maxX, cam.x));
      cam.y = Math.max(lim.minY, Math.min(lim.maxY, cam.y));
    }

    // ── Texto ───────────────────────────────────────────────────────────────
    function dibujar(reg) {
      const ancho = reg.ancho >= 80;
      const total = DENDRO.escritorio.formatoRamas(estado.ramasCatalogadas);
      const cabecera = ancho ? `RAMAS CATALOGADAS: ${total} / ∞ · EN COLISIÓN ${estado.enColision}` : `${total}/∞ · COL ${estado.enColision}`;
      reg.escribir(1, 0, cabecera, "ambar");
      const t = estado.tierras.porCodigo(ui.tierraSeleccionada);
      if (t) {
        const nombre = t.raiz ? "MYTH · TRONCO" : t.nombre ? `${C.codigoCorto(t.codigo)} ${MAYUS(t.nombre)}` : t.codigo;
        if (ancho) reg.derecha(0, ` ${nombre} · ${t.estado} `, t.raiz ? "rama" : COLOR_ESTADO[t.estado]);
      }
      const leyenda = [["── RAMA", "rama"], ["● TIERRA", "tierra"], ["⌒ ATAQUE", "arma"], ["▬ CONVERGENCIA", "rampa5"], ["✕ ANIQUILADA", "textoTenue"]];
      let lx = 1;
      for (const [texto, color] of leyenda) {
        if (lx + texto.length >= reg.ancho - 10) break;
        lx = reg.escribir(lx, reg.alto - 1, texto, color) + 2;
      }
      reg.derecha(reg.alto - 1, `×${cam.zoom.toFixed(1)} `, "ambarTenue");
      if (reg.ancho >= 110) reg.escribir(lx + 1, reg.alto - 1, "+− ZOOM · TAB TIERRAS · A ACTIVA · INICIO", "textoTenue");
      lienzo = reg.region(0, 1, reg.ancho, reg.alto - 2);
    }

    // ── Vectores ────────────────────────────────────────────────────────────
    function vectores(raiz, ahora) {
      if (!lienzo) return;
      const v = lienzo.vectores(), segundos = ahora / 1000;
      ajustar(v);
      sustrato(v);
      ramas(v);
      silueta(v, ahora);
      vislumbre(v);
      grietas(v, segundos);
      nodos(v, segundos);
      misiles(v, segundos);
      seleccion(v);
      fantasmaMyth(v);
      if (cam.zoom > 1.05) minimapa(v);
    }

    function sustrato(v) {
      const hondo = profundidad();
      const y1 = sy(-0.012), y2 = sy(-hondo);
      if (y1 > H + 1 && y2 > H + 1) return;
      v.linea(0, y1, W, y1, "ambarTenue", { alfa: 0.5, discontinua: [1, 3] });
      v.linea(0, y2, W, y2, "ambarTenue", { alfa: 0.35, discontinua: [1, 5] });
      const x = sx(0), y = sy(-hondo * (estado.silueta.visible ? 0.9 : 0.55)), k = Math.min(1.6, 0.6 + cam.zoom * 0.15);
      // Estación Raíz: una plataforma con tres raíces hacia arriba, hacia MYTH.
      v.linea(x - 1.6 * k / aspecto, y, x + 1.6 * k / aspecto, y, "ambar", { grosor: 1.6 });
      for (const d of [-1, 0, 1]) v.linea(x + (d * 0.9 * k) / aspecto, y, x + (d * 0.3 * k) / aspecto, y - 0.9 * k, "ambar", { alfa: 0.8 });
      v.texto(x + (2.2 * k) / aspecto, y - 0.45, "ESTACIÓN RAÍZ", "ambar", { tam: 0.8, alfa: 0.8 });
      v.texto(1, y2 - 0.95, "SUSTRATO M11", "ambarTenue", { tam: 0.8 });
    }

    function silueta(v, ahora) {
      if (!estado.silueta.visible) return;
      const pies = -DENDRO.silueta.SUSTRATO * DENDRO.silueta.PIES, cabeza = -DENDRO.silueta.CABEZA_ARRIBA;
      DENDRO.silueta.dibujar(v, {
        x: sx(0), y: sy(pies), alto: (cabeza - pies) * S,
        objetivos: objetivos.map((c) => [sx(pos[c].x), sy(pos[c].y)]),
        opacidad: estado.silueta.opacidad, crecimiento: estado.silueta.opacidad,
        ahora, reducido: ctx.reducido,
      });
    }

    // Vislumbre: un trazo vertical blanco durante un solo fotograma, en un segundo sembrado del minuto.
    function vislumbre(v) {
      if (!estado.hitos.vislumbres || estado.silueta.visible || estado.fase >= 5) return;
      const ms = DENDRO.reloj.ahora(), minuto = Math.floor(ms / DENDRO.reloj.MINUTO);
      if (minuto === vislumbreVisto) return;
      const rng = DENDRO.prng.crear("vislumbre", minuto);
      if (rng() >= PROB_VISLUMBRE) { vislumbreVisto = minuto; return; }
      const segundo = Math.floor(rng() * 60);
      if (Math.floor((ms % DENDRO.reloj.MINUTO) / 1000) < segundo) return;
      vislumbreVisto = minuto;
      const x = sx((rng() - 0.5) * 0.5);
      v.linea(x, sy(-0.014), x, sy(-SUSTRATO * 0.95), "rama", { grosor: 1.8 });
    }

    function ramas(v) {
      const lotes = new Map();
      const detalle = cam.zoom >= ZOOM_PUNTOS;
      const escala = 1 + Math.log2(cam.zoom) * 0.22;
      for (const s of disp.segmentos) {
        const x1 = sx(s.x1), y1 = sy(s.y1), x2 = sx(s.x2), y2 = sy(s.y2);
        if (Math.max(x1, x2) < -1 || Math.min(x1, x2) > W + 1 || Math.max(y1, y2) < -1 || Math.min(y1, y2) > H + 1) continue;
        const podada = C.efecto(ui, [s.hijo], ["PC-40"]);
        const color = colores.apagadas.has(s.hijo) ? "textoTenue" : colores.rampa.get(s.hijo) || "rama";
        const fina = s.nivel >= 3 && !detalle;
        const alfa = podada ? 0.15 : color === "textoTenue" ? 0.3 : fina && color === "rama" ? 0.42 : 1;
        const clave = `${color}|${s.nivel}|${alfa}`;
        let lote = lotes.get(clave);
        if (!lote) { lote = { color, grosor: GROSOR_NIVEL[s.nivel] * (fina ? 0.8 : escala), alfa, segs: [] }; lotes.set(clave, lote); }
        lote.segs.push(x1, y1, x2, y2);
      }
      for (const l of lotes.values()) v.trazos(l.segs, l.color, { grosor: l.grosor, alfa: l.alfa });
    }

    // Grietas desde la fase 3 y partículas en la fase 4, en las ramas gruesas, con semilla del día.
    function grietas(v, segundos) {
      if (estado.fase < 3) return;
      const rng = DENDRO.prng.crear(estado.dia, "grietas");
      const n = Math.round(estado.intensidad * 22);
      for (let i = 0; i < n; i++) {
        const s = tronco[Math.floor(rng() * tronco.length)];
        const t = 0.2 + rng() * 0.6, largo = (0.6 + rng() * 0.8) * Math.min(3, Math.sqrt(cam.zoom));
        const x = sx(s.x1 + (s.x2 - s.x1) * t), y = sy(s.y1 + (s.y2 - s.y1) * t);
        if (!visible(x, y, 2)) continue;
        const dx = (s.x2 - s.x1) * S, dy = -(s.y2 - s.y1) * S, l = Math.hypot(dx, dy) || 1;   // en altos de celda
        const nx = -dy / l, ny = dx / l, pts = [];
        for (let k = 0; k <= 4; k++) {
          const f = (k / 4 - 0.5) * largo, zig = (k % 2 ? 1 : -1) * 0.16;
          pts.push([x + (nx * f + (dx / l) * zig) / aspecto, y + ny * f + (dy / l) * zig]);
        }
        v.polilinea(pts, rng() < 0.5 ? "texto" : "arma", { alfa: 0.6 + 0.4 * Math.sin(segundos * 3 + i), grosor: 1.1 });
      }
      if (estado.fase < 4) return;
      const lista = [];
      for (let i = 0; i < 50; i++) {
        const s = tronco[Math.floor(rng() * tronco.length)], t = rng(), fase = rng(), deriva = (rng() - 0.5) * 2;
        const k = (segundos * 0.25 + fase) % 1;
        const x = sx(s.x1 + (s.x2 - s.x1) * t) + deriva * k * 2, y = sy(s.y1 + (s.y2 - s.y1) * t) + k * 4;
        if (visible(x, y, 0)) lista.push(x, y);
      }
      v.puntos(lista, "rama", { tam: 1.1, alfa: 0.6 });
    }

    function nodos(v, segundos) {
      const pulso = 0.5 + 0.5 * Math.sin(segundos * 4);
      if (cam.zoom >= ZOOM_PUNTOS) {
        const vivas = [], muertas = [], codigos = [];
        for (const n of cat.nodos) {
          if (n.nombrada || n.raiz || n.baja || colores.fundidas.has(n.codigo)) continue;
          const x = sx(pos[n.codigo].x), y = sy(pos[n.codigo].y);
          if (!visible(x, y, 0.5)) continue;
          (colores.apagadas.has(n.codigo) ? muertas : vivas).push(x, y);
          if (cam.zoom >= ZOOM_CODIGOS && codigos.length < MAX_CODIGOS) codigos.push([x, y, n.codigo]);
        }
        v.puntos(vivas, "tierra", { tam: 1.3, alfa: 0.85 });
        v.puntos(muertas, "textoTenue", { tam: 1.1, alfa: 0.5 });
        for (const [x, y, c] of codigos) v.texto(x + 0.4, y - 0.35, c.split("·").pop(), "textoTenue", { tam: 0.65, base: "bottom" });
      }
      for (const c of nombradas) {
        if (colores.fundidas.has(c)) continue;
        const x = sx(pos[c].x), y = sy(pos[c].y);
        if (!visible(x, y, 2)) continue;
        const t = estado.tierras.porCodigo(c);
        if (DESTRUIDAS.includes(t.estado)) {
          const r = RADIO_NODO * 0.8;
          v.linea(x - r / aspecto, y - r, x + r / aspecto, y + r, "textoTenue", { alfa: 0.7 });
          v.linea(x - r / aspecto, y + r, x + r / aspecto, y - r, "textoTenue", { alfa: 0.7 });
        } else {
          v.circulo(x, y, RADIO_NODO, "tierra", { relleno: "tierra", rellenoAlfa: 0.4, grosor: 1.5 });
          if (t.estado === "APROXIMACIÓN") v.circulo(x, y, RADIO_NODO + 0.3 + pulso * 0.2, "ambar", { alfa: 0.35 + 0.4 * pulso });
          if (t.estado === "HOSTILIDADES") v.circulo(x, y, RADIO_NODO + 0.35, "arma", { alfa: 0.4 + 0.6 * pulso, grosor: 1.6 });
        }
        if (cam.zoom >= 2) v.texto(x, y + 0.55, MAYUS(t.nombre), "texto", { tam: 0.75, alinear: "center", alfa: 0.85 });
      }
      const mx = sx(pos.MYTH.x), my = sy(pos.MYTH.y);
      if (visible(mx, my, 2)) v.texto(mx + 1.2 / aspecto, sy(pos.MYTH.y * 0.5), "MYTH", "rama", { tam: 1.1, base: "middle" });
    }

    // Misiles: un trazo rojo por ataque (como mucho misilesMax), nombradas y visibles primero.
    function misiles(v, segundos) {
      const candidatos = [];
      for (const atq of estado.ataques) {
        const d = pos[atq.desde], h = pos[atq.hacia];
        if (!d || !h) continue;
        const x1 = sx(d.x), y1 = sy(d.y), x2 = sx(h.x), y2 = sy(h.y);
        const enVista = visible(x1, y1, 0) || visible(x2, y2, 0);
        const par = C.pareja(estado, atq.pareja);
        candidatos.push({ atq, x1, y1, x2, y2, prioridad: (par && par.nombrada ? 2 : 0) + (enVista ? 1 : 0) });
      }
      candidatos.sort((a, b) => b.prioridad - a.prioridad);
      candidatos.slice(0, cfgA().misilesMax).forEach(({ atq, x1, y1, x2, y2 }, i) => {
        const dx = x2 - x1, dy = y2 - y1, largo = Math.hypot(dx * aspecto, dy) || 1;
        const altura = Math.max(1.2, largo * 0.45);
        const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - altura;
        const interceptado = C.efecto(ui, [atq.pareja], ["PC-30"]);
        v.curva(x1, y1, cx, cy, x2, y2, "arma", { discontinua: interceptado ? [1, 5] : [2, 4], alfa: 0.4 });
        const t = (segundos * VELOCIDAD_MISIL + i * 0.137) % 1;
        if (interceptado && t > 0.5) {
          const q = DENDRO.vectores.puntoEnCurva(x1, y1, cx, cy, x2, y2, 0.5);
          if (t < 0.6) v.circulo(q.x, q.y, 0.2 + (t - 0.5) * 6, "exito", { alfa: (0.6 - t) * 10 });
          return;
        }
        for (let k = 0; k < 3; k++) {
          const q = DENDRO.vectores.puntoEnCurva(x1, y1, cx, cy, x2, y2, Math.max(0, t - k * 0.02));
          v.punto(q.x, q.y, "arma", { tam: 2 - k * 0.5, alfa: 1 - k * 0.3 });
        }
        if (t > 0.9) v.circulo(x2, y2, 0.2 + (t - 0.9) * 8, "arma", { alfa: (1 - t) * 10 });
      });
    }

    function seleccion(v) {
      for (const [c, color] of [[hover, "texto"], [ui.tierraSeleccionada, "ambar"]]) {
        if (!c || !pos[c]) continue;
        const x = sx(pos[c].x), y = sy(pos[c].y);
        if (!visible(x, y, 1)) continue;
        const n = cat.porCodigo[c];
        v.circulo(x, y, RADIO_NODO + 0.6, color, { grosor: window.DENDRO_CONFIG.vectores.grosorActivo });
        const rotulo = n.raiz ? "MYTH · TRONCO" : n.nombre ? `${n.codigo} ${MAYUS(n.nombre)}` : n.codigo;
        v.texto(x, y - 1.2, rotulo, color, { tam: 1, alinear: "center", base: "bottom" });
      }
    }

    // Si la base del tronco queda fuera, un tronco fantasma en el borde apunta hacia MYTH.
    function fantasmaMyth(v) {
      const x = sx(0), y = sy(0);
      if (visible(x, y, -0.5)) return;
      const bx = Math.max(3, Math.min(W - 3, x)), abajo = y > H / 2;
      const by = abajo ? H - 0.3 : 0.3, dir = abajo ? -1 : 1;
      v.linea(bx, by, bx, by + dir * 2.2, "rama", { grosor: GROSOR_NIVEL[0], alfa: 0.35, discontinua: [3, 3] });
      v.texto(bx + 1, by + dir * 1.2, abajo ? "▼ MYTH" : "▲ MYTH", "rama", { tam: 0.9, base: "middle", alfa: 0.8 });
    }

    function minimapa(v) {
      const x0 = W - ANCHO_MINIMAPA - 0.5, y0 = H - ALTO_MINIMAPA - 0.3;
      const k = Math.min(ALTO_MINIMAPA / (lim.maxY - lim.minY), (ANCHO_MINIMAPA * aspecto) / (lim.maxX - lim.minX));
      const mx = (x) => x0 + ANCHO_MINIMAPA / 2 + ((x - (lim.minX + lim.maxX) / 2) * k) / aspecto;
      const my = (y) => y0 + ALTO_MINIMAPA - (y - lim.minY) * k;
      v.poligono([[x0, y0], [x0 + ANCHO_MINIMAPA, y0], [x0 + ANCHO_MINIMAPA, y0 + ALTO_MINIMAPA], [x0, y0 + ALTO_MINIMAPA]], "ambarTenue", { relleno: "fondo", rellenoAlfa: 0.85 });
      const segs = [];
      for (const s of tronco) segs.push(mx(s.x1), my(s.y1), mx(s.x2), my(s.y2));
      v.trazos(segs, "rama", { grosor: 0.7, alfa: 0.6 });
      const a = mundo(0, 0), b = mundo(W, H);
      v.poligono([[mx(a.x), my(a.y)], [mx(b.x), my(a.y)], [mx(b.x), my(b.y)], [mx(a.x), my(b.y)]], "ambar", { grosor: 1.2 });
    }

    // ── Navegación ──────────────────────────────────────────────────────────
    // El punto señalado (si lo hay) se queda quieto bajo el puntero.
    function zoomEn(factor, punto) {
      const antes = punto && W ? mundo(punto.x, punto.y) : null;
      cam.zoom = Math.max(1, Math.min(cfgA().zoomMax, cam.zoom * factor));
      S = escalaBase() * cam.zoom;
      if (antes) {
        cam.x = antes.x - ((punto.x - W / 2) * aspecto) / S;
        cam.y = antes.y + (punto.y - H / 2) / S;
      }
      limitarCamara();
      ctx.redibujar();
    }

    function desplazar(dx, dy) {
      cam.x += dx * ((W * aspecto) / S);
      cam.y += dy * (H / S);
      limitarCamara();
    }

    function seguir(codigo) {
      ui.tierraSeleccionada = codigo;
      cam.zoom = Math.max(cam.zoom, ZOOM_SEGUIR);
      cam.x = pos[codigo].x; cam.y = pos[codigo].y;
      limitarCamara();
      ctx.redibujar();
    }

    function siguienteNombrada(paso) {
      const i = nombradas.indexOf(ui.tierraSeleccionada);
      seguir(nombradas[(i < 0 ? 0 : i + paso + nombradas.length) % nombradas.length]);
    }

    function siguienteActiva() {
      const activas = estado.activas;
      if (!activas.length) return;
      const actual = activas.findIndex((id) => { const p = C.pareja(estado, id); return p.a === ui.tierraSeleccionada || p.b === ui.tierraSeleccionada; });
      const par = C.pareja(estado, activas[(actual + 1) % activas.length]);
      ui.parejaSeleccionada = par.id;
      seguir(par.a);
    }

    // Punto relativo a la vista → nodo más cercano (o null).
    function nodoEn(punto) {
      if (!punto || !lienzo || !W) return null;
      const m = mundo(punto.x, punto.y - 1);
      return disp.cercano(m.x, m.y, RADIO_TOQUE / S);
    }

    return {
      animada: true,
      usaTab: true,
      dibujar,
      vectores,
      actualizar(nuevo) { estado = nuevo; preparar(); },
      tecla(ev) {
        const k = ev.key;
        if (k === "+" || k === "=") { ev.preventDefault(); zoomEn(1.5); }
        else if (k === "-" || k === "_") { ev.preventDefault(); zoomEn(1 / 1.5); }
        else if (k === "ArrowLeft") { ev.preventDefault(); desplazar(-PASO_DESPLAZAMIENTO, 0); }
        else if (k === "ArrowRight") { ev.preventDefault(); desplazar(PASO_DESPLAZAMIENTO, 0); }
        else if (k === "ArrowUp") { ev.preventDefault(); desplazar(0, PASO_DESPLAZAMIENTO); }
        else if (k === "ArrowDown") { ev.preventDefault(); desplazar(0, -PASO_DESPLAZAMIENTO); }
        else if (k === "Home") { ev.preventDefault(); Object.assign(cam, vistaCompleta()); ctx.redibujar(); }
        else if (k === "Tab") { ev.preventDefault(); siguienteNombrada(ev.shiftKey ? -1 : 1); }
        else if (k.toLowerCase() === "a") { ev.preventDefault(); siguienteActiva(); }
        else if (k === "Enter") { ev.preventDefault(); ctx.abrir("expediente"); }
      },
      gesto(g) {
        if (!lienzo) return;
        const punto = g.punto && { x: g.punto.x, y: g.punto.y - 1 };
        if (g.tipo === "rueda" || g.tipo === "pellizco") zoomEn(g.factor, punto);
        else if (g.tipo === "arrastre") {
          cam.x -= (g.dx * aspecto) / S;
          cam.y += g.dy / S;
          limitarCamara();
        }
      },
      toque(punto) {
        const c = nodoEn(punto);
        if (!c) return;
        if (c === ui.tierraSeleccionada) ctx.abrir("expediente");
        else { ui.tierraSeleccionada = c; ctx.redibujar(); }
      },
      movimiento(punto) {
        hover = nodoEn(punto);
      },
    };
  }

  DENDRO.vistas.registrar({ id: "arbol", tecla: "2", titulo: "ÁRBOL", tituloCorto: "ÁRB", crear });
})(window.DENDRO = window.DENDRO || {});
