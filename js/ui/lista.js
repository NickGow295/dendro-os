// Lista filtrable (02-diseno.md §6): ventana sobre la vista con un campo de filtro (por el campo oculto,
// así funciona con el teclado del móvil), chips que se alternan con Tab o tocándolos y filas
// navegables con ↑↓ y RePág/AvPág. Enter elige, Esc cierra. La usan COLISIÓN, OSCILOSCOPIO y CONTENCIÓN.
(function (DENDRO) {
  "use strict";

  const ANCHO_MAX = 78;
  const normalizar = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^0-9A-Z]/g, "");

  // opciones: { titulo(n), elementos(), chips: [{ id, etiqueta, filtro(el) }], buscar(el), fila(el, ancho) → [{ t, c }],
  //             actual(), alElegir(el), alCerrar(), redibujar() }
  function crear(opciones) {
    let abierta = false, filtro = "", chip = 0, elegido = 0, primera = 0;
    let caja = null, chipsX = [], filtradosCache = null;

    function filtrados() {
      if (filtradosCache) return filtradosCache;
      const q = normalizar(filtro), c = opciones.chips[chip];
      filtradosCache = opciones.elementos().filter((el) => (!c || !c.filtro || c.filtro(el)) && (!q || normalizar(opciones.buscar(el)).includes(q)));
      return filtradosCache;
    }

    function refrescar() { filtradosCache = null; opciones.redibujar(); }

    function abrir() {
      abierta = true;
      filtradosCache = null;
      const actual = opciones.actual && opciones.actual();
      elegido = Math.max(0, filtrados().indexOf(actual));
      DENDRO.teclado.pedirTexto({ valor: filtro, maximo: 24, alCambiar: (v) => { if (v !== filtro) { filtro = v; elegido = 0; refrescar(); } } });
      opciones.redibujar();
    }

    function cerrar() {
      if (!abierta) return;
      abierta = false;
      DENDRO.teclado.soltar();
      if (opciones.alCerrar) opciones.alCerrar();
      opciones.redibujar();
    }

    function elegir() {
      const el = filtrados()[elegido];
      if (!el) return;
      cerrar();
      opciones.alElegir(el);
    }

    function mover(paso) {
      const n = filtrados().length;
      if (!n) return;
      elegido = Math.max(0, Math.min(n - 1, elegido + paso));
      opciones.redibujar();
    }

    function cambiarChip(paso) {
      chip = (chip + paso + opciones.chips.length) % opciones.chips.length;
      elegido = 0;
      refrescar();
    }

    function dibujar(reg) {
      if (!abierta) return;
      const ancho = Math.min(ANCHO_MAX, reg.ancho - 2), alto = reg.alto - 1;
      const x0 = Math.floor((reg.ancho - ancho) / 2);
      reg.rellenar(x0, 0, ancho, alto, " ");
      const lista = filtrados();
      caja = reg.caja(x0, 0, ancho, alto, { titulo: opciones.titulo(lista.length), color: "ambar" });

      const finFiltro = caja.escribir(1, 0, "FILTRO> ", "ambarTenue");
      const fin = caja.escribir(finFiltro, 0, filtro, "texto");
      caja.escribir(fin, 0, "█", "ambar", { parpadeo: true });
      caja.derecha(0, `${lista.length} `, "textoTenue");

      chipsX = [];
      let x = 1;
      opciones.chips.forEach((c, i) => {
        const texto = ` ${c.etiqueta} `;
        if (x + texto.length >= caja.ancho) return;
        const finChip = caja.escribir(x, 1, texto, i === chip ? "ambar" : "textoTenue", i === chip ? { inverso: true } : null);
        chipsX.push({ desde: x, hasta: finChip, i });
        x = finChip + 1;
      });
      caja.rellenar(0, 2, caja.ancho, 1, "─", "ambarTenue");

      const filas = caja.alto - 4;
      elegido = Math.max(0, Math.min(elegido, lista.length - 1));
      if (elegido < primera) primera = elegido;
      if (elegido >= primera + filas) primera = elegido - filas + 1;
      primera = Math.max(0, Math.min(primera, Math.max(0, lista.length - filas)));
      if (!lista.length) caja.centrar(4, "SIN RESULTADOS", "textoTenue");
      lista.slice(primera, primera + filas).forEach((el, i) => {
        const sel = primera + i === elegido, estilo = sel ? { inverso: true } : null;
        if (sel) caja.rellenar(0, 3 + i, caja.ancho, 1, " ", "ambar", estilo);
        let cx = 1;
        for (const s of opciones.fila(el, caja.ancho - 2)) {
          if (cx >= caja.ancho - 1) break;
          cx = caja.escribir(cx, 3 + i, s.t.slice(0, caja.ancho - 1 - cx), sel ? "ambar" : s.c, estilo);
        }
      });
      caja.escribir(1, caja.alto - 1, reg.ancho >= 60 ? "↑↓ ELEGIR · ENTER ABRIR · TAB FILTRO · ESC CERRAR" : "ENTER ABRIR · ESC CERRAR", "textoTenue");
    }

    // Devuelve true si la tecla era de la lista.
    function tecla(ev) {
      if (!abierta) return false;
      const k = ev.key;
      if (k === "Escape") { ev.preventDefault(); cerrar(); }
      else if (k === "Enter") { ev.preventDefault(); elegir(); }
      else if (k === "ArrowUp") { ev.preventDefault(); mover(-1); }
      else if (k === "ArrowDown") { ev.preventDefault(); mover(1); }
      else if (k === "PageUp") { ev.preventDefault(); mover(-10); }
      else if (k === "PageDown") { ev.preventDefault(); mover(10); }
      else if (k === "Tab") { ev.preventDefault(); cambiarChip(ev.shiftKey ? -1 : 1); }
      else DENDRO.teclado.recoger(ev);
      return true;
    }

    // punto relativo a la región en la que se dibujó la lista; devuelve true si lo consumió.
    function toque(punto, reg) {
      if (!abierta) return false;
      if (!caja || !punto) return true;
      const x = punto.x - (caja.x - reg.x), y = Math.floor(punto.y - (caja.y - reg.y));
      if (x < -1 || x > caja.ancho || y < -1 || y > caja.alto) { cerrar(); return true; }
      if (y === 0) DENDRO.teclado.enfocar();
      else if (y === 1) { const c = chipsX.find((k) => x >= k.desde && x < k.hasta); if (c) { chip = c.i; elegido = 0; refrescar(); } }
      else if (y >= 3 && y < caja.alto - 1) {
        const i = primera + y - 3;
        if (i === elegido) elegir();
        else if (i < filtrados().length) { elegido = i; opciones.redibujar(); }
      }
      return true;
    }

    return {
      abrir, cerrar, dibujar, tecla, toque,
      get abierta() { return abierta; },
      invalidar() { filtradosCache = null; },
    };
  }

  DENDRO.lista = { crear, normalizar };
})(window.DENDRO = window.DENDRO || {});
