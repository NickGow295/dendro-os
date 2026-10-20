// ★ Motor de cronología (02-diseno.md §4): calcularEstado("AAAA-MM-DD") → Estado.
// Función pura de la fecha: sin DOM, sin localStorage, sin Math.random(). Se ejecuta también en Node.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const datos = () => window.DENDRO_DATOS || {};

  // Umbrales y ventanas con nombre (02-diseno.md §4.4 y §4.5).
  const UMBRAL_COMUNICACIONES = 0.5;
  const UMBRAL_MONITOR = 0.7;
  const UMBRAL_CONTENCION = 0.9;
  const DIAS_APROXIMACION = 7;
  const DIAS_HOSTILIDADES = 3;          // dd 1..3
  const INICIO_ATAQUE_AGRESOR = -2;     // el agresor dispara desde dd −2
  const INICIO_ATAQUE_RESPUESTA = 0;    // en mutua-hostil, el otro responde desde el contacto
  const FIN_ATAQUE = 3;
  const SERIE_DESDE = -9, SERIE_HASTA = 2; // ventana de la serie de Δω para las minigráficas

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
  const dias = (a, b) => DENDRO.reloj.diasEntre(a, b);

  // ── Progreso, fase e intensidad de un día ─────────────────────────────────
  function progresoDe(fecha) {
    const c = cfg().cronologia;
    const p = limitar(dias(c.primeraColision, fecha) / dias(c.primeraColision, c.colapsoTotal), 0, 1);
    let fase;
    if (fecha < c.inicioAlerta) fase = 0;
    else if (fecha < c.primeraColision) fase = 1;
    else if (fecha >= c.colapsoTotal) fase = 5;
    else fase = p < 0.35 ? 2 : p < 0.8 ? 3 : 4;
    const intensidad = (fase < 2 ? 0.05 * fase : 0.1 + 0.9 * p * p) * cfg().efectos.glitchMaximo;
    return { p, fase, intensidad };
  }

  function ramasAfectadas(fecha, p) {
    const c = cfg().cronologia;
    if (fecha < c.primeraColision) return 0;
    return Math.round(2 * Math.pow(c.ramasAfectadasFinal / 2, p));
  }

  // ── Parejas ───────────────────────────────────────────────────────────────
  function superviviente(par) {
    return par.desenlace.startsWith("superviviente:") ? par.desenlace.split(":")[1] : null;
  }

  function estadoPareja(par, dd, colapso) {
    if (colapso) return "COLAPSO";
    if (dd < -DIAS_APROXIMACION) return "ESTABLE";
    if (dd < 0) return "APROXIMACIÓN";
    if (dd === 0) return "CONTACTO";
    if (dd <= DIAS_HOSTILIDADES) return esHostil(par.postura) ? "HOSTILIDADES" : "INTERFERENCIA";
    if (par.desenlace === "aniquilacion") return "ANIQUILADA";
    if (par.desenlace === "fusion") return "FUSIONADA";
    if (par.desenlace === "colapso") return "COLAPSO";
    return "SUPERVIVIENTE";
  }

  function deltaOmegaEn(dd, d0) {
    if (dd < -DIAS_APROXIMACION) return d0;
    return (d0 * Math.max(0, -dd)) / DIAS_APROXIMACION;
  }

  function calcularPareja(par, fecha, tierrasPorId, colapso) {
    const d0 = Math.abs(tierrasPorId[par.a].omega - tierrasPorId[par.b].omega);
    const dd = dias(par.contacto, fecha);
    const deltaOmega = colapso ? 0 : deltaOmegaEn(dd, d0);
    const serie = [];
    for (let k = SERIE_DESDE; k <= SERIE_HASTA; k++) {
      serie.push({ fecha: DENDRO.reloj.sumarDias(par.contacto, k), valor: deltaOmegaEn(k, d0), futuro: k > dd });
    }
    return {
      ...par,
      estado: estadoPareja(par, dd, colapso),
      hostil: !colapso && esHostil(par.postura) && dd >= INICIO_ATAQUE_AGRESOR && dd <= FIN_ATAQUE,
      deltaOmega0: d0,
      deltaOmega,
      separacion: d0 > 0 ? deltaOmega / d0 : 0,
      diasParaContacto: -dd,               // negativo: días desde el contacto
      serieDeltaOmega: serie,
    };
  }

  function ataquesDe(par, dd) {
    if (!esHostil(par.postura) || dd < INICIO_ATAQUE_AGRESOR || dd > FIN_ATAQUE) return [];
    const progreso = (dd - INICIO_ATAQUE_AGRESOR) / (FIN_ATAQUE - INICIO_ATAQUE_AGRESOR);
    const otro = (id) => (id === par.a ? par.b : par.a);
    const atacantes = [par.agresor];
    if (par.postura === "mutua-hostil" && dd >= INICIO_ATAQUE_RESPUESTA) atacantes.push(otro(par.agresor));
    const lista = [];
    for (const desde of atacantes) {
      for (const tipo of (par.armas && par.armas[desde]) || []) {
        lista.push({ pareja: par.id, desde, hacia: otro(desde), tipo, progreso });
      }
    }
    return lista;
  }

  // Pareja que abre COLISIÓN (02-diseno.md §4.5).
  function parejaPrincipal(parejas) {
    const activas = parejas.filter((x) => ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"].includes(x.estado));
    if (activas.length) return activas.reduce((m, x) => (x.contacto > m.contacto ? x : m)).id;
    const aproximando = parejas.filter((x) => x.estado === "APROXIMACIÓN");
    if (aproximando.length) return aproximando.reduce((m, x) => (x.diasParaContacto < m.diasParaContacto ? x : m)).id;
    const estables = parejas.filter((x) => x.estado === "ESTABLE");
    if (estables.length) return estables.reduce((m, x) => (x.contacto < m.contacto ? x : m)).id;
    return parejas.reduce((m, x) => (x.contacto > m.contacto ? x : m)).id;
  }

  // ── Tierras ───────────────────────────────────────────────────────────────
  function estadoTierra(id, par) {
    if (par.estado === "SUPERVIVIENTE") return superviviente(par) === id ? "SUPERVIVIENTE" : "ANIQUILADA";
    return par.estado;
  }

  function estabilidad(estado, par) {
    if (estado === "APROXIMACIÓN") return Math.round(100 - (60 * (DIAS_APROXIMACION + -par.diasParaContacto)) / DIAS_APROXIMACION);
    return ESTABILIDAD[estado];
  }

  // ── Registro ──────────────────────────────────────────────────────────────
  function hora(rng) {
    const dos = (n) => String(n).padStart(2, "0");
    return `${dos(Math.floor(rng() * 24))}:${dos(Math.floor(rng() * 60))}:${dos(Math.floor(rng() * 60))}`;
  }

  function entrada(fecha, tipo, texto, tierras, origen) {
    return { fecha, hora: hora(DENDRO.prng.crear(fecha, texto)), tipo, texto, tierras: tierras || [], origen };
  }

  function eventosDePareja(par, tierrasPorId) {
    const N = (id) => tierrasPorId[id].nombre.toLocaleUpperCase("es");
    const arma = (id) => ((par.armas && par.armas[id]) || []).map((t) => (datos().armas[t] || { nombre: t }).nombre.toLocaleUpperCase("es")).join(" Y ");
    const otro = (id) => (id === par.a ? par.b : par.a);
    const en = (k) => DENDRO.reloj.sumarDias(par.contacto, k);
    const ids = [par.a, par.b];
    const lista = [
      entrada(en(-DIAS_APROXIMACION), "COLISIÓN", `CONVERGENCIA DETECTADA: ${N(par.a)} / ${N(par.b)} (${par.id}).`, ids, "pareja"),
      entrada(en(0), "COLISIÓN", `CONTACTO CONFIRMADO: ${N(par.a)} / ${N(par.b)} (${par.id}).`, ids, "pareja"),
    ];
    if (esHostil(par.postura)) {
      lista.push(entrada(en(INICIO_ATAQUE_AGRESOR), "HOSTIL", `${N(par.agresor)} ABRE FUEGO CONTRA ${N(otro(par.agresor))}: ${arma(par.agresor)}.`, ids, "pareja"));
      if (par.postura === "mutua-hostil") {
        lista.push(entrada(en(INICIO_ATAQUE_RESPUESTA), "HOSTIL", `${N(otro(par.agresor))} RESPONDE: ${arma(otro(par.agresor))}.`, ids, "pareja"));
      }
      lista.push(entrada(en(1), "HOSTIL", `HOSTILIDADES ABIERTAS EN EL CONTACTO ${N(par.a)} / ${N(par.b)}.`, ids, "pareja"));
    } else {
      const detalle = TEXTO_POSTURA[par.postura].replace("{A}", N(par.a));
      lista.push(entrada(en(1), "COLISIÓN", `INTERFERENCIA EN EL CONTACTO ${N(par.a)} / ${N(par.b)}: ${detalle}.`, ids, "pareja"));
    }
    const s = superviviente(par);
    const desenlace = {
      aniquilacion: `DESENLACE ${par.id}: ANIQUILACIÓN DE ${N(par.a)} Y ${N(par.b)}.`,
      fusion: `DESENLACE ${par.id}: ${N(par.a)} Y ${N(par.b)} SE FUNDEN EN UNA SOLA RAMA.`,
      colapso: `DESENLACE ${par.id}: EL ANCLA CEDE.`,
    }[par.desenlace] || `DESENLACE ${par.id}: ${N(s)} SOBREVIVE. ${N(otro(s))} SE PIERDE.`;
    lista.push(entrada(en(DIAS_HOSTILIDADES + 1), "COLISIÓN", desenlace, ids, "pareja"));
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

  function ruidoDelDia(fecha, tierras) {
    const rng = DENDRO.prng.crear(fecha, "ruido");
    const n = 3 + Math.floor(rng() * 3) + Math.round(progresoDe(fecha).intensidad * 6);
    const lista = [];
    for (let k = 0; k < n; k++) {
      const tierra = DENDRO.prng.elegir(rng, tierras);
      const texto = DENDRO.prng.elegir(rng, RUIDO)(tierra, rng);
      lista.push({ fecha, hora: hora(rng), tipo: "SISTEMA", texto, tierras: [], origen: "ruido" });
    }
    return lista;
  }

  function construirRegistro(fecha, parejasDatos, tierrasPorId, intensidad) {
    const c = cfg().cronologia;
    const tierras = Object.values(tierrasPorId);
    const fijos = (datos().eventos || []).map((ev) => ({ ...ev, hora: hora(DENDRO.prng.crear(ev.fecha, ev.texto)), origen: "fijo" }));
    const repetido = (ev) => fijos.some((f) => f.fecha === ev.fecha && f.tipo === ev.tipo && f.tierras.some((t) => ev.tierras.includes(t)));
    const dePareja = parejasDatos.flatMap((par) => eventosDePareja(par, tierrasPorId))
      .filter((ev) => ev.fecha < c.colapsoTotal && !repetido(ev));
    const colapso = [entrada(c.colapsoTotal, "SISTEMA", "PÉRDIDA TOTAL DE COHESIÓN EN EL SUSTRATO M11.", [], "fijo")];

    const ruido = [];
    const ultimoDia = fecha < c.colapsoTotal ? fecha : DENDRO.reloj.sumarDias(c.colapsoTotal, -1);
    let dia = fecha < c.inicioAlerta ? DENDRO.reloj.sumarDias(fecha, -2) : c.inicioAlerta;
    for (; dia <= ultimoDia; dia = DENDRO.reloj.sumarDias(dia, 1)) ruido.push(...ruidoDelDia(dia, tierras));

    const corrupcion = DENDRO.prng.crear(fecha, "corrupcion");
    return [...fijos, ...dePareja, ...colapso, ...ruido]
      .filter((ev) => ev.fecha <= fecha)
      .sort((x, y) => (x.fecha + x.hora + x.texto < y.fecha + y.hora + y.texto ? 1 : -1))
      .map((ev) => ({ ...ev, dia: dias(c.inicioAlerta, ev.fecha), corrupta: corrupcion() < intensidad * 0.35 }));
  }

  // ── Ejes temporales para las vistas ───────────────────────────────────────
  function calendario() {
    const c = cfg().cronologia, lista = [];
    for (let f = c.inicioAlerta, d = 0; f <= c.colapsoTotal; f = DENDRO.reloj.sumarDias(f, 1), d++) lista.push({ dia: d, fecha: f });
    return lista;
  }

  function serieRamas(hoy) {
    const c = cfg().cronologia, lista = [];
    for (let f = c.primeraColision; f <= c.colapsoTotal; f = DENDRO.reloj.sumarDias(f, 1)) {
      lista.push({ fecha: f, valor: ramasAfectadas(f, progresoDe(f).p), futuro: f > hoy });
    }
    return lista;
  }

  // ── Estado del día ────────────────────────────────────────────────────────
  function calcularEstado(fecha) {
    const c = cfg().cronologia;
    const { p, fase, intensidad } = progresoDe(fecha);
    const colapso = fase === 5;
    const tierrasDatos = datos().tierras || [];
    const parejasDatos = datos().colisiones || [];
    const tierrasPorId = {};
    for (const t of tierrasDatos) tierrasPorId[t.id] = t;

    const parejas = parejasDatos.map((par) => calcularPareja(par, fecha, tierrasPorId, colapso));
    const ataques = colapso ? [] : parejasDatos.flatMap((par) => ataquesDe(par, dias(par.contacto, fecha)));
    const registro = construirRegistro(fecha, parejasDatos, tierrasPorId, intensidad);

    const tierras = tierrasDatos.map((t) => {
      const par = parejas.find((x) => x.a === t.id || x.b === t.id);
      const estado = par ? estadoTierra(t.id, par) : colapso ? "COLAPSO" : "ESTABLE";
      return {
        ...t,
        pareja: par ? par.id : null,
        estado,
        estabilidad: par ? estabilidad(estado, par) : colapso ? 0 : 100,
        fusionadaCon: estado === "FUSIONADA" ? (par.a === t.id ? par.b : par.a) : null,
        eventos: registro.filter((ev) => ev.origen !== "ruido" && ev.tierras.includes(t.id)).reverse(),
      };
    });

    const modulosCaidos = [];
    if (p >= UMBRAL_COMUNICACIONES) modulosCaidos.push("comunicaciones");
    if (p >= UMBRAL_MONITOR) modulosCaidos.push("monitor");
    if (p >= UMBRAL_CONTENCION) modulosCaidos.push("contencion");

    return {
      fecha, fase, nombreFase: FASES[fase].nombre, nivelAlerta: FASES[fase].alerta, p, intensidad,
      ramasAfectadas: ramasAfectadas(fecha, p),
      diasParaColapso: Math.max(0, dias(fecha, c.colapsoTotal)),
      diaHoy: dias(c.inicioAlerta, fecha),
      diasTotales: dias(c.inicioAlerta, c.colapsoTotal),
      calendario: calendario(),
      serieRamas: serieRamas(fecha),
      tierras, parejas,
      parejaPrincipal: parejas.length ? parejaPrincipal(parejas) : null,
      ataques, registro,
      armas: datos().armas || {},
      archivo: datos().archivo || [],
      mensajesDisponibles: (datos().mensajes || []).filter((m) => m.fecha <= fecha),
      modulosCaidos,
    };
  }

  DENDRO.cronologia = { calcularEstado };
})(window.DENDRO = window.DENDRO || {});
