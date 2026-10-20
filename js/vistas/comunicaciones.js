// V7 COMUNICACIONES (02-diseno.md §6): bandeja de mensajes que llegan según el instante.
// Los no leídos parpadean; los leídos se recuerdan en el navegador (DENDRO.local).
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const BARRAS_SENAL = 5;

  function crear(ctx) {
    let estado = ctx.estado;
    const ordenar = () => [...estado.mensajesDisponibles].sort((a, b) => b.instante - a.instante);
    let mensajes = ordenar();
    const primeroSinLeer = mensajes.findIndex((m) => !DENDRO.local.leido(m.id));
    let elegido = primeroSinLeer >= 0 ? primeroSinLeer : 0, primera = 0, desplazado = 0;
    let bandeja = null, lector = null, lineasCuerpo = [];

    function dibujar(reg) {
      const ancho = reg.ancho >= 80;
      const actual = mensajes[elegido];
      if (actual) DENDRO.local.marcarLeido(actual.id);
      const sinLeer = mensajes.filter((m) => !DENDRO.local.leido(m.id)).length;

      if (ancho) {
        const anchoBandeja = 46;
        bandeja = reg.caja(0, 0, anchoBandeja, reg.alto, { titulo: `BANDEJA · ${sinLeer} SIN LEER` });
        lector = reg.caja(anchoBandeja, 0, reg.ancho - anchoBandeja, reg.alto, { titulo: "MENSAJE", doble: false });
      } else {
        const altoBandeja = Math.min(mensajes.length + 2, 10);
        bandeja = reg.caja(0, 0, reg.ancho, altoBandeja, { titulo: `BANDEJA · ${sinLeer} SIN LEER` });
        lector = reg.caja(0, altoBandeja, reg.ancho, reg.alto - altoBandeja, { titulo: "MENSAJE", doble: false });
      }

      if (!mensajes.length) {
        bandeja.centrar(1, "SIN COMUNICACIONES", "textoTenue");
        return;
      }
      primera = C.desplazamiento(primera, elegido, bandeja.alto);
      for (let fila = 0; fila < bandeja.alto; fila++) {
        const m = mensajes[primera + fila];
        if (!m) break;
        const sel = primera + fila === elegido, estilo = sel ? { inverso: true } : null;
        if (sel) bandeja.rellenar(0, fila, bandeja.ancho, 1, " ", "ambar", estilo);
        const leido = DENDRO.local.leido(m.id) && !sel;
        bandeja.escribir(0, fila, leido || sel ? " " : "●", "ambar", leido || sel ? estilo : { parpadeo: true });
        const de = m.de.replace(/\s*\(.*\)$/, "").replace(/^AGENTE |^DIRECTORA AMARANTA /, "");
        const texto = `${DENDRO.tau.corto(m.instante)} ${de} · ${m.asunto.toLocaleUpperCase("es")}`;
        bandeja.escribir(2, fila, texto.slice(0, bandeja.ancho - 3), sel ? "ambar" : leido ? "textoTenue" : "texto", estilo);
      }

      if (!actual) return;
      lector.escribir(1, 0, "DE", "textoTenue");
      lector.escribir(9, 0, actual.de, "ambar");
      lector.escribir(1, 1, "EMITIDO", "textoTenue");
      lector.escribir(9, 1, DENDRO.tau.instante(actual.instante), "texto");
      lector.escribir(1, 2, "ASUNTO", "textoTenue");
      lector.escribir(9, 2, actual.asunto.toLocaleUpperCase("es"), "texto");
      lector.rellenar(1, 3, lector.ancho - 2, 1, "─", "ambarTenue");
      lineasCuerpo = actual.cuerpo.flatMap((p) => (p ? C.partir(p, lector.ancho - 3) : [""]));
      const alto = lector.alto - 5;
      desplazado = Math.max(0, Math.min(desplazado, lineasCuerpo.length - alto));
      lineasCuerpo.slice(desplazado, desplazado + alto).forEach((l, i) => lector.escribir(1, 5 + i, l, "texto"));
      if (lineasCuerpo.length > alto) lector.derecha(lector.alto - 1, `MAYÚS+↑↓ ${desplazado + 1}-${Math.min(lineasCuerpo.length, desplazado + alto)}/${lineasCuerpo.length} `, "textoTenue");
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
      if (!mensajes.length) return;
      elegido = Math.max(0, Math.min(mensajes.length - 1, elegido + paso));
      desplazado = 0;
      ctx.redibujar();
    }

    return {
      animada: true,
      dibujar,
      vectores,
      actualizar(nuevo) {
        const abierto = mensajes[elegido];
        estado = nuevo;
        mensajes = ordenar();
        if (abierto) elegido = Math.max(0, mensajes.findIndex((m) => m.id === abierto.id));
      },
      tecla(ev) {
        if ((ev.key === "ArrowUp" || ev.key === "ArrowDown") && ev.shiftKey) {
          ev.preventDefault();
          desplazado += ev.key === "ArrowDown" ? 1 : -1;
          ctx.redibujar();
        } else if (ev.key === "ArrowUp") { ev.preventDefault(); elegir(-1); }
        else if (ev.key === "ArrowDown") { ev.preventDefault(); elegir(1); }
        else if (ev.key === "PageDown" || ev.key === "PageUp") {
          ev.preventDefault();
          desplazado += (ev.key === "PageDown" ? 1 : -1) * Math.max(1, (lector ? lector.alto : 10) - 6);
          ctx.redibujar();
        }
      },
      toque(punto) {
        if (!punto || !bandeja) return;
        const base = ctx.region();
        const fila = Math.floor(punto.y) - (bandeja.y - base.y);
        const dentroBandeja = punto.x >= bandeja.x - base.x && punto.x < bandeja.x - base.x + bandeja.ancho;
        if (dentroBandeja && fila >= 0 && fila < bandeja.alto && primera + fila < mensajes.length) {
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
