// Sonido con Web Audio (RNF-05): nunca automático; el contexto nace en el encendido del monitor,
// que siempre es un gesto del usuario. Ambiente de transformador + ventilador según la intensidad del día.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG.sonido;
  const CLAVE = "dendro.sonido";
  const FLYBACK_HZ = 15700;

  const e = { ctx: null, maestro: null, ambiente: null, intensidad: 0, activado: null, fuentes: [] };

  function leerPreferencia() {
    try {
      const v = localStorage.getItem(CLAVE);
      if (v !== null) return v === "1";
    } catch (_) { /* sin almacenamiento: se usa el valor de config */ }
    return cfg().activadoPorDefecto;
  }

  function activado() {
    if (e.activado === null) e.activado = leerPreferencia();
    return e.activado;
  }

  function contexto() {
    if (e.ctx) return e.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    e.ctx = new Ctx();
    e.maestro = e.ctx.createGain();
    e.maestro.gain.value = activado() ? cfg().volumen : 0;
    e.maestro.connect(e.ctx.destination);
    return e.ctx;
  }

  function ruidoMarron(ctx, segundos) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * segundos, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    const rng = DENDRO.prng.crear("ruido-marron");   // determinista, como todo lo "aleatorio"
    let ultimo = 0;
    for (let i = 0; i < datos.length; i++) {
      ultimo = (ultimo + 0.02 * (rng() * 2 - 1)) / 1.02;
      datos[i] = ultimo * 3.5;
    }
    return buffer;
  }

  function ruidoBlanco(ctx, segundos) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * segundos), ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    const rng = DENDRO.prng.crear("ruido-blanco");
    for (let i = 0; i < datos.length; i++) datos[i] = rng() * 2 - 1;
    return buffer;
  }

  function gananciaAmbiente(cual) {
    const a = cfg().ambiente[cual];
    return a.base + (a.maximo - a.base) * e.intensidad;
  }

  // Zumbido del transformador (red + armónicos) y ventilador (ruido marrón filtrado con vaivén lento).
  function arrancarAmbiente() {
    const ctx = e.ctx, ahora = ctx.currentTime, f = cfg().ambiente.frecuenciaRed;
    const zumbido = ctx.createGain();
    zumbido.gain.setValueAtTime(0, ahora);
    zumbido.gain.linearRampToValueAtTime(gananciaAmbiente("zumbido"), ahora + 1.2);
    const pasaBajos = ctx.createBiquadFilter();
    pasaBajos.type = "lowpass";
    pasaBajos.frequency.value = 420;
    pasaBajos.connect(zumbido);
    zumbido.connect(e.maestro);
    const osciladores = [[1, 1], [2, 0.5], [3, 0.22]].map(([armonico, nivel]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f * armonico;
      g.gain.value = nivel;
      o.connect(g).connect(pasaBajos);
      o.start();
      return o;
    });

    const ventilador = ctx.createGain();
    ventilador.gain.setValueAtTime(0, ahora);
    ventilador.gain.linearRampToValueAtTime(gananciaAmbiente("ventilador"), ahora + 2);
    const aire = ctx.createBufferSource();
    aire.buffer = ruidoMarron(ctx, 3);
    aire.loop = true;
    const banda = ctx.createBiquadFilter();
    banda.type = "bandpass";
    banda.frequency.value = 450;
    banda.Q.value = 0.7;
    const vaiven = ctx.createOscillator(), profundidad = ctx.createGain();
    vaiven.frequency.value = 0.31;
    profundidad.gain.value = gananciaAmbiente("ventilador") * 0.3;
    vaiven.connect(profundidad).connect(ventilador.gain);
    aire.connect(banda).connect(ventilador).connect(e.maestro);
    aire.start();
    vaiven.start();

    // Silbido del fly-back, casi inaudible.
    const silbido = ctx.createOscillator(), gs = ctx.createGain();
    silbido.frequency.value = FLYBACK_HZ;
    gs.gain.setValueAtTime(0, ahora);
    gs.gain.linearRampToValueAtTime(0.004, ahora + 0.8);
    silbido.connect(gs).connect(e.maestro);
    silbido.start();

    e.ambiente = { zumbido, ventilador, profundidad, osciladores, fuentes: [aire, vaiven, silbido, ...osciladores], silbido: gs };
  }

  function pararAmbiente(segundos) {
    if (!e.ambiente) return;
    const ctx = e.ctx, ahora = ctx.currentTime, a = e.ambiente;
    for (const g of [a.zumbido.gain, a.ventilador.gain, a.silbido.gain]) {
      g.cancelScheduledValues(ahora);
      g.setValueAtTime(g.value, ahora);
      g.linearRampToValueAtTime(0, ahora + segundos);
    }
    // El transformador cae de frecuencia al cortar la corriente.
    for (const o of a.osciladores) {
      o.frequency.setValueAtTime(o.frequency.value, ahora);
      o.frequency.exponentialRampToValueAtTime(o.frequency.value * 0.6, ahora + segundos);
    }
    for (const f of a.fuentes) f.stop(ahora + segundos + 0.05);
    e.ambiente = null;
  }

  // Envolvente corta sobre una fuente; devuelve la ganancia para encadenar filtros.
  function golpe(fuente, nivel, ataque, caida, destino) {
    const ctx = e.ctx, ahora = ctx.currentTime, g = ctx.createGain();
    g.gain.setValueAtTime(0, ahora);
    g.gain.linearRampToValueAtTime(nivel, ahora + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, ahora + ataque + caida);
    fuente.connect(g).connect(destino || e.maestro);
    fuente.start(ahora);
    fuente.stop(ahora + ataque + caida + 0.05);
    return g;
  }

  function listo() {
    return e.ctx && e.ctx.state !== "closed";
  }

  // ── API ───────────────────────────────────────────────────────────────────
  function encender() {
    const ctx = contexto();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    // Golpe grave del relé y la desmagnetización.
    const grave = ctx.createOscillator();
    grave.frequency.setValueAtTime(90, ctx.currentTime);
    grave.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.35);
    golpe(grave, 0.5, 0.005, 0.45);
    const chasquido = ctx.createBufferSource();
    chasquido.buffer = ruidoBlanco(ctx, 0.12);
    const pb = ctx.createBiquadFilter();
    pb.type = "lowpass"; pb.frequency.value = 1800;
    pb.connect(e.maestro);
    golpe(chasquido, 0.35, 0.002, 0.1, pb);
    arrancarAmbiente();
  }

  function apagar() {
    if (!listo()) return;
    const ctx = e.ctx;
    const corte = ctx.createBufferSource();
    corte.buffer = ruidoBlanco(ctx, 0.08);
    golpe(corte, 0.2, 0.002, 0.07);
    pararAmbiente(0.8);
  }

  function tecla() {
    if (!listo() || !activado()) return;
    const ctx = e.ctx;
    const clic = ctx.createBufferSource();
    clic.buffer = ruidoBlanco(ctx, 0.03);
    const pa = ctx.createBiquadFilter();
    pa.type = "highpass"; pa.frequency.value = 2200;
    pa.connect(e.maestro);
    golpe(clic, 0.18, 0.001, 0.025, pa);
  }

  function beep(frecuencia) {
    if (!listo() || !activado()) return;
    const o = e.ctx.createOscillator();
    o.type = "square";
    o.frequency.value = frecuencia || 880;
    const pb = e.ctx.createBiquadFilter();
    pb.type = "lowpass"; pb.frequency.value = 2400;
    pb.connect(e.maestro);
    golpe(o, 0.08, 0.004, 0.09, pb);
  }

  function alarma(ciclos) {
    if (!listo() || !activado()) return;
    const ctx = e.ctx, ahora = ctx.currentTime, n = ciclos || 4;
    const o = ctx.createOscillator(), g = ctx.createGain(), pb = ctx.createBiquadFilter();
    o.type = "sawtooth";
    pb.type = "lowpass"; pb.frequency.value = 1600;
    for (let i = 0; i < n * 2; i++) o.frequency.setValueAtTime(i % 2 ? 660 : 880, ahora + i * 0.25);
    g.gain.setValueAtTime(0, ahora);
    g.gain.linearRampToValueAtTime(0.09, ahora + 0.02);
    g.gain.setValueAtTime(0.09, ahora + n * 0.5 - 0.05);
    g.gain.linearRampToValueAtTime(0, ahora + n * 0.5);
    o.connect(pb).connect(g).connect(e.maestro);
    o.start(ahora);
    o.stop(ahora + n * 0.5 + 0.05);
  }

  function alternar() {
    e.activado = !activado();
    try { localStorage.setItem(CLAVE, e.activado ? "1" : "0"); } catch (_) { /* sin almacenamiento */ }
    if (e.ctx) {
      const g = e.maestro.gain, ahora = e.ctx.currentTime;
      g.cancelScheduledValues(ahora);
      g.setValueAtTime(g.value, ahora);
      g.linearRampToValueAtTime(e.activado ? cfg().volumen : 0, ahora + 0.15);
    }
    return e.activado;
  }

  function fijarIntensidad(x) {
    e.intensidad = Math.max(0, Math.min(1, x));
    if (e.ambiente && listo()) {
      const ahora = e.ctx.currentTime;
      e.ambiente.zumbido.gain.linearRampToValueAtTime(gananciaAmbiente("zumbido"), ahora + 0.5);
      e.ambiente.ventilador.gain.linearRampToValueAtTime(gananciaAmbiente("ventilador"), ahora + 0.5);
      e.ambiente.profundidad.gain.value = gananciaAmbiente("ventilador") * 0.3;
    }
  }

  DENDRO.sonido = {
    encender, apagar, tecla, beep, alarma, alternar, fijarIntensidad, activado,
    // Para depurar: ganancias actuales del ambiente.
    niveles: () => (e.ambiente ? { zumbido: gananciaAmbiente("zumbido"), ventilador: gananciaAmbiente("ventilador") } : null),
  };
})(window.DENDRO = window.DENDRO || {});
