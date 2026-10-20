// Meta-tiempo τ (02-diseno.md §4.2, 04-lore.md §1.2): la única forma en que un instante llega a
// la pantalla. Ciclos de pulsos y pulsos de latidos; nunca fechas ni horas de nuestro calendario.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  let cache = null;

  function unidades() {
    const t = cfg().tau;
    const clave = `${cfg().cronologia.zonaHoraria}|${t.epoca}|${t.segundosPorCiclo}|${t.pulsosPorCiclo}|${t.latidosPorPulso}`;
    if (!cache || cache.clave !== clave) {
      const ciclo = t.segundosPorCiclo * 1000;
      const pulso = ciclo / t.pulsosPorCiclo;
      cache = { clave, epoca: DENDRO.reloj.aInstante(t.epoca), ciclo, pulso, latido: pulso / t.latidosPorPulso };
    }
    return cache;
  }

  const relleno = (n, cifras) => String(n).padStart(cifras, "0");
  const cifrasDe = (n) => String(n - 1).length;

  // τ en ciclos con decimales.
  function de(ms) {
    const u = unidades();
    return (ms - u.epoca) / u.ciclo;
  }

  // Partes enteras de un instante; se trunca, nunca se redondea hacia arriba.
  function partes(ms) {
    const u = unidades(), t = cfg().tau;
    const latidos = Math.floor((ms - u.epoca) / u.latido);
    const pulsos = Math.floor(latidos / t.latidosPorPulso);
    return {
      ciclo: Math.floor(pulsos / t.pulsosPorCiclo),
      pulso: ((pulsos % t.pulsosPorCiclo) + t.pulsosPorCiclo) % t.pulsosPorCiclo,
      latido: ((latidos % t.latidosPorPulso) + t.latidosPorPulso) % t.latidosPorPulso,
    };
  }

  // "7532.137"
  function corto(ms) {
    const p = partes(ms);
    return `${p.ciclo}.${relleno(p.pulso, cifrasDe(cfg().tau.pulsosPorCiclo))}`;
  }

  // "τ 7532.137"
  function instante(ms) {
    return `τ ${corto(ms)}`;
  }

  // "τ 7532.137·42": con latidos, para la barra de estado.
  function reloj(ms) {
    return `${instante(ms)}·${relleno(partes(ms).latido, cifrasDe(cfg().tau.latidosPorPulso))}`;
  }

  // "3.208 c" · "412 p" · "37 l" (valor absoluto, truncado).
  function duracion(ms) {
    const u = unidades(), d = Math.abs(ms);
    if (d >= u.ciclo) return `${(Math.floor((d / u.ciclo) * 1000) / 1000).toFixed(3)} c`;
    if (d >= u.pulso) return `${Math.floor(d / u.pulso)} p`;
    return `${Math.floor(d / u.latido)} l`;
  }

  // restante > 0: falta → "T−…"; si no, ya pasó → "T+…".
  function cuenta(restante) {
    return `${restante > 0 ? "T−" : "T+"}${duracion(restante)}`;
  }

  DENDRO.tau = {
    de, partes, corto, instante, reloj, duracion, cuenta,
    ciclo: () => unidades().ciclo, pulso: () => unidades().pulso, latido: () => unidades().latido,
  };
})(window.DENDRO = window.DENDRO || {});
