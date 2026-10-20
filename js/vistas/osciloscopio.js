// V4 OSCILOSCOPIO (02-diseno.md §6): la firma ω de cada rama de la pareja seleccionada y su suma.
// Los latidos de la interferencia son latidosEnDeltaInicial · separacion por pantalla: se alargan
// a medida que las ramas se acercan y desaparecen en el contacto (envolvente plana).
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO } = C;
  const MUESTRAS = 260;
  const VELOCIDAD = 0.12;        // pantallas por segundo que corre la onda

  function crear(ctx) {
    const { estado, ui } = ctx;
    const cfgO = () => window.DENDRO_CONFIG.vectores.osciloscopio;
    const pareja = () => C.pareja(estado, ui.parejaSeleccionada) || C.pareja(estado, estado.parejaPrincipal);
    let pantalla = null;

    function latidos(par) {
      return cfgO().latidosEnDeltaInicial * par.separacion;
    }

    function dibujar(reg) {
      const par = pareja(), ta = C.tierra(estado, par.a), tb = C.tierra(estado, par.b);
      const ancho = reg.ancho >= 80;
      C.selector(reg, 0, ancho ? `${par.id} · ${C.nombre(ta)} / ${C.nombre(tb)}` : par.id);
      const lista = C.parejasNavegables(estado), indice = lista.indexOf(par) + 1;
      reg.escribir(1, 0, `${estado.activas.length ? "ACTIVA" : "PAREJA"} ${indice || "—"}/${lista.length}`, "textoTenue");

      let lecturas;
      if (ancho) {
        const anchoLect = 30;
        pantalla = reg.caja(0, 1, reg.ancho - anchoLect, reg.alto - 1, { titulo: "CH1 · CH2 · CH1+CH2", doble: false });
        lecturas = reg.caja(reg.ancho - anchoLect, 1, anchoLect, reg.alto - 1, { titulo: "LECTURAS" });
      } else {
        reg.centrar(1, `${C.nombre(ta)} / ${C.nombre(tb)}`, "texto");
        const altoLect = 9;
        pantalla = reg.caja(0, 2, reg.ancho, reg.alto - 2 - altoLect, { titulo: "CH1 · CH2 · SUMA", doble: false });
        lecturas = reg.caja(0, reg.alto - altoLect, reg.ancho, altoLect, { titulo: "LECTURAS" });
      }

      const n = latidos(par);
      const filas = [
        ["CH1 ω", `${ta.omega.toFixed(4)}`, "tierra"],
        ["CH2 ω", `${tb.omega.toFixed(4)}`, "tierra"],
        ["Δω", par.deltaOmega.toFixed(4), "texto"],
        ["Δω₀", par.deltaOmega0.toFixed(4), "textoTenue"],
        ["SEPARACIÓN", `${Math.round(par.separacion * 100)} %`, "texto"],
        ["LATIDOS/PANT.", n > 0.01 ? n.toFixed(2) : "0 (EN FASE)", n > 0.01 ? "ambar" : "texto"],
        ["PERIODO", n > 0.01 ? `${(1 / n).toFixed(2)} PANT.` : "∞", "ambar"],
        ["ESTADO", par.estado, COLOR_ESTADO[par.estado]],
      ];
      filas.forEach(([etiqueta, valor, color], i) => {
        if (i >= lecturas.alto) return;
        lecturas.escribir(1, i, etiqueta, "textoTenue");
        lecturas.derecha(i, valor + " ", color);
      });
      if (ancho && lecturas.alto > filas.length + 2) {
        lecturas.escribir(1, filas.length + 1, "BASE DE TIEMPOS τ/DIV", "textoTenue");
        lecturas.escribir(1, filas.length + 2, `${(1 / cfgO().divisiones[0]).toFixed(2)} PANT.`, "texto");
        lecturas.escribir(1, lecturas.alto - 1, "←→ PAREJA", "textoTenue");
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

    function vectores(raiz, ahora) {
      if (!pantalla) return;
      const v = pantalla.vectores(), par = pareja(), segundos = ahora / 1000;
      const [divX, divY] = cfgO().divisiones;

      // Retícula con marcas en los ejes centrales
      for (let i = 0; i <= divX; i++) v.linea((v.ancho * i) / divX, 0, (v.ancho * i) / divX, v.alto, "ambarTenue", { alfa: i === divX / 2 ? 0.6 : 0.3 });
      for (let j = 0; j <= divY; j++) v.linea(0, (v.alto * j) / divY, v.ancho, (v.alto * j) / divY, "ambarTenue", { alfa: 0.3 });
      for (let i = 0; i <= divX * 5; i++) {
        const x = (v.ancho * i) / (divX * 5);
        v.linea(x, v.alto / 2 - 0.15, x, v.alto / 2 + 0.15, "ambarTenue", { alfa: 0.6 });
      }

      const banda = v.alto / 3;
      const fa = cfgO().ciclosEnPantalla, fb = fa + latidos(par);
      const tau = (x) => x + segundos * VELOCIDAD;
      const muerta = (id) => ["ANIQUILADA", "COLAPSO"].includes(C.tierra(estado, id).estado);
      const rng = DENDRO.prng.crear(estado.dia, "osciloscopio", Math.floor(ahora / 50));
      const ruidoFotograma = [];
      for (let i = 0; i <= MUESTRAS; i++) ruidoFotograma.push(rng() * 2 - 1);
      const nivelRuido = par.estado === "HOSTILIDADES" ? 0.35 : par.estado === "INTERFERENCIA" ? 0.15 : par.estado === "SUPERVIVIENTE" ? 0.2 : 0.02;
      const colorTraza = par.estado === "HOSTILIDADES" ? "arma" : "tierra";
      const onda = (f, id) => (x, i) => (muerta(id) ? 0.04 * ruidoFotograma[i] : Math.sin(2 * Math.PI * f * tau(x)) + nivelRuido * ruidoFotograma[i]);

      const rotulo = (y, texto, color) => v.texto(0.6, y + 0.2, texto, color, { tam: 0.9 });
      if (par.estado === "FUSIONADA") {
        rotulo(0, "CH1 · CH2 FUSIONADOS", "tierra");
        v.polilinea(traza(v, banda * 0.5, banda * 2, (x, i) => Math.sin(2 * Math.PI * fa * tau(x)) + 0.02 * ruidoFotograma[i]), "tierra");
      } else {
        rotulo(0, `CH1 ${par.a}${muerta(par.a) ? " · SIN SEÑAL" : ""}`, muerta(par.a) ? "textoTenue" : "tierra");
        rotulo(banda, `CH2 ${par.b}${muerta(par.b) ? " · SIN SEÑAL" : ""}`, muerta(par.b) ? "textoTenue" : "tierra");
        v.polilinea(traza(v, 0, banda, onda(fa, par.a)), colorTraza);
        v.polilinea(traza(v, banda, banda, onda(fb, par.b)), colorTraza, { alfa: 0.65 });
      }

      // Suma y su envolvente |cos(π·Δf·τ)|
      const dosMuertas = muerta(par.a) && muerta(par.b);
      rotulo(banda * 2, dosMuertas ? "CH1+CH2 · SIN SEÑAL" : "CH1+CH2", dosMuertas ? "textoTenue" : "ambar");
      const df = fb - fa;
      const suma = (x, i) => {
        if (par.estado === "FUSIONADA") return Math.sin(2 * Math.PI * fa * tau(x));
        return (onda(fa, par.a)(x, i) + onda(fb, par.b)(x, i)) / 2;
      };
      v.polilinea(traza(v, banda * 2, banda, suma), par.estado === "HOSTILIDADES" ? "arma" : "ambar");
      if (!dosMuertas && par.estado !== "FUSIONADA") {
        const envolvente = (signo) => traza(v, banda * 2, banda, (x) => signo * Math.abs(Math.cos(Math.PI * df * tau(x))));
        v.polilinea(envolvente(1), "ambarTenue", { discontinua: [2, 3] });
        v.polilinea(envolvente(-1), "ambarTenue", { discontinua: [2, 3] });
      }
      // Marca de disparo
      v.texto(v.ancho - 0.5, 0.2, "T▸", "ambar", { tam: 0.9, alinear: "right" });
    }

    function cambiarPareja(paso) {
      const lista = C.parejasNavegables(estado), i = lista.indexOf(pareja());
      ui.parejaSeleccionada = lista[(i + paso + lista.length) % lista.length].id;
      ctx.redibujar();
    }

    return {
      animada: true,
      dibujar,
      vectores,
      tecla(ev) {
        if (ev.key === "ArrowLeft") { ev.preventDefault(); cambiarPareja(-1); }
        else if (ev.key === "ArrowRight") { ev.preventDefault(); cambiarPareja(1); }
      },
      toque(punto) {
        if (!punto || punto.y >= 1) return;
        const lado = C.ladoDelToque(punto, ctx.region().ancho);
        if (lado) cambiarPareja(lado);
      },
    };
  }

  DENDRO.vistas.registrar({ id: "osciloscopio", tecla: "4", titulo: "OSCILOSCOPIO", tituloCorto: "OSC", crear });
})(window.DENDRO = window.DENDRO || {});
