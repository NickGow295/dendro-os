// Secuencia de arranque tipo mainframe (RF-02) sobre la rejilla.
// Prototipo: variante nominal. Las variantes por fase llegan con el motor de cronología.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const CLAVE_VISTO = "dendro.arranqueVisto";
  const MODULOS = [
    ["M1", "TERMINAL"], ["M2", "MAPA DEL ÁRBOL"], ["M3", "EXPEDIENTES"], ["M4", "MONITOR DE COLISIONES"],
    ["M5", "REGISTRO DE INCIDENTES"], ["M6", "COMUNICACIONES"], ["M7", "ARCHIVO"], ["M8", "CONTENCIÓN"],
  ];

  function leerVisto() {
    try { return localStorage.getItem(CLAVE_VISTO); } catch (_) { return null; }
  }
  function marcarVisto(fecha) {
    try { localStorage.setItem(CLAVE_VISTO, fecha); } catch (_) { /* sin almacenamiento: no pasa nada */ }
  }

  function envolver(texto, ancho) {
    const lineas = [];
    let actual = "";
    for (const palabra of texto.split(/\s+/)) {
      if (actual && (actual + " " + palabra).length > ancho) { lineas.push(actual); actual = palabra; }
      else actual = actual ? actual + " " + palabra : palabra;
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  const esTactil = () => window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  function crear({ fecha, alTerminar }) {
    const P = DENDRO.pantalla;
    const areaTexto = () => P.region(2, 1, P.columnas - 4, P.filas - 2);
    const consola = DENDRO.escritor.crearConsola(areaTexto);
    const escritor = DENDRO.escritor.crearEscritor(consola);
    const rng = DENDRO.prng.crear(fecha, "arranque");
    const saltable = leerVisto() === fecha;
    let etapa = "texto";

    function moverCursor() {
      if (etapa !== "texto") return;
      const f = consola.finalDeLinea();
      P.ponerCursor(f.x, f.y);
    }

    async function contar(etiqueta, hasta, sufijo) {
      const pasos = 24;
      consola.agregar([]);
      for (let i = 1; i <= pasos; i++) {
        const n = Math.round((hasta * i) / pasos);
        consola.reemplazarUltima([{ t: etiqueta }, { relleno: ".", c: "ambarTenue" }, { t: ` ${n}${sufijo}`, c: "ambar" }]);
        moverCursor();
        await escritor.esperar(28);
      }
      consola.anexar({ t: " OK", c: "exito" });
    }

    async function barra(etiqueta) {
      await escritor.linea([{ t: etiqueta }]);
      const ancho = Math.max(10, Math.min(32, areaTexto().ancho - 8));
      consola.agregar([]);
      let progreso = 0;
      while (progreso < 100) {
        progreso = Math.min(100, progreso + DENDRO.prng.entero(rng, 2, 11));
        const llenos = Math.round((ancho * progreso) / 100);
        consola.reemplazarUltima([
          { t: "[", c: "ambarTenue" }, { t: "█".repeat(llenos), c: "ambar" },
          { t: "░".repeat(ancho - llenos), c: "ambarTenue" }, { t: "] ", c: "ambarTenue" },
          { t: String(progreso).padStart(3) + "%", c: "texto" },
        ]);
        moverCursor();
        await escritor.esperar(DENDRO.prng.entero(rng, 30, 120));
      }
    }

    async function guion() {
      const a = cfg().agencia, z = cfg().cronologia.zonaHoraria;
      const linea = async (seg, o) => { await escritor.linea(seg, o); moverCursor(); };
      await escritor.esperar(350);
      await linea([{ t: `${a.sistema} v${a.version}`, c: "ambar" }, { t: "  MONITOR DE SUSTRATO M11", c: "textoTenue" }]);
      await linea([{ t: `(C) ${a.siglas} · ${a.sede.toLocaleUpperCase("es")}`, c: "textoTenue" }], { pausa: 250 });
      await linea("");
      await contar("MEMORIA DEL SUSTRATO ", 65536, "K");
      await linea("", { pausa: 150 });
      await linea([{ t: "VERIFICANDO MÓDULOS", c: "ambar" }]);
      for (const [id, nombre] of MODULOS) {
        await linea([{ t: `  ${id} ${nombre} ` }, { relleno: ".", c: "ambarTenue" }], { velocidad: 9 });
        await escritor.esperar(DENDRO.prng.entero(rng, 60, 240));
        consola.anexar({ t: " [ OK ]", c: "exito" });
      }
      await linea("");
      await barra("CALIBRANDO AISLANTES DE FASE");
      await linea("");
      await linea([{ t: "SINCRONIZANDO META-TIEMPO τ " }, { relleno: ".", c: "ambarTenue" }, { t: " OK", c: "exito" }]);
      await linea([{ t: "  FECHA DE AGENCIA  ", c: "textoTenue" }, { t: `${fecha}  ${DENDRO.reloj.horaAgencia()}` }]);
      await linea([{ t: "  ZONA HORARIA      ", c: "textoTenue" }, { t: z.toUpperCase() }]);
      await linea([{ t: `ENLACE CON LA ${a.sede.toLocaleUpperCase("es")} ` }, { relleno: ".", c: "ambarTenue" }]);
      await escritor.esperar(650);
      consola.anexar({ t: " ESTABLECIDO", c: "exito" });
      await escritor.esperar(900);
      marcarVisto(fecha);
      etapa = "logo";
      dibujar();
    }

    function dibujarLogo() {
      const a = cfg().agencia;
      P.limpiar();
      const r = P.raiz();
      const interior = r.caja(0, 0, r.ancho, r.alto, { titulo: `${a.sistema} v${a.version}` });
      const logo = a.logoASCII;
      const anchoLogo = Math.max(...logo.map(P.largo));
      const nombre = envolver(a.nombre.toLocaleUpperCase("es"), interior.ancho - 6);
      const indicacion = esTactil() ? "▶ TOQUE PARA CONTINUAR" : "▶ PULSE ENTER PARA CONTINUAR";
      const total = logo.length + 2 + nombre.length + 2 + 1 + 3;
      let y = Math.max(0, Math.floor((interior.alto - total) / 2));
      const x = Math.floor((interior.ancho - anchoLogo) / 2);
      for (const l of logo) interior.escribir(x, y++, l, "ambar");
      y += 2;
      for (const l of nombre) interior.centrar(y++, l, "texto");
      y += 1;
      interior.centrar(y++, `« ${a.lema} »`, "textoTenue");
      y += 2;
      const fin = interior.centrar(y, indicacion, "ambar");
      P.ponerCursor(interior.x + fin + 1, interior.y + y);
      r.derecha(r.alto - 1, ` ${fecha} `, "ambarTenue");
    }

    function dibujar() {
      if (etapa === "texto") { consola.dibujar(); moverCursor(); }
      else dibujarLogo();
    }

    function continuar() {
      if (etapa === "logo") alTerminar();
      else if (saltable) escritor.saltar();
    }

    return {
      iniciar() {
        guion().catch((err) => { if (err !== DENDRO.escritor.CANCELADO) throw err; });
      },
      dibujar,
      tecla(ev) {
        if (etapa === "logo" && ev.key !== "Enter" && ev.key !== " ") return;
        ev.preventDefault();
        continuar();
      },
      toque: continuar,
      detener() { escritor.cancelar(); },
    };
  }

  DENDRO.arranque = { crear };
})(window.DENDRO = window.DENDRO || {});
