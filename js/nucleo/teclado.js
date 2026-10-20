// Teclado: qué teclas no se tocan nunca y la entrada de texto (acceso, terminal), que pasa por un
// campo oculto para que el teclado del móvil aparezca y los acentos/IME funcionen.
(function (DENDRO) {
  "use strict";

  // F5, F11 y F12 son del navegador (RF-04); los modificadores solos no son pulsaciones.
  const IGNORADAS = new Set(["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock", "Tab", "F5", "F11", "F12"]);

  const e = { campo: null, peticion: null };

  function ignorable(ev) {
    // Tab navega por los botones del marco, salvo mientras se escribe (autocompletado de la terminal).
    if (ev.key === "Tab" && e.peticion && ev.target === e.campo) return false;
    return ev.ctrlKey || ev.metaKey || ev.altKey || IGNORADAS.has(ev.key);
  }

  function iniciar(campo) {
    e.campo = campo;
    campo.addEventListener("input", () => {
      if (!e.peticion) { campo.value = ""; return; }
      const limpio = e.peticion.filtro(campo.value).slice(0, e.peticion.maximo);
      if (limpio !== campo.value) campo.value = limpio;
      e.peticion.alCambiar(limpio);
    });
  }

  function enfocar() {
    if (e.campo && e.peticion) e.campo.focus({ preventScroll: true });
  }

  // Empieza a recoger texto. filtro(texto) → texto admitido; alCambiar(valor) en cada cambio.
  function pedirTexto({ valor, maximo, filtro, alCambiar }) {
    e.peticion = { maximo: maximo || 64, filtro: filtro || ((t) => t), alCambiar: alCambiar || (() => {}) };
    e.campo.value = valor || "";
    e.peticion.alCambiar(e.campo.value);
    enfocar();
  }

  function soltar() {
    e.peticion = null;
    if (e.campo) { e.campo.value = ""; e.campo.blur(); }
  }

  // Si la pulsación llegó sin que el campo tuviera el foco (p. ej. tras un clic), la aplica a mano.
  function recoger(ev) {
    if (!e.peticion || document.activeElement === e.campo) return false;
    if (ev.key === "Backspace") e.campo.value = e.campo.value.slice(0, -1);
    else if (ev.key.length === 1) e.campo.value += ev.key;
    else return false;
    ev.preventDefault();
    e.campo.dispatchEvent(new Event("input"));
    enfocar();
    return true;
  }

  DENDRO.teclado = {
    iniciar, ignorable, pedirTexto, soltar, enfocar, recoger,
    esCampo: (objetivo) => objetivo === e.campo,
  };
})(window.DENDRO = window.DENDRO || {});
