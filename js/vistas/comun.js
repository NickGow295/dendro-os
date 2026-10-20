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

  const tierra = (estado, codigo) => estado.tierras.porCodigo(codigo);
  const indicesParejas = new WeakMap();   // Estado → Map id → pareja (hay cientos de parejas)
  function pareja(estado, id) {
    let indice = indicesParejas.get(estado);
    if (!indice) { indice = new Map(estado.parejas.map((p) => [p.id, p])); indicesParejas.set(estado, indice); }
    return indice.get(id);
  }
  const nombre = (t) => (t.nombre ? MAYUS(t.nombre) : t.codigo);   // las generadas se ven por su código

  // Dos últimos segmentos del código (7A2·R9), para las celdas estrechas.
  const codigoCorto = (codigo) => codigo.split("·").slice(-2).join("·");

  // Parejas que recorren ←/→: las activas si hay, si no las nombradas.
  function parejasNavegables(estado) {
    return estado.activas.length ? estado.activas.map((id) => pareja(estado, id)) : estado.parejas.filter((p) => p.nombrada);
  }

  // Pareja nombrada de referencia (las vistas de las 24 tierras no seleccionan ramas generadas).
  function parejaNombrada(estado) {
    const principal = pareja(estado, estado.parejaPrincipal);
    if (principal && principal.nombrada) return principal;
    const nombradas = estado.parejas.filter((p) => p.nombrada);
    const activa = nombradas.filter((p) => ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA", "APROXIMACIÓN"].includes(p.estado));
    if (activa.length) return activa.reduce((m, p) => (p.contacto > m.contacto ? p : m));
    const futura = nombradas.filter((p) => p.estado === "ESTABLE");
    if (futura.length) return futura.reduce((m, p) => (p.contacto < m.contacto ? p : m));
    return nombradas.reduce((m, p) => (p.contacto > m.contacto ? p : m));
  }

  // Opciones de dibujo de un globo según el estado de su tierra (02-diseno.md §7.4).
  function opcionesGlobo(estado, t, segundos) {
    const par = t.pareja ? pareja(estado, t.pareja) : null;
    const o = {};
    const danos = estado.ataques.filter((a) => a.hacia === t.codigo).reduce((m, a) => Math.max(m, a.progreso), 0);
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
    tierra, pareja, nombre, codigoCorto, parejasNavegables, parejaNombrada, opcionesGlobo, colorEstabilidad, barraEstabilidad, selector, ladoDelToque, partir, desplazamiento,
  };
})(window.DENDRO = window.DENDRO || {});
