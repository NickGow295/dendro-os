// V3 MONITOR (02-diseno.md §6): dos páginas (Tab): las 24 tierras nombradas en miniatura y las parejas
// generadas activas en contacto, interferencia u hostilidades (globos creados al mostrarse). Al lado,
// la gráfica logarítmica de ramas afectadas con la curva de N̂ de MYTH encima (caídas de los
// guardianes marcadas con credencial) y, debajo, la historia de la pareja seleccionada. El valor
// final y el τ del colapso salen como "???" corruptos hasta la fase CRÍTICO.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO, ABREVIATURA } = C;
  const FASE_REVELACION = 4;
  const POR_PAGINA_MOVIL = 12;
  const RUIDO_TEXTO = "?#%&@▓▒░";
  const SUPERINDICES = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const EN_TRAMO = ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"];
  const PAGINAS = ["NOMBRADAS", "ACTIVAS"];

  function crear(ctx) {
    const { ui } = ctx;
    let estado = ctx.estado;
    const ids = estado.tierras.nombradas.map((t) => t.codigo);
    if (!ids.includes(ui.tierraSeleccionada)) ui.tierraSeleccionada = C.parejaNombrada(estado).a;
    const R = window.DENDRO_CONFIG.cronologia.ramasAfectadasFinal;
    let celdas = [], columnas = 6, filasRejilla = 4, ancho = true, grafica = null, historia = null;
    let pagina = 0, subpagina = 0, anchoPaginas = 0;

    const revelado = () => estado.fase >= FASE_REVELACION;
    const activasGeneradas = () => estado.parejas.filter((p) => !p.nombrada && EN_TRAMO.includes(p.estado));
    const porPagina = () => (ancho ? columnas * filasRejilla : POR_PAGINA_MOVIL);
    const elementos = () => (pagina === 0 ? ids : activasGeneradas().map((p) => p.id));
    const seleccionado = () => (pagina === 0 ? ui.tierraSeleccionada : ui.parejaSeleccionada);
    const parejaGrafica = () => {
      if (pagina === 1) return C.pareja(estado, ui.parejaSeleccionada);
      const t = C.tierra(estado, ui.tierraSeleccionada);
      return t.pareja ? C.pareja(estado, t.pareja) : null;
    };

    // "???" que cambia de caracteres a saltos, con semilla del día y del instante.
    function corrupto(texto, ahora) {
      const rng = DENDRO.prng.crear(estado.dia, "corrupto", Math.floor(ahora / 110));
      return Array.from(texto).map((c) => (rng() < 0.4 ? RUIDO_TEXTO[Math.floor(rng() * RUIDO_TEXTO.length)] : c)).join("");
    }

    function cabecera(reg) {
      let x = 1;
      PAGINAS.forEach((p, i) => {
        const n = i === 1 ? ` ${activasGeneradas().length}` : "";
        x = reg.escribir(x, 0, ` ${p}${n} `, i === pagina ? "ambar" : "textoTenue", i === pagina ? { inverso: true } : null) + 1;
      });
      if (pagina === 0) {
        const t = C.tierra(estado, ui.tierraSeleccionada);
        x = reg.escribir(x + 1, 0, `${C.codigoCorto(t.codigo)} ${MAYUS(t.nombre)}`, "texto");
        reg.escribir(x + 1, 0, ` ${t.estado} `, COLOR_ESTADO[t.estado], { inverso: true });
      } else {
        const par = C.pareja(estado, ui.parejaSeleccionada);
        if (par && !par.nombrada) reg.escribir(x + 1, 0, `${par.id} · ${par.estado}`, COLOR_ESTADO[par.estado]);
      }
      if (ancho) reg.derecha(0, "TAB PÁGINA · ENTER ABRIR ", "textoTenue");
    }

    function dibujar(reg) {
      ancho = reg.ancho >= 80;
      if (pagina === 1 && !activasGeneradas().some((p) => p.id === ui.parejaSeleccionada)) {
        const primera = activasGeneradas()[0];
        if (primera) ui.parejaSeleccionada = primera.id;
      }
      cabecera(reg);

      let rejilla;
      historia = null;
      if (ancho) {
        const anchoRejilla = Math.floor(reg.ancho * 0.6);
        columnas = 6; filasRejilla = 4;
        rejilla = reg.region(0, 1, anchoRejilla, reg.alto - 1);
        const altoRamas = Math.floor((reg.alto - 1) * 0.62);
        grafica = reg.caja(anchoRejilla, 1, reg.ancho - anchoRejilla, altoRamas, { titulo: "RAMAS AFECTADAS · N̂" });
        historia = reg.caja(anchoRejilla, 1 + altoRamas, reg.ancho - anchoRejilla, reg.alto - 1 - altoRamas, { titulo: "HISTORIA DE LA PAREJA", doble: false });
      } else {
        columnas = 3; filasRejilla = 4;
        const altoRejilla = Math.floor((reg.alto - 2) * 0.66);
        rejilla = reg.region(0, 2, reg.ancho, altoRejilla);
        grafica = reg.caja(0, 2 + altoRejilla, reg.ancho, reg.alto - 2 - altoRejilla, { titulo: "RAMAS AFECTADAS" });
      }

      const todos = elementos(), n = porPagina();
      const i = Math.max(0, todos.indexOf(seleccionado()));
      subpagina = Math.floor(i / n);
      const paginas = Math.max(1, Math.ceil(todos.length / n));
      if (!ancho || paginas > 1) (ancho ? rejilla : reg).centrar(ancho ? rejilla.alto - 1 : 1, `◄  ${subpagina + 1}/${paginas}  ►`, "ambar");
      anchoPaginas = ancho ? rejilla.ancho : reg.ancho;
      const lista = todos.slice(subpagina * n, (subpagina + 1) * n);
      const an = rejilla.ancho / columnas, al = (rejilla.alto - (ancho && paginas > 1 ? 1 : 0)) / filasRejilla;
      if (!lista.length) rejilla.centrar(Math.floor(rejilla.alto / 2), "SIN PAREJAS GENERADAS EN CONTACTO", "textoTenue");
      celdas = lista.map((id, k) => {
        const x = Math.floor((k % columnas) * an), y = Math.floor(Math.floor(k / columnas) * al);
        const celda = rejilla.region(x, y, Math.floor(an), Math.floor(al));
        const sel = id === seleccionado();
        if (pagina === 0) {
          const tt = C.tierra(estado, id);
          celda.escribir(1, celda.alto - 2, "·" + tt.codigo.split("·").pop(), sel ? "ambar" : "textoTenue");
          celda.derecha(celda.alto - 2, ABREVIATURA[tt.estado] + " ", COLOR_ESTADO[tt.estado]);
        } else {
          const par = C.pareja(estado, id);
          celda.escribir(1, celda.alto - 2, par.id.slice(2), sel ? "ambar" : "textoTenue");
          celda.derecha(celda.alto - 2, ABREVIATURA[par.estado] + " ", COLOR_ESTADO[par.estado]);
        }
        return { id, region: celda, x: rejilla.x - reg.x + x, y: rejilla.y - reg.y + y, ancho: Math.floor(an), alto: Math.floor(al) };
      });

      dibujarEjes(grafica);
      if (historia && !parejaGrafica()) historia.centrar(Math.floor(historia.alto / 2), "SIN PAREJA", "textoTenue");
    }

    // Etiquetas de texto de la gráfica (los trazos van en vectores()).
    function dibujarEjes(g) {
      const serie = estado.ejes.serieRamas;
      const ultimoPasado = serie.filter((s) => !s.futuro).pop();
      g.centrar(3, revelado() ? `DE ${DENDRO.escritorio.formatoRamas(R)}` : "", "textoTenue");
      const area = areaGrafica(g);
      const decadas = Math.floor(Math.log10(R));
      const maxVisible = ultimoPasado ? Math.floor(Math.log10(Math.max(1, ultimoPasado.valor))) + 1 : 1;
      for (let k = 0; k <= decadas; k += area.alto < 10 ? 2 : 1) {
        if (!revelado() && k > maxVisible) continue;
        const y = Math.round(area.y + area.alto * (1 - k / Math.log10(R)));
        g.escribir(0, y, k === 0 ? "1" : k === 1 ? "10" : "10" + SUPERINDICES[k], "textoTenue");
      }
      g.derecha(area.y, "1 ", "rama");
      g.derecha(area.y + area.alto, "0 ", "rama");
      g.escribir(area.x, g.alto - 1, DENDRO.tau.corto(serie[0].instante), "textoTenue");
      if (revelado()) g.derecha(g.alto - 1, DENDRO.tau.corto(serie[serie.length - 1].instante), "arma");
    }

    function areaGrafica(g) {
      return { x: 5, y: 5, ancho: g.ancho - 8, alto: g.alto - 7 };
    }

    function vectores(raiz, ahora) {
      const segundos = ahora / 1000;
      const pulso = 0.5 + 0.5 * Math.sin(segundos * 5);
      for (const c of celdas) {
        const v = c.region.vectores();
        const marco = (color, o) => v.poligono([[0.2, 0.1], [c.ancho - 0.2, 0.1], [c.ancho - 0.2, c.alto - 0.1], [0.2, c.alto - 0.1]], color, o);
        if (pagina === 0) {
          const t = C.tierra(estado, c.id);
          const r = Math.max(0.6, Math.min((c.alto - 2.6) / 2, (c.ancho * v.aspecto) / 2) * 0.86);
          v.globo(c.ancho / 2, (c.alto - 2) / 2, r, t, C.opcionesGlobo(estado, t, segundos));
          C.barraEstabilidad(v, 1, c.alto - 0.8, c.ancho - 2, C.estabilidadMostrada(ui, t), 0.45);
          if (t.estado === "HOSTILIDADES") marco("arma", { alfa: 0.3 + 0.6 * pulso });
        } else {
          const par = C.pareja(estado, c.id), ta = C.tierra(estado, par.a), tb = C.tierra(estado, par.b);
          const r = Math.max(0.5, Math.min((c.alto - 2.6) / 2, (c.ancho * v.aspecto) / 4) * 0.85);
          const d = (r / v.aspecto) * (0.9 + 0.9 * par.separacion);
          v.globo(c.ancho / 2 - d, (c.alto - 2) / 2, r, ta, C.opcionesGlobo(estado, ta, segundos));
          v.globo(c.ancho / 2 + d, (c.alto - 2) / 2, r, tb, C.opcionesGlobo(estado, tb, segundos));
          C.barraEstabilidad(v, 1, c.alto - 0.8, c.ancho - 2, Math.min(ta.estabilidad, tb.estabilidad), 0.45);
          if (par.estado === "HOSTILIDADES") marco("arma", { alfa: 0.3 + 0.6 * pulso });
        }
        if (c.id === seleccionado()) marco("ambar", { grosor: window.DENDRO_CONFIG.vectores.grosorActivo });
      }
      if (grafica) vectoresGrafica(grafica.vectores(), ahora);
      const par = parejaGrafica();
      if (historia && par) {
        const v = historia.vectores();
        C.graficaHistoria(v, { x: 2, y: 0.9, ancho: v.ancho - 3, alto: v.alto - 2.2 }, par, estado);
        v.texto(v.ancho - 0.5, 0, par.id, "ambar", { tam: 0.8, alinear: "right" });
      }
    }

    function vectoresGrafica(v, ahora) {
      const serie = estado.ejes.serieRamas, area = areaGrafica(grafica);
      const logR = Math.log10(R);
      const px = (i) => area.x + (i / (serie.length - 1)) * area.ancho;
      const py = (valor) => area.y + area.alto * (1 - Math.log10(Math.max(1, valor)) / logR);

      // Cifra grande
      const cifra = DENDRO.escritorio.formatoRamas(estado.ramasAfectadas);
      v.texto(v.ancho / 2, 0.1, cifra, estado.fase >= 3 ? "arma" : "ambar", { tam: Math.min(2.6, v.ancho / 9), alinear: "center" });
      if (!revelado()) v.texto(v.ancho / 2, 3, corrupto("DE ???", ahora), "arma", { tam: 1, alinear: "center", alfa: 0.85 });

      // Ejes y rejilla de décadas
      v.linea(area.x, area.y, area.x, area.y + area.alto, "ambarTenue");
      v.linea(area.x, area.y + area.alto, area.x + area.ancho, area.y + area.alto, "ambarTenue");
      v.linea(area.x + area.ancho, area.y, area.x + area.ancho, area.y + area.alto, "rama", { alfa: 0.3 });
      for (let k = 1; k <= Math.floor(logR); k++) {
        const y = area.y + area.alto * (1 - k / logR);
        v.linea(area.x, y, area.x + area.ancho, y, "ambarTenue", { alfa: 0.25, discontinua: [1, 4] });
      }

      const pasado = [], futuro = [];
      serie.forEach((s, i) => (s.futuro ? futuro : pasado).push([px(i), py(s.valor)]));
      if (pasado.length) futuro.unshift(pasado[pasado.length - 1]);
      if (futuro.length > 1) v.polilinea(futuro, "ambarTenue", { discontinua: [3, 4], alfa: 0.8 });
      if (pasado.length > 1) v.polilinea(pasado, "ambar", { grosor: window.DENDRO_CONFIG.vectores.grosorActivo });
      if (futuro.length > 1) {
        const [fx, fy] = futuro[Math.floor(futuro.length * 0.6)];
        v.texto(fx, fy + 0.6, "PROYECCIÓN", "ambarTenue", { tam: 0.8, alinear: "center" });
      }
      const [ux, uy] = futuro.length ? futuro[futuro.length - 1] : pasado[pasado.length - 1];
      if (!revelado()) {
        v.texto(ux, uy - 0.2, corrupto("???", ahora), "arma", { tam: 1.1, alinear: "right", base: "bottom" });
        v.texto(area.x + area.ancho, area.y + area.alto + 1.05, corrupto("???", ahora + 333), "arma", { tam: 1, alinear: "right" });
      }
      cohesion(v, area);

      if (pasado.length) {
        const [hx, hy] = pasado[pasado.length - 1];
        v.linea(hx, area.y, hx, area.y + area.alto, "ambar", { discontinua: [2, 3], alfa: 0.7 });
        v.punto(hx, hy, "ambar", { tam: 3 });
        v.texto(hx, area.y - 0.1, `AHORA ${DENDRO.tau.corto(estado.instante)}`, "ambar", { tam: 0.8, alinear: "center", base: "bottom" });
      } else {
        v.texto(area.x + area.ancho / 2, area.y + area.alto / 2, "SIN COLISIONES REGISTRADAS", "textoTenue", { tam: 1, alinear: "center" });
      }
    }

    // Curva de N̂ (escala lineal 0–1 a la derecha); con credencial, las caídas de los guardianes.
    function cohesion(v, area) {
      const serie = estado.ejes.serieCohesion;
      const t0 = serie[0].tau, t1 = serie[serie.length - 1].tau;
      const px = (tau) => area.x + ((tau - t0) / (t1 - t0)) * area.ancho;
      const py = (n) => area.y + area.alto * (1 - n);
      const pasado = serie.filter((s) => !s.futuro).map((s) => [px(s.tau), py(s.valor)]);
      if (pasado.length > 1) v.polilinea(pasado, "rama", { alfa: 0.75 });
      const ultimo = pasado[pasado.length - 1];
      if (ultimo) v.texto(ultimo[0] + 0.3, ultimo[1] - 0.2, `N̂ ${estado.myth.cohesion.toFixed(2)}`, "rama", { tam: 0.8, base: "bottom" });
      if (!DENDRO.local.credencial()) return;
      for (const g of estado.myth.guardianes) {
        if (!g.caido) continue;
        const x = px(DENDRO.tau.de(g.cae));
        const n = (serie.find((s) => s.tau >= DENDRO.tau.de(g.cae)) || serie[serie.length - 1]).valor;
        v.linea(x, py(n) - 0.6, x, py(n) + 0.6, "arma", { grosor: 1.6 });
        v.texto(x, py(n) - 0.7, MAYUS(g.nombre).split(" ")[0], "arma", { tam: 0.65, alinear: "center", base: "bottom" });
      }
    }

    function mover(paso) {
      const todos = elementos();
      if (!todos.length) return;
      const i = todos.indexOf(seleccionado());
      const destino = todos[(Math.max(0, i) + paso + todos.length) % todos.length];
      if (pagina === 0) ui.tierraSeleccionada = destino; else ui.parejaSeleccionada = destino;
      ctx.redibujar();
    }

    function cambiarPagina() {
      pagina = (pagina + 1) % PAGINAS.length;
      ctx.redibujar();
    }

    function abrirSeleccion() {
      ctx.abrir(pagina === 0 ? "expediente" : "colision");
    }

    return {
      animada: true,
      usaTab: true,
      dibujar,
      vectores,
      actualizar(nuevo) { estado = nuevo; },
      tecla(ev) {
        const pasos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columnas, ArrowDown: columnas, PageUp: -porPagina(), PageDown: porPagina() };
        if (pasos[ev.key]) { ev.preventDefault(); mover(pasos[ev.key]); }
        else if (ev.key === "Tab") { ev.preventDefault(); cambiarPagina(); }
        else if (ev.key === "Enter") { ev.preventDefault(); abrirSeleccion(); }
      },
      toque(punto) {
        if (!punto) return;
        if (Math.floor(punto.y) === 0) { cambiarPagina(); return; }
        const reg = ctx.region();
        const filaPaginas = ancho ? reg.alto - 1 : 1;
        if (Math.floor(punto.y) === filaPaginas) {
          const lado = punto.x < anchoPaginas ? C.ladoDelToque(punto, anchoPaginas) : 0;
          if (lado) mover(lado * porPagina());
          return;
        }
        const c = celdas.find((k) => punto.x >= k.x && punto.x < k.x + k.ancho && punto.y >= k.y && punto.y < k.y + k.alto);
        if (!c) return;
        if (c.id === seleccionado()) abrirSeleccion();
        else { if (pagina === 0) ui.tierraSeleccionada = c.id; else ui.parejaSeleccionada = c.id; ctx.redibujar(); }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "monitor", tecla: "3", titulo: "MONITOR", tituloCorto: "MON", crear });
})(window.DENDRO = window.DENDRO || {});
