// Escritorio (RF-04): pestañas de vistas arriba, barra de estado abajo y la vista activa en el centro.
// También define el registro DENDRO.vistas donde cada vista se da de alta (02-diseno.md §6).
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const CATALOGO = [
    { id: "colision", tecla: "1", titulo: "COLISIÓN", tituloCorto: "COL" },
    { id: "arbol", tecla: "2", titulo: "ÁRBOL", tituloCorto: "ÁRB" },
    { id: "monitor", tecla: "3", titulo: "MONITOR", tituloCorto: "MON" },
    { id: "osciloscopio", tecla: "4", titulo: "OSCILOSCOPIO", tituloCorto: "OSC" },
    { id: "expediente", tecla: "5", titulo: "EXPEDIENTE", tituloCorto: "EXP" },
    { id: "registro", tecla: "6", titulo: "REGISTRO", tituloCorto: "REG" },
    { id: "comunicaciones", tecla: "7", titulo: "COMUNICACIONES", tituloCorto: "COM" },
    { id: "archivo", tecla: "8", titulo: "ARCHIVO", tituloCorto: "ARC" },
    { id: "contencion", tecla: "9", titulo: "CONTENCIÓN", tituloCorto: "CNT" },
    { id: "terminal", tecla: "0", titulo: "TERMINAL", tituloCorto: "TER" },
  ];
  const TECLAS_F = { F1: "1", F2: "2", F3: "3", F4: "4", F6: "5", F7: "6", F8: "7", F9: "8" };
  const ALERTA = {
    "VERDE": ["exito", null], "ÁMBAR": ["ambar", null], "NARANJA": ["ambar", { inverso: true }],
    "ROJO": ["peligro", { inverso: true }], "NEGRO": ["peligro", { inverso: true, parpadeo: true }], "—": ["textoTenue", null],
  };
  const CLAVE_OPERADOR = "dendro.operador";

  const registradas = {};
  DENDRO.vistas = {
    registrar(def) { registradas[def.id] = def; },
    obtener(id) { return registradas[id]; },
    catalogo: CATALOGO,
  };

  const SUPERINDICES = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  // 1 048 576 o 1.05×10⁶ desde el millón (02-diseno.md §6, V3).
  function formatoRamas(n) {
    if (n < 1e6) return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const exp = Math.floor(Math.log10(n));
    return `${(n / Math.pow(10, exp)).toFixed(2)}×10${String(exp).replace(/\d/g, (d) => SUPERINDICES[d])}`;
  }

  function operador() {
    try { return localStorage.getItem(CLAVE_OPERADOR) || "—"; } catch (_) { return "—"; }
  }

  function enConstruccion(entrada) {
    return {
      animada: false,
      dibujar(reg) {
        const y = Math.floor(reg.alto / 2) - 1;
        reg.centrar(y, `V${entrada.tecla} · ${entrada.titulo}`, "ambar");
        reg.centrar(y + 2, "EN CONSTRUCCIÓN", "textoTenue");
      },
    };
  }

  function crear({ estado, salir }) {
    const P = DENDRO.pantalla;
    const ui = { parejaSeleccionada: estado.parejaPrincipal, tierraSeleccionada: null };
    let activa = null, entradaActiva = null, transicion = -Infinity, reloj = 0, pestanas = [];

    const regionVista = () => P.region(0, 1, P.columnas, P.filas - 2);
    const ctx = {
      estado, ui,
      region: regionVista,
      abrir,
      salir: salir || (() => {}),
      redibujar() { const reg = regionVista(); reg.limpiar(); if (activa) activa.dibujar(reg); },
    };

    function abrir(id) {
      const entrada = CATALOGO.find((c) => c.id === id);
      if (!entrada) return;
      if (activa && activa.detener) activa.detener();
      if (entradaActiva) DENDRO.sonido.beep(entrada.id === entradaActiva.id ? 660 : 990);
      entradaActiva = entrada;
      const def = DENDRO.vistas.obtener(id);
      activa = def ? def.crear(ctx) : enConstruccion(entrada);
      transicion = performance.now();
      dibujar();
      DENDRO.vectores.marcarSucio();
    }

    function dibujarPestanas(r) {
      r.rellenar(0, 0, r.ancho, 1, " ", "ambar", { inverso: true });
      const largoCon = (f) => CATALOGO.reduce((n, c) => n + P.largo(f(c)) + 1, 1);
      const completo = (c) => ` ${c.tecla} ${c.titulo} `;
      const corto = (c) => ` ${c.tecla} ${c.tituloCorto} `;
      const minimo = (c) => (c === entradaActiva ? corto(c) : ` ${c.tecla} `);
      const formato = largoCon(completo) <= r.ancho ? completo : largoCon(corto) <= r.ancho ? corto : minimo;
      pestanas = [];
      let x = 1;
      for (const c of CATALOGO) {
        const texto = formato(c);
        const fin = r.escribir(x, 0, texto, "ambar", c === entradaActiva ? null : { inverso: true });
        pestanas.push({ desde: x, hasta: fin, id: c.id });
        x = fin + 1;
      }
    }

    function dibujarBarraEstado() {
      const r = P.raiz();
      const y = r.alto - 1;
      const ancho = r.ancho >= 80;
      r.rellenar(0, y, r.ancho, 1);
      const [colorAlerta, estiloAlerta] = ALERTA[estado.nivelAlerta];
      const hora = DENDRO.reloj.horaAgencia();
      let x = 1;
      const tramo = (texto, color, estilo) => { x = r.escribir(x, y, texto, color, estilo); x = r.escribir(x, y, " │ ", "ambarTenue"); };
      if (ancho) {
        tramo(`${estado.fecha} ${hora}`, "texto");
        tramo(`FASE ${estado.fase} ${estado.nombreFase}`, "ambar");
        tramo(` ALERTA ${estado.nivelAlerta} `, colorAlerta, estiloAlerta);
        x = r.escribir(x, y, `RAMAS ${formatoRamas(estado.ramasAfectadas)}`, "texto");
        r.derecha(y, `OPERADOR ${operador()} `, "textoTenue");
      } else {
        tramo(`${estado.fecha.slice(5)} ${hora.slice(0, 5)}`, "texto");
        tramo(`F${estado.fase}`, "ambar");
        tramo(` ${estado.nivelAlerta} `, colorAlerta, estiloAlerta);
        r.escribir(x, y, formatoRamas(estado.ramasAfectadas), "texto");
      }
    }

    function dibujar() {
      const r = P.raiz();
      r.limpiar();
      P.ocultarCursor();
      dibujarPestanas(r);
      dibujarBarraEstado();
      if (activa) activa.dibujar(regionVista());
    }

    // Barrido de línea al cambiar de vista (02-diseno.md §6), sin fundidos.
    function barrido(ahora) {
      const k = (ahora - transicion) / cfg().vectores.transicionMs;
      if (k < 0 || k >= 1) return;
      const reg = regionVista(), v = reg.vectores();
      const y = reg.alto * k;
      v.linea(0, y, reg.ancho, y, "rama", { grosor: 2.5, alfa: 1 - k * 0.5 });
      for (let i = 1; i <= 4; i++) v.linea(0, y - i * 0.35, reg.ancho, y - i * 0.35, "ambar", { alfa: (1 - k) * (0.5 - i * 0.1) });
    }

    function relativo(punto) {
      const reg = regionVista();
      return punto && { x: punto.x - reg.x, y: punto.y - reg.y };
    }

    return {
      get animada() {
        return (activa && activa.animada) || performance.now() - transicion < cfg().vectores.transicionMs + 50;
      },
      iniciar() {
        abrir("colision");
        reloj = setInterval(dibujarBarraEstado, 1000);
        if (estado.fase >= 3) setTimeout(() => DENDRO.sonido.alarma(estado.fase >= 4 ? 6 : 3), 600);
      },
      dibujar,
      vectores(raiz, ahora) {
        if (activa && activa.vectores) activa.vectores(regionVista().vectores(), ahora);
        barrido(ahora);
      },
      tecla(ev) {
        if (ev.key === "Escape") { ev.preventDefault(); abrir("colision"); return; }
        const porF = TECLAS_F[ev.key];
        const capturaTexto = activa && activa.capturaTeclado;
        const destino = porF || (!capturaTexto && CATALOGO.some((c) => c.tecla === ev.key) ? ev.key : null);
        if (destino) {
          ev.preventDefault();
          abrir(CATALOGO.find((c) => c.tecla === destino).id);
          return;
        }
        if (activa && activa.tecla) activa.tecla(ev);
      },
      toque(punto) {
        if (punto && punto.y < 1) {
          const p = pestanas.find((t) => punto.x >= t.desde && punto.x < t.hasta);
          if (p) abrir(p.id);
          return;
        }
        if (activa && activa.toque) activa.toque(relativo(punto));
      },
      movimiento(punto) {
        if (activa && activa.movimiento) activa.movimiento(relativo(punto));
      },
      detener() {
        clearInterval(reloj);
        if (activa && activa.detener) activa.detener();
      },
    };
  }

  DENDRO.escritorio = { crear, formatoRamas };
})(window.DENDRO = window.DENDRO || {});
