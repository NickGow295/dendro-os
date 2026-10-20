// V8 ARCHIVO (02-diseno.md §6): carpetas MANUALES, PROCEDIMIENTOS y CLASIFICADOS, con la cabecera de
// documentación interna. Los clasificados piden credencial de dirección (y solo existen desde su
// emisión); el [CLASIFICADO NEGRO] depende además de la orden oculta `semilla`. Algunas líneas de
// documentos visibles solo se leen con credencial.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const CARPETAS = ["MANUALES", "PROCEDIMIENTOS", "CLASIFICADOS"];
  const ALTO_CABECERA = 5;

  function crear(ctx) {
    let estado = ctx.estado;
    let carpeta = 0, elegido = 0, desplazado = 0, lista = null, lector = null, pestanas = [];

    const credencial = () => DENDRO.local.credencial();
    const docs = () => estado.archivo.filter((d) => d.carpeta === CARPETAS[carpeta]);
    const actual = () => docs()[elegido];
    const abierto = (d) => (!d.clasificado || credencial()) && (!d.desbloqueo || DENDRO.local.desbloqueado(d.desbloqueo));
    const motivoSello = (d) => (d.desbloqueo && !DENDRO.local.desbloqueado(d.desbloqueo) ? "REQUIERE AUTORIZACIÓN DE NIVEL NEGRO" : "REQUIERE CREDENCIAL DE DIRECCIÓN");
    const texto = (l) => (typeof l === "string" ? l : credencial() ? l.direccion : l.sello);
    const enTau = (x) => `τ ${x.toFixed(3)}`;

    function dibujarPestanas(reg) {
      pestanas = [];
      let x = 1;
      CARPETAS.forEach((c, i) => {
        const etiqueta = reg.ancho >= 60 ? c : c.slice(0, 4);
        const fin = reg.escribir(x, 0, ` ${etiqueta} `, i === carpeta ? "ambar" : "textoTenue", i === carpeta ? { inverso: true } : null);
        pestanas.push({ desde: x, hasta: fin, i });
        x = fin + 2;
      });
      reg.derecha(0, "←→ CARPETA · ↑↓ DOCUMENTO ", "textoTenue");
    }

    function filaLista(d, ancho) {
      if (!abierto(d)) return `${d.codigo} · ░░░░░░░░░░ · SELLADO`;
      return `${d.codigo.padEnd(12)} ${d.titulo}`.slice(0, ancho - 7).padEnd(ancho - 7) + ` R.${String(d.rev).padStart(2)}`;
    }

    function dibujarCabecera(caja, d) {
      caja.escribir(1, 0, "DENDRO · ESTACIÓN RAÍZ", "ambar");
      caja.derecha(0, `${d.codigo} · REV. ${d.rev} `, "ambar");
      caja.escribir(1, 1, d.titulo.slice(0, caja.ancho - 2), "texto");
      const fechas = `EMITIDO ${enTau(d.emitido)}${d.revisado !== undefined ? ` · REVISADO ${enTau(d.revisado)}` : ""} · CLASIFICACIÓN: ${d.clasificacion}`;
      C.partir(fechas, caja.ancho - 2).slice(0, 2).forEach((l, i) => caja.escribir(1, 2 + i, l, "textoTenue"));
      caja.escribir(1, ALTO_CABECERA - 1, `APROBADO: ${d.aprobado.join(" · ")}`.slice(0, caja.ancho - 2), "textoTenue");
      caja.rellenar(1, ALTO_CABECERA, caja.ancho - 2, 1, "─", "ambarTenue");
    }

    function dibujar(reg) {
      const ancho = reg.ancho >= 80, lista0 = docs();
      dibujarPestanas(reg);
      elegido = Math.max(0, Math.min(elegido, lista0.length - 1));
      const d = actual();
      if (ancho) {
        const anchoLista = 40;
        lista = reg.caja(0, 1, anchoLista, reg.alto - 1, { titulo: `ARCHIVO · ${CARPETAS[carpeta]}` });
        lector = reg.caja(anchoLista, 1, reg.ancho - anchoLista, reg.alto - 1, { titulo: d ? d.codigo : "—", doble: false });
      } else {
        const altoLista = Math.min(lista0.length + 2, 9);
        lista = reg.caja(0, 1, reg.ancho, altoLista, { titulo: CARPETAS[carpeta] });
        lector = reg.caja(0, 1 + altoLista, reg.ancho, reg.alto - 1 - altoLista, { titulo: d ? d.codigo : "—", doble: false });
      }

      if (!lista0.length) { lista.centrar(1, "CARPETA VACÍA", "textoTenue"); return; }
      const primera = C.desplazamiento(0, elegido, lista.alto);
      lista0.slice(primera, primera + lista.alto).forEach((doc, fila) => {
        const sel = primera + fila === elegido, estilo = sel ? { inverso: true } : null;
        if (sel) lista.rellenar(0, fila, lista.ancho, 1, " ", "ambar", estilo);
        lista.escribir(1, fila, filaLista(doc, lista.ancho), sel ? "ambar" : abierto(doc) ? "texto" : "arma", estilo);
      });

      if (!abierto(d)) {
        lector.centrar(Math.floor(lector.alto / 2) + 2, motivoSello(d), "textoTenue");
        return;
      }
      dibujarCabecera(lector, d);
      const anchoTexto = lector.ancho - 3;
      const lineas = d.texto.flatMap((l) => {
        const t = texto(l), fragmento = typeof l !== "string";
        const color = fragmento ? (credencial() ? "ambar" : "arma") : /^[0-9A-ZÁÉÍÓÚÑ .·«»()\-[\]]+$/.test(t) && t.trim() ? "ambar" : "texto";
        return (t.length > anchoTexto ? C.partir(t, anchoTexto) : [t]).map((x) => ({ t: x, c: color }));
      });
      const y0 = ALTO_CABECERA + 1, alto = lector.alto - y0 - 1;
      desplazado = Math.max(0, Math.min(desplazado, lineas.length - alto));
      lineas.slice(desplazado, desplazado + alto).forEach((l, i) => lector.escribir(1, y0 + i, l.t, l.c));
      if (lineas.length > alto) lector.derecha(lector.alto - 1, `MAYÚS+↑↓ ${desplazado + 1}-${Math.min(lineas.length, desplazado + alto)}/${lineas.length} `, "textoTenue");
    }

    // Sello rojo en los clasificados; el documento sellado, un gran ACCESO DENEGADO.
    function vectores() {
      if (!lector) return;
      const v = lector.vectores(), d = actual();
      if (!d) return;
      if (!abierto(d)) {
        v.texto(v.ancho / 2, v.alto / 2 - 2.5, "ACCESO DENEGADO", "arma", { tam: Math.min(2.6, v.ancho / 9), alinear: "center" });
        return;
      }
      if (d.clasificado || d.desbloqueo) {
        const ancho = 13, x = v.ancho - ancho - 1, y = ALTO_CABECERA + 1.4;
        v.poligono([[x, y], [x + ancho, y], [x + ancho, y + 1.8], [x, y + 1.8]], "arma", { alfa: 0.6, grosor: 2 });
        v.texto(x + ancho / 2, y + 0.35, d.clasificacion === "NEGRO" ? "NIVEL NEGRO" : "CLASIFICADO", "arma", { tam: 1.1, alinear: "center", alfa: 0.75 });
      }
    }

    function elegir(paso) {
      const n = docs().length;
      if (!n) return;
      elegido = (elegido + paso + n) % n;
      desplazado = 0;
      ctx.redibujar();
    }

    function cambiarCarpeta(i) {
      carpeta = (i + CARPETAS.length) % CARPETAS.length;
      elegido = 0; desplazado = 0;
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
      // Llegan clasificados nuevos y revisiones; la lectura sigue en el mismo documento.
      actualizar(nuevo) {
        const abiertoAntes = actual();
        estado = nuevo;
        if (abiertoAntes) elegido = Math.max(0, docs().findIndex((d) => d.codigo === abiertoAntes.codigo));
      },
      tecla(ev) {
        if ((ev.key === "ArrowUp" || ev.key === "ArrowDown") && ev.shiftKey) { ev.preventDefault(); desplazar(ev.key === "ArrowDown" ? 1 : -1); }
        else if (ev.key === "ArrowUp") { ev.preventDefault(); elegir(-1); }
        else if (ev.key === "ArrowDown") { ev.preventDefault(); elegir(1); }
        else if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") { ev.preventDefault(); cambiarCarpeta(carpeta + (ev.key === "ArrowRight" ? 1 : -1)); }
        else if (ev.key === "PageDown") { ev.preventDefault(); desplazar(10); }
        else if (ev.key === "PageUp") { ev.preventDefault(); desplazar(-10); }
      },
      toque(punto) {
        if (!punto || !lista) return;
        if (punto.y < 1) {
          const p = pestanas.find((t) => punto.x >= t.desde && punto.x < t.hasta);
          if (p) cambiarCarpeta(p.i);
          return;
        }
        const base = ctx.region();
        const fila = Math.floor(punto.y) - (lista.y - base.y);
        const enLista = punto.x >= lista.x - base.x && punto.x < lista.x - base.x + lista.ancho;
        const primera = C.desplazamiento(0, elegido, lista.alto);
        if (enLista && fila >= 0 && fila < lista.alto && primera + fila < docs().length) {
          elegido = primera + fila; desplazado = 0; ctx.redibujar();
        } else if (lector) {
          desplazar(punto.y > lector.y - base.y + lector.alto / 2 ? 6 : -6);
        }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "archivo", tecla: "8", titulo: "ARCHIVO", tituloCorto: "ARC", crear });
})(window.DENDRO = window.DENDRO || {});
