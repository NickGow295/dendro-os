// Piezas compartidas por las vistas: nombres y colores de estado, barra de estabilidad
// y opciones de globo según el estado del día. Solo leen del Estado; no tocan el canvas.
(function (DENDRO) {
  "use strict";

  const MAYUS = (s) => String(s).toLocaleUpperCase("es");

  const COLOR_ESTADO = {
    "ESTABLE": "tierra", "APROXIMACIÓN": "ambar", "CONTACTO": "texto", "HOSTILIDADES": "arma", "INTERFERENCIA": "ambar",
    "ANIQUILADA": "peligro", "FUSIONADA": "tierra", "SUPERVIVIENTE": "texto", "COLAPSO": "peligro",
  };
  const ABREVIATURA = {
    "ESTABLE": "EST", "APROXIMACIÓN": "APRX", "CONTACTO": "CONT", "HOSTILIDADES": "HOST", "INTERFERENCIA": "INTF",
    "ANIQUILADA": "ANIQ", "FUSIONADA": "FUS", "SUPERVIVIENTE": "SUPV", "COLAPSO": "COLP",
  };
  const POSTURAS = {
    "hostil": "HOSTIL", "mutua-hostil": "MUTUA-HOSTIL", "evacuacion": "EVACUACIÓN",
    "aislamiento": "AISLAMIENTO", "negociacion": "NEGOCIACIÓN", "ignorancia": "IGNORANCIA",
  };
  const COLOR_TIPO = { "SISTEMA": "texto", "COLISIÓN": "ambar", "HOSTIL": "arma", "CONTENCIÓN": "tierra" };

  const tierra = (estado, id) => estado.tierras.find((t) => t.id === id);
  const pareja = (estado, id) => estado.parejas.find((p) => p.id === id);

  // Opciones de dibujo de un globo según el estado de su tierra (02-diseno.md §7.4).
  function opcionesGlobo(estado, t, segundos) {
    const par = t.pareja ? pareja(estado, t.pareja) : null;
    const o = {};
    const danos = estado.ataques.filter((a) => a.hacia === t.id).reduce((m, a) => Math.max(m, a.progreso), 0);
    if (danos) o.danos = danos;
    if (t.estado === "APROXIMACIÓN" && par) o.halo = Math.max(0.3, 1 - par.separacion);
    if (["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"].includes(t.estado)) o.halo = 1;
    if (t.estado === "ANIQUILADA" || t.estado === "COLAPSO") o.fragmentacion = 0.55 + 0.05 * Math.sin(segundos * 0.7);
    if (t.estado === "SUPERVIVIENTE") o.danos = Math.max(o.danos || 0, 0.7);
    if (t.estado === "FUSIONADA" && t.fusionadaCon) o.fusion = { tierra: tierra(estado, t.fusionadaCon), mezcla: 0.5 + 0.2 * Math.sin(segundos * 0.8) };
    return o;
  }

  function colorEstabilidad(valor) {
    return valor > 50 ? "tierra" : valor > 20 ? "ambar" : "arma";
  }

  // Barra segmentada de estabilidad en la capa vectorial; x, y, ancho y alto en celdas.
  function barraEstabilidad(v, x, y, ancho, valor, alto) {
    const segmentos = 10, h = alto || 0.6, llenos = Math.round((valor / 100) * segmentos);
    const color = colorEstabilidad(valor), paso = ancho / segmentos;
    for (let i = 0; i < segmentos; i++) {
      const sx = x + i * paso, lleno = i < llenos;
      v.poligono([[sx, y], [sx + paso * 0.78, y], [sx + paso * 0.78, y + h], [sx, y + h]],
        lleno ? color : "ambarTenue", { relleno: lleno ? color : null, rellenoAlfa: 0.6, alfa: lleno ? 1 : 0.5 });
    }
  }

  // Ajusta un texto a un ancho, partiendo por palabras.
  function partir(texto, ancho) {
    const lineas = [];
    let actual = "";
    for (const palabra of String(texto).split(/\s+/)) {
      if (actual && (actual + " " + palabra).length > ancho) { lineas.push(actual); actual = palabra; }
      else actual = actual ? actual + " " + palabra : palabra;
    }
    if (actual || !lineas.length) lineas.push(actual);
    return lineas;
  }

  // Lista desplazable: primera fila visible para que el elemento elegido quede a la vista.
  function desplazamiento(actual, elegido, visibles) {
    if (elegido < actual) return elegido;
    if (elegido >= actual + visibles) return elegido - visibles + 1;
    return actual;
  }

  // Selector ◄ … ► centrado en una fila; devuelve el texto escrito.
  function selector(reg, y, texto, color) {
    reg.centrar(y, `◄  ${texto}  ►`, color || "ambar");
  }

  // ¿El toque cayó en la flecha izquierda (-1), derecha (+1) o en medio (0) de una fila de selector?
  function ladoDelToque(punto, ancho) {
    if (punto.x < ancho / 3) return -1;
    if (punto.x > (ancho * 2) / 3) return 1;
    return 0;
  }

  DENDRO.vistasComun = {
    MAYUS, COLOR_ESTADO, ABREVIATURA, POSTURAS, COLOR_TIPO,
    tierra, pareja, opcionesGlobo, colorEstabilidad, barraEstabilidad, selector, ladoDelToque, partir, desplazamiento,
  };
})(window.DENDRO = window.DENDRO || {});
