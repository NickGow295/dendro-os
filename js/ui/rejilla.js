// Rejilla de caracteres del tubo: los módulos solo usan esta API pequeña
// (escribir, rellenar, caja, regiones, cursor, celdaEn) y nunca tocan el canvas.
// El contenido se dibuja en un canvas 2D que el shader CRT usa como imagen.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const FUENTE = '"VT323 Local", "VT323", monospace';
  const ATR = { INVERSO: 1, TENUE: 2, PARPADEO: 4 };
  const PERIODO_PARPADEO = 530;
  const ESPACIO = 32;

  // Trazos de caja dibujados a mano para que unan sin huecos: [arriba, derecha, abajo, izquierda], 1 simple, 2 doble.
  const TRAZOS = {
    "─": [0, 1, 0, 1], "│": [1, 0, 1, 0], "┌": [0, 1, 1, 0], "┐": [0, 0, 1, 1], "└": [1, 1, 0, 0], "┘": [1, 0, 0, 1],
    "├": [1, 1, 1, 0], "┤": [1, 0, 1, 1], "┬": [0, 1, 1, 1], "┴": [1, 1, 0, 1], "┼": [1, 1, 1, 1],
    "═": [0, 2, 0, 2], "║": [2, 0, 2, 0], "╔": [0, 2, 2, 0], "╗": [0, 0, 2, 2], "╚": [2, 2, 0, 0], "╝": [2, 0, 0, 2],
    "╠": [2, 2, 2, 0], "╣": [2, 0, 2, 2], "╦": [0, 2, 2, 2], "╩": [2, 2, 0, 2], "╬": [2, 2, 2, 2],
    "╧": [1, 2, 0, 2], "╤": [0, 2, 1, 2], "╪": [1, 2, 1, 2], "╫": [2, 1, 2, 1], "╟": [2, 1, 2, 0], "╢": [2, 0, 2, 1],
    "╞": [1, 2, 1, 0], "╡": [1, 0, 1, 2], "╒": [0, 2, 1, 0], "╕": [0, 0, 1, 2], "╘": [1, 2, 0, 0], "╛": [1, 0, 0, 2],
    "╓": [0, 1, 2, 0], "╖": [0, 0, 2, 1], "╙": [2, 1, 0, 0], "╜": [2, 0, 0, 1], "╥": [0, 1, 2, 1], "╨": [2, 1, 0, 1],
  };
  // Bloques: [x, y, ancho, alto] en fracciones de celda y opacidad.
  const BLOQUES = {
    "█": [0, 0, 1, 1, 1], "▓": [0, 0, 1, 1, 0.72], "▒": [0, 0, 1, 1, 0.48], "░": [0, 0, 1, 1, 0.24],
    "▀": [0, 0, 1, 0.5, 1], "▄": [0, 0.5, 1, 0.5, 1], "▌": [0, 0, 0.5, 1, 1], "▐": [0.5, 0, 0.5, 1, 1],
  };

  const e = {
    contenedor: null, lienzo: null, ctx: null,
    columnas: 0, filas: 0, car: null, col: null, atr: null,
    sucias: null, filasConParpadeo: new Set(), todoSucio: true, version: 0,
    ancho: 0, alto: 0, escala: 1, calidad: 1,
    origenX: 0, origenY: 0, celdaAncho: 0, celdaAlto: 0, tamFuente: 0, linea: 0, grosor: 1, hueco: 2,
    nombres: [], indice: {}, cacheCaracteres: new Map(),
    cursor: { x: 0, y: 0, visible: false }, fase: 1, oyentes: [],
  };

  // ── Paleta ────────────────────────────────────────────────────────────────
  function construirPaleta() {
    e.nombres = Object.keys(cfg().colores);
    e.indice = {};
    e.nombres.forEach((n, i) => { e.indice[n] = i; });
  }
  function indiceColor(nombre) {
    const i = e.indice[nombre || "texto"];
    return i === undefined ? e.indice.texto : i;
  }
  function atributos(estilo) {
    if (!estilo) return 0;
    if (typeof estilo === "number") return estilo;
    return (estilo.inverso ? ATR.INVERSO : 0) | (estilo.tenue ? ATR.TENUE : 0) | (estilo.parpadeo ? ATR.PARPADEO : 0);
  }
  function largo(texto) { return Array.from(String(texto)).length; }
  function caracter(cp) {
    let c = e.cacheCaracteres.get(cp);
    if (c === undefined) { c = String.fromCodePoint(cp); e.cacheCaracteres.set(cp, c); }
    return c;
  }

  // ── Medidas ───────────────────────────────────────────────────────────────
  function medir() {
    const p = cfg().pantalla;
    // clientWidth/Height no cambian con la transformación del encendido en el respaldo CSS.
    const anchoCss = Math.max(1, e.contenedor.clientWidth), altoCss = Math.max(1, e.contenedor.clientHeight);
    let escala = Math.min(window.devicePixelRatio || 1, p.escalaMax) * e.calidad;
    if (anchoCss * altoCss * escala * escala > p.pixelesMax) escala = Math.sqrt(p.pixelesMax / (anchoCss * altoCss));
    e.escala = escala;
    e.ancho = Math.round(anchoCss * escala);
    e.alto = Math.round(altoCss * escala);
    e.lienzo.width = e.ancho;
    e.lienzo.height = e.alto;

    e.ctx.font = `100px ${FUENTE}`;
    const proporcion = e.ctx.measureText("M").width / 100 || 0.5;
    const utilAncho = e.ancho * (1 - 2 * p.margen);
    const utilAlto = e.alto * (1 - 2 * p.margen);

    let filas = p.filas;
    let tam = Math.floor(utilAlto / (filas * p.altoLinea));
    let columnas = Math.floor(utilAncho / (tam * proporcion));
    if (columnas > p.columnasMax) columnas = p.columnasMax;
    if (columnas < p.columnasMin) {
      columnas = p.columnasMin;
      tam = Math.floor(utilAncho / (columnas * proporcion));
      filas = Math.floor(utilAlto / (tam * p.altoLinea));
    }
    e.tamFuente = Math.max(6, tam);
    e.celdaAncho = e.tamFuente * proporcion;
    e.celdaAlto = Math.round(e.tamFuente * p.altoLinea);
    e.origenX = Math.round((e.ancho - columnas * e.celdaAncho) / 2);
    e.origenY = Math.round((e.alto - filas * e.celdaAlto) / 2);
    e.grosor = Math.max(1, Math.round(e.celdaAlto / 14));
    e.hueco = Math.max(e.grosor + 1, Math.round(e.celdaAncho * 0.2));

    e.ctx.font = `${e.tamFuente}px ${FUENTE}`;
    const m = e.ctx.measureText("M");
    const asc = m.actualBoundingBoxAscent || e.tamFuente * 0.7;
    const desc = m.actualBoundingBoxDescent || 0;
    e.linea = Math.round((e.celdaAlto - (asc + desc)) / 2 + asc);

    if (columnas !== e.columnas || filas !== e.filas) {
      e.columnas = columnas;
      e.filas = filas;
      const n = columnas * filas;
      e.car = new Uint32Array(n).fill(ESPACIO);
      e.col = new Uint8Array(n).fill(indiceColor("texto"));
      e.atr = new Uint8Array(n);
      e.sucias = new Uint8Array(filas);
    }
    e.todoSucio = true;
  }

  function bordeX(i) { return e.origenX + Math.round(i * e.celdaAncho); }

  // ── Escritura en el búfer ─────────────────────────────────────────────────
  function poner(x, y, cp, ci, a) {
    if (x < 0 || y < 0 || x >= e.columnas || y >= e.filas) return;
    const i = y * e.columnas + x;
    if (e.car[i] === cp && e.col[i] === ci && e.atr[i] === a) return;
    e.car[i] = cp; e.col[i] = ci; e.atr[i] = a;
    e.sucias[y] = 1;
    e.version++;
  }

  function escribirEn(x, y, texto, ci, a, minX, maxX) {
    for (const ch of String(texto)) {
      if (x >= minX && x < maxX) poner(x, y, ch.codePointAt(0), ci, a);
      x++;
    }
    return x;
  }

  function crearRegion(x0, y0, ancho, alto, padre) {
    const base = padre ? padre.lim : { x1: 0, y1: 0, x2: e.columnas, y2: e.filas };
    const lim = {
      x1: Math.max(base.x1, x0), y1: Math.max(base.y1, y0),
      x2: Math.min(base.x2, x0 + ancho), y2: Math.min(base.y2, y0 + alto),
    };
    const r = {
      x: x0, y: y0, ancho, alto, lim,
      escribir(x, y, texto, color, estilo) {
        const ay = y0 + y;
        if (ay < lim.y1 || ay >= lim.y2) return x + largo(texto);
        return escribirEn(x0 + x, ay, texto, indiceColor(color), atributos(estilo), lim.x1, lim.x2) - x0;
      },
      centrar(y, texto, color, estilo) {
        return r.escribir(Math.floor((ancho - largo(texto)) / 2), y, texto, color, estilo);
      },
      derecha(y, texto, color, estilo) {
        return r.escribir(ancho - largo(texto), y, texto, color, estilo);
      },
      rellenar(x, y, an, al, car, color, estilo) {
        const cp = (car || " ").codePointAt(0), ci = indiceColor(color), a = atributos(estilo);
        for (let j = Math.max(y0 + y, lim.y1); j < Math.min(y0 + y + al, lim.y2); j++) {
          for (let i = Math.max(x0 + x, lim.x1); i < Math.min(x0 + x + an, lim.x2); i++) poner(i, j, cp, ci, a);
        }
      },
      limpiar() { r.rellenar(0, 0, ancho, alto); },
      caja(x, y, an, al, opciones) { return dibujarCaja(r, x, y, an, al, opciones || {}); },
      region(x, y, an, al) { return crearRegion(x0 + x, y0 + y, an, al, r); },
      // Sube el contenido n filas (para registros que se desplazan).
      desplazar(n) {
        n = n || 1;
        for (let j = lim.y1; j < lim.y2; j++) {
          const origen = j + n;
          for (let i = lim.x1; i < lim.x2; i++) {
            if (origen < lim.y2) {
              const k = origen * e.columnas + i;
              poner(i, j, e.car[k], e.col[k], e.atr[k]);
            } else {
              poner(i, j, ESPACIO, indiceColor("texto"), 0);
            }
          }
        }
      },
    };
    return r;
  }

  function dibujarCaja(r, x, y, an, al, o) {
    if (an < 2 || al < 2) return r.region(x, y, 0, 0);
    const t = o.doble === false ? "┌─┐│└┘" : "╔═╗║╚╝";
    const color = o.color || "ambar";
    r.escribir(x, y, t[0] + t[1].repeat(an - 2) + t[2], color);
    for (let j = 1; j < al - 1; j++) {
      r.escribir(x, y + j, t[3], color);
      r.escribir(x + an - 1, y + j, t[3], color);
    }
    r.escribir(x, y + al - 1, t[4] + t[1].repeat(an - 2) + t[5], color);
    if (o.rellenar !== false) r.rellenar(x + 1, y + 1, an - 2, al - 2);
    if (o.titulo) {
      const texto = Array.from(` ${o.titulo} `).slice(0, Math.max(0, an - 4)).join("");
      r.escribir(x + 2, y, texto, o.colorTitulo || color, o.estiloTitulo || { inverso: true });
    }
    return r.region(x + 1, y + 1, an - 2, al - 2);
  }

  // ── Dibujo en el canvas ───────────────────────────────────────────────────
  let estiloActual = "";
  function relleno(color) {
    if (color !== estiloActual) { e.ctx.fillStyle = color; estiloActual = color; }
  }

  function dibujarTrazo(t, izq, der, arr, abj) {
    const ctx = e.ctx, g = e.grosor, h = e.hueco;
    const cx = Math.round((izq + der) / 2), cy = Math.round((arr + abj) / 2);
    const [up, dr, dn, iz] = t;
    const mitad = Math.floor(g / 2);
    // Horizontal hacia la derecha / izquierda
    const lineaH = (hacia, peso) => {
      if (!peso) return;
      if (peso === 1) {
        const dobleV = up === 2 || dn === 2;
        if (hacia > 0) { const x = (dobleV ? cx + h : cx) - mitad; ctx.fillRect(x, cy - mitad, der - x, g); }
        else { const x = (dobleV ? cx - h : cx) + g - mitad; ctx.fillRect(izq, cy - mitad, x - izq, g); }
        return;
      }
      for (const o of [-h, h]) {
        const corta = (o < 0 && up === 2) || (o > 0 && dn === 2);
        if (hacia > 0) { const x = (corta ? cx + h : cx - h) - mitad; ctx.fillRect(x, cy + o - mitad, der - x, g); }
        else { const x = (corta ? cx - h : cx + h) + g - mitad; ctx.fillRect(izq, cy + o - mitad, x - izq, g); }
      }
    };
    const lineaV = (hacia, peso) => {
      if (!peso) return;
      if (peso === 1) {
        const dobleH = dr === 2 || iz === 2;
        if (hacia > 0) { const y = (dobleH ? cy + h : cy) - mitad; ctx.fillRect(cx - mitad, y, g, abj - y); }
        else { const y = (dobleH ? cy - h : cy) + g - mitad; ctx.fillRect(cx - mitad, arr, g, y - arr); }
        return;
      }
      for (const o of [-h, h]) {
        const corta = (o < 0 && iz === 2) || (o > 0 && dr === 2);
        if (hacia > 0) { const y = (corta ? cy + h : cy - h) - mitad; ctx.fillRect(cx + o - mitad, y, g, abj - y); }
        else { const y = (corta ? cy - h : cy + h) + g - mitad; ctx.fillRect(cx + o - mitad, arr, g, y - arr); }
      }
    };
    lineaH(1, dr); lineaH(-1, iz); lineaV(1, dn); lineaV(-1, up);
  }

  function dibujarCelda(x, y, cp, colorTinta, colorFondo, a) {
    const ctx = e.ctx;
    const izq = bordeX(x), der = bordeX(x + 1);
    const arr = e.origenY + y * e.celdaAlto, abj = arr + e.celdaAlto;
    const visible = !(a & ATR.PARPADEO) || e.fase === 1;
    if (a & ATR.INVERSO) {
      relleno(colorTinta);
      ctx.fillRect(izq, arr, der - izq, abj - arr);
      colorTinta = colorFondo;
    }
    if (cp === ESPACIO || !visible) return;
    ctx.globalAlpha = a & ATR.TENUE ? 0.55 : 1;
    relleno(colorTinta);
    const ch = caracter(cp);
    const trazo = TRAZOS[ch];
    if (trazo) {
      dibujarTrazo(trazo, izq, der, arr, abj);
    } else if (BLOQUES[ch]) {
      const [bx, by, bw, bh, alfa] = BLOQUES[ch];
      ctx.globalAlpha *= alfa;
      const w = der - izq, hgt = abj - arr;
      ctx.fillRect(izq + Math.round(bx * w), arr + Math.round(by * hgt), Math.round(bw * w), Math.round(bh * hgt));
    } else {
      // maxWidth comprime los glifos de fuentes de respaldo más anchas que la celda.
      ctx.fillText(ch, (izq + der) / 2, arr + e.linea, der - izq);
    }
    ctx.globalAlpha = 1;
  }

  function dibujarFila(y, colores) {
    const ctx = e.ctx;
    const arr = e.origenY + y * e.celdaAlto;
    relleno(colores.fondo);
    ctx.fillRect(0, arr, e.ancho, e.celdaAlto);
    let conParpadeo = false;
    const fila = y * e.columnas;
    for (let x = 0; x < e.columnas; x++) {
      const i = fila + x, a = e.atr[i];
      if (a & ATR.PARPADEO) conParpadeo = true;
      if (e.car[i] === ESPACIO && !(a & ATR.INVERSO)) continue;
      dibujarCelda(x, y, e.car[i], colores[e.nombres[e.col[i]]], colores.fondo, a);
    }
    if (conParpadeo) e.filasConParpadeo.add(y); else e.filasConParpadeo.delete(y);
    const c = e.cursor;
    if (c.visible && c.y === y && e.fase === 1 && c.x >= 0 && c.x < e.columnas) {
      const i = fila + c.x;
      dibujarCelda(c.x, y, e.car[i], colores.ambar, colores.fondo, ATR.INVERSO);
    }
  }

  // Llamar en cada fotograma; devuelve true si cambió la imagen.
  function renderizar(ahora) {
    if (!e.ctx) return false;
    const fase = Math.floor(ahora / PERIODO_PARPADEO) % 2 === 0 ? 1 : 0;
    if (fase !== e.fase) {
      e.fase = fase;
      for (const y of e.filasConParpadeo) e.sucias[y] = 1;
      if (e.cursor.visible) e.sucias[e.cursor.y] = 1;
    }
    const colores = cfg().colores;
    let cambio = false;
    if (e.todoSucio) {
      relleno(colores.fondo);
      e.ctx.fillRect(0, 0, e.ancho, e.alto);
      e.sucias.fill(1);
      e.todoSucio = false;
    }
    e.ctx.textAlign = "center";
    e.ctx.textBaseline = "alphabetic";
    for (let y = 0; y < e.filas; y++) {
      if (!e.sucias[y]) continue;
      e.sucias[y] = 0;
      dibujarFila(y, colores);
      cambio = true;
    }
    return cambio;
  }

  // ── API pública ───────────────────────────────────────────────────────────
  function iniciar(contenedor) {
    construirPaleta();
    e.contenedor = contenedor;
    e.lienzo = document.createElement("canvas");
    e.lienzo.className = "lienzo-texto";
    e.lienzo.setAttribute("aria-hidden", "true");
    contenedor.appendChild(e.lienzo);
    e.ctx = e.lienzo.getContext("2d", { alpha: false });
    medir();
  }

  function redimensionar() {
    if (!e.ctx) return;
    estiloActual = "";
    medir();
    for (const fn of e.oyentes) fn(e.columnas, e.filas);
  }

  // Espera a la fuente local o a la de Google Fonts sin bloquear más de `limiteMs`.
  function cargarFuente(limiteMs) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const cargas = Promise.all([
      document.fonts.load('32px "VT323 Local"').catch(() => null),
      document.fonts.load('32px "VT323"').catch(() => null),
    ]);
    document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", redimensionar);
    return Promise.race([cargas, new Promise((ok) => setTimeout(ok, limiteMs || 2500))]);
  }

  function ponerCursor(x, y, visible) {
    const c = e.cursor;
    if (c.y >= 0 && c.y < e.filas) e.sucias[c.y] = 1;
    c.x = x; c.y = y; c.visible = visible !== false;
    if (y >= 0 && y < e.filas) e.sucias[y] = 1;
  }

  function leer(x, y) {
    if (x < 0 || y < 0 || x >= e.columnas || y >= e.filas) return null;
    const i = y * e.columnas + x;
    return { caracter: caracter(e.car[i]), color: e.nombres[e.col[i]], estilo: e.atr[i] };
  }

  function textoPlano() {
    const lineas = [];
    for (let y = 0; y < e.filas; y++) {
      let s = "";
      for (let x = 0; x < e.columnas; x++) s += caracter(e.car[y * e.columnas + x]);
      lineas.push(s.replace(/\s+$/, ""));
    }
    return lineas.join("\n").replace(/\n+$/, "");
  }

  // Celda bajo un punto de la ventana, deshaciendo la curvatura del tubo si está activa.
  function celdaEn(clienteX, clienteY) {
    const caja = e.contenedor.getBoundingClientRect();
    let u = (clienteX - caja.left) / caja.width;
    let v = (clienteY - caja.top) / caja.height;
    if (DENDRO.crt && DENDRO.crt.activo()) {
      const p = DENDRO.crt.pantallaAImagen(u, v);
      if (!p) return null;
      u = p.u; v = p.v;
    }
    const x = Math.floor((u * e.ancho - e.origenX) / e.celdaAncho);
    const y = Math.floor((v * e.alto - e.origenY) / e.celdaAlto);
    return x >= 0 && y >= 0 && x < e.columnas && y < e.filas ? { x, y } : null;
  }

  const raiz = () => crearRegion(0, 0, e.columnas, e.filas, null);

  DENDRO.pantalla = {
    ATR,
    iniciar, redimensionar, renderizar, cargarFuente,
    raiz,
    escribir: (x, y, texto, color, estilo) => raiz().escribir(x, y, texto, color, estilo),
    limpiar: () => { raiz().limpiar(); e.cursor.visible = false; },
    region: (x, y, an, al) => crearRegion(x, y, an, al, null),
    ponerCursor, ocultarCursor: () => ponerCursor(e.cursor.x, e.cursor.y, false),
    leer, textoPlano, celdaEn, largo,
    alRedimensionar: (fn) => e.oyentes.push(fn),
    fijarCalidad: (f) => { if (f !== e.calidad) { e.calidad = f; redimensionar(); } },
    get columnas() { return e.columnas; },
    get filas() { return e.filas; },
    get version() { return e.version; },
    get lienzo() { return e.lienzo; },
    info: () => ({ ancho: e.ancho, alto: e.alto, escala: e.escala, calidad: e.calidad, columnas: e.columnas, filas: e.filas, celdaAlto: e.celdaAlto }),
  };
})(window.DENDRO = window.DENDRO || {});
