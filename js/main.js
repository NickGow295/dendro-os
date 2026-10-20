// Arranque de la app: monta la rejilla y el tubo, enruta pantallas y teclado, y mueve el bucle de fotogramas.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const $ = (id) => document.getElementById(id);

  const fecha = DENDRO.reloj.fechaHoy();
  const estadoDia = DENDRO.cronologia.calcularEstado(fecha);
  const movimientoReducido = cfg().efectos.respetarMovimientoReducido &&
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const parametro = (n) => (cfg().debug.permitirParametrosURL ? DENDRO.reloj.parametroURL(n) : null);

  let actual = null;
  let modo = "CSS";

  // ── Pantallas ─────────────────────────────────────────────────────────────
  function mostrar(pantalla) {
    if (actual && actual.detener) actual.detener();
    actual = pantalla;
    DENDRO.pantalla.limpiar();
    DENDRO.vectores.marcarSucio();
    if (!pantalla) return;
    pantalla.dibujar();
    if (pantalla.iniciar) pantalla.iniciar();
  }

  function irArranque() {
    mostrar(DENDRO.arranque.crear({ fecha, estado: estadoDia, alTerminar: irAcceso }));
  }

  function irAcceso() {
    mostrar(DENDRO.acceso.crear({ alTerminar: irEscritorio }));
  }

  function irEscritorio() {
    mostrar(DENDRO.escritorio.crear({ estado: estadoDia, salir: () => DENDRO.monitor.apagar() }));
  }

  // ── Medidor de rendimiento y calidad adaptativa ───────────────────────────
  const medidor = { visible: false, cuadros: 0, trabajo: 0, desde: 0, lentos: 0 };

  function alternarMedidor() {
    medidor.visible = !medidor.visible;
    $("medidor").hidden = !medidor.visible;
  }

  function medir(ahora, ms) {
    medidor.cuadros++;
    medidor.trabajo += ms;
    if (!medidor.desde) medidor.desde = ahora;
    const transcurrido = ahora - medidor.desde;
    if (transcurrido < 1000) return;
    const fps = (medidor.cuadros * 1000) / transcurrido;
    const i = DENDRO.pantalla.info();
    if (medidor.visible) {
      $("medidor").textContent =
        `${fps.toFixed(0)} FPS · CPU ${(medidor.trabajo / medidor.cuadros).toFixed(1)} MS · ` +
        `${i.ancho}×${i.alto} · ${i.columnas}×${i.filas} · CALIDAD ${Math.round(i.calidad * 100)}% · ${modo}`;
    }
    const encendido = DENDRO.monitor.estado() === "encendido";
    if (cfg().pantalla.calidadAdaptativa && encendido && !document.hidden) {
      medidor.lentos = fps < 45 ? medidor.lentos + 1 : 0;
      if (medidor.lentos >= 3 && i.calidad > 0.6) {
        medidor.lentos = 0;
        DENDRO.pantalla.fijarCalidad(Math.max(0.6, i.calidad * 0.8));
      }
    }
    medidor.cuadros = 0; medidor.trabajo = 0; medidor.desde = ahora;
  }

  // ── Bucle de fotogramas ───────────────────────────────────────────────────
  let cuadrosApagado = 0;
  function bucle(ahora) {
    const inicio = performance.now();
    const cambio = DENDRO.pantalla.renderizar(ahora);
    let cambioVectores = false;
    if (actual && actual.vectores && (actual.animada || DENDRO.vectores.sucio)) {
      DENDRO.vectores.comenzar(ahora);
      actual.vectores(DENDRO.pantalla.raiz().vectores(), ahora);
      cambioVectores = true;
    } else if (!actual || !actual.vectores) {
      cambioVectores = DENDRO.vectores.vaciar();
    }
    // Con el tubo apagado y el resplandor extinguido no hay nada que animar.
    const apagado = DENDRO.monitor.estado() === "apagado";
    cuadrosApagado = apagado ? cuadrosApagado + 1 : 0;
    if (cuadrosApagado < 4) DENDRO.crt.dibujar(ahora, cambio, cambioVectores);
    medir(ahora, performance.now() - inicio);
    requestAnimationFrame(bucle);
  }

  // ── Entrada ───────────────────────────────────────────────────────────────
  function alternarEncendido() {
    const estado = DENDRO.monitor.estado();
    if (estado === "apagado") DENDRO.monitor.encender();
    else if (estado === "encendido") DENDRO.monitor.apagar();
  }

  function alTeclear(ev) {
    if (DENDRO.teclado.ignorable(ev)) return;
    // Los botones del marco se activan con Enter/Espacio por sí solos.
    if (ev.target && ev.target.closest && ev.target.closest("button") && (ev.key === "Enter" || ev.key === " ")) return;
    const estado = DENDRO.monitor.estado();
    if (estado === "apagado") {
      ev.preventDefault();
      DENDRO.monitor.encender();
    } else if (estado !== "apagando" && actual && actual.tecla) {
      // El campo oculto suena por su cuenta al cambiar (también con el teclado del móvil).
      if (!ev.repeat && !DENDRO.teclado.esCampo(ev.target)) DENDRO.sonido.tecla();
      actual.tecla(ev);
    }
  }

  function alPulsarPantalla(ev) {
    const estado = DENDRO.monitor.estado();
    if (estado === "apagado") { DENDRO.monitor.encender(); return; }
    if (estado === "apagando" || !actual || !actual.toque) return;
    DENDRO.sonido.tecla();
    actual.toque(DENDRO.pantalla.puntoEn(ev.clientX, ev.clientY));
  }

  function alMoverPuntero(ev) {
    if (ev.pointerType !== "mouse" || !actual || !actual.movimiento) return;
    if (DENDRO.monitor.estado() !== "encendido") return;
    actual.movimiento(DENDRO.pantalla.puntoEn(ev.clientX, ev.clientY));
  }

  function alCambiarMonitor(estado) {
    const boton = $("boton-encendido");
    boton.setAttribute("aria-label", estado === "apagado" ? "Encender el monitor" : "Apagar el monitor");
    boton.setAttribute("aria-pressed", String(estado !== "apagado"));
    // El contenido aparece mientras el fósforo se calienta, como en un tubo real.
    if (estado === "encendiendo") {
      DENDRO.sonido.encender();
      irArranque();
    }
    if (estado === "apagando") {
      DENDRO.sonido.apagar();
      DENDRO.teclado.soltar();
      if (actual && actual.detener) actual.detener();
    }
    if (estado === "apagado") mostrar(null);
  }

  // ── Montaje ───────────────────────────────────────────────────────────────
  function rotular() {
    const a = cfg().agencia;
    document.title = `${a.sistema} · ${a.siglas}`;
    $("placa-siglas").textContent = a.siglas;
    $("placa-sistema").textContent = `${a.sistema} ${a.version}`;
    $("placa-modelo").textContent = a.terminal;
  }

  function activarRespaldo() {
    modo = "CSS";
    document.documentElement.classList.remove("crt-webgl");
    document.documentElement.classList.add("crt-css");
    // Reaplica el estado del tubo con transformaciones CSS.
    const t = DENDRO.crt.tubo;
    const tubo = $("tubo");
    tubo.style.transform = `scale(${Math.max(t.sx, 0.0001)}, ${Math.max(t.sy, 0.0001)})`;
    tubo.style.filter = `brightness(${t.calor + t.haz})`;
  }

  // Panel de depuración (RF-10): resumen del Estado del día; el Estado completo va a la consola.
  function mostrarPanelDebug() {
    const e = estadoDia;
    const panel = document.createElement("pre");
    panel.className = "panel-debug";
    panel.textContent = [
      `${e.fecha} · FASE ${e.fase} ${e.nombreFase} · ALERTA ${e.nivelAlerta}`,
      `p=${e.p.toFixed(3)}  intensidad=${e.intensidad.toFixed(2)}  ramas=${e.ramasAfectadas}  días al colapso=${e.diasParaColapso}`,
      `principal=${e.parejaPrincipal}  ataques=${e.ataques.length}  registro=${e.registro.length}  caídos=[${e.modulosCaidos.join(", ")}]`,
      ...e.parejas.map((p) => `${p.id} ${p.estado.padEnd(13)} Δω=${p.deltaOmega.toFixed(4)} sep=${p.separacion.toFixed(2)} T=${-p.diasParaContacto}${p.hostil ? " HOSTIL" : ""}`),
    ].join("\n");
    document.body.appendChild(panel);
    console.info("DENDRO-OS · Estado del día", e);
  }

  function iniciar() {
    DENDRO.tema.aplicar();
    rotular();
    DENDRO.crt.fijarIntensidad(estadoDia.intensidad);
    DENDRO.sonido.fijarIntensidad(estadoDia.intensidad);
    DENDRO.teclado.iniciar($("entrada"));
    if (cfg().debug.mostrarPanelDebug || parametro("debug") === "1") mostrarPanelDebug();
    if (movimientoReducido) document.documentElement.classList.add("movimiento-reducido");
    const ef = cfg().efectos, clases = document.documentElement.classList;
    if (!ef.scanlines) clases.add("sin-scanlines");
    if (!ef.parpadeo) clases.add("sin-parpadeo");
    if (!ef.curvatura) clases.add("sin-curvatura");

    const tubo = $("tubo");
    DENDRO.pantalla.iniciar(tubo);
    DENDRO.vectores.iniciar(tubo);
    const conWebGL = parametro("webgl") !== "0" && DENDRO.crt.iniciar(
      tubo, DENDRO.pantalla.lienzo, DENDRO.vectores.lienzo, { movimientoReducido, alPerderContexto: activarRespaldo });
    if (conWebGL) {
      modo = "WEBGL";
      document.documentElement.classList.add("crt-webgl");
    }
    DENDRO.monitor.iniciar({ raiz: $("monitor"), tubo, haz: $("haz"), reducido: movimientoReducido });
    if (!conWebGL) activarRespaldo();

    DENDRO.pantalla.alRedimensionar(() => {
      DENDRO.vectores.redimensionar();
      DENDRO.crt.redimensionar();
      if (actual) actual.dibujar();
    });
    let pendiente = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(() => DENDRO.pantalla.redimensionar());
    }).observe(tubo);
    DENDRO.pantalla.cargarFuente(2500).then(() => DENDRO.pantalla.redimensionar());

    DENDRO.monitor.alCambiar(alCambiarMonitor);
    $("boton-encendido").addEventListener("click", alternarEncendido);
    const botonSonido = $("boton-sonido");
    const marcarSonido = (activo) => {
      botonSonido.setAttribute("aria-pressed", String(activo));
      botonSonido.setAttribute("aria-label", activo ? "Silenciar" : "Activar sonido");
    };
    marcarSonido(DENDRO.sonido.activado());
    botonSonido.addEventListener("click", () => marcarSonido(DENDRO.sonido.alternar()));
    document.addEventListener("keydown", alTeclear);
    $("vidrio").addEventListener("pointerdown", alPulsarPantalla);
    $("vidrio").addEventListener("pointermove", alMoverPuntero);

    if (cfg().debug.mostrarFPS || parametro("fps") === "1") alternarMedidor();

    // Espejo de texto para lectores de pantalla (el canvas no es accesible).
    let version = -1;
    setInterval(() => {
      if (DENDRO.pantalla.version === version) return;
      version = DENDRO.pantalla.version;
      $("espejo").textContent = DENDRO.pantalla.textoPlano();
    }, 1500);

    requestAnimationFrame(bucle);
  }

  iniciar();
})(window.DENDRO = window.DENDRO || {});
