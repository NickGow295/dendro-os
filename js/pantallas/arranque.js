// Secuencia de arranque tipo mainframe (RF-02) sobre la rejilla. Varía con la fase del día:
// más avisos, reintentos y fallos a medida que avanza el colapso. Saltable si ya se vio hoy.
// Mientras corre, precalcula los modelos de los globos para que el escritorio abra sin tirones.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const CLAVE_VISTO = "dendro.arranqueVisto";
  const COLOR_ALERTA = { "VERDE": "exito", "ÁMBAR": "ambar", "NARANJA": "ambar", "ROJO": "peligro", "NEGRO": "peligro", "—": "textoTenue" };

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

  function precalcularGlobos(tierras) {
    let i = 0;
    const paso = () => {
      if (i >= tierras.length) return;
      const t = tierras[i++];
      DENDRO.globo.modelo(t.id, t.globo);
      setTimeout(paso, 16);
    };
    setTimeout(paso, 400);
  }

  function crear({ fecha, estado, alTerminar }) {
    const P = DENDRO.pantalla;
    const areaTexto = () => P.region(2, 1, P.columnas - 4, P.filas - 2);
    const consola = DENDRO.escritor.crearConsola(areaTexto);
    const escritor = DENDRO.escritor.crearEscritor(consola);
    const rng = DENDRO.prng.crear(fecha, "arranque");
    const saltable = leerVisto() === fecha;
    const fase = estado.fase, intensidad = estado.intensidad;
    const lento = 1 + intensidad;   // el sistema tarda más cuanto peor está (como mucho el doble)
    let etapa = "texto";

    function moverCursor() {
      if (etapa !== "texto") return;
      const f = consola.finalDeLinea();
      P.ponerCursor(f.x, f.y);
    }

    const linea = async (seg, o) => { await escritor.linea(seg, o); moverCursor(); };
    const esperar = (ms) => escritor.esperar(ms * lento);

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
      await linea([{ t: etiqueta }]);
      const ancho = Math.max(10, Math.min(32, areaTexto().ancho - 8));
      consola.agregar([]);
      let progreso = 0, atascada = false;
      while (progreso < 100) {
        progreso = Math.min(100, progreso + DENDRO.prng.entero(rng, 2, 11));
        const llenos = Math.round((ancho * progreso) / 100);
        consola.reemplazarUltima([
          { t: "[", c: "ambarTenue" }, { t: "█".repeat(llenos), c: "ambar" },
          { t: "░".repeat(ancho - llenos), c: "ambarTenue" }, { t: "] ", c: "ambarTenue" },
          { t: String(progreso).padStart(3) + "%", c: "texto" },
        ]);
        moverCursor();
        await esperar(DENDRO.prng.entero(rng, 30, 120));
        // Desde la cascada, los aislantes se atascan una vez a mitad de calibración.
        if (fase >= 3 && !atascada && progreso >= 60) {
          atascada = true;
          await esperar(700);
          await linea([{ t: "  AISLANTE DE FASE NO RESPONDE · REINTENTANDO", c: "ambar" }]);
          await esperar(500);
          consola.agregar([]);
        }
      }
      if (fase >= 3) await linea([{ t: `  AISLANTES AL ${Math.round(100 - intensidad * 45)} %`, c: fase >= 4 ? "arma" : "ambar" }]);
    }

    async function verificarVistas() {
      await linea([{ t: "VERIFICANDO VISTAS", c: "ambar" }]);
      for (const v of DENDRO.vistas.catalogo) {
        await linea([{ t: `  V${v.tecla} ${v.titulo} ` }, { relleno: ".", c: "ambarTenue" }], { velocidad: 9 });
        await esperar(DENDRO.prng.entero(rng, 60, 240));
        if (estado.modulosCaidos.includes(v.id)) {
          consola.anexar({ t: " [ FALLO ]", c: "arma" });
        } else if (fase >= 3 && rng() < intensidad * 0.5) {
          consola.anexar({ t: " [ ERROR ]", c: "arma" });
          await linea([{ t: "    REINTENTO " }, { relleno: ".", c: "ambarTenue" }], { velocidad: 9 });
          await esperar(DENDRO.prng.entero(rng, 200, 500));
          consola.anexar({ t: " [ OK ]", c: "exito" });
        } else if (fase >= 2 && rng() < intensidad) {
          consola.anexar({ t: " [ AVISO ]", c: "ambar" });
        } else {
          consola.anexar({ t: " [ OK ]", c: "exito" });
        }
      }
    }

    async function guion() {
      const a = cfg().agencia, z = cfg().cronologia.zonaHoraria;
      const sede = a.sede.toLocaleUpperCase("es");
      await esperar(350);
      await linea([{ t: `${a.sistema} v${a.version}`, c: "ambar" }, { t: "  MONITOR DE SUSTRATO M11", c: "textoTenue" }]);
      await linea([{ t: `(C) ${a.siglas} · ${sede}`, c: "textoTenue" }], { pausa: 250 });
      await linea("");
      await contar("MEMORIA DEL SUSTRATO ", 65536, "K");
      if (fase >= 2) await linea([{ t: `  SECTORES DEGRADADOS: ${Math.max(1, Math.round(intensidad * 64))}`, c: fase >= 3 ? "arma" : "ambar" }]);
      await linea("", { pausa: 150 });
      await verificarVistas();
      await linea("");
      if (fase === 1) await linea([{ t: "ADVERTENCIA: ANOMALÍA DE FIRMA EN EL CUADRANTE BAJO", c: "ambar" }], { pausa: 300 });
      if (fase >= 2) {
        const activas = estado.parejas.filter((p) => ["APROXIMACIÓN", "CONTACTO", "HOSTILIDADES", "INTERFERENCIA"].includes(p.estado)).length;
        await linea([{ t: "CONVERGENCIAS ACTIVAS: " }, { t: String(activas), c: "arma" }]);
        await linea([{ t: "RAMAS AFECTADAS: " }, { t: DENDRO.escritorio.formatoRamas(estado.ramasAfectadas), c: "arma" }], { pausa: 300 });
      }
      await barra("CALIBRANDO AISLANTES DE FASE");
      await linea("");
      await linea([{ t: "SINCRONIZANDO META-TIEMPO τ " }, { relleno: ".", c: "ambarTenue" }, fase >= 4 ? { t: " IRREGULAR", c: "arma" } : { t: " OK", c: "exito" }]);
      await linea([{ t: "  FECHA DE AGENCIA  ", c: "textoTenue" }, { t: `${fecha}  ${DENDRO.reloj.horaAgencia()}` }]);
      await linea([{ t: "  ZONA HORARIA      ", c: "textoTenue" }, { t: z.toUpperCase() }]);
      await linea([{ t: `ENLACE CON LA ${sede} ` }, { relleno: ".", c: "ambarTenue" }]);
      await esperar(650);
      consola.anexar(fase >= 4 ? { t: " INESTABLE", c: "arma" } : fase === 3 ? { t: " DEGRADADO", c: "ambar" } : { t: " ESTABLECIDO", c: "exito" });
      if (fase >= 4) await linea([{ t: "ADVERTENCIA: PÉRDIDA DE COHESIÓN EN EL TRONCO", c: "arma", e: { parpadeo: true } }]);
      await esperar(900);
      marcarVisto(fecha);
      etapa = "logo";
      DENDRO.sonido.beep(fase >= 3 ? 440 : 880);
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
      const total = logo.length + 2 + nombre.length + 2 + 1 + 2 + 3;
      let y = Math.max(0, Math.floor((interior.alto - total) / 2));
      const x = Math.floor((interior.ancho - anchoLogo) / 2);
      for (const l of logo) interior.escribir(x, y++, l, "ambar");
      y += 2;
      for (const l of nombre) interior.centrar(y++, l, "texto");
      y += 1;
      interior.centrar(y++, `« ${a.lema} »`, "textoTenue");
      y += 1;
      interior.centrar(y++, `FASE ${fase} ${estado.nombreFase} · ALERTA ${estado.nivelAlerta}`, COLOR_ALERTA[estado.nivelAlerta]);
      y += 1;
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
        precalcularGlobos(estado.tierras);
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
