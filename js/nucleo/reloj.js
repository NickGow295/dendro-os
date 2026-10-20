// Fecha de la agencia: la real en la zona horaria de config, o la de ?fecha= en depuración (RF-10).
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

  function esFechaValida(iso) {
    if (!PATRON_FECHA.test(iso)) return false;
    const d = new Date(iso + "T12:00:00Z");
    return !isNaN(d) && d.toISOString().slice(0, 10) === iso;
  }

  function parametroURL(nombre) {
    const busqueda = (window.location && window.location.search) || "";
    const coincidencia = new RegExp("[?&]" + nombre + "=([^&]*)").exec(busqueda);
    return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
  }

  function partesEnZona(fecha) {
    const formato = new Intl.DateTimeFormat("en-CA", {
      timeZone: cfg().cronologia.zonaHoraria,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    const partes = {};
    for (const p of formato.formatToParts(fecha)) partes[p.type] = p.value;
    return partes;
  }

  function fechaSimulada() {
    if (!cfg().debug.permitirFechaURL) return null;
    const valor = parametroURL("fecha");
    return valor && esFechaValida(valor) ? valor : null;
  }

  // "AAAA-MM-DD" del día de la agencia.
  function fechaHoy() {
    const simulada = fechaSimulada();
    if (simulada) return simulada;
    const p = partesEnZona(new Date());
    return `${p.year}-${p.month}-${p.day}`;
  }

  // "hh:mm:ss" reales en la zona de la agencia (también al simular otro día).
  function horaAgencia() {
    const p = partesEnZona(new Date());
    return `${p.hour}:${p.minute}:${p.second}`;
  }

  function diasEntre(desde, hasta) {
    const a = Date.parse(desde + "T00:00:00Z");
    const b = Date.parse(hasta + "T00:00:00Z");
    return Math.round((b - a) / 86400000);
  }

  function sumarDias(iso, n) {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  DENDRO.reloj = {
    fechaHoy, horaAgencia, diasEntre, sumarDias, esFechaValida, parametroURL,
    esSimulada: () => fechaSimulada() !== null,
  };
})(window.DENDRO = window.DENDRO || {});
