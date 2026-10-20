// Reloj de la agencia (02-diseno.md §4.1): el instante real en la zona horaria de config, o el de
// ?fecha= en depuración, que sigue corriendo desde ahí salvo con &congelar=1 (RF-10).
// Los instantes son milisegundos Unix; las cadenas "AAAA-MM-DDThh:mm" se leen en la zona de config.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const MINUTO = 60000;
  const PATRON = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;
  const MAXIMO_TEMPORIZADOR = 2147483647;   // setTimeout no admite esperas más largas

  const formatos = {};
  function formato(zona) {
    if (!formatos[zona]) {
      formatos[zona] = new Intl.DateTimeFormat("en-CA", {
        timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      });
    }
    return formatos[zona];
  }

  function partesEn(ms) {
    const partes = {};
    for (const p of formato(cfg().cronologia.zonaHoraria).formatToParts(new Date(ms))) partes[p.type] = p.value;
    return partes;
  }

  // Cuánto adelanta el reloj de pared de la zona respecto a UTC en ese instante.
  function desfase(ms) {
    const p = partesEn(ms);
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
  }

  function leer(texto) {
    const m = PATRON.exec(texto || "");
    if (!m) return null;
    const [, a, mes, d, h, min] = m.map((x) => (x === undefined ? undefined : Number(x)));
    const hora = h === undefined ? 0 : h, minuto = min === undefined ? 0 : min;
    const muestra = new Date(Date.UTC(a, mes - 1, d, hora, minuto));
    const valido = muestra.getUTCFullYear() === a && muestra.getUTCMonth() === mes - 1 && muestra.getUTCDate() === d &&
      hora < 24 && minuto < 60;
    return valido ? { a, mes, d, hora, minuto, conHora: h !== undefined } : null;
  }

  // "AAAA-MM-DD" o "AAAA-MM-DDThh:mm" local → ms. Dos pasadas por si el desfase cambia en ese tramo.
  function aInstante(texto) {
    const p = leer(texto);
    if (!p) throw new Error(`Instante no válido: ${texto}`);
    const pared = Date.UTC(p.a, p.mes - 1, p.d, p.hora, p.minuto);
    let ms = pared - desfase(pared);
    ms = pared - desfase(ms);
    return ms;
  }

  function esFechaValida(texto) {
    return leer(texto) !== null;
  }

  // "AAAA-MM-DD" del día local de un instante (semillas por día, "ya vio el arranque hoy").
  function diaLocal(ms) {
    const p = partesEn(ms);
    return `${p.year}-${p.month}-${p.day}`;
  }

  function sumarDias(dia, n) {
    const d = new Date(dia + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function parametroURL(nombre) {
    const busqueda = (window.location && window.location.search) || "";
    const coincidencia = new RegExp("[?&]" + nombre + "=([^&]*)").exec(busqueda);
    return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
  }

  // Simulación: se fija una vez al cargar. Sin hora, las 12:00.
  const simulacion = (function () {
    if (!cfg().debug.permitirFechaURL) return null;
    const valor = parametroURL("fecha");
    const p = leer(valor);
    if (!p) return null;
    return {
      base: aInstante(p.conHora ? valor : `${valor}T12:00`),
      carga: Date.now(),
      congelada: parametroURL("congelar") === "1",
    };
  })();

  // Instante actual con precisión de milisegundos (para el reloj τ con latidos).
  function ahora() {
    if (!simulacion) return Date.now();
    return simulacion.congelada ? simulacion.base : simulacion.base + (Date.now() - simulacion.carga);
  }

  // Instante del Estado: truncado al minuto.
  function instanteActual() {
    return Math.floor(ahora() / MINUTO) * MINUTO;
  }

  // Llama a fn al empezar cada minuto (con un margen para no caer un instante antes del cambio).
  function alCambiarMinuto(fn) {
    if (simulacion && simulacion.congelada) return () => {};
    let id = 0;
    const programar = () => {
      const espera = MINUTO - (ahora() % MINUTO) + 50;
      id = setTimeout(() => { fn(instanteActual()); programar(); }, espera);
    };
    programar();
    return () => clearTimeout(id);
  }

  // Llama a fn cuando el reloj llegue a ms (o enseguida si ya pasó).
  function alLlegar(ms, fn) {
    if (simulacion && simulacion.congelada) return () => {};
    let id = 0;
    const programar = () => {
      const falta = ms - ahora();
      if (falta <= 0) { id = setTimeout(fn, 0); return; }
      id = setTimeout(programar, Math.min(falta + 20, MAXIMO_TEMPORIZADOR));
    };
    programar();
    return () => clearTimeout(id);
  }

  DENDRO.reloj = {
    MINUTO,
    ahora, instanteActual, aInstante, diaLocal, sumarDias, partesEn, esFechaValida, parametroURL,
    alCambiarMinuto, alLlegar,
    esSimulada: () => simulacion !== null,
  };
})(window.DENDRO = window.DENDRO || {});
