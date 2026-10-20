// V6 REGISTRO (02-diseno.md §6): bitácora del sistema, del más reciente al más antiguo, con filtros
// por tipo y un histograma de eventos por día. Suma el registro local del operador (accesos y
// contenciones), que no forma parte de la cronología global.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { COLOR_TIPO } = C;
  const FILTROS = ["TODOS", "SISTEMA", "COLISIÓN", "HOSTIL", "CONTENCIÓN"];
  const ABREV = { "SISTEMA": "SIS", "COLISIÓN": "COL", "HOSTIL": "HOS", "CONTENCIÓN": "CNT" };
  const ALTO_HISTOGRAMA = 4, ALTO_DETALLE = 3;
  const ORIGEN = {
    fijo: "BITÁCORA DE LA DIRECCIÓN", pareja: "MONITOR DE CONVERGENCIA",
    ruido: "SISTEMA AUTOMÁTICO", local: "REGISTRO LOCAL DEL OPERADOR",
  };

  function crear(ctx) {
    const { estado } = ctx;
    const diaDe = (fecha) => { const c = estado.calendario.find((k) => k.fecha === fecha); return c ? c.dia : null; };
    const todas = [...estado.registro, ...DENDRO.local.entradas().map((e) => ({ ...e, dia: diaDe(e.fecha) }))]
      .sort((a, b) => (a.fecha + a.hora < b.fecha + b.hora ? 1 : -1));
    let filtro = 0, elegido = 0, primera = 0, visibles = 10, pestanas = [], lista = null, histograma = null;

    const filtradas = () => (filtro === 0 ? todas : todas.filter((e) => e.tipo === FILTROS[filtro]));

    function dibujar(reg) {
      const ancho = reg.ancho >= 80;
      // Pestañas de filtro con su cuenta
      pestanas = [];
      let x = 1;
      FILTROS.forEach((f, i) => {
        const n = i === 0 ? todas.length : todas.filter((e) => e.tipo === f).length;
        const texto = ancho ? ` ${f} ${n} ` : ` ${f.slice(0, 3)} ${n} `;
        const color = i === 0 ? "ambar" : COLOR_TIPO[f];
        const fin = reg.escribir(x, 0, texto, color, i === filtro ? { inverso: true } : null);
        pestanas.push({ desde: x, hasta: fin, i });
        x = fin + 1;
      });
      if (ancho) reg.derecha(0, "←→ FILTRO · ↑↓ ELEGIR ", "textoTenue");

      histograma = reg.region(0, 1, reg.ancho, ALTO_HISTOGRAMA);
      const y0 = 1 + ALTO_HISTOGRAMA;
      if (ancho) reg.escribir(1, y0, "FECHA      HORA     TIPO         EVENTO", "textoTenue");
      lista = reg.region(0, y0 + 1, reg.ancho, reg.alto - y0 - 1 - ALTO_DETALLE);
      visibles = lista.alto;

      const items = filtradas();
      elegido = Math.min(elegido, Math.max(0, items.length - 1));
      primera = C.desplazamiento(primera, elegido, visibles);
      for (let fila = 0; fila < visibles; fila++) {
        const e = items[primera + fila];
        if (!e) break;
        const sel = primera + fila === elegido, estilo = sel ? { inverso: true } : null;
        if (sel) lista.rellenar(0, fila, lista.ancho, 1, " ", "ambar", estilo);
        const marca = e.origen === "local" ? "◆" : " ";
        let cx = lista.escribir(1, fila, ancho ? `${e.fecha} ${e.hora} ` : `${e.fecha.slice(5)} ${e.hora.slice(0, 5)} `, sel ? "ambar" : "textoTenue", estilo);
        cx = lista.escribir(cx, fila, ancho ? `[${e.tipo}]`.padEnd(13) : ABREV[e.tipo] + " ", sel ? "ambar" : COLOR_TIPO[e.tipo], estilo);
        lista.escribir(cx, fila, `${marca}${e.texto}`.slice(0, lista.ancho - cx - 1), sel ? "ambar" : e.origen === "local" ? "ambar" : "texto", estilo);
      }
      if (!items.length) lista.centrar(1, "SIN ENTRADAS PARA ESTE FILTRO", "textoTenue");

      const detalle = reg.region(0, reg.alto - ALTO_DETALLE, reg.ancho, ALTO_DETALLE);
      detalle.rellenar(0, 0, detalle.ancho, 1, "─", "ambarTenue");
      const e = items[elegido];
      if (e) {
        detalle.escribir(1, 0, ` ${elegido + 1}/${items.length} · ${ORIGEN[e.origen]} `, "ambarTenue");
        C.partir(e.texto, detalle.ancho - 2).slice(0, 2).forEach((l, i) => detalle.escribir(1, 1 + i, l, "texto"));
      }
    }

    // Eventos por día desde inicioAlerta hasta hoy; lo hostil, encima y en rojo.
    function vectores() {
      if (!histograma) return;
      const v = histograma.vectores();
      const dias = Math.max(1, Math.min(estado.diaHoy, estado.diasTotales) + 1);
      const conteo = new Array(dias).fill(0), hostiles = new Array(dias).fill(0);
      for (const e of filtradas()) {
        if (e.dia === null || e.dia === undefined || e.dia < 0 || e.dia >= dias) continue;
        conteo[e.dia]++;
        if (e.tipo === "HOSTIL") hostiles[e.dia]++;
      }
      const max = Math.max(1, ...conteo), x0 = 7, ancho = v.ancho - x0 - 1, base = v.alto - 0.3;
      v.texto(1, 0.1, "EVENTOS", "textoTenue", { tam: 0.8 });
      v.texto(1, 1.0, "POR DÍA", "textoTenue", { tam: 0.8 });
      v.linea(x0, base, x0 + ancho, base, "ambarTenue");
      const paso = ancho / dias;
      for (let d = 0; d < dias; d++) {
        if (!conteo[d]) continue;
        const x = x0 + d * paso + paso / 2, h = ((v.alto - 0.6) * conteo[d]) / max;
        v.linea(x, base, x, base - h, "ambar", { grosor: Math.max(1, Math.min(4, paso * 4)) });
        if (hostiles[d]) v.linea(x, base, x, base - ((v.alto - 0.6) * hostiles[d]) / max, "arma", { grosor: Math.max(1, Math.min(4, paso * 4)) });
      }
    }

    function mover(paso) {
      const n = filtradas().length;
      elegido = Math.max(0, Math.min(n - 1, elegido + paso));
      ctx.redibujar();
    }

    function cambiarFiltro(paso) {
      filtro = (filtro + paso + FILTROS.length) % FILTROS.length;
      elegido = 0; primera = 0;
      ctx.redibujar();
    }

    return {
      animada: false,
      dibujar,
      vectores,
      tecla(ev) {
        const acciones = {
          ArrowLeft: () => cambiarFiltro(-1), ArrowRight: () => cambiarFiltro(1),
          ArrowUp: () => mover(-1), ArrowDown: () => mover(1),
          PageUp: () => mover(-visibles), PageDown: () => mover(visibles),
          Home: () => mover(-Infinity), End: () => mover(Infinity),
        };
        if (acciones[ev.key]) { ev.preventDefault(); acciones[ev.key](); }
      },
      toque(punto) {
        if (!punto) return;
        const y = Math.floor(punto.y);
        if (y === 0) {
          const p = pestanas.find((t) => punto.x >= t.desde && punto.x < t.hasta);
          if (p) { filtro = p.i; elegido = 0; primera = 0; ctx.redibujar(); }
          return;
        }
        if (lista && y >= lista.y - ctx.region().y && y < lista.y - ctx.region().y + visibles) {
          elegido = Math.min(filtradas().length - 1, primera + y - (lista.y - ctx.region().y));
          ctx.redibujar();
        }
      },
    };
  }

  DENDRO.vistas.registrar({ id: "registro", tecla: "6", titulo: "REGISTRO", tituloCorto: "REG", crear });
})(window.DENDRO = window.DENDRO || {});
