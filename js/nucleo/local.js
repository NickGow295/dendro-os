// Estado local del operador (02-diseno.md §1, persistencia): registro de sus acciones, mensajes
// leídos y documentos desbloqueados. Vive en localStorage y NUNCA alimenta la cronología global.
(function (DENDRO) {
  "use strict";

  const CLAVES = { registro: "dendro.registroLocal", leidos: "dendro.leidos", desbloqueos: "dendro.desbloqueos" };
  const MAXIMO_REGISTRO = 200;

  function leer(clave, porDefecto) {
    try {
      const v = localStorage.getItem(clave);
      return v ? JSON.parse(v) : porDefecto;
    } catch (_) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (_) { /* sin almacenamiento: dura la sesión */ }
  }

  // Memoria de respaldo por si localStorage no está disponible.
  const memoria = { registro: leer(CLAVES.registro, []), leidos: leer(CLAVES.leidos, []), desbloqueos: leer(CLAVES.desbloqueos, []) };

  function registrar(tipo, texto) {
    const entrada = {
      fecha: DENDRO.reloj.fechaHoy(), hora: DENDRO.reloj.horaAgencia(),
      tipo, texto, tierras: [], origen: "local",
    };
    memoria.registro.unshift(entrada);
    memoria.registro.length = Math.min(memoria.registro.length, MAXIMO_REGISTRO);
    guardar(CLAVES.registro, memoria.registro);
    return entrada;
  }

  // Solo las del día simulado o anteriores: con ?fecha= en el pasado no aparecen acciones "del futuro".
  function entradas() {
    const hoy = DENDRO.reloj.fechaHoy();
    return memoria.registro.filter((e) => e.fecha <= hoy);
  }

  function leido(id) { return memoria.leidos.includes(id); }
  function marcarLeido(id) {
    if (leido(id)) return;
    memoria.leidos.push(id);
    guardar(CLAVES.leidos, memoria.leidos);
  }

  function desbloqueado(clave) { return memoria.desbloqueos.includes(clave); }
  function desbloquear(clave) {
    if (desbloqueado(clave)) return false;
    memoria.desbloqueos.push(clave);
    guardar(CLAVES.desbloqueos, memoria.desbloqueos);
    return true;
  }

  DENDRO.local = { registrar, entradas, leido, marcarLeido, desbloqueado, desbloquear };
})(window.DENDRO = window.DENDRO || {});
