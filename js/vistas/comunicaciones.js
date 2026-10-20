// V7 COMUNICACIONES (02-diseno.md §6): dos canales que se contradicen. GENERAL, visible; DIRECCIÓN,
// sellado sin credencial salvo los mensajes visibleSinCredencial. Los no leídos parpadean y los
// leídos se recuerdan en el navegador (DENDRO.local). Con el módulo degradado, algunas líneas llegan corruptas.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const BARRAS_SENAL = 5;
  const CANALES = [
    { id: "general", titulo: "GENERAL", corto: "GEN" },
    { id: "direccion", titulo: "DIRECCIÓN", corto: "DIR" },
  ];
  const CORRUPCION = "░▒▓";

  function crear(ctx) {
    let estado = ctx.estado;
    let canal = 0, elegido = 0, primera = 0, desplazado = 0;
    let pestanas = [], bandeja = null, lector = null;

    const credencial = () => DENDRO.local.credencial();
    const legible = (m) => m.canal === "general" || credencial() || m.visibleSinCredencial;
    const delCanal = (i) => estado.mensajes.filter((m) => m.canal === CANALES[i].id).sort((a, b) => b.instante - a.instante);
    const visibles = (i) => delCanal(i).filter(legible);
    const sinLeer = (i) => visibles(i).filter((m) => !DENDRO.local.leido(m.id)).length;

    // Al abrir: el canal con algo sin leer (general primero) y su primer mensaje sin leer.
    (function elegirInicio() {
      const i = CANALES.findIndex((c, k) => sinLeer(k) > 0);
      canal = i >= 0 ? i : 0;
      const k = visibles(canal).findIndex((m) => !DENDRO.local.leido(m.id));
      elegido = Math.max(0, k);
    })();

    function remitente(m) { return m.de || "(SIN REMITENTE)"; }
    function asunto(m) { return m.asunto ? m.asunto.toLocaleUpperCase("es") : "(SIN ASUNTO)"; }

    // Corrupción sembrada por el día y el mensaje: la misma línea se ve igual todo el día.
    function corromper(m, linea, i) {
      if (!estado.modulosCaidos.includes("comunicaciones") || !linea) return linea;
      const rng = DENDRO.prng.crear(estado.dia, "comunicaciones", m.id, i);
      if (rng() > estado.intensidad * 0.3) return linea;
      return Array.from(linea).map((ch) => (ch !== " " && rng() < 0.35 ? CORRUPCION[Math.floor(rng() * CORRUPCION.length)] : ch)).join("");
    }

    function dibujarPestanas(reg) {
      pestanas = [];
      let x = 1;
      CANALES.forEach((c, i) => {
        const n = sinLeer(i), activa = i === canal;
        const sello = c.id === "direccion" && !credencial() ? " ▒" : "";
        const texto = ` ${reg.ancho >= 60 ? c.titulo : c.corto}${n ? ` · ${n}` : ""}${sello} `;
        const fin = reg.escribir(x, 0, texto, activa ? "ambar" : n ? "texto" : "textoTenue", activa ? { inverso: true } : n ? { parpadeo: true } : null);
        pestanas.push({ desde: x, hasta: fin, i });
        x = fin + 2;
      });
      reg.derecha(0, "TAB CANAL · ↑↓ MENSAJE ", "textoTenue");
    }

    function dibujarSellado(caja, cifrados) {
      const medio = Math.floor(caja.alto / 2);
      caja.centrar(medio - 2, "CANAL DE DIRECCIÓN · SELLADO", "arma");
      caja.centrar(medio, "REQUIERE CREDENCIAL DE DIRECCIÓN", "textoTenue");
      if (cifrados) caja.centrar(medio + 2, `▒ ${cifrados} ${cifrados === 1 ? "MENSAJE CIFRADO" : "MENSAJES CIFRADOS"}`, "ambar");
    }

    function dibujar(reg) {
      const ancho = reg.ancho >= 80;
      const lista = visibles(canal);
      const cifrados = delCanal(canal).length - lista.length;
      elegido = Math.max(0, Math.min(elegido, lista.length - 1));
      const actual = lista[elegido];
      if (actual) DENDRO.local.marcarLeido(actual.id);
      dibujarPestanas(reg);
      const titulo = `${CANALES[canal].titulo} · ${sinLeer(canal)} SIN LEER`;

      if (ancho) {
        const anchoBandeja = 46;
        bandeja = reg.caja(0, 1, anchoBandeja, reg.alto - 1, { titulo });
        lector = reg.caja(anchoBandeja, 1, reg.ancho - anchoBandeja, reg.alto - 1, { titulo: "MENSAJE", doble: false });
      } else {
        const altoBandeja = Math.min(lista.length + (cifrados ? 1 : 0) + 2, 9);
        bandeja = reg.caja(0, 1, reg.ancho, Math.max(4, altoBandeja), { titulo });
        lector = reg.caja(0, 1 + bandeja.alto + 2, reg.ancho, reg.alto - 3 - bandeja.alto, { titulo: "MENSAJE", doble: false });
      }

      if (!lista.length && !cifrados) bandeja.centrar(1, "SIN COMUNICACIONES", "textoTenue");
      primera = C.desplazamiento(primera, elegido, bandeja.alto - (cifrados ? 1 : 0));
      for (let fila = 0; fila < bandeja.alto - (cifrados ? 1 : 0); fila++) {
        const m = lista[primera + fila];
        if (!m) break;
        const sel = primera + fila === elegido, estilo = sel ? { inverso: true } : null;
        if (sel) bandeja.rellenar(0, fila, bandeja.ancho, 1, " ", "ambar", estilo);
        const leido = DENDRO.local.leido(m.id) && !sel;
        bandeja.escribir(0, fila, leido || sel ? " " : "●", "ambar", leido || sel ? estilo : { parpadeo: true });
        const de = remitente(m).replace(/\s*\(.*\)$/, "").replace(/\s*·.*$/, "").replace(/^(AGENTE|ANALISTA|DIRECTORA AMARANTA) /, "");
        const texto = `${DENDRO.tau.corto(m.instante)} ${de} · ${asunto(m)}`;
        bandeja.escribir(2, fila, texto.slice(0, bandeja.ancho - 3), sel ? "ambar" : leido ? "textoTenue" : "texto", estilo);
      }
      if (cifrados) bandeja.escribir(2, bandeja.alto - 1, `▒ ${cifrados} CIFRADOS`, "arma");

      if (!actual) {
        if (cifrados) dibujarSellado(lector, cifrados);
        return;
      }
      lector.escribir(1, 0, "DE", "textoTenue");
      lector.escribir(9, 0, remitente(actual).slice(0, lector.ancho - 20), actual.de ? "ambar" : "arma");
      lector.escribir(1, 1, "EMITIDO", "textoTenue");
      lector.escribir(9, 1, DENDRO.tau.instante(actual.instante), "texto");
      lector.escribir(1, 2, "ASUNTO", "textoTenue");
      lector.escribir(9, 2, asunto(actual).slice(0, lector.ancho - 10), "texto");
      lector.rellenar(1, 3, lector.ancho - 2, 1, "─", "ambarTenue");
      const lineas = actual.cuerpo.flatMap((p, i) => {
        if (!p) return [{ t: "", c: "texto" }];
        if (p.startsWith("──")) return [{ t: p.slice(0, lector.ancho - 3), c: "ambarTenue" }];
        return C.partir(corromper(actual, p, i), lector.ancho - 3).map((t) => ({ t, c: "texto" }));
      });
      const alto = lector.alto - 5;
      desplazado = Math.max(0, Math.min(desplazado, lineas.length - alto));
      lineas.slice(desplazado, desplazado + alto).forEach((l, i) => lector.escribir(1, 5 + i, l.t, l.c));
      if (lineas.length > alto) lector.derecha(lector.alto - 1, `MAYÚS+↑↓ ${desplazado + 1}-${Math.min(lineas.length, desplazado + alto)}/${lineas.length} `, "textoTenue");
    }

    // Medidor de señal de la portadora: pierde barras con la intensidad del día.
    function vectores(raiz, ahora) {
      if (!lector) return;
      const v = lector.vectores();
      const fuerza = Math.max(1, BARRAS_SENAL - Math.round(estado.intensidad * 4));
      const temblor = DENDRO.prng.crear(estado.dia, "senal", Math.floor(ahora / 400))() < estado.intensidad * 0.5 ? 1 : 0;
      const x0 = v.ancho - 9;
      v.texto(x0 - 0.5, 0.1, "SEÑAL", "textoTenue", { tam: 0.8, alinear: "right" });
      for (let i = 0; i < BARRAS_SENAL; i++) {
        const activa = i < fuerza - temblor, h = 0.35 + i * 0.22;
        v.poligono([[x0 + i * 1.4, 1.1 - h], [x0 + i * 1.4 + 0.9, 1.1 - h], [x0 + i * 1.4 + 0.9, 1.1], [x0 + i * 1.4, 1.1]],
          activa ? (fuerza <= 2 ? "arma" : "ambar") : "ambarTenue", { relleno: activa ? (fuerza <= 2 ? "arma" : "ambar") : null, rellenoAlfa: 0.7, alfa: activa ? 1 : 0.5 });
      }
    }

    function elegir(paso) {
      const n = visibles(canal).length;
      if (!n) return;
      elegido = Math.max(0, Math.min(n - 1, elegido + paso));
      desplazado = 0;
      ctx.redibujar();
    }

    function cambiarCanal(i) {
      canal = (i + CANALES.length) % CANALES.length;
      const k = visibles(canal).findIndex((m) => !DENDRO.local.leido(m.id));
      elegido = Math.max(0, k);
      primera = 0; desplazado = 0;
      ctx.redibujar();
    }

    return {
      animada: true,
      usaTab: true,
      dibujar,
      vectores,
      actualizar(nuevo) {
        const abierto = visibles(canal)[elegido];
        estado = nuevo;
        if (abierto) elegido = Math.max(0, visibles(canal).findIndex((m) => m.id === abierto.id));
      },
      tecla(ev) {
        if ((ev.key === "ArrowUp" || ev.key === "ArrowDown") && ev.shiftKey) {
          ev.preventDefault();
          desplazado += ev.key === "ArrowDown" ? 1 : -1;
          ctx.redibujar();
        } else if (ev.key === "ArrowUp") { ev.preventDefault(); elegir(-1); }
        else if (ev.key === "ArrowDown") { ev.preventDefault(); elegir(1); }
        else if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") { ev.preventDefault(); cambiarCanal(canal + (ev.key === "ArrowRight" ? 1 : -1)); }
        else if (ev.key === "Tab") { ev.preventDefault(); cambiarCanal(canal + (ev.shiftKey ? -1 : 1)); }
        else if (ev.key === "PageDown" || ev.key === "PageUp") {
          ev.preventDefault();
          desplazado += (ev.key === "PageDown" ? 1 : -1) * Math.max(1, (lector ? lector.alto : 10) - 6);
          ctx.redibujar();
        }
      },
      toque(punto) {
        if (!punto || !bandeja) return;
        if (punto.y < 1) {
          const p = pestanas.find((t) => punto.x >= t.desde && punto.x < t.hasta);
          if (p) cambiarCanal(p.i);
          return;
        }
        const base = ctx.region();
        const fila = Math.floor(punto.y) - (bandeja.y - base.y);
        const dentroBandeja = punto.x >= bandeja.x - base.x && punto.x < bandeja.x - base.x + bandeja.ancho;
        if (dentroBandeja && fila >= 0 && fila < bandeja.alto && primera + fila < visibles(canal).length) {
          elegido = primera + fila;
          desplazado = 0;
          ctx.redibujar();
        } else if (lector) {
          // Mitad baja del lector: avanzar; mitad alta: retroceder.
          const medio = lector.y - base.y + lector.alto / 2;
          desplazado += punto.y > medio ? 4 : -4;
          ctx.redibujar();
        }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "comunicaciones", tecla: "7", titulo: "COMUNICACIONES", tituloCorto: "COM", crear });
})(window.DENDRO = window.DENDRO || {});
