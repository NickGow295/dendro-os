// TEMPORAL (se borra en la Fase 3): patrón de prueba del renderizador.
// Tres páginas — TEXTO, VECTORES y 24 GLOBOS — que usan solo la API pública, igual que las vistas.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const PAGINAS = ["TEXTO", "VECTORES", "24 GLOBOS"];
  const MUESTRA_CAJAS = [
    "┌───┬───┐ ╔═══╦═══╗ ╒═══╤═══╕",
    "│ A │ B │ ║ A ║ B ║ │ A │ B │",
    "├───┼───┤ ╠═══╬═══╣ ╞═══╪═══╡",
    "└───┴───┘ ╚═══╩═══╝ ╘═══╧═══╛",
  ];
  const TIPOS = [["SISTEMA", "texto"], ["SISTEMA", "texto"], ["COLISIÓN", "ambar"], ["HOSTIL", "arma"], ["ESCANEO", "tierra"]];
  const FRASES = [
    "LATIDO DEL SUSTRATO", "BARRIDO DE FIRMAS ω", "AISLANTE DE FASE NOMINAL", "Δω DENTRO DE MARGEN",
    "ECO EN EL CUADRANTE BAJO", "SINCRONÍA τ VERIFICADA", "LECTURA DE COHESIÓN N", "PAQUETE DE CAMPO RECIBIDO",
  ];
  // Globos de muestra: ids reales, parámetros del lore §2.1 y una opción de estado cada uno.
  const MUESTRAS = [
    { etiqueta: "B-0x01 NORMAL", tierra: { id: "B-0x01" }, opciones: () => ({}) },
    { etiqueta: "B-0x07 HALO", tierra: { id: "B-0x07", globo: { mar: 0.85 } }, opciones: () => ({ halo: 1 }) },
    { etiqueta: "B-0x05 DAÑOS", tierra: { id: "B-0x05", globo: { mar: 0.3, rugosidad: 0.9 } }, opciones: (t) => ({ danos: (t % 6) / 6 }) },
    { etiqueta: "B-0x0D FRAGMENTA", tierra: { id: "B-0x0D", globo: { rugosidad: 1.4 } }, opciones: (t) => ({ fragmentacion: Math.max(0, Math.min(1, ((t % 7) - 1.5) / 4)) }) },
    { etiqueta: "B-0x13 INESTABLE", tierra: { id: "B-0x13", globo: { rugosidad: 1.6, inestable: true } }, opciones: () => ({}) },
    { etiqueta: "B-0x03+04 FUSIÓN", tierra: { id: "B-0x03" }, opciones: (t) => ({ fusion: { tierra: { id: "B-0x04" }, mezcla: 0.5 + 0.5 * Math.sin(t) } }) },
  ];
  const ID_TIERRA = (i) => "B-0x" + (i + 1).toString(16).toUpperCase().padStart(2, "0");

  function crear({ fecha, modo, alSalir, alReiniciar, alAlternarFPS }) {
    const P = DENDRO.pantalla;
    const rng = DENDRO.prng.crear(fecha, "prueba");
    let pagina = 0, areaRegistro = null, puntero = null, temporizador = 0, cuenta = 0;
    let huecos = [];   // regiones donde van los globos de la página actual
    let lienzoPrimitivas = null;
    const consola = DENDRO.escritor.crearConsola(() => areaRegistro);
    const esAncho = () => P.columnas >= 80;

    function lineaRegistro() {
      const [tipo, color] = DENDRO.prng.elegir(rng, TIPOS);
      const rama = "B-0x" + DENDRO.prng.entero(rng, 1, 24).toString(16).toUpperCase().padStart(2, "0");
      cuenta++;
      return [
        { t: String(cuenta).padStart(5, "0") + " ", c: "ambarTenue" },
        { t: `[${tipo}] `.padEnd(11), c: color },
        { t: `${DENDRO.prng.elegir(rng, FRASES)} `, c: "texto" },
        { t: `${rama} ω=${(rng() * 9).toFixed(4)}`, c: "tierra" },
      ];
    }

    // ── Página TEXTO ─────────────────────────────────────────────────────────
    function paginaTexto(cuerpo) {
      const nombres = Object.keys(cfg().colores);
      let registroCaja, punteroCaja;
      if (esAncho()) {
        const izq = 34;
        const paleta = cuerpo.caja(0, 0, izq, nombres.length + 2, { titulo: "PALETA" });
        nombres.forEach((n, i) => {
          paleta.escribir(1, i, "████", n);
          paleta.escribir(6, i, n, "texto");
          paleta.escribir(18, i, cfg().colores[n], "textoTenue");
        });
        const car = cuerpo.caja(0, nombres.length + 2, izq, 10, { titulo: "CARACTERES", doble: false });
        MUESTRA_CAJAS.forEach((l, i) => car.escribir(1, i, l, "ambar"));
        car.escribir(1, 5, "░░▒▒▓▓██ ▀▄▌▐", "ambar");
        car.escribir(1, 6, "ÁÉÍÓÚÑÜ ¿¡ ω Δ τ Ω « »", "texto");
        car.escribir(1, 7, "TEXTO TENUE", "texto", { tenue: true });
        car.escribir(14, 7, " INVERSO ", "ambar", { inverso: true });
        car.escribir(24, 7, "PARPADEO", "arma", { parpadeo: true });
        punteroCaja = cuerpo.caja(izq, cuerpo.alto - 4, cuerpo.ancho - izq, 4, { titulo: "PUNTERO", doble: false });
        registroCaja = cuerpo.caja(izq, 0, cuerpo.ancho - izq, cuerpo.alto - 4, { titulo: "REGISTRO EN VIVO" });
      } else {
        const altoPaleta = Math.ceil(nombres.length / 2) + 2;
        const paleta = cuerpo.caja(0, 0, cuerpo.ancho, altoPaleta, { titulo: "PALETA" });
        nombres.forEach((n, i) => {
          const x = (i % 2) * Math.floor(paleta.ancho / 2);
          paleta.escribir(x + 1, Math.floor(i / 2), "██", n);
          paleta.escribir(x + 4, Math.floor(i / 2), n, "texto");
        });
        punteroCaja = cuerpo.caja(0, cuerpo.alto - 4, cuerpo.ancho, 4, { titulo: "PUNTERO", doble: false });
        registroCaja = cuerpo.caja(0, altoPaleta, cuerpo.ancho, cuerpo.alto - altoPaleta - 4, { titulo: "REGISTRO EN VIVO" });
      }
      areaRegistro = registroCaja.region(1, 0, registroCaja.ancho - 2, registroCaja.alto);
      consola.dibujar();
      if (!puntero) punteroCaja.escribir(1, 0, "MUEVA EL RATÓN O TOQUE", "textoTenue");
      else {
        const celda = P.leer(puntero.x, puntero.y);
        punteroCaja.escribir(1, 0, `CELDA ${puntero.x},${puntero.y}`, "texto");
        if (celda) punteroCaja.escribir(1, 1, `'${celda.caracter}' ${celda.color}`, "tierra");
      }
    }

    // ── Página VECTORES ──────────────────────────────────────────────────────
    function paginaVectores(cuerpo) {
      const ancho = esAncho();
      const altoPrim = ancho ? cuerpo.alto : Math.floor(cuerpo.alto * 0.36);
      const anchoPrim = ancho ? 40 : cuerpo.ancho;
      lienzoPrimitivas = cuerpo.caja(0, 0, anchoPrim, altoPrim, { titulo: "PRIMITIVAS" });
      const globos = ancho
        ? cuerpo.caja(anchoPrim, 0, cuerpo.ancho - anchoPrim, cuerpo.alto, { titulo: "GLOBOS" })
        : cuerpo.caja(0, altoPrim, cuerpo.ancho, cuerpo.alto - altoPrim, { titulo: "GLOBOS" });
      huecos = repartir(globos, MUESTRAS.length, ancho ? 3 : 2, (hueco, i) => hueco.centrar(hueco.alto - 1, MUESTRAS[i].etiqueta, "textoTenue"));
    }

    // ── Página 24 GLOBOS ─────────────────────────────────────────────────────
    function paginaGlobos(cuerpo) {
      const caja = cuerpo.caja(0, 0, cuerpo.ancho, cuerpo.alto, { titulo: "24 GLOBOS · MEDIDOR CON F" });
      huecos = repartir(caja, 24, esAncho() ? 6 : 3, (hueco, i) => hueco.centrar(hueco.alto - 1, ID_TIERRA(i), "textoTenue"));
    }

    function repartir(region, n, columnas, rotular) {
      const filas = Math.ceil(n / columnas), lista = [];
      const an = region.ancho / columnas, al = region.alto / filas;
      for (let i = 0; i < n; i++) {
        const x = Math.floor((i % columnas) * an), y = Math.floor(Math.floor(i / columnas) * al);
        const hueco = region.region(x, y, Math.floor(an), Math.floor(al));
        rotular(hueco, i);
        lista.push(hueco);
      }
      return lista;
    }

    // Radio que cabe en un hueco, en altos de celda, dejando la última fila para la etiqueta.
    function radioEn(hueco, v) {
      return Math.max(0.5, Math.min((hueco.alto - 1.5) / 2, (hueco.ancho * v.aspecto) / 2) * 0.86);
    }

    function dibujar() {
      const a = cfg().agencia;
      const r = P.raiz();
      r.limpiar();
      r.rellenar(0, 0, r.ancho, 1, " ", "ambar", { inverso: true });
      let x = 1;
      PAGINAS.forEach((nombre, i) => {
        const texto = esAncho() ? ` ${i + 1} ${nombre} ` : ` ${i + 1} `;
        x = r.escribir(x, 0, texto, "ambar", i === pagina ? undefined : { inverso: true }) + 1;
      });
      r.derecha(0, `${r.ancho}×${r.alto} · ${modo()} `, "ambar", { inverso: true });
      const pie = esAncho() ? `${a.sistema} · PRUEBA · 1-3/←→ PÁGINA · ESC APAGAR · R ARRANQUE · F MEDIDOR` : "TOQUE ARRIBA: PÁGINA · ⏻ APAGAR";
      r.escribir(1, r.alto - 1, pie, "ambarTenue");
      const cuerpo = r.region(0, 1, r.ancho, r.alto - 2);
      huecos = [];
      lienzoPrimitivas = null;
      if (pagina === 0) paginaTexto(cuerpo);
      else if (pagina === 1) paginaVectores(cuerpo);
      else paginaGlobos(cuerpo);
      if (pagina === 0 && puntero) P.ponerCursor(puntero.x, puntero.y); else P.ocultarCursor();
    }

    function vectores(raiz, ahora) {
      const t = ahora / 1000;
      if (lienzoPrimitivas) primitivas(lienzoPrimitivas.vectores(), t);
      if (pagina === 1) {
        huecos.forEach((hueco, i) => {
          const v = hueco.vectores();
          const m = MUESTRAS[i];
          v.globo(hueco.ancho / 2, (hueco.alto - 1) / 2, radioEn(hueco, v), m.tierra, m.opciones(t));
        });
      } else if (pagina === 2) {
        huecos.forEach((hueco, i) => {
          const v = hueco.vectores();
          v.globo(hueco.ancho / 2, (hueco.alto - 1) / 2, radioEn(hueco, v), { id: ID_TIERRA(i) }, {});
        });
      }
    }

    function primitivas(v, t) {
      const w = v.ancho, h = v.alto;
      v.texto(w / 2, h * 0.04, "T−3 DÍAS", "ambar", { tam: Math.min(4, h * 0.16), alinear: "center" });
      v.texto(w / 2, h * 0.2, "HOSTILIDADES", "arma", { tam: Math.min(2.2, h * 0.09), alinear: "center" });
      // Retícula y una onda
      const y0 = h * 0.42, alto = h * 0.2;
      for (let i = 0; i <= 8; i++) v.linea(2 + ((w - 4) * i) / 8, y0, 2 + ((w - 4) * i) / 8, y0 + alto, "ambarTenue", { alfa: 0.5 });
      v.linea(2, y0 + alto / 2, w - 2, y0 + alto / 2, "ambarTenue", { discontinua: [3, 4] });
      const onda = [];
      for (let i = 0; i <= 120; i++) {
        const x = 2 + ((w - 4) * i) / 120;
        onda.push([x, y0 + alto / 2 - (alto / 2.4) * Math.sin(i * 0.35 + t * 4) * Math.cos(i * 0.035)]);
      }
      v.polilinea(onda, "tierra");
      // Figuras
      const yf = h * 0.75;
      v.circulo(w * 0.15, yf, Math.min(2.2, h * 0.09), "texto");
      v.arco(w * 0.15, yf, Math.min(2.2, h * 0.09) + 0.6, t, t + Math.PI * 1.3, "ambar", { grosor: cfg().vectores.grosorActivo });
      v.poligono([[w * 0.32, yf + 2], [w * 0.42, yf - 2], [w * 0.52, yf + 2]], "ambar", { relleno: "ambar", rellenoAlfa: 0.2 });
      // Trayectoria de misil con proyectil
      const x1 = w * 0.6, y1 = yf + 2, cx = w * 0.75, cy = yf - 5, x2 = w * 0.92, y2 = yf + 2;
      v.curva(x1, y1, cx, cy, x2, y2, "arma", { discontinua: [2, 4], alfa: 0.7 });
      const q = DENDRO.vectores.puntoEnCurva(x1, y1, cx, cy, x2, y2, (t * 0.6) % 1);
      v.punto(q.x, q.y, "arma", { tam: 2.6 });
      v.circulo(x2, y2, 0.4 + ((t * 0.6) % 1) * 0.6, "arma", { alfa: 1 - ((t * 0.6) % 1) });
    }

    function cambiarPagina(n) {
      pagina = (n + PAGINAS.length) % PAGINAS.length;
      dibujar();
      DENDRO.vectores.marcarSucio();
    }

    function marcar(punto) {
      if (!punto) return;
      const celda = { x: Math.floor(punto.x), y: Math.floor(punto.y) };
      if (puntero && puntero.x === celda.x && puntero.y === celda.y) return;
      puntero = celda;
      if (pagina === 0) dibujar();
    }

    return {
      get animada() { return pagina > 0; },
      iniciar() {
        const paso = () => {
          // Fuera de la página TEXTO el registro sigue creciendo pero no se dibuja.
          if (pagina === 0) consola.agregar(lineaRegistro()); else consola.lineas.push(lineaRegistro());
          if (consola.lineas.length > 400) consola.lineas.splice(0, 200);
          temporizador = setTimeout(paso, DENDRO.prng.entero(rng, 40, 220));
        };
        paso();
      },
      dibujar,
      vectores,
      tecla(ev) {
        const k = ev.key.toLowerCase();
        if (k === "escape" || k === "q") alSalir();
        else if (k === "r") alReiniciar();
        else if (k === "f") alAlternarFPS();
        else if (k === "arrowright") cambiarPagina(pagina + 1);
        else if (k === "arrowleft") cambiarPagina(pagina - 1);
        else if (k >= "1" && k <= "3") cambiarPagina(Number(k) - 1);
      },
      toque(punto) {
        if (punto && punto.y < 1) cambiarPagina(pagina + 1);
        else marcar(punto);
      },
      movimiento: marcar,
      detener() { clearTimeout(temporizador); },
    };
  }

  DENDRO.prueba = { crear };
})(window.DENDRO = window.DENDRO || {});
