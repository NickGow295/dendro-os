// V5 EXPEDIENTE (02-diseno.md §6): ficha de una tierra con su globo, datos, barra de estabilidad
// y línea temporal dibujada con sus eventos hasta hoy; el tramo futuro, rayado y sin datos.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO, POSTURAS, COLOR_TIPO } = C;
  const DIGITOS = "0123456789";
  const COLUMNA_VALOR = 16;

  function crear(ctx) {
    const { estado, ui } = ctx;
    const ids = estado.tierras.map((t) => t.id);
    if (!ui.tierraSeleccionada) ui.tierraSeleccionada = C.pareja(estado, estado.parejaPrincipal).a;
    let evento = -1;   // índice del evento resaltado en la línea temporal (−1: el último)
    let zonaGlobo = null, zonaLinea = null, campoOmega = null;

    const tierra = () => C.tierra(estado, ui.tierraSeleccionada);
    const eventos = () => tierra().eventos;
    const eventoActual = () => {
      const lista = eventos();
      if (!lista.length) return null;
      return lista[evento < 0 || evento >= lista.length ? lista.length - 1 : evento];
    };

    function dibujarLista(reg) {
      ids.forEach((id, i) => {
        if (i >= reg.alto) return;
        const t = C.tierra(estado, id), activa = id === ui.tierraSeleccionada;
        reg.rellenar(0, i, reg.ancho, 1, " ", "ambar", activa ? { inverso: true } : null);
        reg.escribir(1, i, `${id.slice(4)} ${MAYUS(t.nombre)}`.slice(0, reg.ancho - 3), activa ? "ambar" : COLOR_ESTADO[t.estado] === "tierra" ? "texto" : COLOR_ESTADO[t.estado], activa ? { inverso: true } : null);
      });
    }

    function dibujarFicha(caja, t) {
      const par = t.pareja ? C.pareja(estado, t.pareja) : null;
      const otra = par ? C.tierra(estado, par.a === t.id ? par.b : par.a) : null;
      const filas = [];
      const fila = (etiqueta, valor, color) => filas.push([etiqueta, valor, color || "texto"]);
      fila("DESIGNACIÓN", t.id, "tierra");
      fila("NOMBRE", MAYUS(t.nombre));
      fila("FIRMA ω", t.magia === "Inestable" ? "" : t.omega.toFixed(4), "tierra");
      fila("RÉGIMEN", MAYUS(t.magia));
      fila("TECNOLOGÍA", MAYUS(t.tecnologia));
      const ancho = caja.ancho - 17;
      const planos = t.planos.length ? MAYUS(t.planos.join(", ")) : "NINGUNO DETECTADO";
      C.partir(planos, ancho).forEach((l, i) => fila(i ? "" : "PLANOS ANEXOS", l, "textoTenue"));
      C.partir(MAYUS(t.caracter), ancho).forEach((l, i) => fila(i ? "" : "CARÁCTER", l, "textoTenue"));
      if (par) {
        fila("PAREJA", `${par.id} · ${MAYUS(otra.nombre)}`, "ambar");
        fila("POSTURA", POSTURAS[par.postura], par.postura.includes("hostil") ? "arma" : "texto");
        const propias = (par.armas && par.armas[t.id]) || [];
        const contra = (par.armas && par.armas[otra.id]) || [];
        if (propias.length) fila("ARMAS", MAYUS(propias.map((a) => estado.armas[a].nombre).join(", ")), "arma");
        if (contra.length) fila("AMENAZA", MAYUS(contra.map((a) => estado.armas[a].nombre).join(", ")), "arma");
      }
      fila("ESTADO", t.estado + (t.fusionadaCon ? ` CON ${MAYUS(C.tierra(estado, t.fusionadaCon).nombre)}` : ""), COLOR_ESTADO[t.estado]);
      fila("ESTABILIDAD", `${t.estabilidad} %`, C.colorEstabilidad(t.estabilidad));
      filas.forEach(([etiqueta, valor, color], i) => {
        if (i >= caja.alto - 1) return;
        caja.escribir(1, i, etiqueta, "textoTenue");
        caja.escribir(COLUMNA_VALOR, i, valor, color);
        if (etiqueta === "FIRMA ω" && t.magia === "Inestable") campoOmega = { region: caja, x: COLUMNA_VALOR, y: i };
      });
      return Math.min(filas.length, caja.alto - 1);
    }

    function dibujar(reg) {
      const t = tierra();
      const ancho = reg.ancho >= 80;
      campoOmega = null;
      const altoLinea = ancho ? 8 : 7;
      if (ancho) {
        const anchoLista = 22, anchoFicha = 48;
        dibujarLista(reg.caja(0, 0, anchoLista, reg.alto - altoLinea, { titulo: "TIERRAS", doble: false }));
        zonaGlobo = reg.region(anchoLista, 0, reg.ancho - anchoLista - anchoFicha, reg.alto - altoLinea);
        zonaGlobo.centrar(0, `${t.id} · ${MAYUS(t.nombre)}`, "ambar");
        const ficha = reg.caja(reg.ancho - anchoFicha, 0, anchoFicha, reg.alto - altoLinea, { titulo: "EXPEDIENTE" });
        const usadas = dibujarFicha(ficha, t);
        zonaGlobo.barra = { region: ficha, y: usadas };
      } else {
        C.selector(reg, 0, `${t.id} ${MAYUS(t.nombre)}`);
        const altoGlobo = Math.floor((reg.alto - 1 - altoLinea) * 0.36);
        zonaGlobo = reg.region(0, 1, reg.ancho, altoGlobo);
        const ficha = reg.caja(0, 1 + altoGlobo, reg.ancho, reg.alto - 1 - altoGlobo - altoLinea, { titulo: "EXPEDIENTE" });
        const usadas = dibujarFicha(ficha, t);
        zonaGlobo.barra = { region: ficha, y: usadas };
      }
      zonaLinea = reg.caja(0, reg.alto - altoLinea, reg.ancho, altoLinea, { titulo: "LÍNEA TEMPORAL", doble: false });
      const ev = eventoActual();
      if (ev) {
        const n = eventos().indexOf(ev) + 1;
        zonaLinea.escribir(1, zonaLinea.alto - 2, `${ev.fecha} ${ev.hora} [${ev.tipo}] (${n}/${eventos().length})`, COLOR_TIPO[ev.tipo]);
        zonaLinea.escribir(1, zonaLinea.alto - 1, ev.texto.slice(0, zonaLinea.ancho - 2), "texto");
      } else {
        zonaLinea.escribir(1, zonaLinea.alto - 1, "SIN EVENTOS REGISTRADOS PARA ESTA RAMA", "textoTenue");
      }
      if (ancho) zonaLinea.derecha(zonaLinea.alto - 2, "MAYÚS+←→ EVENTOS ", "textoTenue");
    }

    function lineaTemporal(v) {
      const total = estado.diasTotales, hoy = Math.max(0, Math.min(total, estado.diaHoy));
      const x0 = 1, x1 = v.ancho - 1, y = 1.6;
      const px = (dia) => x0 + ((x1 - x0) * dia) / total;
      v.linea(x0, y, x1, y, "ambarTenue");
      // Marcas semanales con su fecha
      for (const c of estado.calendario) {
        if (c.dia % 7) continue;
        v.linea(px(c.dia), y - 0.3, px(c.dia), y + 0.3, "ambarTenue");
        v.texto(px(c.dia), y + 0.4, c.fecha.slice(5), "textoTenue", { tam: 0.8, alinear: "center" });
      }
      // Futuro rayado
      if (hoy < total) {
        for (let x = px(hoy) + 0.6; x < x1; x += 1.2) v.linea(x, y - 0.9, x + 0.8, y + 0.0, "ambarTenue", { alfa: 0.35 });
        v.texto((px(hoy) + x1) / 2, y - 1.5, "[DATOS NO DISPONIBLES]", "textoTenue", { tam: 0.8, alinear: "center" });
      }
      v.linea(px(hoy), y - 1.2, px(hoy), y + 0.4, "ambar", { grosor: 1.6 });
      v.texto(px(hoy), y - 1.3, "HOY", "ambar", { tam: 0.8, alinear: "center", base: "bottom" });
      const actual = eventoActual();
      for (const ev of eventos()) {
        const x = px(Math.max(0, ev.dia)), resaltado = ev === actual;
        v.circulo(x, y, resaltado ? 0.55 : 0.35, COLOR_TIPO[ev.tipo], { relleno: COLOR_TIPO[ev.tipo], rellenoAlfa: resaltado ? 0.9 : 0.5 });
        if (resaltado) v.circulo(x, y, 0.9, "ambar", { grosor: window.DENDRO_CONFIG.vectores.grosorActivo });
      }
    }

    function vectores(raiz, ahora) {
      if (!zonaGlobo) return;
      const t = tierra(), segundos = ahora / 1000;
      const v = zonaGlobo.vectores();
      const r = Math.max(1, Math.min((v.alto - 2) / 2, (v.ancho * v.aspecto) / 2) * 0.82);
      v.globo(v.ancho / 2, (v.alto + 1) / 2, r, t, C.opcionesGlobo(estado, t, segundos));

      const b = zonaGlobo.barra;
      if (b && b.y < b.region.alto) C.barraEstabilidad(b.region.vectores(), COLUMNA_VALOR, b.y + 0.2, Math.min(20, b.region.ancho - COLUMNA_VALOR - 2), t.estabilidad);

      // En las tierras inestables, la ω no se deja leer: los dígitos oscilan (decorativo).
      if (campoOmega) {
        const rng = DENDRO.prng.crear(t.id, Math.floor(ahora / 90));
        const texto = t.omega.toFixed(4).split("").map((c, i) => (i > 1 && DIGITOS.includes(c) ? DIGITOS[Math.floor(rng() * 10)] : c)).join("");
        campoOmega.region.vectores().texto(campoOmega.x, campoOmega.y, texto, "tierra", { tam: 1 });
      }
      lineaTemporal(zonaLinea.vectores());
    }

    function cambiarTierra(paso) {
      ui.tierraSeleccionada = ids[(ids.indexOf(ui.tierraSeleccionada) + paso + ids.length) % ids.length];
      evento = -1;
      ctx.redibujar();
    }

    function cambiarEvento(paso) {
      const lista = eventos();
      if (!lista.length) return;
      const actual = evento < 0 ? lista.length - 1 : evento;
      evento = (actual + paso + lista.length) % lista.length;
      ctx.redibujar();
    }

    return {
      animada: true,
      dibujar,
      vectores,
      tecla(ev) {
        const horizontal = ev.key === "ArrowLeft" ? -1 : ev.key === "ArrowRight" ? 1 : 0;
        const vertical = ev.key === "ArrowUp" ? -1 : ev.key === "ArrowDown" ? 1 : 0;
        if (horizontal && ev.shiftKey) { ev.preventDefault(); cambiarEvento(horizontal); }
        else if (horizontal || vertical) { ev.preventDefault(); cambiarTierra(horizontal || vertical); }
      },
      toque(punto) {
        if (!punto) return;
        const reg = ctx.region();
        if (reg.ancho < 80 && punto.y < 1) {
          const lado = C.ladoDelToque(punto, reg.ancho);
          if (lado) cambiarTierra(lado);
          return;
        }
        if (reg.ancho >= 80 && punto.x < 22 && punto.y >= 1 && punto.y <= ids.length) {
          ui.tierraSeleccionada = ids[Math.floor(punto.y) - 1];
          evento = -1;
          ctx.redibujar();
          return;
        }
        // En la línea temporal: el evento más cercano en el eje.
        if (zonaLinea && punto.y >= zonaLinea.y - reg.y) {
          const lista = eventos();
          if (!lista.length) return;
          const x = punto.x - (zonaLinea.x - reg.x);
          const px = (dia) => 1 + ((zonaLinea.ancho - 2) * dia) / estado.diasTotales;
          let mejor = 0;
          lista.forEach((e2, i) => { if (Math.abs(px(e2.dia) - x) < Math.abs(px(lista[mejor].dia) - x)) mejor = i; });
          evento = mejor;
          ctx.redibujar();
        }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "expediente", tecla: "5", titulo: "EXPEDIENTE", tituloCorto: "EXP", crear });
})(window.DENDRO = window.DENDRO || {});
