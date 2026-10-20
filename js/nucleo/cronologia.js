// ★ Motor de cronología (02-diseno.md §4): calcularEstado(instante) → Estado.
// Función pura del instante (ms o "AAAA-MM-DDThh:mm" local), truncado al minuto: sin DOM, sin
// localStorage, sin Math.random(). Se ejecuta también en Node.
// Lo que no depende del instante (parejas, registro base, series) se calcula una vez y se memoiza.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const datos = () => window.DENDRO_DATOS || {};

  // Umbrales con nombre (02-diseno.md §4.3).
  const UMBRAL_COMUNICACIONES = 0.5;
  const UMBRAL_MONITOR = 0.7;
  const UMBRAL_CONTENCION = 0.9;
  const PASO_SERIES = 3 * 3600000;           // muestras de las gráficas de ramas afectadas y de N̂
  const MUESTRAS_SERIE_DELTA = 48;            // puntos de la minigráfica de Δω de cada pareja
  const MUESTRAS_SERIE_FIRMAS = 64;
  const AGRUPAR_CONTACTOS = 3;                // más contactos generados que esto en un pulso → una línea

  const FASES = [
    { nombre: "NOMINAL", alerta: "VERDE" },
    { nombre: "ANOMALÍA", alerta: "ÁMBAR" },
    { nombre: "CONTACTO", alerta: "NARANJA" },
    { nombre: "CASCADA", alerta: "ROJO" },
    { nombre: "CRÍTICO", alerta: "NEGRO" },
    { nombre: "COLAPSO", alerta: "—" },
  ];
  const ESTABILIDAD = { ESTABLE: 100, CONTACTO: 25, HOSTILIDADES: 10, INTERFERENCIA: 10, ANIQUILADA: 0, SUPERVIVIENTE: 35, FUSIONADA: 40, COLAPSO: 0 };
  const ACTIVOS = ["APROXIMACIÓN", "CONTACTO", "HOSTILIDADES", "INTERFERENCIA"];
  const EN_TRAMO = ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"];
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
  const MAYUS = (s) => String(s).toLocaleUpperCase("es");

  // Cuántos valores de una lista ascendente son ≤ x.
  function contarHasta(lista, x) {
    let lo = 0, hi = lista.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (lista[m] <= x) lo = m + 1; else hi = m; }
    return lo;
  }

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
    return par.desenlace.startsWith("superviviente:") ? par.desenlace.slice("superviviente:".length) : null;
  }

  // Ramas que el desenlace destruye (para las gráficas).
  function destruidas(par) {
    if (par.desenlace === "fusion") return [];
    const s = superviviente(par);
    return s ? [s === par.a ? par.b : par.a] : [par.a, par.b];
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

  const deltaOmegaEn = (dt, v, d0) => d0 * limitar(-dt / v.A, 0, 1);

  // Parejas nombradas y generadas con su contacto en ms, ventanas y Δω₀; índices por rama y contactos ordenados.
  let baseCache = null;
  function base() {
    const cat = DENDRO.multiverso.catalogo();
    const lista = datos().colisiones || [];
    if (baseCache && baseCache.lista === lista && baseCache.cat === cat && baseCache.clave === hitos().clave) return baseCache;
    const completar = (par, nombrada) => {
      const contacto = aMs(par.contacto);
      const d0 = Math.abs(cat.porCodigo[par.a].omega - cat.porCodigo[par.b].omega);
      return { ...par, nombrada, contacto, ventanas: ventanas(contacto), deltaOmega0: d0 };
    };
    const parejas = [...lista.map((p) => completar(p, true)), ...cat.parejas.map((p) => completar(p, false))];
    const porId = {}, deRama = {};
    for (const par of parejas) { porId[par.id] = par; deRama[par.a] = par; deRama[par.b] = par; }
    baseCache = {
      lista, cat, clave: hitos().clave, parejas, porId, deRama,
      contactos: parejas.map((p) => p.contacto).sort((a, b) => a - b),
      desgarro: (parejas.find((p) => p.desenlace === "colapso") || {}).contacto,
    };
    baseCache.registro = registroBase(baseCache);
    baseCache.series = seriesBase();
    return baseCache;
  }

  function calcularPareja(par, t, colapso) {
    const v = par.ventanas, dt = t - par.contacto;
    const deltaOmega = colapso ? 0 : deltaOmegaEn(dt, v, par.deltaOmega0);
    return {
      ...par,
      estado: estadoPareja(par, dt, v, colapso),
      hostil: !colapso && esHostil(par.postura) && dt >= v.ataque && dt < v.H,
      deltaOmega,
      separacion: par.deltaOmega0 > 0 ? deltaOmega / par.deltaOmega0 : 0,
      paraContacto: par.contacto - t,          // > 0: falta; < 0: ya pasó
      desvanecimiento: limitar((dt - v.H) / (v.H / 2), 0, 1),
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
    const reciente = (lista) => lista.reduce((m, x) => (x.contacto > m.contacto ? x : m));
    const enTramo = parejas.filter((x) => EN_TRAMO.includes(x.estado));
    const nombradasEnTramo = enTramo.filter((x) => x.nombrada);
    if (nombradasEnTramo.length) return reciente(nombradasEnTramo).id;
    if (enTramo.length) return reciente(enTramo).id;
    const aproximando = parejas.filter((x) => x.estado === "APROXIMACIÓN");
    if (aproximando.length) {
      const grupo = aproximando.some((x) => x.nombrada) ? aproximando.filter((x) => x.nombrada) : aproximando;
      return grupo.reduce((m, x) => (x.paraContacto < m.paraContacto ? x : m)).id;
    }
    const estables = parejas.filter((x) => x.estado === "ESTABLE");
    if (estables.length) return estables.reduce((m, x) => (x.contacto < m.contacto ? x : m)).id;
    return reciente(parejas).id;
  }

  // ── Cohesión N̂ de MYTH (§4.6) ─────────────────────────────────────────────
  function cohesionEn(t, b) {
    const { t1, tr, tf } = hitos();
    if (t >= tf) return 0;
    if (t < t1) return 1;
    let n = 1 - contarHasta(b.contactos, t) / (b.contactos.length + 1);
    if (b.desgarro !== undefined && t >= b.desgarro) n *= 0.5;
    if (t >= tr) n *= (tf - t) / (tf - tr);
    return n;
  }

  function guardianes(t) {
    return ((datos().myth || {}).guardianes || []).map((g) => {
      const cae = aMs(g.cae);
      return { id: g.id, nombre: g.nombre, titulo: g.titulo, cae, caido: t >= cae };
    });
  }

  // ── Tierras ───────────────────────────────────────────────────────────────
  function estadoTierra(codigo, par) {
    if (par.estado === "SUPERVIVIENTE") return superviviente(par) === codigo ? "SUPERVIVIENTE" : "ANIQUILADA";
    return par.estado;
  }

  function estabilidad(estado, par, t) {
    if (estado === "APROXIMACIÓN") return Math.round(100 - 60 * (1 + (t - par.contacto) / par.ventanas.A));
    return ESTABILIDAD[estado];
  }

  // Una rama del catálogo con su estado en este minuto.
  function tierraEn(nodo, par, t, colapso, cohesion) {
    if (nodo.raiz) return { ...nodo, pareja: null, estado: colapso ? "COLAPSO" : "ESTABLE", estabilidad: Math.round(cohesion * 100), cohesion, fusionadaCon: null };
    const estado = par ? estadoTierra(nodo.codigo, par) : colapso ? "COLAPSO" : "ESTABLE";
    return {
      ...nodo,
      pareja: par ? par.id : null,
      estado,
      estabilidad: par ? estabilidad(estado, par, t) : colapso ? 0 : 100,
      fusionadaCon: estado === "FUSIONADA" ? (par.a === nodo.codigo ? par.b : par.a) : null,
    };
  }

  // ── Registro (§4.7) ───────────────────────────────────────────────────────
  function entrada(instante, tipo, texto, tierras, origen) {
    return { instante, tipo, texto, tierras: tierras || [], origen };
  }

  // Nombradas: convergencia, ataques, contacto, interferencia u hostilidades y desenlace.
  // Generadas: solo contacto, primer ataque y desenlace, con su código.
  function eventosDePareja(par, cat) {
    const N = (c) => (cat.porCodigo[c].nombre ? MAYUS(cat.porCodigo[c].nombre) : c);
    const arma = (c) => ((par.armas && par.armas[c]) || []).map((t) => MAYUS((datos().armas[t] || { nombre: t }).nombre)).join(" Y ");
    const otro = (c) => (c === par.a ? par.b : par.a);
    const v = par.ventanas, en = (dt) => alMinuto(par.contacto + dt);
    const ids = [par.a, par.b];
    const lista = [];
    if (par.nombrada) lista.push(entrada(en(-v.A), "COLISIÓN", `CONVERGENCIA DETECTADA: ${N(par.a)} / ${N(par.b)} (${par.id}).`, ids, "pareja"));
    lista.push(entrada(en(0), "COLISIÓN", `CONTACTO ${par.nombrada ? "CONFIRMADO" : "CATALOGADO"}: ${N(par.a)} / ${N(par.b)} (${par.id}).`, ids, par.nombrada ? "pareja" : "contacto"));
    if (esHostil(par.postura)) {
      lista.push(entrada(en(v.ataque), "HOSTIL", `${N(par.agresor)} ABRE FUEGO CONTRA ${N(otro(par.agresor))}: ${arma(par.agresor)}.`, ids, "pareja"));
      if (par.nombrada && par.postura === "mutua-hostil") {
        lista.push(entrada(en(0), "HOSTIL", `${N(otro(par.agresor))} RESPONDE: ${arma(otro(par.agresor))}.`, ids, "pareja"));
      }
      if (par.nombrada) lista.push(entrada(en(v.K), "HOSTIL", `HOSTILIDADES ABIERTAS EN EL CONTACTO ${N(par.a)} / ${N(par.b)}.`, ids, "pareja"));
    } else if (par.nombrada) {
      const detalle = TEXTO_POSTURA[par.postura].replace("{A}", N(par.a));
      lista.push(entrada(en(v.K), "COLISIÓN", `INTERFERENCIA EN EL CONTACTO ${N(par.a)} / ${N(par.b)}: ${detalle}.`, ids, "pareja"));
    }
    const s = superviviente(par);
    const desenlace = {
      aniquilacion: `DESENLACE ${par.id}: ANIQUILACIÓN DE ${N(par.a)} Y ${N(par.b)}.`,
      fusion: `DESENLACE ${par.id}: ${N(par.a)} Y ${N(par.b)} SE FUNDEN EN UNA SOLA RAMA.`,
      colapso: `DESENLACE ${par.id}: ORIGEN CEDE. LA BASE DE MYTH SE DESGARRA.`,
    }[par.desenlace] || `DESENLACE ${par.id}: ${N(s)} SOBREVIVE. ${N(otro(s))} SE PIERDE.`;
    lista.push(entrada(en(v.H), "COLISIÓN", desenlace, ids, "pareja"));
    return lista;
  }

  // Si en un mismo pulso coinciden más de AGRUPAR_CONTACTOS contactos generados, van en una línea.
  function agruparContactos(lista) {
    const porPulso = new Map();
    for (const ev of lista) {
      const pulso = DENDRO.tau.corto(ev.instante);
      if (!porPulso.has(pulso)) porPulso.set(pulso, []);
      porPulso.get(pulso).push(ev);
    }
    const salida = [];
    for (const [pulso, grupo] of porPulso) {
      if (grupo.length <= AGRUPAR_CONTACTOS) { salida.push(...grupo); continue; }
      const ultimo = Math.max(...grupo.map((ev) => ev.instante));
      salida.push(entrada(ultimo, "COLISIÓN", `${grupo.length} CONTACTOS CATALOGADOS EN EL PULSO ${pulso}.`, grupo.flatMap((ev) => ev.tierras), "contacto"));
    }
    return salida;
  }

  const RUIDO = [
    () => "LATIDO DEL SUSTRATO · NOMINAL",
    () => "BARRIDO DE FIRMAS ω COMPLETADO",
    (n) => `ESCANEO ${n.codigo} · ω=${n.omega.toFixed(4)}`,
    (n, rng) => `AISLANTE DE FASE ${n.codigo} AL ${DENDRO.prng.entero(rng, 62, 99)}%`,
    () => "SINCRONÍA τ VERIFICADA",
    (n, rng) => `ECO EN EL CUADRANTE ${DENDRO.prng.elegir(rng, ["BAJO", "ALTO", "LATERAL", "DE LA COPA"])}`,
  ];

  // Ruido de un día local: cantidad, textos e instantes salen de su semilla.
  function ruidoDelDia(dia, nodos) {
    const inicio = DENDRO.reloj.aInstante(dia);
    const fin = DENDRO.reloj.aInstante(DENDRO.reloj.sumarDias(dia, 1));
    const rng = DENDRO.prng.crear(dia, "ruido");
    const n = 3 + Math.floor(rng() * 3) + Math.round(progresoDe(inicio + (fin - inicio) / 2).intensidad * 6);
    const lista = [];
    for (let k = 0; k < n; k++) {
      const nodo = DENDRO.prng.elegir(rng, nodos);
      const texto = DENDRO.prng.elegir(rng, RUIDO)(nodo, rng);
      lista.push(entrada(alMinuto(inicio + rng() * (fin - inicio)), "SISTEMA", texto, [], "ruido"));
    }
    return lista;
  }

  const ordenRegistro = (x, y) => y.instante - x.instante || (x.texto < y.texto ? 1 : -1);

  function nodosDeRuido(cat) {
    return cat.nodos.filter((n) => !n.baja && !n.raiz);
  }

  // Registro completo hasta el colapso, de más reciente a más antiguo; cada minuto solo se recorta.
  function registroBase(b) {
    const { t0, tf } = hitos();
    const fijos = (datos().eventos || []).map((ev) => entrada(aMs(ev.instante), ev.tipo, ev.texto, ev.tierras, "fijo"));
    // Un evento de pareja que ya cuenta un evento fijo (mismo tipo, mismas tierras, menos de medio ciclo) sobra.
    const medioCiclo = DENDRO.tau.ciclo() / 2;
    const repetido = (ev) => fijos.some((f) => f.tipo === ev.tipo && Math.abs(f.instante - ev.instante) < medioCiclo &&
      f.tierras.some((x) => ev.tierras.includes(x)));
    const dePareja = b.parejas.flatMap((par) => eventosDePareja(par, b.cat)).filter((ev) => ev.instante < tf && !repetido(ev));
    const contactos = agruparContactos(dePareja.filter((ev) => ev.origen === "contacto"));
    const resto = dePareja.filter((ev) => ev.origen !== "contacto");
    const colapso = [entrada(tf, "SISTEMA", "MYTH HA PERDIDO LA COHESIÓN.", [], "fijo")];
    const ruido = [];
    const nodos = nodosDeRuido(b.cat);
    for (let dia = DENDRO.reloj.diaLocal(t0); dia <= DENDRO.reloj.diaLocal(tf - 1); dia = DENDRO.reloj.sumarDias(dia, 1)) {
      ruido.push(...ruidoDelDia(dia, nodos));
    }
    return [...fijos, ...resto, ...contactos, ...colapso, ...ruido]
      .filter((ev) => ev.instante <= tf)
      .sort(ordenRegistro)
      .map((ev) => ({ ...ev, tau: DENDRO.tau.de(ev.instante) }));
  }

  // La corrupción visual depende del día de hoy y de cada entrada, no de su posición en la lista.
  let corrupcionCache = { dia: null, mapa: null };
  function corrupta(hoy, ev, intensidad) {
    if (corrupcionCache.dia !== hoy) corrupcionCache = { dia: hoy, mapa: new Map() };
    const clave = ev.instante + "|" + ev.texto;
    let valor = corrupcionCache.mapa.get(clave);
    if (valor === undefined) {
      valor = DENDRO.prng.crear(hoy, "corrupcion", ev.instante, ev.texto)();
      corrupcionCache.mapa.set(clave, valor);
    }
    return valor < intensidad * 0.35;
  }

  function construirRegistro(t, b, intensidad) {
    const { t0 } = hitos();
    const lista = b.registro;
    let lo = 0, hi = lista.length;                 // primera entrada con instante ≤ t (lista descendente)
    while (lo < hi) { const m = (lo + hi) >> 1; if (lista[m].instante > t) lo = m + 1; else hi = m; }
    let visibles = lista.slice(lo);
    if (t < t0) {                                  // antes de la alerta: el ruido de los días previos
      const extra = [], nodos = nodosDeRuido(b.cat);
      for (let dia = DENDRO.reloj.sumarDias(DENDRO.reloj.diaLocal(t), -2); dia < DENDRO.reloj.diaLocal(t0); dia = DENDRO.reloj.sumarDias(dia, 1)) {
        extra.push(...ruidoDelDia(dia, nodos).filter((ev) => ev.instante <= t).map((ev) => ({ ...ev, tau: DENDRO.tau.de(ev.instante) })));
      }
      visibles = [...visibles, ...extra].sort(ordenRegistro);
    }
    const hoy = DENDRO.reloj.diaLocal(t);
    return visibles.map((ev) => ({ ...ev, corrupta: corrupta(hoy, ev, intensidad) }));
  }

  // ── Series para las vistas ────────────────────────────────────────────────
  function seriesBase() {
    const { t1, tf } = hitos(), ramas = [], cohesion = [];
    const muestras = [];
    for (let ms = t1; ms < tf; ms += PASO_SERIES) muestras.push(ms);
    muestras.push(tf);
    for (const ms of muestras) {
      ramas.push({ tau: DENDRO.tau.de(ms), instante: ms, valor: ramasAfectadas(ms, progresoDe(ms).p) });
      cohesion.push({ tau: DENDRO.tau.de(ms), instante: ms, valor: null });
    }
    return { ramas, cohesion };
  }

  function conFuturo(serie, t) {
    return serie.map((x) => ({ ...x, futuro: x.instante > t }));
  }

  function serieCohesion(t, b) {
    for (const x of b.series.cohesion) if (x.valor === null) x.valor = cohesionEn(x.instante, b);
    return conFuturo(b.series.cohesion, t);
  }

  // Instante de referencia de una pareja del Estado (o null si viene del catálogo).
  const instanteDe = (par) => (par.paraContacto === undefined ? null : par.contacto - par.paraContacto);

  // Δω de una pareja desde antes de su aproximación hasta su desenlace (minigráfica de COLISIÓN).
  function serieDeltaOmega(par, n) {
    n = n || MUESTRAS_SERIE_DELTA;
    const v = par.ventanas, t = instanteDe(par);
    const desde = par.contacto - 1.3 * v.A, hasta = par.contacto + v.H, serie = [];
    for (let i = 0; i < n; i++) {
      const ms = desde + ((hasta - desde) * i) / (n - 1);
      serie.push({ tau: DENDRO.tau.de(ms), instante: ms, valor: deltaOmegaEn(ms - par.contacto, v, par.deltaOmega0), futuro: t !== null && ms > t });
    }
    return serie;
  }

  // Firmas ω de las dos ramas de una pareja (RF-19): convergen al ω medio, se cortan en la rama
  // destruida y se unen en la fusión. Pura: las vistas pueden llamarla.
  function serieFirmas(par, n) {
    n = n || MUESTRAS_SERIE_FIRMAS;
    const cat = DENDRO.multiverso.catalogo(), { tf } = hitos();
    const v = par.ventanas, t = instanteDe(par);
    const wa0 = cat.porCodigo[par.a].omega, wb0 = cat.porCodigo[par.b].omega;
    const media = (wa0 + wb0) / 2, s = wa0 >= media ? 1 : -1;
    const muertas = destruidas(par);
    const desde = par.contacto - 1.3 * v.A, hasta = par.contacto + 2 * v.H, puntos = [];
    for (let i = 0; i < n; i++) {
      const ms = desde + ((hasta - desde) * i) / (n - 1), dt = ms - par.contacto;
      const d = deltaOmegaEn(dt, v, par.deltaOmega0), resuelta = dt >= v.H, fin = ms >= tf;
      puntos.push({
        tau: DENDRO.tau.de(ms), instante: ms,
        wa: fin || (resuelta && muertas.includes(par.a)) ? null : media + (s * d) / 2,
        wb: fin || (resuelta && muertas.includes(par.b)) ? null : media - (s * d) / 2,
        futuro: t !== null && ms > t,
      });
    }
    const tau = (dt) => DENDRO.tau.de(par.contacto + dt);
    return {
      puntos,
      marcas: { aproximacion: tau(-v.A), contacto: tau(0), tramo: tau(v.K), desenlace: tau(v.H), destruidas: muertas, fusion: par.desenlace === "fusion" },
    };
  }

  // ── Mensajes, archivo y revelaciones (§4.7) ───────────────────────────────
  // Lo emitido hasta t. Qué se puede leer lo decide la vista con la credencial, no el motor.
  function mensajes(t) {
    return (datos().mensajes || [])
      .map((m) => ({ ...m, instante: aMs(m.instante) }))
      .filter((m) => m.instante <= t)
      .map((m) => ({ ...m, tau: DENDRO.tau.de(m.instante) }));
  }

  function archivo(t) {
    return (datos().archivo || []).filter((d) => !d.desde || aMs(d.desde) <= t).map((d) => {
      const doc = { ...d };
      if (d.desde) doc.revisado = DENDRO.tau.de(aMs(d.desde));
      if (d.revision && aMs(d.revision.desde) <= t) {
        doc.rev = d.revision.rev;
        doc.revisado = DENDRO.tau.de(aMs(d.revision.desde));
        doc.texto = [...d.texto, ...d.revision.texto];
      }
      delete doc.revision;
      return doc;
    });
  }

  function hitosDe(t) {
    const r = datos().revelaciones || {}, hitos = {};
    for (const [clave, instante] of Object.entries(r)) hitos[clave] = t >= aMs(instante);
    return hitos;
  }

  // Silueta del Injertador (lore §3.1): de 0.15 al aparecer a 1 en el último minuto antes del colapso.
  function siluetaDe(t) {
    const r = datos().revelaciones || {}, { tf } = hitos();
    if (!r.silueta || t < aMs(r.silueta) || t >= tf) return { visible: false, opacidad: 0 };
    const desde = aMs(r.silueta), hasta = tf - DENDRO.reloj.MINUTO;
    return { visible: true, opacidad: 0.15 + 0.85 * limitar((t - desde) / (hasta - desde), 0, 1) };
  }

  // ── Estado de un instante ─────────────────────────────────────────────────
  function calcularEstado(instante) {
    const t = alMinuto(aMs(instante));
    const { t0, tf } = hitos();
    const { p, fase, rectaFinal, intensidad } = progresoDe(t);
    const colapso = fase === 5;
    const b = base(), cat = b.cat;

    const parejas = b.parejas.map((par) => calcularPareja(par, t, colapso));
    const porId = {};
    for (const par of parejas) porId[par.id] = par;
    const ataques = colapso ? [] : b.parejas.flatMap((par) => ataquesDe(par, t));
    const registro = construirRegistro(t, b, intensidad);
    const cohesion = cohesionEn(t, b);

    const eventosDe = {};
    for (const ev of registro) {
      if (ev.origen === "ruido") continue;
      for (const c of ev.tierras) if (cat.porCodigo[c] && cat.porCodigo[c].nombrada) (eventosDe[c] = eventosDe[c] || []).push(ev);
    }
    const nombradas = cat.nodos.filter((n) => n.nombrada).map((n) => {
      const par = b.deRama[n.codigo] ? porId[b.deRama[n.codigo].id] : null;
      return { ...tierraEn(n, par, t, colapso, cohesion), eventos: (eventosDe[n.codigo] || []).reverse() };
    });
    const memo = new Map(nombradas.map((x) => [x.codigo, x]));
    const porCodigo = (c) => {
      if (!memo.has(c)) {
        const nodo = cat.porCodigo[c];
        if (!nodo || nodo.baja) return null;
        const par = b.deRama[c] ? porId[b.deRama[c].id] : null;
        const eventos = nodo.raiz
          ? registro.filter((ev) => ev.origen === "fijo" && /MYTH|N̂/.test(ev.texto)).reverse()
          : registro.filter((ev) => ev.origen !== "ruido" && ev.tierras.includes(c)).reverse();
        memo.set(c, { ...tierraEn(nodo, par, t, colapso, cohesion), eventos });
      }
      return memo.get(c);
    };

    const modulosCaidos = [];
    if (p >= UMBRAL_COMUNICACIONES) modulosCaidos.push("comunicaciones");
    if (p >= UMBRAL_MONITOR) modulosCaidos.push("monitor");
    if (p >= UMBRAL_CONTENCION) modulosCaidos.push("contencion");

    return {
      instante: t, tau: DENDRO.tau.de(t), dia: DENDRO.reloj.diaLocal(t),
      fase, nombreFase: FASES[fase].nombre, nivelAlerta: FASES[fase].alerta, rectaFinal, p, intensidad,
      ramasAfectadas: ramasAfectadas(t, p),
      ramasCatalogadas: cat.total,
      enColision: 2 * contarHasta(b.contactos, t),
      paraColapso: Math.max(0, tf - t),
      myth: { cohesion, guardianes: guardianes(t) },
      ejes: {
        desde: t0, hasta: tf, tauDesde: DENDRO.tau.de(t0), tauHasta: DENDRO.tau.de(tf),
        serieRamas: conFuturo(b.series.ramas, t), serieCohesion: serieCohesion(t, b),
      },
      tierras: { nombradas, porCodigo },
      parejas,
      activas: parejas.filter((x) => ACTIVOS.includes(x.estado)).map((x) => x.id),
      parejaPrincipal: parejas.length ? parejaPrincipal(parejas) : null,
      ataques, registro,
      armas: datos().armas || {},
      mensajes: mensajes(t),
      archivo: archivo(t),
      hitos: hitosDe(t),
      silueta: siluetaDe(t),
      modulosCaidos,
    };
  }

  DENDRO.cronologia = { calcularEstado, hitos, serieFirmas, serieDeltaOmega, cohesionEn: (t) => cohesionEn(aMs(t), base()) };
})(window.DENDRO = window.DENDRO || {});
