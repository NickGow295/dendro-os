// Piezas compartidas por las vistas: nombres y colores de estado, barra de estabilidad, opciones de
// globo según el estado del día, selector de parejas con lista filtrable, gráfica de historia de
// pareja (RF-19) y mejoras transitorias de contención. Solo leen del Estado; no tocan el canvas.
(function (DENDRO) {
  "use strict";

  const MAYUS = (s) => String(s).toLocaleUpperCase("es");

  const COLOR_ESTADO = {
    "ESTABLE": "tierra", "APROXIMACIÓN": "ambar", "CONTACTO": "texto", "HOSTILIDADES": "arma", "INTERFERENCIA": "ambar",
    "ANIQUILADA": "peligro", "FUSIONADA": "tierra", "SUPERVIVIENTE": "texto", "COLAPSO": "peligro",
  };
  const ABREVIATURA = {
    "ESTABLE": "EST", "APROXIMACIÓN": "APRX", "CONTACTO": "CONT", "HOSTILIDADES": "HOST", "INTERFERENCIA": "INTF",
    "ANIQUILADA": "ANIQ", "FUSIONADA": "FUS", "SUPERVIVIENTE": "SUPV", "COLAPSO": "COLP",
  };
  const POSTURAS = {
    "hostil": "HOSTIL", "mutua-hostil": "MUTUA-HOSTIL", "evacuacion": "EVACUACIÓN",
    "aislamiento": "AISLAMIENTO", "negociacion": "NEGOCIACIÓN", "ignorancia": "IGNORANCIA",
  };
  const COLOR_TIPO = { "SISTEMA": "texto", "COLISIÓN": "ambar", "HOSTIL": "arma", "CONTENCIÓN": "tierra" };

  const tierra = (estado, codigo) => estado.tierras.porCodigo(codigo);
  const indicesParejas = new WeakMap();   // Estado → Map id → pareja (hay cientos de parejas)
  function pareja(estado, id) {
    let indice = indicesParejas.get(estado);
    if (!indice) { indice = new Map(estado.parejas.map((p) => [p.id, p])); indicesParejas.set(estado, indice); }
    return indice.get(id);
  }
  const nombre = (t) => (t.nombre ? MAYUS(t.nombre) : t.codigo);   // las generadas se ven por su código

  // Dos últimos segmentos del código (7A2·R9), para las celdas estrechas.
  const codigoCorto = (codigo) => codigo.split("·").slice(-2).join("·");

  // Parejas que recorren ←/→: las activas si hay, si no las nombradas.
  function parejasNavegables(estado) {
    return estado.activas.length ? estado.activas.map((id) => pareja(estado, id)) : estado.parejas.filter((p) => p.nombrada);
  }

  // Pareja nombrada de referencia (las vistas de las 24 tierras no seleccionan ramas generadas).
  function parejaNombrada(estado) {
    const principal = pareja(estado, estado.parejaPrincipal);
    if (principal && principal.nombrada) return principal;
    const nombradas = estado.parejas.filter((p) => p.nombrada);
    const activa = nombradas.filter((p) => ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA", "APROXIMACIÓN"].includes(p.estado));
    if (activa.length) return activa.reduce((m, p) => (p.contacto > m.contacto ? p : m));
    const futura = nombradas.filter((p) => p.estado === "ESTABLE");
    if (futura.length) return futura.reduce((m, p) => (p.contacto < m.contacto ? p : m));
    return nombradas.reduce((m, p) => (p.contacto > m.contacto ? p : m));
  }

  // Opciones de dibujo de un globo según el estado de su tierra (02-diseno.md §7.4).
  function opcionesGlobo(estado, t, segundos) {
    const par = t.pareja ? pareja(estado, t.pareja) : null;
    const o = {};
    const danos = estado.ataques.filter((a) => a.hacia === t.codigo).reduce((m, a) => Math.max(m, a.progreso), 0);
    if (danos) o.danos = danos;
    if (t.estado === "APROXIMACIÓN" && par) o.halo = Math.max(0.3, 1 - par.separacion);
    if (["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"].includes(t.estado)) o.halo = 1;
    if (t.estado === "ANIQUILADA" || t.estado === "COLAPSO") o.fragmentacion = 0.55 + 0.05 * Math.sin(segundos * 0.7);
    if (t.estado === "SUPERVIVIENTE") o.danos = Math.max(o.danos || 0, 0.7);
    if (t.estado === "FUSIONADA" && t.fusionadaCon) o.fusion = { tierra: tierra(estado, t.fusionadaCon), mezcla: 0.5 + 0.2 * Math.sin(segundos * 0.8) };
    return o;
  }

  function colorEstabilidad(valor) {
    return valor > 50 ? "tierra" : valor > 20 ? "ambar" : "arma";
  }

  // Barra segmentada de estabilidad en la capa vectorial; x, y, ancho y alto en celdas.
  function barraEstabilidad(v, x, y, ancho, valor, alto) {
    const segmentos = 10, h = alto || 0.6, llenos = Math.round((valor / 100) * segmentos);
    const color = colorEstabilidad(valor), paso = ancho / segmentos;
    for (let i = 0; i < segmentos; i++) {
      const sx = x + i * paso, lleno = i < llenos;
      v.poligono([[sx, y], [sx + paso * 0.78, y], [sx + paso * 0.78, y + h], [sx, y + h]],
        lleno ? color : "ambarTenue", { relleno: lleno ? color : null, rellenoAlfa: 0.6, alfa: lleno ? 1 : 0.5 });
    }
  }

  // Ajusta un texto a un ancho, partiendo por palabras.
  function partir(texto, ancho) {
    const lineas = [];
    let actual = "";
    for (const palabra of String(texto).split(/\s+/)) {
      if (actual && (actual + " " + palabra).length > ancho) { lineas.push(actual); actual = palabra; }
      else actual = actual ? actual + " " + palabra : palabra;
    }
    if (actual || !lineas.length) lineas.push(actual);
    return lineas;
  }

  // Lista desplazable: primera fila visible para que el elemento elegido quede a la vista.
  function desplazamiento(actual, elegido, visibles) {
    if (elegido < actual) return elegido;
    if (elegido >= actual + visibles) return elegido - visibles + 1;
    return actual;
  }

  // Selector ◄ … ► centrado en una fila; devuelve el texto escrito.
  function selector(reg, y, texto, color) {
    reg.centrar(y, `◄  ${texto}  ►`, color || "ambar");
  }

  // ¿El toque cayó en la flecha izquierda (-1), derecha (+1) o en medio (0) de una fila de selector?
  function ladoDelToque(punto, ancho) {
    if (punto.x < ancho / 3) return -1;
    if (punto.x > (ancho * 2) / 3) return 1;
    return 0;
  }

  // ── Mejoras de contención (02-diseno.md §6, V9) ───────────────────────────
  // ui.efectosContencion: [{ objetivo, protocolo, hasta }]. Solo cambian el dibujo, nunca el Estado.
  function efecto(ui, objetivos, protocolos) {
    const ahora = performance.now();
    ui.efectosContencion = (ui.efectosContencion || []).filter((e) => e.hasta > ahora);
    return ui.efectosContencion.find((e) => objetivos.includes(e.objetivo) && (!protocolos || protocolos.includes(e.protocolo))) || null;
  }

  // Lectura de una pareja con la mejora transitoria aplicada (si la hay).
  function lecturaPareja(ui, par) {
    const e = efecto(ui, [par.id, par.a, par.b]);
    const l = { efecto: e, deltaOmega: par.deltaOmega, separacion: par.separacion, anillo: false, interceptados: false };
    if (!e) return l;
    if (e.protocolo === "PC-14") { l.anillo = true; l.deltaOmega = par.deltaOmega * 1.08; }
    if (e.protocolo === "PC-21") l.separacion = Math.min(1, par.separacion + 0.12);
    if (e.protocolo === "PC-30") l.interceptados = true;
    return l;
  }

  // Estabilidad mostrada de una rama (PC-11: +15).
  function estabilidadMostrada(ui, t) {
    return efecto(ui, [t.codigo], ["PC-11"]) ? Math.min(100, t.estabilidad + 15) : t.estabilidad;
  }

  // ── Protocolos: objetivos válidos (data/protocolos.js) ────────────────────
  // Un objetivo es { id, tipo: "universo" | "pareja" | "myth" }; id es el código, el id de pareja o "MYTH".
  function admite(proto, id, estado) {
    if (proto.objetivo === "myth") return id === "MYTH";
    if (proto.objetivo === "pareja") {
      const par = pareja(estado, id);
      return !!par && (!proto.estados || proto.estados.includes(par.estado)) && (!proto.soloHostil || /hostil/.test(par.postura));
    }
    const t = estado.tierras.porCodigo(id);
    return !!t && !t.raiz && (!proto.estados || proto.estados.includes(t.estado)) && !(proto.excluir || []).includes(t.estado) &&
      (!proto.conPlanos || !!(t.planos && t.planos.length));
  }

  function objetivosDe(proto, estado) {
    if (proto.objetivo === "myth") return ["MYTH"];
    if (proto.objetivo === "pareja") return estado.parejas.filter((par) => admite(proto, par.id, estado)).map((par) => par.id);
    return DENDRO.multiverso.catalogo().nodos.filter((n) => !n.raiz && !n.baja && admite(proto, n.codigo, estado)).map((n) => n.codigo);
  }

  // ── Selector de parejas con lista filtrable (02-diseno.md §6, V1) ─────────
  const ACTIVOS = ["APROXIMACIÓN", "CONTACTO", "HOSTILIDADES", "INTERFERENCIA"];
  const RESUELTOS = ["ANIQUILADA", "FUSIONADA", "SUPERVIVIENTE", "COLAPSO"];
  const CHIPS_PAREJAS = [
    { id: "activas", etiqueta: "ACTIVAS", filtro: (p) => ACTIVOS.includes(p.estado) },
    { id: "aprox", etiqueta: "APROX", filtro: (p) => p.estado === "APROXIMACIÓN" },
    { id: "contacto", etiqueta: "CONTACTO", filtro: (p) => p.estado === "CONTACTO" },
    { id: "hostil", etiqueta: "HOSTIL", filtro: (p) => p.estado === "HOSTILIDADES" || p.hostil },
    { id: "interf", etiqueta: "INTERF", filtro: (p) => p.estado === "INTERFERENCIA" },
    { id: "resueltas", etiqueta: "RESUELTAS", filtro: (p) => RESUELTOS.includes(p.estado) },
    { id: "nombradas", etiqueta: "NOMBRADAS", filtro: (p) => p.nombrada },
    { id: "todas", etiqueta: "TODAS", filtro: null },
  ];

  function nombresPareja(estado, par) {
    if (par.nombrada) return `${nombre(tierra(estado, par.a))} / ${nombre(tierra(estado, par.b))}`;
    return `${codigoCorto(par.a)} / ${codigoCorto(par.b)}`;
  }

  // Lista de parejas para ctx (usa ctx.estado y ctx.ui.parejaSeleccionada); alElegir(par) opcional.
  function listaParejas(ctx, alElegir) {
    return DENDRO.lista.crear({
      titulo: () => `ACTIVAS: ${ctx.estado.activas.length}`,
      elementos: () => ctx.estado.parejas,
      chips: CHIPS_PAREJAS,
      buscar: (p) => `${p.id} ${p.a} ${p.b} ${nombresPareja(ctx.estado, p)}`,
      fila: (p, ancho) => [
        { t: p.id.padEnd(7), c: "ambar" },
        { t: nombresPareja(ctx.estado, p).padEnd(Math.max(12, ancho - 36)).slice(0, Math.max(12, ancho - 36)) + " ", c: "texto" },
        { t: p.estado.padEnd(14), c: COLOR_ESTADO[p.estado] },
        { t: p.estado === "ESTABLE" || RESUELTOS.includes(p.estado) ? "" : DENDRO.tau.cuenta(p.paraContacto), c: "textoTenue" },
      ],
      actual: () => pareja(ctx.estado, ctx.ui.parejaSeleccionada),
      alElegir: (p) => { ctx.ui.parejaSeleccionada = p.id; if (alElegir) alElegir(p); ctx.redibujar(); },
      redibujar: () => ctx.redibujar(),
    });
  }

  // ── Gráfica de la historia de una pareja (RF-19) ──────────────────────────
  // Las dos firmas ω convergen; contacto en ámbar; hostilidades rayadas en rojo; la rama destruida se
  // corta y cae al eje con ✕ roja; en la fusión, una sola curva más gruesa. Ahora y futuro discontinuo.
  // a = { x, y, ancho, alto } en celdas dentro de v.
  function graficaHistoria(v, a, par, estado, o) {
    o = o || {};
    const serie = DENDRO.cronologia.serieFirmas(par, o.muestras || 96), puntos = serie.puntos, m = serie.marcas;
    const valores = puntos.flatMap((q) => [q.wa, q.wb]).filter((w) => w !== null);
    if (!valores.length) return;
    let min = Math.min(...valores), max = Math.max(...valores);
    const margen = (max - min) * 0.15 || 0.001;
    min -= margen; max += margen;
    const t0 = puntos[0].tau, t1 = puntos[puntos.length - 1].tau;
    const px = (tau) => a.x + ((tau - t0) / (t1 - t0)) * a.ancho;
    const py = (w) => a.y + a.alto * (1 - (w - min) / (max - min));
    const base = a.y + a.alto;
    const grosor = window.DENDRO_CONFIG.vectores.grosorActivo;

    v.linea(a.x, a.y, a.x, base, "ambarTenue", { alfa: 0.7 });
    v.linea(a.x, base, a.x + a.ancho, base, "ambarTenue", { alfa: 0.7 });
    if (/hostil/.test(par.postura)) {
      const x1 = px(m.tramo), x2 = px(m.desenlace);
      for (let x = x1; x < x2; x += 0.8) v.linea(x, base, Math.min(x2, x + 0.8), a.y, "arma", { alfa: 0.22 });
      v.texto((x1 + x2) / 2, a.y + 0.1, "HOSTILIDADES", "arma", { tam: 0.75, alinear: "center", alfa: 0.8 });
    }
    v.linea(px(m.contacto), a.y, px(m.contacto), base, "ambar", { discontinua: [2, 2], alfa: 0.9 });
    v.texto(px(m.contacto) + 0.3, base - 0.9, "CONTACTO", "ambar", { tam: 0.75 });

    // Una curva por rama, partida en tramos (pasado / futuro, y cortada donde vale null).
    function curva(clave, color, alfa, ancho) {
      let tramo = [], futuro = null, ultimo = null;
      const cerrar = () => {
        if (tramo.length > 1) v.polilinea(tramo, color, futuro ? { alfa: alfa * 0.6, discontinua: [3, 3] } : { alfa, grosor: ancho });
        tramo = [];
      };
      for (const q of puntos) {
        const w = q[clave];
        if (w === null) { cerrar(); continue; }
        if (futuro !== null && futuro !== q.futuro) { const enlace = tramo[tramo.length - 1]; cerrar(); if (enlace) tramo.push(enlace); }
        futuro = q.futuro;
        const punto = [px(q.tau), py(w)];
        tramo.push(punto);
        ultimo = punto;
      }
      cerrar();
      return ultimo;
    }
    const fusion = m.fusion && puntos.some((q) => q.tau >= m.desenlace && !q.futuro);
    const finA = curva("wa", "tierra", 1, fusion ? grosor : undefined);
    const finB = fusion ? null : curva("wb", "tierra", 0.55);
    // La rama destruida cae al eje con una marca roja, si su corte ya ocurrió.
    if (estado.tau >= m.desenlace) {
      for (const c of m.destruidas) {
        const fin = c === par.a ? finA : finB;
        if (!fin) continue;
        v.linea(fin[0], fin[1], fin[0], base, "arma", { alfa: 0.8 });
        const r = 0.35;
        v.linea(fin[0] - r / v.aspecto, base - r, fin[0] + r / v.aspecto, base + r, "arma", { grosor });
        v.linea(fin[0] - r / v.aspecto, base + r, fin[0] + r / v.aspecto, base - r, "arma", { grosor });
      }
    }
    if (estado.tau >= t0 && estado.tau <= t1) {
      v.linea(px(estado.tau), a.y, px(estado.tau), base, "texto", { alfa: 0.5, discontinua: [1, 2] });
      v.texto(px(estado.tau), a.y - 0.05, "AHORA", "texto", { tam: 0.7, alinear: "center", base: "bottom", alfa: 0.8 });
    }
    if (o.rotulos !== false) {
      v.texto(a.x, base + 0.15, DENDRO.tau.corto(puntos[0].instante), "textoTenue", { tam: 0.75 });
      v.texto(a.x + a.ancho, base + 0.15, DENDRO.tau.corto(puntos[puntos.length - 1].instante), "textoTenue", { tam: 0.75, alinear: "right" });
      v.texto(a.x - 0.3, a.y, "ω", "textoTenue", { tam: 0.8, alinear: "right" });
    }
  }

  DENDRO.vistasComun = {
    MAYUS, COLOR_ESTADO, ABREVIATURA, POSTURAS, COLOR_TIPO, ACTIVOS, RESUELTOS,
    tierra, pareja, nombre, codigoCorto, parejasNavegables, parejaNombrada, opcionesGlobo, colorEstabilidad, barraEstabilidad, selector, ladoDelToque, partir, desplazamiento,
    efecto, lecturaPareja, estabilidadMostrada, listaParejas, nombresPareja, graficaHistoria, admite, objetivosDe,
  };
})(window.DENDRO = window.DENDRO || {});
