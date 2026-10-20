// Estado local del operador (02-diseno.md §1, persistencia): registro de sus acciones, mensajes
// leídos, documentos desbloqueados y credencial de dirección (solo su hash). Vive en localStorage y
// NUNCA alimenta la cronología global: la credencial cambia lo que se ve, no lo que pasa.
(function (DENDRO) {
  "use strict";

  const CLAVES = { registro: "dendro.registroLocal", leidos: "dendro.leidos", desbloqueos: "dendro.desbloqueos", credencial: "dendro.credencial" };
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

  // Las entradas de versiones anteriores llevaban fecha y hora en vez de instante.
  function migrar(e) {
    if (typeof e.instante === "number") return e;
    try {
      return { instante: DENDRO.reloj.aInstante(`${e.fecha}T${String(e.hora || "00:00").slice(0, 5)}`), tipo: e.tipo, texto: e.texto, tierras: e.tierras || [], origen: "local" };
    } catch (_) { return null; }
  }

  // Memoria de respaldo por si localStorage no está disponible.
  const memoria = {
    registro: leer(CLAVES.registro, []).map(migrar).filter(Boolean),
    leidos: leer(CLAVES.leidos, []),
    desbloqueos: leer(CLAVES.desbloqueos, []),
    credencial: leer(CLAVES.credencial, null),
  };

  function registrar(tipo, texto) {
    const entrada = { instante: DENDRO.reloj.ahora(), tipo, texto, tierras: [], origen: "local" };
    memoria.registro.unshift(entrada);
    memoria.registro.length = Math.min(memoria.registro.length, MAXIMO_REGISTRO);
    guardar(CLAVES.registro, memoria.registro);
    return entrada;
  }

  // Solo las anteriores al instante actual: con ?fecha= en el pasado no aparecen acciones "del futuro".
  function entradas() {
    const ahora = DENDRO.reloj.ahora();
    return memoria.registro.filter((e) => e.instante <= ahora).map((e) => ({ ...e, tau: DENDRO.tau.de(e.instante) }));
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

  // credencial() → ¿hay una credencial de dirección válida? credencial(hash) la guarda; credencial(null) la cierra.
  function credencial(hash) {
    if (arguments.length) {
      memoria.credencial = hash || null;
      if (hash) guardar(CLAVES.credencial, hash);
      else { try { localStorage.removeItem(CLAVES.credencial); } catch (_) { /* nada que borrar */ } }
    }
    return DENDRO.credencial.valida(memoria.credencial);
  }

  DENDRO.local = { registrar, entradas, leido, marcarLeido, desbloqueado, desbloquear, credencial };
})(window.DENDRO = window.DENDRO || {});
