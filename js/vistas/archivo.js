// V8 ARCHIVO (02-diseno.md §6): documentos con niveles de autorización decorativos. El
// [CLASIFICADO NEGRO] queda sellado hasta que la terminal recibe la orden oculta `semilla`.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;

  function crear(ctx) {
    const { estado } = ctx;
    const docs = estado.archivo;
    let elegido = 0, desplazado = 0, lista = null, lector = null;

    const abierto = (d) => !d.desbloqueo || DENDRO.local.desbloqueado(d.desbloqueo);
    const colorNivel = (d) => (d.nivel === "NEGRO" ? "arma" : Number(d.nivel) >= 3 ? "ambar" : "textoTenue");

    function dibujar(reg) {
      const ancho = reg.ancho >= 80;
      if (ancho) {
        const anchoLista = 40;
        lista = reg.caja(0, 0, anchoLista, reg.alto, { titulo: "ARCHIVO · ESTACIÓN RAÍZ" });
        lector = reg.caja(anchoLista, 0, reg.ancho - anchoLista, reg.alto, { titulo: docs[elegido].id, doble: false });
      } else {
        lista = reg.caja(0, 0, reg.ancho, docs.length + 2, { titulo: "ARCHIVO" });
        lector = reg.caja(0, docs.length + 2, reg.ancho, reg.alto - docs.length - 2, { titulo: docs[elegido].id, doble: false });
      }

      docs.forEach((d, i) => {
        const sel = i === elegido, estilo = sel ? { inverso: true } : null;
        if (sel) lista.rellenar(0, i, lista.ancho, 1, " ", "ambar", estilo);
        const nivel = `NIVEL ${d.nivel}`.padEnd(12);
        lista.escribir(1, i, nivel, sel ? "ambar" : colorNivel(d), estilo);
        const titulo = abierto(d) ? d.titulo : "▓▓▓▓▓▓▓▓▓▓▓▓▓▓";
        lista.escribir(13, i, titulo.slice(0, lista.ancho - 14), sel ? "ambar" : abierto(d) ? "texto" : "arma", estilo);
      });
      if (ancho) lista.escribir(1, lista.alto - 1, "↑↓ ELEGIR · MAYÚS+↑↓ LEER", "textoTenue");

      const d = docs[elegido];
      if (!abierto(d)) {
        lector.centrar(Math.floor(lector.alto / 2) + 2, "REQUIERE AUTORIZACIÓN DE NIVEL NEGRO", "textoTenue");
        return;
      }
      const lineas = d.texto.flatMap((l) => (l.length > lector.ancho - 3 ? C.partir(l, lector.ancho - 3) : [l]));
      const alto = lector.alto - 1;
      desplazado = Math.max(0, Math.min(desplazado, lineas.length - alto));
      lineas.slice(desplazado, desplazado + alto).forEach((l, i) => {
        const titulo = desplazado + i === 0;
        lector.escribir(1, i, l, titulo ? "ambar" : /^[0-9A-ZÁÉÍÓÚÑ .·-]+$/.test(l) && l.trim() ? "ambar" : "texto");
      });
      if (lineas.length > alto) lector.derecha(lector.alto - 1, `${desplazado + 1}-${Math.min(lineas.length, desplazado + alto)}/${lineas.length} `, "textoTenue");
    }

    // Sello en rojo para los niveles altos; el documento sellado, un gran ACCESO DENEGADO.
    function vectores() {
      if (!lector) return;
      const v = lector.vectores(), d = docs[elegido];
      if (!abierto(d)) {
        v.texto(v.ancho / 2, v.alto / 2 - 2.5, "ACCESO DENEGADO", "arma", { tam: Math.min(2.6, v.ancho / 9), alinear: "center" });
        return;
      }
      if (d.nivel === "NEGRO" || Number(d.nivel) >= 3) {
        const ancho = 13, x = v.ancho - ancho - 1, y = 0.4;
        v.poligono([[x, y], [x + ancho, y], [x + ancho, y + 1.8], [x, y + 1.8]], "arma", { alfa: 0.6, grosor: 2 });
        v.texto(x + ancho / 2, y + 0.35, d.nivel === "NEGRO" ? "NIVEL NEGRO" : "CLASIFICADO", "arma", { tam: 1.1, alinear: "center", alfa: 0.75 });
      }
    }

    function elegir(paso) {
      elegido = (elegido + paso + docs.length) % docs.length;
      desplazado = 0;
      ctx.redibujar();
    }

    function desplazar(paso) {
      desplazado += paso;
      ctx.redibujar();
    }

    return {
      animada: false,
      dibujar,
      vectores,
      tecla(ev) {
        if ((ev.key === "ArrowUp" || ev.key === "ArrowDown") && ev.shiftKey) { ev.preventDefault(); desplazar(ev.key === "ArrowDown" ? 1 : -1); }
        else if (ev.key === "ArrowUp") { ev.preventDefault(); elegir(-1); }
        else if (ev.key === "ArrowDown") { ev.preventDefault(); elegir(1); }
        else if (ev.key === "PageDown") { ev.preventDefault(); desplazar(10); }
        else if (ev.key === "PageUp") { ev.preventDefault(); desplazar(-10); }
      },
      toque(punto) {
        if (!punto || !lista) return;
        const base = ctx.region();
        const fila = Math.floor(punto.y) - (lista.y - base.y);
        const enLista = punto.x >= lista.x - base.x && punto.x < lista.x - base.x + lista.ancho;
        if (enLista && fila >= 0 && fila < docs.length) {
          elegido = fila; desplazado = 0; ctx.redibujar();
        } else if (lector) {
          desplazar(punto.y > lector.y - base.y + lector.alto / 2 ? 6 : -6);
        }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "archivo", tecla: "8", titulo: "ARCHIVO", tituloCorto: "ARC", crear });
})(window.DENDRO = window.DENDRO || {});
