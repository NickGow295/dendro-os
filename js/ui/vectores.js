// Capa vectorial: diagramas, globos y texto grande sobre un canvas transparente que el tubo
// suma a la rejilla antes de los efectos CRT. Las vistas la usan con region.vectores():
// posiciones en celdas (con decimales), longitudes en altos de celda, colores por nombre.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const e = { contenedor: null, lienzo: null, ctx: null, ahora: 0, conContenido: false, sucio: true, banda: null };

  function iniciar(contenedor) {
    e.contenedor = contenedor;
    e.lienzo = document.createElement("canvas");
    e.lienzo.className = "lienzo-vectores";
    e.lienzo.setAttribute("aria-hidden", "true");
    contenedor.appendChild(e.lienzo);
    e.ctx = e.lienzo.getContext("2d");
    redimensionar();
  }

  function redimensionar() {
    const fuente = DENDRO.pantalla.lienzo;
    e.lienzo.width = fuente.width;
    e.lienzo.height = fuente.height;
    e.sucio = true;
  }

  // Limpia la capa para un fotograma nuevo; con un glitch activo, el fotograma entero tiembla.
  function comenzar(ahora) {
    e.ahora = ahora;
    e.ctx.setTransform(1, 0, 0, 1, 0, 0);
    e.ctx.clearRect(0, 0, e.lienzo.width, e.lienzo.height);
    const t = DENDRO.glitch && DENDRO.glitch.temblor();
    if (t) { const k = DENDRO.pantalla.info().escala; e.ctx.setTransform(1, 0, 0, 1, t.dx * k, t.dy * k); }
    e.conContenido = true;
    e.sucio = false;
  }

  // Tras dibujar: las bandas del glitch se cortan (se borran) o se desfasan en horizontal.
  function posprocesar() {
    const bandas = DENDRO.glitch ? DENDRO.glitch.bandas() : [];
    if (!bandas.length) return;
    const W = e.lienzo.width, H = e.lienzo.height, ctx = e.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const b of bandas) {
      const y = Math.floor(b.y * H), alto = Math.max(1, Math.ceil(b.alto * H));
      if (b.corte) { ctx.clearRect(0, y, W, alto); continue; }
      if (!e.banda) e.banda = document.createElement("canvas");
      e.banda.width = W; e.banda.height = alto;
      const bctx = e.banda.getContext("2d");
      bctx.clearRect(0, 0, W, alto);
      bctx.drawImage(e.lienzo, 0, y, W, alto, 0, 0, W, alto);
      ctx.clearRect(0, y, W, alto);
      ctx.drawImage(e.banda, Math.round(b.dx * W), y);
    }
  }

  // Deja la capa vacía si había algo; devuelve true si cambió.
  function vaciar() {
    if (!e.conContenido) return false;
    e.ctx.clearRect(0, 0, e.lienzo.width, e.lienzo.height);
    e.conContenido = false;
    return true;
  }

  function puntoEnCurva(x1, y1, cx, cy, x2, y2, t) {
    const u = 1 - t;
    return { x: u * u * x1 + 2 * u * t * cx + t * t * x2, y: u * u * y1 + 2 * u * t * cy + t * t * y2 };
  }

  // Contexto ligado a una región: origen en su esquina y recorte a sus bordes.
  function contexto(x0, y0, ancho, alto, lim) {
    const m = DENDRO.pantalla.info();
    const ctx = e.ctx;
    const u = m.celdaAlto;
    const px = (x) => m.origenX + (x0 + x) * m.celdaAncho;
    const py = (y) => m.origenY + (y0 + y) * m.celdaAlto;
    const recorte = [
      m.origenX + lim.x1 * m.celdaAncho, m.origenY + lim.y1 * m.celdaAlto,
      (lim.x2 - lim.x1) * m.celdaAncho, (lim.y2 - lim.y1) * m.celdaAlto,
    ];
    const color = (nombre) => DENDRO.tema.color(nombre || "texto");

    function recortado(fn) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(recorte[0], recorte[1], recorte[2], recorte[3]);
      ctx.clip();
      fn(ctx);
      ctx.restore();
    }

    function trazo(nombreColor, o, construir) {
      o = o || {};
      recortado((c) => {
        const alfa = o.alfa === undefined ? 1 : o.alfa;
        c.globalAlpha = alfa;
        c.strokeStyle = color(nombreColor);
        c.lineWidth = (o.grosor || cfg().vectores.grosorLinea) * m.escala;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.setLineDash(o.discontinua ? o.discontinua.map((d) => d * m.escala) : []);
        c.beginPath();
        construir(c);
        if (o.relleno) {
          c.globalAlpha = alfa * (o.rellenoAlfa === undefined ? 0.25 : o.rellenoAlfa);
          c.fillStyle = color(o.relleno);
          c.fill();
          c.globalAlpha = alfa;
        }
        if (o.sinTrazo !== true) c.stroke();
      });
    }

    const v = {
      ancho, alto, ctx, unidad: u, escala: m.escala, px, py,
      aspecto: m.celdaAncho / m.celdaAlto, // ancho de celda en altos de celda
      ahora: () => e.ahora,
      color,
      recortado,
      linea(x1, y1, x2, y2, c, o) { trazo(c, o, (k) => { k.moveTo(px(x1), py(y1)); k.lineTo(px(x2), py(y2)); }); },
      polilinea(puntos, c, o) {
        if (puntos.length < 2) return;
        trazo(c, o, (k) => { k.moveTo(px(puntos[0][0]), py(puntos[0][1])); for (let i = 1; i < puntos.length; i++) k.lineTo(px(puntos[i][0]), py(puntos[i][1])); });
      },
      poligono(puntos, c, o) {
        if (puntos.length < 3) return;
        trazo(c, o, (k) => { k.moveTo(px(puntos[0][0]), py(puntos[0][1])); for (let i = 1; i < puntos.length; i++) k.lineTo(px(puntos[i][0]), py(puntos[i][1])); k.closePath(); });
      },
      circulo(cx, cy, r, c, o) { trazo(c, o, (k) => k.arc(px(cx), py(cy), Math.max(0, r * u), 0, Math.PI * 2)); },
      arco(cx, cy, r, desde, hasta, c, o) { trazo(c, o, (k) => k.arc(px(cx), py(cy), Math.max(0, r * u), desde, hasta)); },
      // Lote de segmentos [x1, y1, x2, y2, …] en un solo trazo (el ÁRBOL dibuja miles así).
      trazos(segmentos, c, o) {
        if (segmentos.length < 4) return;
        trazo(c, o, (k) => { for (let i = 0; i + 3 < segmentos.length; i += 4) { k.moveTo(px(segmentos[i]), py(segmentos[i + 1])); k.lineTo(px(segmentos[i + 2]), py(segmentos[i + 3])); } });
      },
      // Lote de puntos [x, y, …] rellenos en una sola pasada; o.tam en px CSS.
      puntos(lista, c, o) {
        o = o || {};
        if (lista.length < 2) return;
        const r = (o.tam || 1.6) * m.escala;
        recortado((k) => {
          k.globalAlpha = o.alfa === undefined ? 1 : o.alfa;
          k.fillStyle = color(c);
          k.beginPath();
          for (let i = 0; i + 1 < lista.length; i += 2) { const x = px(lista[i]), y = py(lista[i + 1]); k.moveTo(x + r, y); k.arc(x, y, r, 0, Math.PI * 2); }
          k.fill();
        });
      },
      curva(x1, y1, cx, cy, x2, y2, c, o) { trazo(c, o, (k) => { k.moveTo(px(x1), py(y1)); k.quadraticCurveTo(px(cx), py(cy), px(x2), py(y2)); }); },
      punto(x, y, c, o) {
        o = o || {};
        recortado((k) => {
          k.globalAlpha = o.alfa === undefined ? 1 : o.alfa;
          k.fillStyle = color(c);
          k.beginPath();
          k.arc(px(x), py(y), (o.tam || 1.6) * m.escala, 0, Math.PI * 2);
          k.fill();
        });
      },
      texto(x, y, texto, c, o) {
        o = o || {};
        recortado((k) => {
          k.globalAlpha = o.alfa === undefined ? 1 : o.alfa;
          k.fillStyle = color(c);
          k.font = `${(o.tam || 2) * u}px ${DENDRO.pantalla.FUENTE}`;
          k.textAlign = o.alinear || "left";
          k.textBaseline = o.base || "top";
          k.fillText(texto, px(x), py(y));
        });
      },
      globo(cx, cy, r, tierra, o) { DENDRO.globo.dibujar(v, cx, cy, r, tierra, o || {}); },
    };
    return v;
  }

  DENDRO.vectores = {
    iniciar, redimensionar, comenzar, posprocesar, vaciar, contexto, puntoEnCurva,
    marcarSucio: () => { e.sucio = true; },
    get sucio() { return e.sucio; },
    get lienzo() { return e.lienzo; },
  };
})(window.DENDRO = window.DENDRO || {});
