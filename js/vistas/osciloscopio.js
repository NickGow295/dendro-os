// V4 OSCILOSCOPIO (02-diseno.md §6, RF-19): las firmas ω de la pareja seleccionada y su interferencia.
// Las frecuencias convergen (f_b → f_a): los latidos se alargan y, con la ganancia, crecen en amplitud;
// en el contacto la suma se satura; en hostilidades aparecen picos rojos; en el desenlace la onda de
// la rama destruida se apaga hasta quedar plana. ←/→ cambia de pareja; L o Enter abre la lista.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { COLOR_ESTADO } = C;
  const MUESTRAS = 260;
  const VELOCIDAD = 0.12;        // pantallas por segundo que corre la onda
  const SATURADOS = ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"];
  const PICOS_BASE = 3, PICOS_MAX = 14;
  const AMPLITUD_SUMA = 1.4;     // la suma con ganancia 1 llena casi toda su banda

  function crear(ctx) {
    const { ui } = ctx;
    let estado = ctx.estado;
    const cfgO = () => window.DENDRO_CONFIG.vectores.osciloscopio;
    const pareja = () => C.pareja(estado, ui.parejaSeleccionada) || C.pareja(estado, estado.parejaPrincipal);
    const lista = C.listaParejas(ctx);
    let pantalla = null;

    const latidos = (sep) => cfgO().latidosEnDeltaInicial * sep;
    const ganancia = (sep) => cfgO().gananciaMin + (1 - cfgO().gananciaMin) * (1 - sep);

    // Ramas que el desenlace destruye y cuánto queda de su onda (1 viva … 0 plana).
    function destruidas(par) {
      if (par.desenlace === "fusion") return [];
      const s = par.desenlace.startsWith("superviviente:") ? par.desenlace.slice(14) : null;
      return s ? [s === par.a ? par.b : par.a] : [par.a, par.b];
    }
    function amplitud(par, codigo) {
      const resuelta = C.RESUELTOS.includes(par.estado);
      return resuelta && destruidas(par).includes(codigo) ? 1 - par.desvanecimiento : 1;
    }

    function dibujar(reg) {
      const par = pareja(), ta = C.tierra(estado, par.a), tb = C.tierra(estado, par.b);
      const ancho = reg.ancho >= 80;
      C.selector(reg, 0, ancho ? `${par.id} · ${C.nombre(ta)} / ${C.nombre(tb)}` : par.id);
      const navegables = C.parejasNavegables(estado), indice = navegables.indexOf(par) + 1;
      reg.escribir(1, 0, `${estado.activas.length ? "ACTIVA" : "PAREJA"} ${indice || "—"}/${navegables.length}`, "textoTenue");
      if (lista.abierta) {
        pantalla = null;
        lista.dibujar(reg.region(0, 1, reg.ancho, reg.alto - 1));
        return;
      }

      let lecturas;
      if (ancho) {
        const anchoLect = 30;
        pantalla = reg.caja(0, 1, reg.ancho - anchoLect, reg.alto - 1, { titulo: "CH1 · CH2 · CH1+CH2", doble: false });
        lecturas = reg.caja(reg.ancho - anchoLect, 1, anchoLect, reg.alto - 1, { titulo: "LECTURAS" });
      } else {
        reg.centrar(1, `${C.nombre(ta)} / ${C.nombre(tb)}`, "texto");
        const altoLect = 10;
        pantalla = reg.caja(0, 2, reg.ancho, reg.alto - 2 - altoLect, { titulo: "CH1 · CH2 · SUMA", doble: false });
        lecturas = reg.caja(0, reg.alto - altoLect, reg.ancho, altoLect, { titulo: "LECTURAS" });
      }

      const l = C.lecturaPareja(ui, par), n = latidos(l.separacion), g = ganancia(l.separacion);
      const filas = [
        ["CH1 ω", ta.omega.toFixed(4), "tierra"],
        ["CH2 ω", tb.omega.toFixed(4), "tierra"],
        ["Δω", l.deltaOmega.toFixed(4), l.efecto ? "exito" : "texto"],
        ["Δω₀", par.deltaOmega0.toFixed(4), "textoTenue"],
        ["LATIDOS/PANT.", n > 0.01 ? n.toFixed(2) : "0 (EN FASE)", n > 0.01 ? "ambar" : "texto"],
        ["GANANCIA", `×${g.toFixed(2)}`, g > 0.9 ? "arma" : "texto"],
        ["ESTADO", par.estado, COLOR_ESTADO[par.estado]],
      ];
      if (l.efecto) filas.push(["PROTOCOLO", `${l.efecto.protocolo} EN CURSO`, "exito"]);
      filas.forEach(([etiqueta, valor, color], i) => {
        if (i >= lecturas.alto) return;
        lecturas.escribir(1, i, etiqueta, "textoTenue");
        lecturas.derecha(i, valor + " ", color);
      });
      if (ancho && lecturas.alto > filas.length + 3) {
        lecturas.escribir(1, filas.length + 1, "BASE DE TIEMPOS τ/DIV", "textoTenue");
        lecturas.escribir(1, filas.length + 2, `${(1 / cfgO().divisiones[0]).toFixed(2)} PANT.`, "texto");
        lecturas.escribir(1, lecturas.alto - 1, "←→ PAREJA · L LISTA", "textoTenue");
      }
    }

    // Trazas: devuelven puntos [x, y] en celdas dentro de una banda (y0..y0+alto).
    function traza(v, y0, alto, fn) {
      const puntos = [];
      for (let i = 0; i <= MUESTRAS; i++) {
        const x = i / MUESTRAS;
        // 0.34 deja sitio al ruido (hasta ±1.35) sin salirse de la banda.
        puntos.push([x * v.ancho, y0 + alto / 2 - (alto * 0.34) * fn(x, i)]);
      }
      return puntos;
    }

    function reticula(v) {
      const [divX, divY] = cfgO().divisiones;
      for (let i = 0; i <= divX; i++) v.linea((v.ancho * i) / divX, 0, (v.ancho * i) / divX, v.alto, "ambarTenue", { alfa: i === divX / 2 ? 0.6 : 0.3 });
      for (let j = 0; j <= divY; j++) v.linea(0, (v.alto * j) / divY, v.ancho, (v.alto * j) / divY, "ambarTenue", { alfa: 0.3 });
      for (let i = 0; i <= divX * 5; i++) {
        const x = (v.ancho * i) / (divX * 5);
        v.linea(x, v.alto / 2 - 0.15, x, v.alto / 2 + 0.15, "ambarTenue", { alfa: 0.6 });
      }
    }

    function vectores(raiz, ahora) {
      if (!pantalla) return;
      const v = pantalla.vectores(), par = pareja(), segundos = ahora / 1000;
      const l = C.lecturaPareja(ui, par);
      reticula(v);

      const banda = v.alto / 3;
      const fa = cfgO().ciclosEnPantalla, fb = fa + latidos(l.separacion), g = ganancia(l.separacion);
      const tau = (x) => x + segundos * VELOCIDAD;
      const rng = DENDRO.prng.crear(estado.dia, "osciloscopio", Math.floor(ahora / 50));
      const ruido = [];
      for (let i = 0; i <= MUESTRAS; i++) ruido.push(rng() * 2 - 1);
      const nivelRuido = { HOSTILIDADES: 0.35, INTERFERENCIA: 0.15, SUPERVIVIENTE: 0.2, CONTACTO: 0.1 }[par.estado] || 0.02;
      const colorTraza = par.estado === "HOSTILIDADES" ? "arma" : "tierra";
      const ampA = amplitud(par, par.a), ampB = amplitud(par, par.b);
      const onda = (f, amp) => (x, i) => amp * Math.sin(2 * Math.PI * f * tau(x)) + (amp > 0 ? nivelRuido : 0.04) * ruido[i];
      const rotulo = (y, texto, color) => v.texto(0.6, y + 0.2, texto, color, { tam: 0.9 });
      const perdida = (amp) => (amp <= 0.001 ? " · SEÑAL PERDIDA" : amp < 1 ? " · SEÑAL CAYENDO" : "");

      const fusion = par.estado === "FUSIONADA";
      if (fusion) {
        rotulo(0, "CH1 · CH2 FUSIONADOS", "tierra");
        v.polilinea(traza(v, banda * 0.5, banda * 2, (x, i) => Math.sin(2 * Math.PI * fa * tau(x)) + 0.02 * ruido[i]), "tierra", { grosor: 1.8 });
      } else {
        rotulo(0, `CH1 ${par.a}${perdida(ampA)}`, ampA < 1 ? "textoTenue" : "tierra");
        rotulo(banda, `CH2 ${par.b}${perdida(ampB)}`, ampB < 1 ? "textoTenue" : "tierra");
        v.polilinea(traza(v, 0, banda, onda(fa, ampA)), colorTraza);
        v.polilinea(traza(v, banda, banda, onda(fb, ampB)), colorTraza, { alfa: 0.65 });
      }

      // Suma con ganancia; en el contacto se recorta en ±saturacion (techos planos).
      const saturada = SATURADOS.includes(par.estado);
      const tope = cfgO().saturacion;
      const suma = (x, i) => {
        const y = fusion ? Math.sin(2 * Math.PI * fa * tau(x)) : (g * (onda(fa, ampA)(x, i) + onda(fb, ampB)(x, i))) / 2 * AMPLITUD_SUMA;
        return saturada ? Math.max(-tope * AMPLITUD_SUMA, Math.min(tope * AMPLITUD_SUMA, y)) : y;
      };
      const dosMuertas = ampA <= 0.001 && ampB <= 0.001;
      rotulo(banda * 2, dosMuertas ? "CH1+CH2 · SIN SEÑAL" : `CH1+CH2 · ×${g.toFixed(2)}`, dosMuertas ? "textoTenue" : "ambar");
      // La suma sigue ámbar en hostilidades: así los picos rojos se distinguen encima.
      v.polilinea(traza(v, banda * 2, banda, suma), "ambar");
      if (!dosMuertas && !fusion && !saturada) {
        const df = fb - fa;
        const envolvente = (signo) => traza(v, banda * 2, banda, (x) => signo * g * AMPLITUD_SUMA * Math.abs(Math.cos(Math.PI * df * tau(x))));
        v.polilinea(envolvente(1), "ambarTenue", { discontinua: [2, 3] });
        v.polilinea(envolvente(-1), "ambarTenue", { discontinua: [2, 3] });
      }
      if (saturada) {
        const yTope = banda * 2 + banda / 2 - banda * 0.34 * tope * AMPLITUD_SUMA;
        v.linea(0, yTope, v.ancho, yTope, "arma", { alfa: 0.4, discontinua: [1, 3] });
        v.linea(0, banda * 3 - (yTope - banda * 2), v.ancho, banda * 3 - (yTope - banda * 2), "arma", { alfa: 0.4, discontinua: [1, 3] });
        if (Math.floor(segundos * 2) % 2 === 0) v.texto(v.ancho - 0.6, banda * 2 + 0.2, "SATURACIÓN", "arma", { tam: 0.9, alinear: "right" });
      }

      // Hostilidades: picos rojos sembrados por pareja y segundo, más densos con el progreso del ataque.
      if (par.estado === "HOSTILIDADES" || (par.hostil && !l.interceptados)) picos(v, par, banda, segundos, l.interceptados);
      v.texto(v.ancho - 0.5, 0.2, "T▸", "ambar", { tam: 0.9, alinear: "right" });
    }

    function picos(v, par, banda, segundos, interceptados) {
      if (interceptados) return;
      const progreso = estado.ataques.filter((a) => a.pareja === par.id).reduce((m, a) => Math.max(m, a.progreso), 0);
      if (!progreso && par.estado !== "HOSTILIDADES") return;
      const rng = DENDRO.prng.crear(par.id, Math.floor(segundos));
      const n = PICOS_BASE + Math.round(progreso * (PICOS_MAX - PICOS_BASE));
      for (let k = 0; k < n; k++) {
        const x = rng() * v.ancho, alto = banda * (0.25 + rng() * 0.25), y0 = banda * 2.5;
        const signo = rng() < 0.5 ? -1 : 1, w = 0.25;
        v.polilinea([[x - w, y0], [x, y0 - signo * alto], [x + w, y0]], "arma", { grosor: 1.6, alfa: 0.7 + 0.3 * rng() });
      }
    }

    function cambiarPareja(paso) {
      const navegables = C.parejasNavegables(estado), i = navegables.indexOf(pareja());
      ui.parejaSeleccionada = navegables[(i + paso + navegables.length) % navegables.length].id;
      ctx.redibujar();
    }

    return {
      animada: true,
      dibujar,
      vectores,
      get capturaTeclado() { return lista.abierta; },
      get usaTab() { return lista.abierta; },
      capturaEscape: () => lista.abierta,
      actualizar(nuevo) { estado = nuevo; lista.invalidar(); },
      tecla(ev) {
        if (lista.tecla(ev)) return;
        if (ev.key.toLowerCase() === "l") { ev.preventDefault(); lista.abrir(); }
        else if (ev.key === "ArrowLeft") { ev.preventDefault(); cambiarPareja(-1); }
        else if (ev.key === "ArrowRight") { ev.preventDefault(); cambiarPareja(1); }
        else if (ev.key === "Home" || ev.key.toLowerCase() === "p") { ui.parejaSeleccionada = estado.parejaPrincipal; ctx.redibujar(); }
      },
      toque(punto) {
        if (!punto) return;
        const reg = ctx.region();
        if (lista.abierta) { lista.toque({ x: punto.x, y: punto.y - 1 }, reg.region(0, 1, reg.ancho, reg.alto - 1)); return; }
        if (punto.y >= 1) return;
        const lado = C.ladoDelToque(punto, reg.ancho);
        if (lado) cambiarPareja(lado);
        else lista.abrir();
      },
      detener() { lista.cerrar(); },
    };
  }

  DENDRO.vistas.registrar({ id: "osciloscopio", tecla: "4", titulo: "OSCILOSCOPIO", tituloCorto: "OSC", crear });
})(window.DENDRO = window.DENDRO || {});
