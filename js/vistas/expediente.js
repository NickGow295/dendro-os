// V5 EXPEDIENTE (02-diseno.md §6): ficha de una rama con su globo, datos, barra de estabilidad
// y línea temporal dibujada con sus eventos hasta hoy; el tramo futuro, rayado y sin datos.
// Completa para MYTH (cohesión N̂ y guardianes, sellados sin credencial) y las 24 nombradas;
// corta para las generadas, que llegan seleccionadas desde COLISIÓN o la terminal.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO, POSTURAS, COLOR_TIPO } = C;
  const DIGITOS = "0123456789";
  const COLUMNA_VALOR = 16;

  function crear(ctx) {
    const { ui } = ctx;
    let estado = ctx.estado;
    const ids = ["MYTH", ...estado.tierras.nombradas.map((t) => t.codigo)];
    if (!ui.tierraSeleccionada || !estado.tierras.porCodigo(ui.tierraSeleccionada)) ui.tierraSeleccionada = C.parejaNombrada(estado).a;
    let primeraLista = 0;
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
      const i = ids.indexOf(ui.tierraSeleccionada);
      if (i >= 0) primeraLista = C.desplazamiento(primeraLista, i, reg.alto);
      ids.slice(primeraLista, primeraLista + reg.alto).forEach((id, fila) => {
        const t = C.tierra(estado, id), activa = id === ui.tierraSeleccionada;
        reg.rellenar(0, fila, reg.ancho, 1, " ", "ambar", activa ? { inverso: true } : null);
        const rotulo = t.raiz ? "MYTH · TRONCO" : `${C.codigoCorto(id)} ${MAYUS(t.nombre)}`;
        reg.escribir(1, fila, rotulo.slice(0, reg.ancho - 3), activa ? "ambar" : t.raiz ? "rama" : COLOR_ESTADO[t.estado] === "tierra" ? "texto" : COLOR_ESTADO[t.estado], activa ? { inverso: true } : null);
      });
    }

    const origen = (t) => (t.raiz ? "PRIMERA IGNICIÓN BETA" : t.joven ? `JOVEN · SALTO N.º ${t.salto} DE MYTH` : "ANTIGUA");
    const barra = (t) => (t.raiz ? Math.round(t.cohesion * 100) : t.estabilidad);
    const rotulo = (t) => (t.raiz ? "MYTH · TRONCO" : t.nombre ? `${t.codigo} · ${MAYUS(t.nombre)}` : t.codigo);

    function dibujarFicha(caja, t) {
      const par = t.pareja ? C.pareja(estado, t.pareja) : null;
      const otra = par ? C.tierra(estado, par.a === t.codigo ? par.b : par.a) : null;
      const filas = [];
      const fila = (etiqueta, valor, color) => filas.push([etiqueta, valor, color || "texto"]);
      const ancho = caja.ancho - 17;
      fila("DESIGNACIÓN", t.raiz ? "MYTH · TRONCO" : t.codigo, "tierra");
      if (t.nombrada) fila("NOMBRE", MAYUS(t.nombre));
      else if (!t.raiz) fila("DENOMINACIÓN", "LOCAL: NO CATALOGADA", "textoTenue");
      fila("FIRMA ω", t.raiz ? "≡ 1.0000" : t.magia === "Inestable" ? "" : t.omega.toFixed(4), "tierra");
      fila("RÉGIMEN", MAYUS(t.magia));
      fila("TECNOLOGÍA", MAYUS(t.tecnologia));
      fila("ORIGEN", origen(t), t.joven ? "ambar" : "texto");
      if (t.nombrada || t.raiz) {
        const planos = t.planos.length ? MAYUS(t.planos.join(", ")) : "NINGUNO DETECTADO";
        C.partir(planos, ancho).forEach((l, i) => fila(i ? "" : "PLANOS ANEXOS", l, "textoTenue"));
        C.partir(MAYUS(t.caracter), ancho).forEach((l, i) => fila(i ? "" : "CARÁCTER", l, "textoTenue"));
      }
      if (t.raiz) {
        fila("RAMAS", `${DENDRO.escritorio.formatoRamas(estado.ramasCatalogadas - 1)} BROTAN DE ÉL`);
        fila("ESTADO", t.estado, COLOR_ESTADO[t.estado]);
        fila("COHESIÓN N̂", t.cohesion.toFixed(3), C.colorEstabilidad(barra(t)));
        return filas;
      }
      if (par) {
        fila("PAREJA", `${par.id} · ${C.nombre(otra)}`, "ambar");
        fila("POSTURA", POSTURAS[par.postura], par.postura.includes("hostil") ? "arma" : "texto");
        const propias = (par.armas && par.armas[t.codigo]) || [];
        const contra = (par.armas && par.armas[otra.codigo]) || [];
        if (propias.length) fila("ARMAS", MAYUS(propias.map((a) => estado.armas[a].nombre).join(", ")), "arma");
        if (contra.length) fila("AMENAZA", MAYUS(contra.map((a) => estado.armas[a].nombre).join(", ")), "arma");
      }
      fila("ESTADO", t.estado + (t.fusionadaCon ? ` CON ${C.nombre(C.tierra(estado, t.fusionadaCon))}` : ""), COLOR_ESTADO[t.estado]);
      fila("ESTABILIDAD", `${t.estabilidad} %`, C.colorEstabilidad(t.estabilidad));
      return filas;
    }

    // Guardianes de MYTH: sellados sin credencial de dirección.
    function filasGuardianes() {
      const filas = [["GUARDIANES", "", "ambar"]];
      if (!DENDRO.local.credencial()) return [...filas, ["", "▒ SELLADO · REQUIERE CREDENCIAL", "arma"]];
      for (const g of estado.myth.guardianes) {
        filas.push([MAYUS(g.nombre).slice(0, 14), g.caido ? `CAÍDO EN ${DENDRO.tau.instante(g.cae)}` : "EN PIE", g.caido ? "arma" : "tierra"]);
      }
      return filas;
    }

    function escribirFicha(caja, t) {
      const filas = dibujarFicha(caja, t);
      const barraEn = filas.length;
      if (t.raiz) filas.push(...filasGuardianes());
      filas.forEach(([etiqueta, valor, color], i) => {
        if (i >= caja.alto - 1) return;
        caja.escribir(1, i, etiqueta, "textoTenue");
        caja.escribir(COLUMNA_VALOR, i, valor, color);
        if (etiqueta === "FIRMA ω" && t.magia === "Inestable" && !t.raiz) campoOmega = { region: caja, x: COLUMNA_VALOR, y: i };
      });
      return t.raiz ? barraEn - 1 : Math.min(barraEn, caja.alto - 1);   // fila de la barra
    }

    function dibujar(reg) {
      const t = tierra();
      const ancho = reg.ancho >= 80;
      campoOmega = null;
      const altoLinea = ancho ? 8 : 7;
      if (ancho) {
        const anchoLista = 22, anchoFicha = 48;
        dibujarLista(reg.caja(0, 0, anchoLista, reg.alto - altoLinea, { titulo: "RAMAS", doble: false }));
        zonaGlobo = reg.region(anchoLista, 0, reg.ancho - anchoLista - anchoFicha, reg.alto - altoLinea);
        zonaGlobo.centrar(0, rotulo(t), "ambar");
        const ficha = reg.caja(reg.ancho - anchoFicha, 0, anchoFicha, reg.alto - altoLinea, { titulo: t.nombrada || t.raiz ? "EXPEDIENTE" : "FICHA BREVE" });
        const usadas = escribirFicha(ficha, t);
        zonaGlobo.barra = { region: ficha, y: usadas };
      } else {
        C.selector(reg, 0, rotulo(t));
        const altoGlobo = Math.floor((reg.alto - 1 - altoLinea) * 0.36);
        zonaGlobo = reg.region(0, 1, reg.ancho, altoGlobo);
        const ficha = reg.caja(0, 1 + altoGlobo, reg.ancho, reg.alto - 1 - altoGlobo - altoLinea, { titulo: t.nombrada || t.raiz ? "EXPEDIENTE" : "FICHA BREVE" });
        const usadas = escribirFicha(ficha, t);
        zonaGlobo.barra = { region: ficha, y: usadas };
      }
      zonaLinea = reg.caja(0, reg.alto - altoLinea, reg.ancho, altoLinea, { titulo: "LÍNEA TEMPORAL", doble: false });
      const ev = eventoActual();
      if (ev) {
        const n = eventos().indexOf(ev) + 1;
        zonaLinea.escribir(1, zonaLinea.alto - 2, `${DENDRO.tau.instante(ev.instante)} [${ev.tipo}] (${n}/${eventos().length})`, COLOR_TIPO[ev.tipo]);
        zonaLinea.escribir(1, zonaLinea.alto - 1, ev.texto.slice(0, zonaLinea.ancho - 2), "texto");
      } else {
        zonaLinea.escribir(1, zonaLinea.alto - 1, "SIN EVENTOS REGISTRADOS PARA ESTA RAMA", "textoTenue");
      }
      if (ancho) zonaLinea.derecha(zonaLinea.alto - 2, "MAYÚS+←→ EVENTOS ", "textoTenue");
    }

    // Posición en el eje (de inicioAlerta al colapso) de un instante; x0 y x1 en celdas.
    function eje(x0, x1) {
      const { desde, hasta } = estado.ejes;
      return (ms) => x0 + ((x1 - x0) * Math.max(0, Math.min(hasta, ms) - desde)) / (hasta - desde);
    }

    function lineaTemporal(v) {
      const { desde, hasta } = estado.ejes;
      const x0 = 1, x1 = v.ancho - 1, y = 1.6, px = eje(x0, x1);
      const ahora = Math.max(desde, Math.min(hasta, estado.instante));
      v.linea(x0, y, x1, y, "ambarTenue");
      // Marcas cada 7 ciclos con su ciclo τ
      const semana = 7 * DENDRO.tau.ciclo();
      for (let ms = desde; ms <= hasta; ms += semana) {
        v.linea(px(ms), y - 0.3, px(ms), y + 0.3, "ambarTenue");
        v.texto(px(ms), y + 0.4, String(DENDRO.tau.partes(ms).ciclo), "textoTenue", { tam: 0.8, alinear: "center" });
      }
      // Futuro rayado
      if (ahora < hasta) {
        for (let x = px(ahora) + 0.6; x < x1; x += 1.2) v.linea(x, y - 0.9, x + 0.8, y + 0.0, "ambarTenue", { alfa: 0.35 });
        v.texto((px(ahora) + x1) / 2, y - 1.5, "[DATOS NO DISPONIBLES]", "textoTenue", { tam: 0.8, alinear: "center" });
      }
      v.linea(px(ahora), y - 1.2, px(ahora), y + 0.4, "ambar", { grosor: 1.6 });
      v.texto(px(ahora), y - 1.3, "AHORA", "ambar", { tam: 0.8, alinear: "center", base: "bottom" });
      const actual = eventoActual();
      for (const ev of eventos()) {
        const x = px(ev.instante), resaltado = ev === actual;
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
      if (b && b.y < b.region.alto) {
        // En MYTH, la barra de cohesión va junto a su lectura; en las demás, bajo la estabilidad.
        const x = t.raiz ? COLUMNA_VALOR + 7 : COLUMNA_VALOR, y = t.raiz ? Math.floor(b.y) + 0.2 : b.y + 0.2;
        C.barraEstabilidad(b.region.vectores(), x, y, Math.min(t.raiz ? 16 : 20, b.region.ancho - x - 2), barra(t));
      }

      // En las tierras inestables, la ω no se deja leer: los dígitos oscilan (decorativo).
      if (campoOmega) {
        const rng = DENDRO.prng.crear(t.codigo, Math.floor(ahora / 90));
        const texto = t.omega.toFixed(4).split("").map((c, i) => (i > 1 && DIGITOS.includes(c) ? DIGITOS[Math.floor(rng() * 10)] : c)).join("");
        campoOmega.region.vectores().texto(campoOmega.x, campoOmega.y, texto, "tierra", { tam: 1 });
      }
      lineaTemporal(zonaLinea.vectores());
    }

    function cambiarTierra(paso) {
      const i = ids.indexOf(ui.tierraSeleccionada);
      ui.tierraSeleccionada = i < 0 ? ids[0] : ids[(i + paso + ids.length) % ids.length];
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
      actualizar(nuevo) {
        // El evento resaltado sigue siendo el mismo aunque lleguen otros nuevos.
        const resaltado = evento >= 0 ? eventoActual() : null;
        estado = nuevo;
        if (resaltado) evento = eventos().findIndex((e) => e.instante === resaltado.instante && e.texto === resaltado.texto);
      },
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
        if (reg.ancho >= 80 && punto.x < 22 && punto.y >= 1 && primeraLista + Math.floor(punto.y) - 1 < ids.length) {
          ui.tierraSeleccionada = ids[primeraLista + Math.floor(punto.y) - 1];
          evento = -1;
          ctx.redibujar();
          return;
        }
        // En la línea temporal: el evento más cercano en el eje.
        if (zonaLinea && punto.y >= zonaLinea.y - reg.y) {
          const lista = eventos();
          if (!lista.length) return;
          const x = punto.x - (zonaLinea.x - reg.x);
          const px = eje(1, zonaLinea.ancho - 1);
          let mejor = 0;
          lista.forEach((e2, i) => { if (Math.abs(px(e2.instante) - x) < Math.abs(px(lista[mejor].instante) - x)) mejor = i; });
          evento = mejor;
          ctx.redibujar();
        }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "expediente", tecla: "5", titulo: "EXPEDIENTE", tituloCorto: "EXP", crear });
})(window.DENDRO = window.DENDRO || {});
