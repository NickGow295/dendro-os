// SOLO PROTOTIPO: patrón de prueba para revisar la rejilla, el shader y el rendimiento.
// Usa únicamente la API pública de DENDRO.pantalla, igual que harán los módulos.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
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

  function crear({ fecha, modo, alSalir, alReiniciar, alAlternarFPS }) {
    const P = DENDRO.pantalla;
    const rng = DENDRO.prng.crear(fecha, "prueba");
    let areaRegistro = null, puntero = null, temporizador = 0, cuenta = 0;
    const consola = DENDRO.escritor.crearConsola(() => areaRegistro);

    function lineaRegistro() {
      const [tipo, color] = DENDRO.prng.elegir(rng, TIPOS);
      const rama = "B-0x" + DENDRO.prng.entero(rng, 1, 24).toString(16).toUpperCase().padStart(2, "0");
      const omega = (rng() * 9).toFixed(4);
      cuenta++;
      return [
        { t: String(cuenta).padStart(5, "0") + " ", c: "ambarTenue" },
        { t: `[${tipo}] `.padEnd(11), c: color },
        { t: `${DENDRO.prng.elegir(rng, FRASES)} `, c: "texto" },
        { t: `${rama} ω=${omega}`, c: "tierra" },
      ];
    }

    function dibujarPaleta(r) {
      const nombres = Object.keys(cfg().colores);
      nombres.forEach((n, i) => {
        r.escribir(1, i, "████", n);
        r.escribir(6, i, n, "texto");
        r.escribir(18, i, cfg().colores[n], "textoTenue");
      });
    }

    function dibujarCaracteres(r) {
      MUESTRA_CAJAS.forEach((l, i) => r.escribir(1, i, l, "ambar"));
      r.escribir(1, 5, "░░▒▒▓▓██ ▀▄▌▐", "ambar");
      r.escribir(1, 6, "ÁÉÍÓÚÑÜ ¿¡ ω Δ τ Ω « »", "texto");
      r.escribir(1, 7, "TEXTO TENUE", "texto", { tenue: true });
      r.escribir(14, 7, " INVERSO ", "ambar", { inverso: true });
      r.escribir(24, 7, "PARPADEO", "arma", { parpadeo: true });
    }

    function dibujarPuntero(r) {
      r.limpiar();
      if (!puntero) { r.escribir(1, 0, "MUEVA EL RATÓN O TOQUE", "textoTenue"); return; }
      const celda = P.leer(puntero.x, puntero.y);
      r.escribir(1, 0, `CELDA ${puntero.x},${puntero.y}`, "texto");
      if (celda) r.escribir(1, 1, `'${celda.caracter}' ${celda.color}`, "tierra");
    }

    function dibujar() {
      const a = cfg().agencia;
      const r = P.raiz();
      r.limpiar();
      r.rellenar(0, 0, r.ancho, 1, " ", "ambar", { inverso: true });
      r.escribir(1, 0, `${a.sistema} · PATRÓN DE PRUEBA`, "ambar", { inverso: true });
      r.derecha(0, `${r.ancho}×${r.alto} · ${modo()} `, "ambar", { inverso: true });
      const pie = esAncho() ? "ESC APAGAR · R REINICIAR ARRANQUE · F MEDIDOR" : "⏻ APAGAR · TOQUE: CELDA";
      r.escribir(1, r.alto - 1, pie, "ambarTenue");

      const cuerpo = r.region(0, 1, r.ancho, r.alto - 2);
      const nColores = Object.keys(cfg().colores).length;
      let registroCaja, punteroCaja;
      if (esAncho()) {
        const izq = 34;
        dibujarPaleta(cuerpo.caja(0, 0, izq, nColores + 2, { titulo: "PALETA" }));
        dibujarCaracteres(cuerpo.caja(0, nColores + 2, izq, 10, { titulo: "CARACTERES", doble: false }));
        punteroCaja = cuerpo.caja(izq, cuerpo.alto - 4, cuerpo.ancho - izq, 4, { titulo: "PUNTERO", doble: false });
        registroCaja = cuerpo.caja(izq, 0, cuerpo.ancho - izq, cuerpo.alto - 4, { titulo: "REGISTRO EN VIVO" });
      } else {
        const altoPaleta = Math.ceil(nColores / 2) + 2;
        const paleta = cuerpo.caja(0, 0, cuerpo.ancho, altoPaleta, { titulo: "PALETA" });
        Object.keys(cfg().colores).forEach((n, i) => {
          const x = (i % 2) * Math.floor(paleta.ancho / 2);
          paleta.escribir(x + 1, Math.floor(i / 2), "██", n);
          paleta.escribir(x + 4, Math.floor(i / 2), n, "texto");
        });
        punteroCaja = cuerpo.caja(0, cuerpo.alto - 4, cuerpo.ancho, 4, { titulo: "PUNTERO", doble: false });
        registroCaja = cuerpo.caja(0, altoPaleta, cuerpo.ancho, cuerpo.alto - altoPaleta - 4, { titulo: "REGISTRO EN VIVO" });
      }
      areaRegistro = registroCaja.region(1, 0, registroCaja.ancho - 2, registroCaja.alto);
      consola.dibujar();
      dibujarPuntero(punteroCaja);
      if (puntero) P.ponerCursor(puntero.x, puntero.y); else P.ocultarCursor();
    }

    const esAncho = () => P.columnas >= 80;

    function marcar(celda) {
      if (!celda) return;
      if (puntero && puntero.x === celda.x && puntero.y === celda.y) return;
      puntero = celda;
      dibujar();
    }

    return {
      iniciar() {
        const paso = () => {
          consola.agregar(lineaRegistro());
          if (consola.lineas.length > 400) consola.lineas.splice(0, 200);
          temporizador = setTimeout(paso, DENDRO.prng.entero(rng, 40, 220));
        };
        paso();
      },
      dibujar,
      tecla(ev) {
        const k = ev.key.toLowerCase();
        if (k === "escape" || k === "q") alSalir();
        else if (k === "r") alReiniciar();
        else if (k === "f") alAlternarFPS();
      },
      toque: marcar,
      movimiento: marcar,
      detener() { clearTimeout(temporizador); },
    };
  }

  DENDRO.prueba = { crear };
})(window.DENDRO = window.DENDRO || {});
