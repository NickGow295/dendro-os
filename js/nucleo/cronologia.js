// ★ Motor de cronología (02-diseno.md §4): calcularEstado(instante) → Estado.
// Función pura del instante (ms o "AAAA-MM-DDThh:mm" local), truncado al minuto: sin DOM, sin
// localStorage, sin Math.random(). Se ejecuta también en Node.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const datos = () => window.DENDRO_DATOS || {};

  // Umbrales con nombre (02-diseno.md §4.3).
  const UMBRAL_COMUNICACIONES = 0.5;
  const UMBRAL_MONITOR = 0.7;
  const UMBRAL_CONTENCION = 0.9;
  const PASO_SERIE_RAMAS = 3 * 3600000;      // muestras de la gráfica de ramas afectadas
  const MUESTRAS_SERIE_DELTA = 48;            // puntos de la minigráfica de Δω de cada pareja

  const FASES = [
    { nombre: "NOMINAL", alerta: "VERDE" },
    { nombre: "ANOMALÍA", alerta: "ÁMBAR" },
    { nombre: "CONTACTO", alerta: "NARANJA" },
    { nombre: "CASCADA", alerta: "ROJO" },
    { nombre: "CRÍTICO", alerta: "NEGRO" },
    { nombre: "COLAPSO", alerta: "—" },
  ];
  const ESTABILIDAD = { ESTABLE: 100, CONTACTO: 25, HOSTILIDADES: 10, INTERFERENCIA: 10, ANIQUILADA: 0, SUPERVIVIENTE: 35, FUSIONADA: 40, COLAPSO: 0 };
  const TEXTO_POSTURA = {
    evacuacion: "EVACUACIÓN EN CURSO",
    aislamiento: "{A} SELLA SUS FRONTERAS DE FASE",
    negociacion: "CANALES DE NEGOCIACIÓN ABIERTOS",
    ignorancia: "NINGUNA DE LAS DOS RAMAS RESPONDE",
  };

  const limitar = (x, a, b) => Math.max(a, Math.min(b, x));
  const esHostil = (postura) => postura === "hostil" || postura === "mutua-hostil";
  const aMs = (x) => (typeof x === "number" ? x : DENDRO.reloj.aInstante(x));
  const alMinuto = (ms) => Math.floor(ms / DENDRO.reloj.MINUTO) * DENDRO.reloj.MINUTO;

  // Hitos de config en ms (se recalculan si cambia la config, p. ej. en las pruebas).
  let hitosCache = null;
  function hitos() {
    const c = cfg().cronologia;
    const clave = [c.zonaHoraria, c.inicioAlerta, c.primeraColision, c.inicioRectaFinal, c.colapsoTotal].join("|");
    if (!hitosCache || hitosCache.clave !== clave) {
      hitosCache = {
        clave,
        t0: aMs(c.inicioAlerta), t1: aMs(c.primeraColision),
        tr: aMs(c.inicioRectaFinal), tf: aMs(c.colapsoTotal),
      };
    }
    return hitosCache;
  }

  // ── Progreso, fase e intensidad (§4.3) ────────────────────────────────────
  function progresoDe(t) {
    const { t0, t1, tr, tf } = hitos();
    const p = limitar((t - t1) / (tf - t1), 0, 1);
    let fase;
    if (t < t0) fase = 0;
    else if (t < t1) fase = 1;
    else if (t >= tf) fase = 5;
    else fase = p < 0.35 ? 2 : p < 0.8 ? 3 : 4;
    const rectaFinal = t >= tr && t < tf;
    const intensidad = (fase < 2 ? 0.05 * fase : rectaFinal ? 1 : 0.1 + 0.9 * p * p) * cfg().efectos.glitchMaximo;
    return { p, fase, rectaFinal, intensidad };
  }

  function ramasAfectadas(t, p) {
    if (t < hitos().t1) return 0;
    return Math.round(2 * Math.pow(cfg().cronologia.ramasAfectadasFinal / 2, p));
  }

  // ── Parejas (§4.5) ────────────────────────────────────────────────────────
  // Ventanas en ms; se comprimen cuando el contacto cae cerca del colapso.
  function ventanas(contacto) {
    const w = cfg().multiverso.ventanas, ciclo = DENDRO.tau.ciclo();
    const resto = (hitos().tf - contacto) / ciclo;
    const A = Math.min(w.aproximacionMax, w.factorAproximacion * resto) * ciclo;
    const H = Math.min(w.tramoMax, w.factorTramo * resto) * ciclo;
    const K = Math.min(w.contactoMax * ciclo, H / 4);
    return { A, H, K, ataque: -w.inicioAtaque * A };
  }

  function superviviente(par) {
    return par.desenlace.startsWith("superviviente:") ? par.desenlace.split(":")[1] : null;
  }

  function estadoPareja(par, dt, v, colapso) {
    if (colapso) return "COLAPSO";
    if (dt < -v.A) return "ESTABLE";
    if (dt < 0) return "APROXIMACIÓN";
    if (dt < v.K) return "CONTACTO";
    if (dt < v.H) return esHostil(par.postura) ? "HOSTILIDADES" : "INTERFERENCIA";
    if (par.desenlace === "aniquilacion") return "ANIQUILADA";
    if (par.desenlace === "fusion") return "FUSIONADA";
    if (par.desenlace === "colapso") return "COLAPSO";
    return "SUPERVIVIENTE";
  }

  function deltaOmegaEn(dt, v, d0) {
    return d0 * limitar(-dt / v.A, 0, 1);
  }

  // Parejas de los datos con su contacto en ms (cacheadas por lista de datos).
  let parejasCache = null;
  function parejasBase() {
    const lista = datos().colisiones || [];
    if (!parejasCache || parejasCache.lista !== lista || parejasCache.clave !== hitos().clave) {
      parejasCache = {
        lista, clave: hitos().clave,
        parejas: lista.map((par) => {
          const contacto = aMs(par.contacto);
          return { ...par, contacto, ventanas: ventanas(contacto) };
        }),
      };
    }
    return parejasCache.parejas;
  }

  function calcularPareja(par, t, tierrasPorId, colapso) {
    const d0 = Math.abs(tierrasPorId[par.a].omega - tierrasPorId[par.b].omega);
    const v = par.ventanas, dt = t - par.contacto;
    const deltaOmega = colapso ? 0 : deltaOmegaEn(dt, v, d0);
    const desde = par.contacto - 1.3 * v.A, hasta = par.contacto + v.H;
    const serie = [];
    for (let i = 0; i < MUESTRAS_SERIE_DELTA; i++) {
      const ms = desde + ((hasta - desde) * i) / (MUESTRAS_SERIE_DELTA - 1);
      serie.push({ tau: DENDRO.tau.de(ms), instante: ms, valor: deltaOmegaEn(ms - par.contacto, v, d0), futuro: ms > t });
    }
    return {
      ...par,
      estado: estadoPareja(par, dt, v, colapso),
      hostil: !colapso && esHostil(par.postura) && dt >= v.ataque && dt < v.H,
      deltaOmega0: d0,
      deltaOmega,
      separacion: d0 > 0 ? deltaOmega / d0 : 0,
      paraContacto: par.contacto - t,          // > 0: falta; < 0: ya pasó
      desvanecimiento: limitar((dt - v.H) / (v.H / 2), 0, 1),
      serieDeltaOmega: serie,
    };
  }

  function ataquesDe(par, t) {
    const v = par.ventanas, dt = t - par.contacto;
    if (!esHostil(par.postura) || dt < v.ataque || dt >= v.H) return [];
    const progreso = (dt - v.ataque) / (v.H - v.ataque);
    const otro = (id) => (id === par.a ? par.b : par.a);
    const atacantes = [par.agresor];
    if (par.postura === "mutua-hostil" && dt >= 0) atacantes.push(otro(par.agresor));
    const lista = [];
    for (const desde of atacantes) {
      for (const tipo of (par.armas && par.armas[desde]) || []) {
        lista.push({ pareja: par.id, desde, hacia: otro(desde), tipo, progreso });
      }
    }
    return lista;
  }

  // Pareja que abre COLISIÓN (§4.5).
  function parejaPrincipal(parejas) {
    const activas = parejas.filter((x) => ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"].includes(x.estado));
    if (activas.length) return activas.reduce((m, x) => (x.contacto > m.contacto ? x : m)).id;
    const aproximando = parejas.filter((x) => x.estado === "APROXIMACIÓN");
    if (aproximando.length) return aproximando.reduce((m, x) => (x.paraContacto < m.paraContacto ? x : m)).id;
    const estables = parejas.filter((x) => x.estado === "ESTABLE");
    if (estables.length) return estables.reduce((m, x) => (x.contacto < m.contacto ? x : m)).id;
    return parejas.reduce((m, x) => (x.contacto > m.contacto ? x : m)).id;
  }

  // ── Tierras ───────────────────────────────────────────────────────────────
  function estadoTierra(id, par) {
    if (par.estado === "SUPERVIVIENTE") return superviviente(par) === id ? "SUPERVIVIENTE" : "ANIQUILADA";
    return par.estado;
  }

  function estabilidad(estado, par, t) {
    if (estado === "APROXIMACIÓN") return Math.round(100 - 60 * (1 + (t - par.contacto) / par.ventanas.A));
    return ESTABILIDAD[estado];
  }

  // ── Registro (§4.7) ───────────────────────────────────────────────────────
  function entrada(instante, tipo, texto, tierras, origen) {
    return { instante, tipo, texto, tierras: tierras || [], origen };
  }

  function eventosDePareja(par, tierrasPorId) {
    const N = (id) => tierrasPorId[id].nombre.toLocaleUpperCase("es");
    const arma = (id) => ((par.armas && par.armas[id]) || []).map((t) => (datos().armas[t] || { nombre: t }).nombre.toLocaleUpperCase("es")).join(" Y ");
    const otro = (id) => (id === par.a ? par.b : par.a);
    const v = par.ventanas, en = (dt) => alMinuto(par.contacto + dt);
    const ids = [par.a, par.b];
    const lista = [
      entrada(en(-v.A), "COLISIÓN", `CONVERGENCIA DETECTADA: ${N(par.a)} / ${N(par.b)} (${par.id}).`, ids, "pareja"),
      entrada(en(0), "COLISIÓN", `CONTACTO CONFIRMADO: ${N(par.a)} / ${N(par.b)} (${par.id}).`, ids, "pareja"),
    ];
    if (esHostil(par.postura)) {
      lista.push(entrada(en(v.ataque), "HOSTIL", `${N(par.agresor)} ABRE FUEGO CONTRA ${N(otro(par.agresor))}: ${arma(par.agresor)}.`, ids, "pareja"));
      if (par.postura === "mutua-hostil") {
        lista.push(entrada(en(0), "HOSTIL", `${N(otro(par.agresor))} RESPONDE: ${arma(otro(par.agresor))}.`, ids, "pareja"));
      }
      lista.push(entrada(en(v.K), "HOSTIL", `HOSTILIDADES ABIERTAS EN EL CONTACTO ${N(par.a)} / ${N(par.b)}.`, ids, "pareja"));
    } else {
      const detalle = TEXTO_POSTURA[par.postura].replace("{A}", N(par.a));
      lista.push(entrada(en(v.K), "COLISIÓN", `INTERFERENCIA EN EL CONTACTO ${N(par.a)} / ${N(par.b)}: ${detalle}.`, ids, "pareja"));
    }
    const s = superviviente(par);
    const desenlace = {
      aniquilacion: `DESENLACE ${par.id}: ANIQUILACIÓN DE ${N(par.a)} Y ${N(par.b)}.`,
      fusion: `DESENLACE ${par.id}: ${N(par.a)} Y ${N(par.b)} SE FUNDEN EN UNA SOLA RAMA.`,
      colapso: `DESENLACE ${par.id}: EL ANCLA CEDE.`,
    }[par.desenlace] || `DESENLACE ${par.id}: ${N(s)} SOBREVIVE. ${N(otro(s))} SE PIERDE.`;
    lista.push(entrada(en(v.H), "COLISIÓN", desenlace, ids, "pareja"));
    return lista;
  }

  const RUIDO = [
    () => "LATIDO DEL SUSTRATO · NOMINAL",
    () => "BARRIDO DE FIRMAS ω COMPLETADO",
    (t) => `ESCANEO ${t.id} · ω=${t.omega.toFixed(4)}`,
    (t, rng) => `AISLANTE DE FASE ${t.id} AL ${DENDRO.prng.entero(rng, 62, 99)}%`,
    () => "SINCRONÍA τ VERIFICADA",
    (t, rng) => `ECO EN EL CUADRANTE ${DENDRO.prng.elegir(rng, ["BAJO", "ALTO", "LATERAL", "DE LA COPA"])}`,
  ];

  // Ruido de un día local: cantidad, textos e instantes salen de su semilla.
  function ruidoDelDia(dia, tierras) {
    const inicio = DENDRO.reloj.aInstante(dia);
    const fin = DENDRO.reloj.aInstante(DENDRO.reloj.sumarDias(dia, 1));
    const rng = DENDRO.prng.crear(dia, "ruido");
    const n = 3 + Math.floor(rng() * 3) + Math.round(progresoDe(inicio + (fin - inicio) / 2).intensidad * 6);
    const lista = [];
    for (let k = 0; k < n; k++) {
      const tierra = DENDRO.prng.elegir(rng, tierras);
      const texto = DENDRO.prng.elegir(rng, RUIDO)(tierra, rng);
      lista.push(entrada(alMinuto(inicio + rng() * (fin - inicio)), "SISTEMA", texto, [], "ruido"));
    }
    return lista;
  }

  function construirRegistro(t, parejas, tierrasPorId, intensidad) {
    const { t0, tf } = hitos();
    const tierras = Object.values(tierrasPorId);
    const fijos = (datos().eventos || []).map((ev) => entrada(aMs(ev.instante), ev.tipo, ev.texto, ev.tierras, "fijo"));
    // Un evento de pareja que ya cuenta un evento fijo (mismo tipo, mismas tierras, menos de medio ciclo) sobra.
    const medioCiclo = DENDRO.tau.ciclo() / 2;
    const repetido = (ev) => fijos.some((f) => f.tipo === ev.tipo && Math.abs(f.instante - ev.instante) < medioCiclo &&
      f.tierras.some((x) => ev.tierras.includes(x)));
    const dePareja = parejas.flatMap((par) => eventosDePareja(par, tierrasPorId))
      .filter((ev) => ev.instante < tf && !repetido(ev));
    const colapso = [entrada(tf, "SISTEMA", "PÉRDIDA TOTAL DE COHESIÓN EN EL SUSTRATO M11.", [], "fijo")];

    const ruido = [];
    const ultimo = DENDRO.reloj.diaLocal(Math.min(t, tf - 1));
    let dia = t < t0 ? DENDRO.reloj.sumarDias(DENDRO.reloj.diaLocal(t), -2) : DENDRO.reloj.diaLocal(t0);
    for (; dia <= ultimo; dia = DENDRO.reloj.sumarDias(dia, 1)) ruido.push(...ruidoDelDia(dia, tierras));

    // La corrupción visual depende del día de hoy y de cada entrada, no de su posición en la lista.
    const hoy = DENDRO.reloj.diaLocal(t);
    return [...fijos, ...dePareja, ...colapso, ...ruido]
      .filter((ev) => ev.instante <= t)
      .sort((x, y) => y.instante - x.instante || (x.texto < y.texto ? 1 : -1))
      .map((ev) => ({
        ...ev,
        tau: DENDRO.tau.de(ev.instante),
        corrupta: DENDRO.prng.crear(hoy, "corrupcion", ev.instante, ev.texto)() < intensidad * 0.35,
      }));
  }

  // ── Ejes temporales para las vistas ───────────────────────────────────────
  function serieRamas(t) {
    const { t1, tf } = hitos(), lista = [];
    for (let ms = t1; ms < tf; ms += PASO_SERIE_RAMAS) {
      lista.push({ tau: DENDRO.tau.de(ms), instante: ms, valor: ramasAfectadas(ms, progresoDe(ms).p), futuro: ms > t });
    }
    lista.push({ tau: DENDRO.tau.de(tf), instante: tf, valor: ramasAfectadas(tf, 1), futuro: tf > t });
    return lista;
  }

  function mensajes(t) {
    return (datos().mensajes || [])
      .map((m) => ({ ...m, instante: aMs(m.instante) }))
      .filter((m) => m.instante <= t)
      .map((m) => ({ ...m, tau: DENDRO.tau.de(m.instante) }));
  }

  // ── Estado de un instante ─────────────────────────────────────────────────
  function calcularEstado(instante) {
    const t = alMinuto(aMs(instante));
    const { t0, tf } = hitos();
    const { p, fase, rectaFinal, intensidad } = progresoDe(t);
    const colapso = fase === 5;
    const tierrasDatos = datos().tierras || [];
    const tierrasPorId = {};
    for (const x of tierrasDatos) tierrasPorId[x.id] = x;

    const base = parejasBase();
    const parejas = base.map((par) => calcularPareja(par, t, tierrasPorId, colapso));
    const ataques = colapso ? [] : base.flatMap((par) => ataquesDe(par, t));
    const registro = construirRegistro(t, base, tierrasPorId, intensidad);

    const tierras = tierrasDatos.map((x) => {
      const par = parejas.find((y) => y.a === x.id || y.b === x.id);
      const estado = par ? estadoTierra(x.id, par) : colapso ? "COLAPSO" : "ESTABLE";
      return {
        ...x,
        pareja: par ? par.id : null,
        estado,
        estabilidad: par ? estabilidad(estado, par, t) : colapso ? 0 : 100,
        fusionadaCon: estado === "FUSIONADA" ? (par.a === x.id ? par.b : par.a) : null,
        eventos: registro.filter((ev) => ev.origen !== "ruido" && ev.tierras.includes(x.id)).reverse(),
      };
    });

    const modulosCaidos = [];
    if (p >= UMBRAL_COMUNICACIONES) modulosCaidos.push("comunicaciones");
    if (p >= UMBRAL_MONITOR) modulosCaidos.push("monitor");
    if (p >= UMBRAL_CONTENCION) modulosCaidos.push("contencion");

    return {
      instante: t, tau: DENDRO.tau.de(t), dia: DENDRO.reloj.diaLocal(t),
      fase, nombreFase: FASES[fase].nombre, nivelAlerta: FASES[fase].alerta, rectaFinal, p, intensidad,
      ramasAfectadas: ramasAfectadas(t, p),
      paraColapso: Math.max(0, tf - t),
      ejes: { desde: t0, hasta: tf, tauDesde: DENDRO.tau.de(t0), tauHasta: DENDRO.tau.de(tf), serieRamas: serieRamas(t) },
      tierras, parejas,
      parejaPrincipal: parejas.length ? parejaPrincipal(parejas) : null,
      ataques, registro,
      armas: datos().armas || {},
      archivo: datos().archivo || [],
      mensajesDisponibles: mensajes(t),
      modulosCaidos,
    };
  }

  DENDRO.cronologia = { calcularEstado, hitos };
})(window.DENDRO = window.DENDRO || {});
