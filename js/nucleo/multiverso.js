// ★ Catálogo del multiverso (02-diseno.md §4.4–4.5): ramas catalogadas, parejas generadas y
// disposición del diagrama. Todo sale de config.multiverso.semilla y de data/: no depende del
// instante, así que se calcula una vez y se memoiza. Sin DOM: se ejecuta también en Node.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const datos = () => window.DENDRO_DATOS || {};

  const ALFABETO = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";   // sin I ni O
  const LARGO_SEGMENTO = [0, 2, 3, 2, 1];                  // por nivel
  const NIVEL_HOJA = 4;
  const SEP = "·";
  const DESVIO_OMEGA = [0, 0, 0.025, 0.015, 0.0075];       // media distancia máxima entre hermanas, por nivel
  const DESVIO_MINIMO = 0.00015;
  const HEREDA_TECNOLOGIA = 0.7;                           // ramillas (nivel 4) con la tecnología del padre

  const LARGO_RAMA = [0.26, 0.3, 0.17, 0.11, 0.07];        // disposición: largo por nivel (0 = tronco)
  const ABANICO = 1.4;                                     // semiabertura de las primarias en radianes
  const APERTURA = [0, 0, 0.55, 0.75, 0.95];               // semiabertura de los hijos alrededor del padre, por nivel
  const CELDA_REJILLA = 0.025;

  const limitar = (x, a, b) => Math.max(a, Math.min(b, x));

  function elegirPeso(rng, pesos) {
    const entradas = Object.entries(pesos);
    const total = entradas.reduce((s, [, p]) => s + p, 0);
    let r = rng() * total;
    for (const [clave, p] of entradas) { r -= p; if (r < 0) return clave; }
    return entradas[entradas.length - 1][0];
  }

  function barajar(rng, lista) {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  }

  function segmentoAlAzar(rng, largo) {
    let s = "";
    for (let i = 0; i < largo; i++) s += ALFABETO[Math.floor(rng() * ALFABETO.length)];
    return s;
  }

  // ── Catálogo ──────────────────────────────────────────────────────────────

  // Segmentos reservados por padre (caminos de las nombradas y de las bajas) y ω de los nudos intermedios.
  function reservas(fijas) {
    const porPadre = {}, omegas = {};
    for (const f of fijas) {
      const partes = f.codigo.split(SEP);
      for (let n = 1; n < partes.length; n++) {
        const padre = partes.slice(0, n).join(SEP), codigo = partes.slice(0, n + 1).join(SEP);
        porPadre[padre] = porPadre[padre] || [];
        if (!porPadre[padre].includes(partes[n])) porPadre[padre].push(partes[n]);
        if (codigo !== f.codigo && n >= 2) (omegas[codigo] = omegas[codigo] || []).push(f.omega);
      }
    }
    for (const c of Object.keys(omegas)) omegas[c] = omegas[c].reduce((s, x) => s + x, 0) / omegas[c].length;
    return { porPadre, omegas };
  }

  function construirCatalogo() {
    const m = cfg().multiverso, d = datos(), myth = d.myth, gen = d.generacion;
    const nombradas = {};
    for (const t of d.tierras || []) nombradas[t.codigo] = t;
    const bajas = {};
    for (const b of myth.bajas || []) bajas[b.codigo] = b;
    const { porPadre, omegas } = reservas([...(d.tierras || []), ...(myth.bajas || [])]);
    const primariaDe = {};
    for (const p of myth.primarias) primariaDe["MYTH" + SEP + p.segmento] = p;

    const nodos = [], porCodigo = {};
    const raiz = {
      codigo: "MYTH", padre: null, nivel: 0, hijos: [], primaria: null, joven: false, salto: null,
      omega: myth.omega, regimen: myth.magia, magia: myth.magia, tecnologia: myth.tecnologia,
      planos: myth.planos, caracter: myth.caracter, semillaGlobo: myth.semillaGlobo, globo: myth.globo,
      nombrada: false, nombre: myth.nombre, raiz: true,
    };

    function alta(nodo) {
      nodos.push(nodo);
      porCodigo[nodo.codigo] = nodo;
    }

    function datosGenerados(codigo, padre, nivel, rng, primaria) {
      const joven = primaria.origen === "joven";
      let omega;
      if (nivel === 1) omega = primaria.omega;
      else if (omegas[codigo] !== undefined) omega = omegas[codigo];
      else {
        const signo = rng() < 0.5 ? -1 : 1;
        omega = padre.omega + signo * Math.max(DESVIO_MINIMO, rng() * DESVIO_OMEGA[nivel]);
      }
      const regimen = nivel === NIVEL_HOJA ? padre.regimen : elegirPeso(rng, joven ? m.regimenJoven : m.regimen);
      const tecnologia = nivel === NIVEL_HOJA && rng() < HEREDA_TECNOLOGIA ? padre.tecnologia : DENDRO.prng.elegir(rng, gen.tecnologias);
      const [mar0, mar1] = gen.globo.mar, [rug0, rug1] = gen.globo.rugosidad;
      return {
        omega: Number(omega.toFixed(4)), regimen, magia: regimen, tecnologia,
        semillaGlobo: codigo,
        globo: { mar: mar0 + rng() * (mar1 - mar0), rugosidad: rug0 + rng() * (rug1 - rug0), inestable: regimen === "Inestable" },
        nombrada: false,
      };
    }

    function crearHijo(padre, segmento, rng) {
      const nivel = padre.nivel + 1, codigo = padre.codigo + SEP + segmento;
      const codigoPrimaria = nivel === 1 ? codigo : padre.primaria;
      const primaria = primariaDe[codigoPrimaria];
      const base = {
        codigo, padre: padre.codigo, nivel, hijos: [], primaria: codigoPrimaria,
        joven: primaria.origen === "joven", salto: primaria.salto || null,
      };
      if (bajas[codigo]) return { ...base, ...bajas[codigo], omega: bajas[codigo].omega, baja: true, nombrada: false };
      const generado = datosGenerados(codigo, padre, nivel, rng, primaria);
      const fija = nombradas[codigo];
      if (!fija) return { ...base, ...generado };
      return { ...base, ...fija, regimen: fija.magia, semillaGlobo: fija.semillaGlobo || codigo, nombrada: true };
    }

    function generarHijos(padre) {
      if (padre.nivel >= NIVEL_HOJA || padre.baja) return;
      const nivel = padre.nivel + 1;
      const rng = DENDRO.prng.crear(m.semilla, padre.codigo);
      let segmentos;
      if (nivel === 1) segmentos = myth.primarias.map((p) => p.segmento);
      else {
        const [min, max] = m.hijosPorNivel[nivel];
        const reservados = porPadre[padre.codigo] || [];
        const cuenta = Math.max(DENDRO.prng.entero(rng, min, max), reservados.length);
        segmentos = [...reservados];
        while (segmentos.length < cuenta) {
          const s = segmentoAlAzar(rng, LARGO_SEGMENTO[nivel]);
          if (!segmentos.includes(s)) segmentos.push(s);
        }
        segmentos.sort();
      }
      for (const s of segmentos) {
        const hijo = crearHijo(padre, s, DENDRO.prng.crear(m.semilla, padre.codigo, s));
        padre.hijos.push(hijo.codigo);
        alta(hijo);
        generarHijos(hijo);
      }
    }

    alta(raiz);
    generarHijos(raiz);
    const total = nodos.filter((n) => !n.baja).length;
    return { nodos, porCodigo, total, parejas: generarParejas(nodos, porCodigo) };
  }

  // ── Parejas generadas y cadena exponencial (§4.5) ─────────────────────────

  // Pares de hermanas (y algunas primas, siempre dentro de la misma primaria). Quedan fuera MYTH, las
  // primarias, las nombradas, las bajas y los nudos por los que pasa el camino de una nombrada.
  function candidatas(nodos, porCodigo) {
    const m = cfg().multiverso;
    const caminos = new Set();
    for (const n of nodos) {
      if (!n.nombrada && !n.baja) continue;
      for (let c = n.padre; c; c = porCodigo[c].padre) caminos.add(c);
    }
    const elegible = (c) => { const n = porCodigo[c]; return n.nivel >= 2 && !n.nombrada && !n.baja && !caminos.has(c); };
    const pares = [], primas = {};
    const aPrimas = (padre, h) => { if (padre.nivel >= 2) (primas[padre.padre] = primas[padre.padre] || []).push(h); };
    for (const padre of nodos) {
      const hijos = padre.hijos.filter(elegible);
      if (!hijos.length) continue;
      const rng = DENDRO.prng.crear(m.semilla, "parejas", padre.codigo);
      barajar(rng, hijos);
      const hermanas = [];
      for (const h of hijos) {
        if (padre.nivel >= 2 && rng() < m.cascada.fraccionPrimas) aPrimas(padre, h);
        else hermanas.push(h);
      }
      for (let i = 0; i + 1 < hermanas.length; i += 2) pares.push([hermanas[i], hermanas[i + 1]]);
      if (hermanas.length % 2) aPrimas(padre, hermanas[hermanas.length - 1]);
    }
    for (const abuelo of Object.keys(primas).sort()) {
      const lista = barajar(DENDRO.prng.crear(m.semilla, "primas", abuelo), primas[abuelo]);
      for (let i = 0; i + 1 < lista.length; i += 2) pares.push([lista[i], lista[i + 1]]);
    }
    return pares;
  }

  // Grupo por la primaria: salto 1…7 y después las antiguas, en el orden de data/myth.js.
  function grupoDe(nodo) {
    const primarias = datos().myth.primarias;
    if (nodo.joven) return nodo.salto - 1;
    const antiguas = primarias.filter((p) => p.origen !== "joven").map((p) => "MYTH" + SEP + p.segmento);
    return 7 + antiguas.indexOf(nodo.primaria);
  }

  function generarParejas(nodos, porCodigo) {
    const m = cfg().multiverso, gen = datos().generacion;
    const { t1, tf } = DENDRO.cronologia.hitos();
    const grupos = {};
    for (const par of candidatas(nodos, porCodigo)) {
      const g = grupoDe(porCodigo[par[0]]);
      (grupos[g] = grupos[g] || []).push(par);
    }
    const orden = Object.keys(grupos).map(Number).sort((a, b) => a - b)
      .flatMap((g) => barajar(DENDRO.prng.crear(m.semilla, "orden", g), grupos[g]));
    const K = Math.min(m.cascada.parejasGeneradas, orden.length), b = m.cascada.curvatura;
    const minuto = DENDRO.reloj.MINUTO;

    return orden.slice(0, K).map(([a, bb], i) => {
      const j = i + 1;
      const x = Math.log2(1 + (j * (Math.pow(2, b) - 1)) / K) / b;
      const contacto = Math.min(tf - minuto, Math.floor((t1 + x * (tf - t1)) / minuto) * minuto);
      const id = "C-" + String(12 + j).padStart(4, "0");
      const rng = DENDRO.prng.crear(m.semilla, id);
      const postura = elegirPeso(rng, m.postura);
      const hostil = postura === "hostil" || postura === "mutua-hostil";
      const agresor = hostil ? (rng() < 0.5 ? a : bb) : null;
      const armas = {};
      const armar = (c) => { armas[c] = barajar(rng, [...gen.armas]).slice(0, 1 + (rng() < 0.35 ? 1 : 0)); };
      if (hostil) armar(agresor);
      if (postura === "mutua-hostil") armar(agresor === a ? bb : a);
      let desenlace = elegirPeso(rng, m.desenlace);
      if (desenlace === "superviviente") desenlace = "superviviente:" + (rng() < 0.5 ? a : bb);
      return { id, a, b: bb, contacto, postura, agresor, armas, desenlace, nombrada: false, grupo: grupoDe(porCodigo[a]) };
    });
  }

  let catalogoCache = null;
  function catalogo() {
    const m = cfg().multiverso, h = DENDRO.cronologia.hitos();
    const clave = [m.semilla, JSON.stringify(m.hijosPorNivel), JSON.stringify(m.cascada), h.clave].join("|");
    if (!catalogoCache || catalogoCache.clave !== clave || catalogoCache.datos !== datos().tierras) {
      catalogoCache = { clave, datos: datos().tierras, valor: construirCatalogo() };
      dispCache = null;
    }
    return catalogoCache.valor;
  }

  // ── Disposición del diagrama ──────────────────────────────────────────────
  // Coordenadas normalizadas: base del tronco en (0, 0), y hacia arriba. Abanico proporcional a las
  // hojas de cada subárbol, con una pequeña desviación sembrada para que parezca orgánico.

  let dispCache = null;
  function disposicion() {
    const cat = catalogo();
    if (dispCache) return dispCache;
    const semilla = cfg().multiverso.semilla;
    const hojas = {};
    const contar = (c) => {
      const n = cat.porCodigo[c];
      const hijos = n.hijos.filter((h) => !cat.porCodigo[h].baja);
      hojas[c] = hijos.length ? hijos.reduce((s, h) => s + contar(h), 0) : 1;
      return hojas[c];
    };
    contar("MYTH");

    const posiciones = {}, segmentos = [];
    const largoTronco = LARGO_RAMA[0];
    posiciones.MYTH = { x: 0, y: largoTronco };
    segmentos.push({ x1: 0, y1: 0, x2: 0, y2: largoTronco, nivel: 0, hijo: "MYTH" });

    // Las primarias se reparten el abanico según sus hojas; por debajo, cada nodo abre a sus hijos
    // alrededor de su propia dirección (como un árbol, no como una escoba), también según sus hojas.
    (function abrir(c, angPadre) {
      const n = cat.porCodigo[c], p = posiciones[c];
      const hijos = n.hijos.filter((h) => !cat.porCodigo[h].baja);
      const nivel = n.nivel + 1;
      let acumulado = 0;
      for (const h of hijos) {
        const centro = (acumulado + hojas[h] / 2) / hojas[c];
        acumulado += hojas[h];
        const rng = DENDRO.prng.crear(semilla, "disposicion", h);
        const base = nivel === 1 ? -ABANICO + 2 * ABANICO * centro : angPadre + (centro - 0.5) * 2 * APERTURA[nivel];
        const ang = base + (rng() - 0.5) * (nivel === 1 ? 0.04 : APERTURA[nivel] * 0.25);
        const largo = LARGO_RAMA[nivel] * (0.85 + rng() * 0.3);
        const q = { x: p.x + Math.sin(ang) * largo, y: p.y + Math.cos(ang) * largo };
        posiciones[h] = q;
        segmentos.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, nivel, hijo: h });
        abrir(h, ang);
      }
    })("MYTH", 0);

    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    const celdas = new Map();
    const llave = (i, j) => i + "," + j;
    for (const [c, q] of Object.entries(posiciones)) {
      minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y);
      const k = llave(Math.floor(q.x / CELDA_REJILLA), Math.floor(q.y / CELDA_REJILLA));
      if (!celdas.has(k)) celdas.set(k, []);
      celdas.get(k).push(c);
    }

    // Nodo más cercano a (x, y) dentro de radio (unidades normalizadas), o null.
    function cercano(x, y, radio) {
      const r = Math.ceil(radio / CELDA_REJILLA), ci = Math.floor(x / CELDA_REJILLA), cj = Math.floor(y / CELDA_REJILLA);
      let mejor = null, dist = radio;
      for (let i = ci - r; i <= ci + r; i++) {
        for (let j = cj - r; j <= cj + r; j++) {
          for (const c of celdas.get(llave(i, j)) || []) {
            const q = posiciones[c], dd = Math.hypot(q.x - x, q.y - y);
            if (dd < dist) { dist = dd; mejor = c; }
          }
        }
      }
      return mejor;
    }

    dispCache = { posiciones, segmentos, hojas, limites: { minX, maxX, minY, maxY }, cercano };
    return dispCache;
  }

  DENDRO.multiverso = { catalogo, disposicion, SEP, ALFABETO, LARGO_SEGMENTO };
})(window.DENDRO = window.DENDRO || {});
