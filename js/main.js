// Arranque de la app: monta la rejilla y el tubo, enruta pantallas y teclado, y mueve el bucle de fotogramas.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const $ = (id) => document.getElementById(id);

  // El Estado del minuto actual; se recalcula al cambiar el minuto (RF-01, estado vivo).
  let estado = DENDRO.cronologia.calcularEstado(DENDRO.reloj.instanteActual());
  const movimientoReducido = cfg().efectos.respetarMovimientoReducido &&
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const parametro = (n) => (cfg().debug.permitirParametrosURL ? DENDRO.reloj.parametroURL(n) : null);

  let actual = null;
  let modo = "CSS";
  let colapsando = false;     // ráfaga y contracción del colapso en vivo en curso
  const tf = () => DENDRO.reloj.aInstante(cfg().cronologia.colapsoTotal);

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
    mostrar(DENDRO.arranque.crear({ estado, alTerminar: irAcceso }));
  }

  // Si el colapso llegó durante el encendido, el arranque desemboca en él.
  function irAcceso() {
    if (estado.fase >= 5) { irColapso(); return; }
    mostrar(DENDRO.acceso.crear({ alTerminar: irEscritorio }));
  }

  function irEscritorio() {
    if (estado.fase >= 5) { irColapso(); return; }
    mostrar(DENDRO.escritorio.crear({ estado, salir: () => DENDRO.monitor.apagar(), reducido: movimientoReducido }));
  }

  // Tras el colapso el tubo se calma: el error tiene que leerse (RNF-03).
  function irColapso() {
    DENDRO.glitch.calmar();
    DENDRO.crt.fijarIntensidad(INTENSIDAD_TRAS_COLAPSO);
    DENDRO.sonido.fijarIntensidad(INTENSIDAD_TRAS_COLAPSO);
    mostrar(DENDRO.colapso.crear({ instanteColapso: tf(), reducido: movimientoReducido }));
  }
  const INTENSIDAD_TRAS_COLAPSO = 0.2;

  function fijarIntensidad() {
    if (estado.fase >= 5) return;
    DENDRO.crt.fijarIntensidad(estado.intensidad);
    DENDRO.sonido.fijarIntensidad(estado.intensidad);
    DENDRO.glitch.fijarIntensidad(estado.intensidad);
  }

  function alCambiarMinuto(instante) {
    estado = DENDRO.cronologia.calcularEstado(instante);
    fijarIntensidad();
    if (panelDebug) panelDebug.textContent = textoDebug();
    if (colapsando || (actual && actual.esColapso)) return;
    if (actual && actual.actualizar && DENDRO.monitor.estado() === "encendido") actual.actualizar(estado);
  }

  // RF-08 en vivo: a las 14:00, con la interfaz abierta, ráfaga de glitches, el tubo se contrae a una
  // línea y se abre con el error fatal. Con el monitor apagado, el encendido ya entra en el colapso.
  async function colapsoEnVivo() {
    estado = DENDRO.cronologia.calcularEstado(DENDRO.reloj.instanteActual());
    if (panelDebug) panelDebug.textContent = textoDebug();
    if (colapsando || DENDRO.monitor.estado() !== "encendido" || (actual && actual.esColapso)) return;
    colapsando = true;
    DENDRO.sonido.alarma(3);
    await DENDRO.glitch.rafaga(cfg().efectos.colapsoEnVivo.rafagaMs);
    await DENDRO.monitor.contraerYAbrir(irColapso);
    colapsando = false;
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
    if (DENDRO.monitor.estado() !== "apagado" && DENDRO.glitch.actualizar(ahora)) DENDRO.vectores.marcarSucio();
    const cambio = DENDRO.pantalla.renderizar(ahora);
    let cambioVectores = false;
    if (actual && actual.vectores && (actual.animada || DENDRO.vectores.sucio)) {
      DENDRO.vectores.comenzar(ahora);
      actual.vectores(DENDRO.pantalla.raiz().vectores(), ahora);
      DENDRO.vectores.posprocesar();
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
    if (colapsando) return;
    const estado = DENDRO.monitor.estado();
    if (estado === "apagado") DENDRO.monitor.encender();
    else if (estado === "encendido") DENDRO.monitor.apagar();
  }

  function alTeclear(ev) {
    if (DENDRO.teclado.ignorable(ev) || colapsando) return;
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

  // ── Toques y gestos (02-diseno.md §6) ─────────────────────────────────────
  // En las pantallas sin gestos, el toque llega al pulsar. Con gestos, al soltar si no hubo arrastre:
  // más de media celda con el botón pulsado es arrastre; dos dedos, pellizco; la rueda, rueda.
  const UMBRAL_ARRASTRE = 0.5;
  const punteros = new Map();
  let toquePendiente = false;
  const conGestos = () => !!(actual && actual.conGestos && DENDRO.monitor.estado() === "encendido");
  const enCeldas = (p) => DENDRO.pantalla.puntoEn(p.x, p.y);

  function alPulsarPantalla(ev) {
    const estado = DENDRO.monitor.estado();
    if (estado === "apagado") { DENDRO.monitor.encender(); return; }
    if (estado === "apagando" || !actual || colapsando) return;
    punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, arrastre: false });
    if (conGestos()) {
      try { $("vidrio").setPointerCapture(ev.pointerId); } catch (_) { /* puntero ya liberado */ }
      toquePendiente = punteros.size === 1;
      return;
    }
    if (!actual.toque) return;
    DENDRO.sonido.tecla();
    actual.toque(DENDRO.pantalla.puntoEn(ev.clientX, ev.clientY));
  }

  function alMoverPuntero(ev) {
    if (DENDRO.monitor.estado() !== "encendido" || !actual) return;
    const p = punteros.get(ev.pointerId);
    if (p && conGestos()) {
      const antes = { x: p.x, y: p.y };
      p.x = ev.clientX; p.y = ev.clientY;
      if (punteros.size >= 2) {
        const [a, b] = [...punteros.values()];
        const otro = a === p ? b : a;
        const dAntes = Math.hypot(antes.x - otro.x, antes.y - otro.y), dAhora = Math.hypot(p.x - otro.x, p.y - otro.y);
        toquePendiente = false;
        if (dAntes > 0) actual.gesto({ tipo: "pellizco", punto: enCeldas({ x: (p.x + otro.x) / 2, y: (p.y + otro.y) / 2 }), factor: dAhora / dAntes });
        return;
      }
      const c0 = enCeldas({ x: p.x0, y: p.y0 }), c1 = enCeldas(p), ca = enCeldas(antes);
      if (!p.arrastre && Math.hypot(c1.x - c0.x, c1.y - c0.y) > UMBRAL_ARRASTRE) p.arrastre = true;
      if (p.arrastre) {
        toquePendiente = false;
        actual.gesto({ tipo: "arrastre", punto: c1, dx: c1.x - ca.x, dy: c1.y - ca.y });
      }
      return;
    }
    if (ev.pointerType !== "mouse" || !actual.movimiento) return;
    actual.movimiento(DENDRO.pantalla.puntoEn(ev.clientX, ev.clientY));
  }

  function alSoltarPuntero(ev) {
    if (!punteros.has(ev.pointerId)) return;
    punteros.delete(ev.pointerId);
    if (ev.type !== "pointerup" || !toquePendiente || punteros.size || !conGestos() || !actual.toque) return;
    toquePendiente = false;
    DENDRO.sonido.tecla();
    actual.toque(DENDRO.pantalla.puntoEn(ev.clientX, ev.clientY));
  }

  function alGirarRueda(ev) {
    if (!conGestos()) return;
    ev.preventDefault();
    actual.gesto({ tipo: "rueda", punto: DENDRO.pantalla.puntoEn(ev.clientX, ev.clientY), dy: ev.deltaY, factor: Math.exp(-ev.deltaY * 0.0015) });
  }

  function alCambiarMonitor(estadoMonitor) {
    const boton = $("boton-encendido");
    boton.setAttribute("aria-label", estadoMonitor === "apagado" ? "Encender el monitor" : "Apagar el monitor");
    boton.setAttribute("aria-pressed", String(estadoMonitor !== "apagado"));
    // El contenido aparece mientras el fósforo se calienta, como en un tubo real.
    if (estadoMonitor === "encendiendo") {
      DENDRO.sonido.encender();
      estado = DENDRO.cronologia.calcularEstado(DENDRO.reloj.instanteActual());
      if (estado.fase >= 5) irColapso();
      else { fijarIntensidad(); irArranque(); }
    }
    if (estadoMonitor === "apagando") {
      DENDRO.sonido.apagar();
      DENDRO.teclado.soltar();
      if (actual && actual.detener) actual.detener();
    }
    if (estadoMonitor === "apagado") mostrar(null);
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

  // Panel de depuración (RF-10): resumen del Estado, con la fecha real (fuera del tubo); el
  // Estado completo va a la consola.
  let panelDebug = null;
  function textoDebug() {
    const e = estado, f = DENDRO.reloj.partesEn(e.instante);
    return [
      `${f.year}-${f.month}-${f.day} ${f.hour}:${f.minute} · ${DENDRO.tau.instante(e.instante)} · FASE ${e.fase} ${e.nombreFase}${e.rectaFinal ? " (RECTA FINAL)" : ""} · ALERTA ${e.nivelAlerta}`,
      `p=${e.p.toFixed(4)}  intensidad=${e.intensidad.toFixed(2)}  ramas=${e.ramasAfectadas}  al colapso=${DENDRO.tau.cuenta(e.paraColapso)}`,
      `principal=${e.parejaPrincipal}  ataques=${e.ataques.length}  registro=${e.registro.length}  caídos=[${e.modulosCaidos.join(", ")}]`,
      `catalogadas=${e.ramasCatalogadas}  en colisión=${e.enColision}  activas=${e.activas.length}  N̂=${e.myth.cohesion.toFixed(3)}  guardianes caídos=${e.myth.guardianes.filter((g) => g.caido).length}`,
      ...e.parejas.filter((p) => p.nombrada).map((p) => `${p.id} ${p.estado.padEnd(13)} Δω=${p.deltaOmega.toFixed(4)} sep=${p.separacion.toFixed(2)} ${DENDRO.tau.cuenta(p.paraContacto)}${p.hostil ? " HOSTIL" : ""}`),
    ].join("\n");
  }

  function mostrarPanelDebug() {
    panelDebug = document.createElement("pre");
    panelDebug.className = "panel-debug";
    panelDebug.textContent = textoDebug();
    document.body.appendChild(panelDebug);
    console.info("DENDRO-OS · Estado", estado);
  }

  function iniciar() {
    DENDRO.tema.aplicar();
    rotular();
    DENDRO.glitch.iniciar({ reducido: movimientoReducido });
    fijarIntensidad();
    DENDRO.reloj.alCambiarMinuto(alCambiarMinuto);
    if (estado.fase < 5) DENDRO.reloj.alLlegar(tf(), colapsoEnVivo);
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
    $("vidrio").addEventListener("pointerup", alSoltarPuntero);
    $("vidrio").addEventListener("pointercancel", alSoltarPuntero);
    $("vidrio").addEventListener("wheel", alGirarRueda, { passive: false });
    // El mousedown (también el de compatibilidad que sigue a un toque) llevaría el foco al body y
    // cerraría el teclado del móvil recién abierto por el campo oculto.
    $("vidrio").addEventListener("mousedown", (ev) => ev.preventDefault());
    // iOS solo abre el teclado si el foco se pide dentro de un click; enfocar() no hace nada sin petición.
    $("vidrio").addEventListener("click", () => DENDRO.teclado.enfocar());

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
