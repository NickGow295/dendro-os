// V1 COLISIÓN (02-diseno.md §6): la pareja seleccionada como dos globos que se acercan,
// con la regla de Δω, los ataques en rojo, el desenlace y los paneles de lectura.
// Lee solo del Estado y del estado de interfaz; los tiempos se muestran en τ.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const C = DENDRO.vistasComun;
  const { MAYUS, POSTURAS, COLOR_ESTADO } = C;
  const MISILES_POR_ARMA = 3;
  const VELOCIDAD_MISIL = 0.35;  // trayectorias completas por segundo

  function crear(ctx) {
    const { estado, ui } = ctx;
    const tierra = (id) => estado.tierras.find((t) => t.id === id);
    const pareja = () => estado.parejas.find((p) => p.id === ui.parejaSeleccionada) || estado.parejas[0];
    let escena = null;   // región donde van los globos (se recalcula en cada dibujo)
    let grafica = null;  // interior de la caja de la minigráfica, o null
    let globos = [];     // posiciones del último fotograma, para tocar un globo y abrir su expediente

    // ── Texto: selector y paneles ───────────────────────────────────────────
    function nombrePareja(par) {
      if (par.estado === "FUSIONADA") return `${MAYUS(tierra(par.a).nombre)} ∪ ${MAYUS(tierra(par.b).nombre)}`;
      return `${MAYUS(tierra(par.a).nombre)} ⟷ ${MAYUS(tierra(par.b).nombre)}`;
    }

    function textoContacto(par) {
      if (par.estado === "ESTABLE") return "SIN CONVERGENCIA";
      return DENDRO.tau.cuenta(par.paraContacto);
    }

    function dibujarSelector(reg, par, ancho) {
      const indice = estado.parejas.indexOf(par) + 1;
      const centro = ancho ? `◄  ${par.id} · ${nombrePareja(par)}  ►` : `◄ ${par.id} ►`;
      reg.centrar(0, centro, "ambar");
      reg.escribir(1, 0, `PAREJA ${String(indice).padStart(2, "0")}/${estado.parejas.length}`, "textoTenue");
      if (par.id === estado.parejaPrincipal) reg.derecha(0, " PRINCIPAL ", "ambar", { inverso: true });
      else reg.derecha(0, ancho ? "INICIO: PRINCIPAL " : "", "textoTenue");
      if (!ancho) reg.centrar(1, nombrePareja(par), "texto");
      else reg.rellenar(0, 1, reg.ancho, 1, "─", "ambarTenue");
    }

    function dibujarLectura(caja, par) {
      const filas = [
        ["Δω ACTUAL", par.deltaOmega.toFixed(4), "texto"],
        ["Δω₀", par.deltaOmega0.toFixed(4), "textoTenue"],
        ["SEPARACIÓN", `${Math.round(par.separacion * 100)} %`, "texto"],
        ["CONTACTO", textoContacto(par), par.paraContacto > 0 && par.estado !== "ESTABLE" ? "ambar" : "texto"],
        ["ESTADO", par.estado, COLOR_ESTADO[par.estado]],
      ];
      filas.forEach(([etiqueta, valor, color], i) => {
        if (i >= caja.alto) return;
        caja.escribir(1, i, etiqueta, "textoTenue");
        caja.derecha(i, valor + " ", color);
      });
    }

    function dibujarPostura(caja, par) {
      let y = 0;
      const fila = (etiqueta, valor, color) => {
        if (y >= caja.alto) return;
        caja.escribir(1, y, etiqueta, "textoTenue");
        caja.escribir(12, y++, valor, color);
      };
      fila("POSTURA", POSTURAS[par.postura], par.postura.includes("hostil") ? "arma" : "texto");
      fila("AGRESOR", par.agresor ? MAYUS(tierra(par.agresor).nombre) : "—", par.agresor ? "arma" : "textoTenue");
      const armas = Object.entries(par.armas || {});
      if (!armas.length) fila("ARMAS", "NINGUNA DECLARADA", "textoTenue");
      for (const [id, lista] of armas) {
        for (const tipo of lista) fila(y === 2 ? "ARMAS" : "", `${MAYUS(estado.armas[tipo].nombre)}`, "arma");
      }
    }

    function dibujar(reg) {
      const par = pareja();
      const ancho = reg.ancho >= 80;
      dibujarSelector(reg, par, ancho);
      grafica = null;
      if (ancho) {
        const altoPanel = 9;
        escena = reg.region(0, 2, reg.ancho, reg.alto - 2 - altoPanel);
        const y = reg.alto - altoPanel;
        const a1 = Math.floor(reg.ancho * 0.28), a2 = Math.floor(reg.ancho * 0.36);
        dibujarLectura(reg.caja(0, y, a1, altoPanel, { titulo: "LECTURA" }), par);
        dibujarPostura(reg.caja(a1, y, a2, altoPanel, { titulo: "POSTURA", doble: false }), par);
        const g = reg.caja(a1 + a2, y, reg.ancho - a1 - a2, altoPanel, { titulo: "Δω · VENTANA DE CONTACTO", doble: false });
        if (par.estado === "ESTABLE") g.centrar(Math.floor(g.alto / 2), "SIN DATOS DE CONVERGENCIA", "textoTenue");
        else {
          grafica = g;
          g.escribir(0, 0, "Δω₀", "textoTenue");
          g.escribir(0, g.alto - 2, "0", "textoTenue");
          const serie = par.serieDeltaOmega;
          g.escribir(4, g.alto - 1, DENDRO.tau.corto(serie[0].instante), "textoTenue");
          g.derecha(g.alto - 1, DENDRO.tau.corto(serie[serie.length - 1].instante), "textoTenue");
        }
      } else {
        const altoPanel = 8;
        escena = reg.region(0, 2, reg.ancho, reg.alto - 2 - altoPanel);
        const caja = reg.caja(0, reg.alto - altoPanel, reg.ancho, altoPanel, { titulo: "LECTURA" });
        dibujarLectura(caja.region(0, 0, caja.ancho, 5), par);
        caja.escribir(1, 5, "POSTURA", "textoTenue");
        caja.derecha(5, POSTURAS[par.postura] + " ", par.postura.includes("hostil") ? "arma" : "texto");
      }
    }

    // ── Vectores: escena ────────────────────────────────────────────────────
    // En vertical (compacto) el id y la ω van en líneas separadas para no salirse por la derecha.
    function rotulosGlobo(v, t, x, y, alinear, compacto) {
      v.texto(x, y, MAYUS(t.nombre), "texto", { tam: 1.4, alinear });
      if (compacto) {
        v.texto(x, y + 1.35, t.id, "tierra", { tam: 1, alinear });
        v.texto(x, y + 2.35, `ω ${t.omega.toFixed(4)}`, "tierra", { tam: 1, alinear });
        y += 1;
      } else {
        v.texto(x, y + 1.35, `${t.id} · ω ${t.omega.toFixed(4)}`, "tierra", { tam: 1, alinear });
      }
      v.texto(x, y + 2.35, t.estado, COLOR_ESTADO[t.estado], { tam: 1, alinear });
      const anchoBarra = compacto ? 11 : 14;
      C.barraEstabilidad(v, alinear === "center" ? x - anchoBarra / 2 : x, y + 3.6, anchoBarra, t.estabilidad);
    }

    function rotuloEstado(par) {
      const nombre = (id) => MAYUS(tierra(id).nombre);
      switch (par.estado) {
        case "ESTABLE": return ["SIN CONVERGENCIA", "tierra"];
        case "APROXIMACIÓN": return [textoContacto(par), par.hostil ? "arma" : "ambar"];
        case "CONTACTO": return ["CONTACTO", "texto"];
        case "HOSTILIDADES": return ["HOSTILIDADES", "arma"];
        case "INTERFERENCIA": return ["INTERFERENCIA", "ambar"];
        case "ANIQUILADA": return ["ANIQUILACIÓN", "peligro"];
        case "FUSIONADA": return ["FUSIÓN", "tierra"];
        case "SUPERVIVIENTE": return [`SOBREVIVE ${nombre(par.desenlace.split(":")[1])}`, "texto"];
        default: return [par.estado, "peligro"];
      }
    }

    // Destello en el punto de contacto; en interferencia, un zigzag inestable.
    function contacto(v, x, y, par, segundos, vertical) {
      if (!["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"].includes(par.estado)) return;
      const pulso = 0.5 + 0.5 * Math.sin(segundos * 6);
      if (par.estado === "INTERFERENCIA") {
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const k = i / 12 - 0.5, desvio = (Math.sin(segundos * 20 + i * 2.1) * 0.6);
          pts.push(vertical ? [x + k * 14, y + desvio] : [x + desvio, y + k * 6]);
        }
        v.polilinea(pts, "ambar", { alfa: 0.5 + 0.5 * pulso });
        return;
      }
      const color = par.estado === "HOSTILIDADES" ? "arma" : "texto";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + segundos;
        const largo = 0.8 + 1.2 * pulso;
        v.linea(x, y, x + (Math.cos(a) * largo) / v.aspecto, y + Math.sin(a) * largo, color, { alfa: 0.4 + 0.6 * pulso });
      }
      v.punto(x, y, color, { tam: 2.5 + 2 * pulso });
    }

    function ataques(v, par, posiciones, r, segundos, vertical) {
      const lista = estado.ataques.filter((a) => a.pareja === par.id);
      lista.forEach((atq, indice) => {
        const desde = posiciones[atq.desde], hacia = posiciones[atq.hacia];
        if (!desde || !hacia) return;
        const esAgresor = atq.desde === par.agresor;
        const altura = r * (esAgresor ? 2.3 : 1.5);
        let x1, y1, cx, cy, x2, y2;
        if (vertical) {
          const lado = esAgresor ? 1 : -1;
          x1 = desde.x + (lado * r * 0.6) / v.aspecto; y1 = desde.y;
          x2 = hacia.x + (lado * r * 0.6) / v.aspecto; y2 = hacia.y;
          cx = desde.x + (lado * altura) / v.aspecto; cy = (y1 + y2) / 2;
        } else {
          x1 = desde.x; y1 = desde.y - r * 0.85;
          x2 = hacia.x; y2 = hacia.y - r * 0.6;
          cx = (x1 + x2) / 2; cy = Math.min(y1, y2) - altura;
        }
        v.curva(x1, y1, cx, cy, x2, y2, "arma", { discontinua: [2, 5], alfa: 0.45 });
        for (let k = 0; k < MISILES_POR_ARMA; k++) {
          const t = (segundos * VELOCIDAD_MISIL + k / MISILES_POR_ARMA + indice * 0.17) % 1;
          for (let s = 0; s < 3; s++) {
            const q = DENDRO.vectores.puntoEnCurva(x1, y1, cx, cy, x2, y2, Math.max(0, t - s * 0.015));
            v.punto(q.x, q.y, "arma", { tam: 2.4 - s * 0.6, alfa: 1 - s * 0.3 });
          }
          if (t > 0.9) v.circulo(x2, y2, 0.3 + (t - 0.9) * 12, "arma", { alfa: (1 - t) * 10 });
        }
      });
    }

    function grafiqueta(v, par) {
      const serie = par.serieDeltaOmega, w = v.ancho - 4, h = v.alto - 2;
      const px = (i) => 4 + (i / (serie.length - 1)) * w;
      const py = (valor) => 0.5 + (1 - valor / par.deltaOmega0) * (h - 0.5);
      v.linea(4, py(0), 4 + w, py(0), "ambarTenue", { alfa: 0.6 });
      v.linea(4, 0.5, 4, py(0), "ambarTenue", { alfa: 0.6 });
      const pasado = serie.map((s, i) => [px(i), py(s.valor), s.futuro]);
      const corte = pasado.findIndex((p) => p[2]);
      const ultimo = corte < 0 ? pasado.length - 1 : corte - 1;
      if (ultimo >= 1) v.polilinea(pasado.slice(0, ultimo + 1), "tierra", { grosor: cfg().vectores.grosorActivo });
      if (corte >= 0) v.polilinea(pasado.slice(Math.max(0, corte - 1)), "ambarTenue", { discontinua: [3, 4] });
      if (ultimo >= 0) {
        v.linea(pasado[ultimo][0], 0.3, pasado[ultimo][0], py(0), "ambar", { alfa: 0.7, discontinua: [2, 3] });
        v.punto(pasado[ultimo][0], pasado[ultimo][1], "ambar", { tam: 3 });
      }
    }

    function vectores(raiz, ahora) {
      if (!escena) return;
      const par = pareja();
      const v = escena.vectores();
      const segundos = ahora / 1000;
      const ta = tierra(par.a), tb = tierra(par.b);
      const vertical = escena.ancho < 80;
      const W = escena.ancho, H = escena.alto;

      const [rotulo, colorRotulo] = rotuloEstado(par);
      v.texto(W / 2, 0.2, rotulo, colorRotulo, { tam: Math.min(3.2, H * 0.11), alinear: "center" });

      const posiciones = {};
      let r;
      globos = [];
      if (!vertical) {
        r = Math.min(H * 0.27, W * v.aspecto * 0.15);
        const cy = H * 0.5;
        const juntos = (2 * r) / v.aspecto;
        const lejos = Math.min(W * 0.62, W - (2 * r) / v.aspecto - 6);
        const d = par.estado === "FUSIONADA" ? 0 : juntos + (lejos - juntos) * par.separacion;
        posiciones[ta.id] = { x: W / 2 - d / 2, y: cy };
        posiciones[tb.id] = { x: W / 2 + d / 2, y: cy };
      } else {
        r = Math.min(W * v.aspecto * 0.26, H * 0.15);
        const cx = W * 0.36;
        const juntos = 2 * r;
        const lejos = H * 0.6;
        const d = par.estado === "FUSIONADA" ? 0 : juntos + (lejos - juntos) * par.separacion;
        posiciones[ta.id] = { x: cx, y: H * 0.52 - d / 2 };
        posiciones[tb.id] = { x: cx, y: H * 0.52 + d / 2 };
      }

      for (const t of [ta, tb]) globos.push({ id: t.id, x: posiciones[t.id].x, y: posiciones[t.id].y, r, aspecto: v.aspecto });
      if (par.estado === "FUSIONADA") {
        const p = posiciones[ta.id];
        v.globo(p.x, p.y, r * 1.1, ta, { fusion: { tierra: tb, mezcla: 0.5 + 0.2 * Math.sin(segundos * 0.8) } });
        const t = { ...ta, nombre: `${ta.nombre} ∪ ${tb.nombre}`, estabilidad: ta.estabilidad };
        if (vertical) rotulosGlobo(v, t, p.x + r * 1.1 / v.aspecto + 2, p.y - 2.5, "left", true);
        else rotulosGlobo(v, t, p.x, p.y + r * 1.1 + 0.6, "center");
      } else {
        // Regla de Δω entre los dos limbos
        const pa = posiciones[ta.id], pb = posiciones[tb.id];
        if (par.separacion > 0.05) {
          if (!vertical) {
            const x1 = pa.x + r / v.aspecto + 1.5, x2 = pb.x - r / v.aspecto - 1.5;
            v.linea(x1, pa.y, x2, pb.y, "ambarTenue", { discontinua: [3, 4] });
            for (let i = 0; i <= 4; i++) v.linea(x1 + ((x2 - x1) * i) / 4, pa.y - 0.3, x1 + ((x2 - x1) * i) / 4, pa.y + 0.3, "ambarTenue");
            v.texto((x1 + x2) / 2, pa.y - 1.4, `Δω ${par.deltaOmega.toFixed(4)}`, "texto", { tam: 1.1, alinear: "center" });
          } else {
            const y1 = pa.y + r + 0.8, y2 = pb.y - r - 0.8;
            v.linea(pa.x, y1, pb.x, y2, "ambarTenue", { discontinua: [3, 4] });
            v.texto(pa.x + 2, (y1 + y2) / 2 - 0.5, `Δω ${par.deltaOmega.toFixed(4)}`, "texto", { tam: 1 });
          }
        }
        v.globo(pa.x, pa.y, r, ta, C.opcionesGlobo(estado, ta, segundos));
        v.globo(pb.x, pb.y, r, tb, C.opcionesGlobo(estado, tb, segundos));
        contacto(v, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2, par, segundos, vertical);
        ataques(v, par, posiciones, r, segundos, vertical);
        for (const t of [ta, tb]) {
          const p = posiciones[t.id];
          if (vertical) rotulosGlobo(v, t, p.x + r / v.aspecto + 2, p.y - 2.5, "left", true);
          else rotulosGlobo(v, t, p.x, p.y + r + 0.6, "center");
        }
      }

      if (grafica && par.estado !== "ESTABLE") grafiqueta(grafica.vectores(), par);
    }

    function cambiarPareja(paso) {
      const i = estado.parejas.indexOf(pareja());
      ui.parejaSeleccionada = estado.parejas[(i + paso + estado.parejas.length) % estado.parejas.length].id;
      ctx.redibujar();
    }

    return {
      animada: true,
      dibujar,
      vectores,
      tecla(ev) {
        if (ev.key === "ArrowLeft") { ev.preventDefault(); cambiarPareja(-1); }
        else if (ev.key === "ArrowRight") { ev.preventDefault(); cambiarPareja(1); }
        else if (ev.key === "Home" || ev.key.toLowerCase() === "p") {
          ui.parejaSeleccionada = estado.parejaPrincipal;
          ctx.redibujar();
        }
      },
      toque(punto) {
        if (!punto) return;
        if (punto.y < 2) {
          const lado = C.ladoDelToque(punto, ctx.region().ancho);
          if (lado) cambiarPareja(lado);
          return;
        }
        // Coordenadas de la escena (empieza dos filas por debajo de la vista).
        const x = punto.x, y = punto.y - 2;
        const tocado = globos.find((g) => Math.hypot((x - g.x) * g.aspecto, y - g.y) <= g.r);
        if (tocado) {
          ui.tierraSeleccionada = tocado.id;
          ctx.abrir("expediente");
        }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "colision", tecla: "1", titulo: "COLISIÓN", tituloCorto: "COL", crear });
})(window.DENDRO = window.DENDRO || {});
