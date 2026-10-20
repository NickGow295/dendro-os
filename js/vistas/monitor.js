// V3 MONITOR (02-diseno.md §6): las 24 tierras en miniatura con su estado, y la gráfica logarítmica
// de ramas afectadas. La proyección se dibuja siempre, pero el valor final y el τ del colapso
// salen como "???" corruptos hasta la fase CRÍTICO.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO, ABREVIATURA } = C;
  const FASE_REVELACION = 4;
  const POR_PAGINA_MOVIL = 12;
  const RUIDO_TEXTO = "?#%&@▓▒░";
  const SUPERINDICES = "⁰¹²³⁴⁵⁶⁷⁸⁹";

  function crear(ctx) {
    const { estado, ui } = ctx;
    const ids = estado.tierras.nombradas.map((t) => t.codigo);
    if (!ids.includes(ui.tierraSeleccionada)) ui.tierraSeleccionada = C.parejaNombrada(estado).a;
    const revelado = estado.fase >= FASE_REVELACION;
    const R = window.DENDRO_CONFIG.cronologia.ramasAfectadasFinal;
    let celdas = [], columnas = 6, pagina = 0, ancho = true, grafica = null;

    const indice = () => ids.indexOf(ui.tierraSeleccionada);
    const visibles = () => (ancho ? ids : ids.slice(pagina * POR_PAGINA_MOVIL, (pagina + 1) * POR_PAGINA_MOVIL));

    // "???" que cambia de caracteres a saltos, con semilla del día y del instante.
    function corrupto(texto, ahora) {
      const rng = DENDRO.prng.crear(estado.dia, "corrupto", Math.floor(ahora / 110));
      return Array.from(texto).map((c) => (rng() < 0.4 ? RUIDO_TEXTO[Math.floor(rng() * RUIDO_TEXTO.length)] : c)).join("");
    }

    function dibujar(reg) {
      ancho = reg.ancho >= 80;
      const t = C.tierra(estado, ui.tierraSeleccionada);
      const fin = reg.escribir(1, 0, `${t.codigo} ${MAYUS(t.nombre)}`, "texto");
      reg.escribir(fin + 1, 0, ` ${t.estado} `, COLOR_ESTADO[t.estado], { inverso: true });
      if (ancho) reg.derecha(0, `ESTABILIDAD ${t.estabilidad} % · ${t.pareja || "—"} `, "textoTenue");

      let rejilla;
      if (ancho) {
        const anchoRejilla = Math.floor(reg.ancho * 0.6);
        columnas = 6;
        rejilla = reg.region(0, 1, anchoRejilla, reg.alto - 1);
        grafica = reg.caja(anchoRejilla, 1, reg.ancho - anchoRejilla, reg.alto - 1, { titulo: "RAMAS AFECTADAS" });
      } else {
        columnas = 3;
        pagina = Math.floor(indice() / POR_PAGINA_MOVIL);
        const altoRejilla = Math.floor((reg.alto - 2) * 0.66);
        reg.centrar(1, `◄  ${pagina + 1}/2  ►`, "ambar");
        rejilla = reg.region(0, 2, reg.ancho, altoRejilla);
        grafica = reg.caja(0, 2 + altoRejilla, reg.ancho, reg.alto - 2 - altoRejilla, { titulo: "RAMAS AFECTADAS" });
      }

      const lista = visibles(), filas = Math.ceil(lista.length / columnas);
      const an = rejilla.ancho / columnas, al = rejilla.alto / filas;
      celdas = lista.map((id, i) => {
        const x = Math.floor((i % columnas) * an), y = Math.floor(Math.floor(i / columnas) * al);
        const celda = rejilla.region(x, y, Math.floor(an), Math.floor(al));
        const tt = C.tierra(estado, id);
        celda.escribir(1, celda.alto - 2, "·" + tt.codigo.split("·").pop(), id === ui.tierraSeleccionada ? "ambar" : "textoTenue");
        celda.derecha(celda.alto - 2, ABREVIATURA[tt.estado] + " ", COLOR_ESTADO[tt.estado]);
        return { id, region: celda, x: rejilla.x - reg.x + x, y: rejilla.y - reg.y + y, ancho: Math.floor(an), alto: Math.floor(al) };
      });

      dibujarEjes(grafica);
    }

    // Etiquetas de texto de la gráfica (los trazos van en vectores()).
    function dibujarEjes(g) {
      const serie = estado.ejes.serieRamas;
      const ultimoPasado = serie.filter((s) => !s.futuro).pop();
      g.centrar(4, revelado ? `DE ${DENDRO.escritorio.formatoRamas(R)}` : "", "textoTenue");
      const area = areaGrafica(g);
      const decadas = Math.floor(Math.log10(R));
      const maxVisible = ultimoPasado ? Math.floor(Math.log10(Math.max(1, ultimoPasado.valor))) + 1 : 1;
      for (let k = 0; k <= decadas; k++) {
        if (!revelado && k > maxVisible) continue;
        const y = Math.round(area.y + area.alto * (1 - k / Math.log10(R)));
        g.escribir(0, y, k === 0 ? "1" : k === 1 ? "10" : "10" + SUPERINDICES[k], "textoTenue");
      }
      g.escribir(area.x, g.alto - 1, DENDRO.tau.corto(serie[0].instante), "textoTenue");
      if (revelado) g.derecha(g.alto - 1, DENDRO.tau.corto(serie[serie.length - 1].instante), "arma");
    }

    function areaGrafica(g) {
      return { x: 5, y: 6, ancho: g.ancho - 6, alto: g.alto - 8 };
    }

    function vectores(raiz, ahora) {
      const segundos = ahora / 1000;
      const pulso = 0.5 + 0.5 * Math.sin(segundos * 5);
      for (const c of celdas) {
        const v = c.region.vectores(), t = C.tierra(estado, c.id);
        const r = Math.max(0.6, Math.min((c.alto - 2.6) / 2, (c.ancho * v.aspecto) / 2) * 0.86);
        v.globo(c.ancho / 2, (c.alto - 2) / 2, r, t, C.opcionesGlobo(estado, t, segundos));
        C.barraEstabilidad(v, 1, c.alto - 0.8, c.ancho - 2, t.estabilidad, 0.45);
        if (t.estado === "HOSTILIDADES") {
          v.poligono([[0.2, 0.1], [c.ancho - 0.2, 0.1], [c.ancho - 0.2, c.alto - 0.1], [0.2, c.alto - 0.1]], "arma", { alfa: 0.3 + 0.6 * pulso });
        }
        if (c.id === ui.tierraSeleccionada) {
          v.poligono([[0.2, 0.1], [c.ancho - 0.2, 0.1], [c.ancho - 0.2, c.alto - 0.1], [0.2, c.alto - 0.1]], "ambar",
            { grosor: window.DENDRO_CONFIG.vectores.grosorActivo });
        }
      }
      if (grafica) vectoresGrafica(grafica.vectores(), ahora);
    }

    function vectoresGrafica(v, ahora) {
      const serie = estado.ejes.serieRamas, area = areaGrafica(grafica);
      const logR = Math.log10(R);
      const px = (i) => area.x + (i / (serie.length - 1)) * area.ancho;
      const py = (valor) => area.y + area.alto * (1 - Math.log10(Math.max(1, valor)) / logR);

      // Cifra grande
      const cifra = DENDRO.escritorio.formatoRamas(estado.ramasAfectadas);
      v.texto(v.ancho / 2, 0.2, cifra, estado.fase >= 3 ? "arma" : "ambar", { tam: Math.min(3, v.ancho / 9), alinear: "center" });
      if (!revelado) v.texto(v.ancho / 2, 4, corrupto("DE ???", ahora), "arma", { tam: 1, alinear: "center", alfa: 0.85 });

      // Ejes y rejilla de décadas
      v.linea(area.x, area.y, area.x, area.y + area.alto, "ambarTenue");
      v.linea(area.x, area.y + area.alto, area.x + area.ancho, area.y + area.alto, "ambarTenue");
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
        v.texto(fx, fy + 0.6, "PROYECCIÓN", "ambarTenue", { tam: 0.9, alinear: "center" });
      }
      const [ux, uy] = futuro.length ? futuro[futuro.length - 1] : pasado[pasado.length - 1];
      if (!revelado) {
        v.texto(ux, uy - 0.2, corrupto("???", ahora), "arma", { tam: 1.1, alinear: "right", base: "bottom" });
        v.texto(area.x + area.ancho, area.y + area.alto + 1.05, corrupto("???", ahora + 333), "arma", { tam: 1, alinear: "right" });
      }

      if (pasado.length) {
        const [hx, hy] = pasado[pasado.length - 1];
        v.linea(hx, area.y, hx, area.y + area.alto, "ambar", { discontinua: [2, 3], alfa: 0.7 });
        v.punto(hx, hy, "ambar", { tam: 3 });
        v.texto(hx, area.y - 0.1, `AHORA ${DENDRO.tau.corto(estado.instante)}`, "ambar", { tam: 0.9, alinear: "center", base: "bottom" });
      } else {
        v.texto(area.x + area.ancho / 2, area.y + area.alto / 2, "SIN COLISIONES REGISTRADAS", "textoTenue", { tam: 1, alinear: "center" });
      }
    }

    function mover(paso) {
      ui.tierraSeleccionada = ids[(indice() + paso + ids.length) % ids.length];
      ctx.redibujar();
    }

    return {
      animada: true,
      dibujar,
      vectores,
      tecla(ev) {
        const pasos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columnas, ArrowDown: columnas };
        if (pasos[ev.key]) { ev.preventDefault(); mover(pasos[ev.key]); }
        else if (ev.key === "Enter") { ev.preventDefault(); ctx.abrir("expediente"); }
      },
      toque(punto) {
        if (!punto) return;
        if (!ancho && Math.floor(punto.y) === 1) {
          const lado = C.ladoDelToque(punto, ctx.region().ancho);
          if (lado) {
            pagina = (pagina + 1) % 2;
            ui.tierraSeleccionada = ids[pagina * POR_PAGINA_MOVIL];
            ctx.redibujar();
          }
          return;
        }
        const c = celdas.find((k) => punto.x >= k.x && punto.x < k.x + k.ancho && punto.y >= k.y && punto.y < k.y + k.alto);
        if (!c) return;
        if (c.id === ui.tierraSeleccionada) ctx.abrir("expediente");
        else { ui.tierraSeleccionada = c.id; ctx.redibujar(); }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "monitor", tecla: "3", titulo: "MONITOR", tituloCorto: "MON", crear });
})(window.DENDRO = window.DENDRO || {});
