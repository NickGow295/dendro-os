// Colapso final (RF-08, 04-lore.md §13). Error fatal a pantalla completa (franja ámbar con texto oscuro,
// cuerpo blanco en un marco ámbar) hasta una tecla; después, el epílogo: arranque fallido, el Árbol
// deshaciéndose en vectores de las hojas al tronco (las ramas de la silueta, las últimas) y, al final,
// solo la semilla, el τ transcurrido desde el colapso y una terminal que acepta únicamente
// colapso.comandosPermitidos. Una tecla durante el epílogo salta al final.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const GROSOR_NIVEL = [4.4, 2.6, 1.7, 1.05, 0.8];
  const NIVELES = GROSOR_NIVEL.length;
  const MAPA_COMPLETO_MS = 1400;     // el Árbol entero antes de deshacerse
  const PASO_NIVEL_MS = 1500;        // de un nivel al siguiente, de las hojas al tronco
  const DISPERSION_MS = 1300;        // dentro de un nivel, cada segmento empieza a su hora
  const DESHACER_MS = 1100;          // lo que tarda un segmento en deshacerse
  const FRAGMENTOS = 3;
  const CAIDA = 2.5;                 // altos de celda que caen los fragmentos
  const FIN_ARBOL_MS = MAPA_COMPLETO_MS + (NIVELES - 1) * PASO_NIVEL_MS + DISPERSION_MS + DESHACER_MS;
  const CONTORNO_MS = [FIN_ARBOL_MS - 800, FIN_ARBOL_MS + 400];       // la figura se apaga…
  const RAMAS_SILUETA_MS = [FIN_ARBOL_MS + 400, FIN_ARBOL_MS + 1800]; // …y sus ramas, las últimas
  const FIN_MAPA_MS = RAMAS_SILUETA_MS[1] + 900;
  const FILAS_TEXTO = 7;             // filas libres bajo el mapa para el τ y la terminal
  const MAXIMO_ORDEN = 32;
  const MAX_RESPUESTAS = 4;

  // Separador de miles sin corte (U+00A0): al envolver en pantallas estrechas el número no se parte.
  const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const limitar = (x) => Math.max(0, Math.min(1, x));

  // Parte una línea por palabras (solo en espacios normales) para que quepa en `ancho`, con su sangría.
  function partir(linea, ancho) {
    if (DENDRO.pantalla.largo(linea) <= ancho) return [linea];
    const sangria = linea.match(/^ */)[0], partes = [];
    let actual = "";
    for (const palabra of linea.replace(/^ +| +$/g, "").split(/ +/)) {
      const prueba = actual ? `${actual} ${palabra}` : sangria + palabra;
      if (DENDRO.pantalla.largo(prueba) > ancho && actual) { partes.push(actual); actual = sangria + palabra; }
      else actual = prueba;
    }
    if (actual) partes.push(actual);
    return partes;
  }

  // Segmentos del Árbol con su hora de deshacerse y la deriva de sus fragmentos (sembradas).
  function prepararArbol() {
    const disp = DENDRO.multiverso.disposicion();
    const rng = DENDRO.prng.crear("colapso", "arbol");
    const segmentos = disp.segmentos.map((s) => ({
      ...s,
      inicio: MAPA_COMPLETO_MS + (NIVELES - 1 - s.nivel) * PASO_NIVEL_MS + rng() * DISPERSION_MS,
      deriva: Array.from({ length: FRAGMENTOS }, () => [(rng() - 0.5) * 3, (rng() - 0.3) * 1.5]),
    }));
    const lim = { minX: disp.limites.minX - 0.03, maxX: disp.limites.maxX + 0.03, minY: -DENDRO.silueta.SUSTRATO - 0.02, maxY: disp.limites.maxY + 0.03 };
    // Ocho ramas del segundo nivel, repartidas, de las que tira la silueta.
    const nivel2 = disp.segmentos.filter((s) => s.nivel === 2).sort((a, b) => a.x2 - b.x2);
    const objetivos = [];
    for (let i = 0; i < 8; i++) { const s = nivel2[Math.floor(((i + 0.5) * nivel2.length) / 8)]; objetivos.push([s.x2, s.y2]); }
    const orden = [0, 7, 1, 6, 2, 5, 3, 4].map((i) => objetivos[i]);
    return { segmentos, lim, objetivos: orden };
  }

  function crear({ instanteColapso, reducido }) {
    const P = DENDRO.pantalla;
    const R = cfg().cronologia.ramasAfectadasFinal;
    let paso = "error";               // error → arranque → mapa → semilla
    let escritor = null, inicioMapa = 0, arbol = null, entrada = "", respuestas = [], reloj = 0;
    const consola = DENDRO.escritor.crearConsola(() => P.region(2, 1, P.columnas - 4, P.filas - 2));

    // ── Error fatal ─────────────────────────────────────────────────────────
    function dibujarError() {
      const r = P.raiz();
      r.limpiar();
      P.ocultarCursor();
      const titulo = cfg().colapso.tituloError;
      const cuerpo = cfg().colapso.mensajeError.map((l) => l.replace(/\{ramas\}/g, miles(R)));
      const ancho = Math.min(r.ancho - 2, Math.max(P.largo(titulo), ...cuerpo.map(P.largo)) + 6);
      const lineas = cuerpo.flatMap((l) => partir(l, ancho - 4));
      const alto = Math.min(r.alto, lineas.length + 4);
      const caja = r.caja(Math.floor((r.ancho - ancho) / 2), Math.floor((r.alto - alto) / 2), ancho, alto, {});
      caja.rellenar(0, 0, caja.ancho, 1, " ", "ambar", { inverso: true });
      caja.centrar(0, titulo, "ambar", { inverso: true });
      lineas.forEach((l, i) => {
        if (l.startsWith("[")) caja.centrar(i + 2, l, "texto", { parpadeo: true });
        else caja.escribir(1, i + 2, l, "texto");
      });
    }

    // ── Arranque fallido ────────────────────────────────────────────────────
    async function arranqueFallido() {
      paso = "arranque";
      P.raiz().limpiar();
      consola.limpiar();
      escritor = DENDRO.escritor.crearEscritor(consola);
      const a = cfg().agencia, linea = escritor.linea;
      const fallo = (texto) => linea([{ t: texto }, { relleno: ".", c: "ambarTenue" }, { t: " [ FALLO ]", c: "arma" }], { velocidad: 9 });
      try {
        await escritor.esperar(400);
        await linea([{ t: `${a.sistema} v${a.version}`, c: "ambar" }, { t: "  MONITOR DE SUSTRATO M11", c: "textoTenue" }], { pausa: 300 });
        await linea("");
        await fallo("MEMORIA DEL SUSTRATO ");
        await fallo("ENLACE CON MYTH ");
        await fallo("CALIBRACIÓN DE AISLANTES ");
        await linea([{ t: "VERIFICANDO VISTAS", c: "ambar" }]);
        for (const v of DENDRO.vistas.catalogo) { await fallo(`  V${v.tecla} ${v.titulo} `); await escritor.esperar(70); }
        await linea("", { pausa: 300 });
        await linea([{ t: "MEDIDOR τ ", c: "texto" }, { relleno: ".", c: "ambarTenue" }, { t: " DETENIDO", c: "arma" }]);
        await linea([{ t: "ABRIENDO LA ÚLTIMA COPIA DEL MAPA…", c: "ambar" }], { pausa: 1000 });
        empezarMapa();
      } catch (err) {
        if (err !== DENDRO.escritor.CANCELADO) throw err;
      }
    }

    function empezarMapa() {
      paso = "mapa";
      P.raiz().limpiar();
      inicioMapa = performance.now();
      DENDRO.vectores.marcarSucio();
    }

    // Mapa a pantalla completa (salvo las filas del texto), con la semilla en la base del tronco.
    function proyeccion(v) {
      if (!arbol) arbol = prepararArbol();
      const altoMapa = v.alto - FILAS_TEXTO - 1, { lim } = arbol;
      const S = Math.min(altoMapa / (lim.maxY - lim.minY), (v.ancho * v.aspecto) / (lim.maxX - lim.minX));
      return {
        S,
        sx: (x) => v.ancho / 2 + ((x - (lim.minX + lim.maxX) / 2) * S) / v.aspecto,
        sy: (y) => 1 + altoMapa / 2 - (y - (lim.minY + lim.maxY) / 2) * S,
      };
    }

    // ── La semilla y la terminal limitada ───────────────────────────────────
    function pedirOrden() {
      entrada = "";
      DENDRO.teclado.pedirTexto({
        valor: "", maximo: MAXIMO_ORDEN, filtro: (t) => t.toLocaleLowerCase("es"),
        alCambiar(v) { if (v !== entrada) { entrada = v; dibujarSemilla(); } },
      });
    }

    function irSemilla() {
      if (escritor) escritor.cancelar();
      paso = "semilla";
      dibujarSemilla();
      pedirOrden();
      clearInterval(reloj);
      reloj = setInterval(dibujarSemilla, DENDRO.tau.latido());
    }

    function dibujarSemilla() {
      const r = P.raiz(), m = P.info();
      r.limpiar();
      const filaSemilla = Math.round(proyeccion({ ancho: r.ancho, alto: r.alto, aspecto: m.celdaAncho / m.celdaAlto }).sy(0));
      const y = Math.min(r.alto - 4, filaSemilla + 2);
      r.centrar(y, `τ DETENIDO HACE ${DENDRO.tau.duracion(DENDRO.reloj.ahora() - instanteColapso)}`, "textoTenue");
      const x0 = Math.max(1, Math.floor(r.ancho / 2) - 14);
      const fin = r.escribir(x0, y + 2, `▸ ${entrada}`, "ambar");
      P.ponerCursor(fin, y + 2);
      respuestas.forEach((l, i) => r.escribir(x0 + 2, y + 3 + i, l.t, l.c));
    }

    function ejecutar() {
      const orden = entrada.trim();
      pedirOrden();
      if (!orden) return;
      if (!cfg().colapso.comandosPermitidos.includes(orden)) {
        DENDRO.sonido.beep(220);
        respuestas = [{ t: "EL SUSTRATO NO RESPONDE.", c: "textoTenue" }];
      } else if (orden === "semilla") {
        DENDRO.sonido.beep(440);
        DENDRO.local.desbloquear("negro");
        respuestas = [{ t: "|Ω₀⟩ · ESTADO NULO", c: "rama" }, { t: "NO SE VUELVE A LA SEMILLA: [Ŝ, N̂] ≠ 0.", c: "texto" }];
      } else {
        respuestas = [{ t: "SIN RESPUESTA.", c: "textoTenue" }];
      }
      respuestas = respuestas.slice(0, MAX_RESPUESTAS);
      dibujarSemilla();
    }

    // ── Vectores: el Árbol que se deshace y la semilla ──────────────────────
    function vectores(raiz, ahora) {
      if (paso !== "mapa" && paso !== "semilla") return;
      const v = raiz, { S, sx, sy } = proyeccion(v);
      const t = paso === "semilla" ? Infinity : ahora - inicioMapa;

      if (t < FIN_ARBOL_MS) dibujarArbol(v, t, sx, sy);
      if (t < RAMAS_SILUETA_MS[1]) {
        DENDRO.silueta.dibujar(v, {
          x: sx(0), y: sy(-DENDRO.silueta.SUSTRATO * DENDRO.silueta.PIES),
          alto: (DENDRO.silueta.SUSTRATO * DENDRO.silueta.PIES - DENDRO.silueta.CABEZA_ARRIBA) * S,
          objetivos: arbol.objetivos.map(([x, y]) => [sx(x), sy(y)]),
          ahora, reducido, crecimiento: 1,
          alfaContorno: 1 - limitar((t - CONTORNO_MS[0]) / (CONTORNO_MS[1] - CONTORNO_MS[0])),
          alfaRamas: 1 - limitar((t - RAMAS_SILUETA_MS[0]) / (RAMAS_SILUETA_MS[1] - RAMAS_SILUETA_MS[0])),
        });
      }
      if (t >= RAMAS_SILUETA_MS[1]) {
        const brillo = paso === "semilla" ? 1 : limitar((t - RAMAS_SILUETA_MS[1]) / 600);
        const pulso = reducido ? 0.5 : 0.5 + 0.5 * Math.sin(ahora / 900);
        v.circulo(sx(0), sy(0), 0.6 + 0.2 * pulso, "rama", { alfa: 0.15 * brillo, relleno: "rama", rellenoAlfa: 0.3, sinTrazo: true });
        v.punto(sx(0), sy(0), "rama", { tam: 2.4, alfa: brillo });
      }
      if (paso === "mapa" && t >= FIN_MAPA_MS) irSemilla();
    }

    function dibujarArbol(v, t, sx, sy) {
      const enteros = Array.from({ length: NIVELES }, () => []);
      const fragmentos = [[], [], [], []];        // por tramo de alfa
      for (const s of arbol.segmentos) {
        const e = t - s.inicio;
        if (e >= DESHACER_MS) continue;
        const x1 = sx(s.x1), y1 = sy(s.y1), x2 = sx(s.x2), y2 = sy(s.y2);
        if (e < 0) { enteros[s.nivel].push(x1, y1, x2, y2); continue; }
        const k = e / DESHACER_MS, lote = fragmentos[Math.min(3, Math.floor(k * 4))];
        for (let f = 0; f < FRAGMENTOS; f++) {
          const [dx, dy] = s.deriva[f];
          const a = f / FRAGMENTOS, b = (f + 1) / FRAGMENTOS;
          const ox = reducido ? 0 : (dx * k) / v.aspecto, oy = reducido ? 0 : k * k * CAIDA + dy * k;
          lote.push(x1 + (x2 - x1) * a + ox, y1 + (y2 - y1) * a + oy, x1 + (x2 - x1) * (b - 0.08) + ox, y1 + (y2 - y1) * (b - 0.08) + oy);
        }
      }
      enteros.forEach((segs, nivel) => v.trazos(segs, "rama", { grosor: GROSOR_NIVEL[nivel] }));
      fragmentos.forEach((segs, i) => v.trazos(segs, "rama", { grosor: 1, alfa: 0.85 - i * 0.22 }));
    }

    return {
      get animada() { return paso === "mapa" || paso === "semilla"; },
      esColapso: true,
      dibujar() {
        if (paso === "error") dibujarError();
        else if (paso === "arranque") consola.dibujar();
        else if (paso === "semilla") dibujarSemilla();
      },
      iniciar() {
        DENDRO.sonido.beep(110);
      },
      vectores,
      tecla(ev) {
        if (paso === "error") { ev.preventDefault(); arranqueFallido(); return; }
        if (paso === "arranque" || paso === "mapa") { ev.preventDefault(); irSemilla(); return; }
        if (ev.key === "Enter") { ev.preventDefault(); ejecutar(); return; }
        DENDRO.teclado.recoger(ev);
      },
      toque() {
        if (paso === "error") arranqueFallido();
        else if (paso === "semilla") DENDRO.teclado.enfocar();
        else irSemilla();
      },
      detener() {
        clearInterval(reloj);
        DENDRO.teclado.soltar();
        if (escritor) escritor.cancelar();
      },
    };
  }

  DENDRO.colapso = { crear };
})(window.DENDRO = window.DENDRO || {});
