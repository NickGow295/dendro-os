// V9 CONTENCIÓN (02-diseno.md §6): acciones del operador con confirmación y barra de progreso.
// Quedan en el registro local, pero NO alteran la cronología global: ninguna cambia una lectura de Δω.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO } = C;
  const ACCIONES = [
    { id: "reforzar", titulo: "REFORZAR AISLANTE", duracion: 4200,
      descripcion: "Recalibra el aislante de fase de la tierra contra la firma ω de su pareja." },
    { id: "sellar", titulo: "SELLAR GARGANTA", duracion: 5200, requierePlanos: true,
      descripcion: "Cierra los planos anexos de la tierra para que no perforen el aislante desde dentro." },
    { id: "aislar", titulo: "AISLAR RAMA", duracion: 6200,
      descripcion: "Desconecta la rama del resto del Árbol durante el turno. Medida extrema." },
  ];
  const MENSAJE_SUSPENSION = "D-12";   // canal de dirección: solo lo ve quien tiene credencial

  function crear(ctx) {
    const { ui } = ctx;
    let estado = ctx.estado;
    const ids = estado.tierras.nombradas.map((t) => t.codigo);
    if (!ids.includes(ui.tierraSeleccionada)) ui.tierraSeleccionada = C.parejaNombrada(estado).a;
    let elegida = 0, paso = "elegir", inicio = 0, duracion = 0, resultado = null, temporizador = 0;
    let panel = null, escena = null, historial = null;
    const tierra = () => C.tierra(estado, ui.tierraSeleccionada);
    const suspendidas = () => DENDRO.local.credencial() && estado.mensajes.some((m) => m.id === MENSAJE_SUSPENSION);

    // Resultado de una acción: siempre local, siempre sin efecto medible sobre la convergencia.
    function concluir(accion, t) {
      if (["ANIQUILADA", "COLAPSO"].includes(t.estado)) return ["OBJETIVO SIN SEÑAL · ACCIÓN ABORTADA", "arma"];
      if (accion.requierePlanos && !t.planos.length) return ["LA RAMA NO TIENE GARGANTAS CONOCIDAS · NADA QUE SELLAR", "ambar"];
      return ["COMPLETADO · SIN EFECTO MEDIBLE EN Δω", "exito"];
    }

    function ejecutar() {
      const accion = ACCIONES[elegida], t = tierra();
      paso = "ejecutando";
      inicio = performance.now();
      duracion = accion.duracion * (1 + estado.intensidad);
      ctx.redibujar();
      temporizador = setTimeout(() => {
        const [texto, color] = concluir(accion, t);
        resultado = { texto, color };
        DENDRO.local.registrar("CONTENCIÓN", `${accion.titulo} · ${t.codigo} ${MAYUS(t.nombre)} · ${texto}`);
        DENDRO.sonido.beep(color === "exito" ? 880 : 330);
        paso = "resultado";
        ctx.redibujar();
      }, duracion);
    }

    function dibujar(reg) {
      const ancho = reg.ancho >= 80, t = tierra();
      if (ancho) {
        const anchoPanel = 52;
        panel = reg.caja(0, 0, anchoPanel, reg.alto, { titulo: "CONTENCIÓN LOCAL" });
        escena = reg.region(anchoPanel, 0, reg.ancho - anchoPanel, reg.alto - 10);
        historial = reg.caja(anchoPanel, reg.alto - 10, reg.ancho - anchoPanel, 10, { titulo: "HISTORIAL LOCAL", doble: false });
      } else {
        panel = reg.caja(0, 0, reg.ancho, 19, { titulo: "CONTENCIÓN LOCAL" });
        escena = reg.region(0, 19, reg.ancho, reg.alto - 19 - 6);
        historial = reg.caja(0, reg.alto - 6, reg.ancho, 6, { titulo: "HISTORIAL", doble: false });
      }

      let y = 0;
      panel.escribir(1, y, "OBJETIVO", "textoTenue");
      panel.escribir(11, y++, `◄ ${t.codigo} ${MAYUS(t.nombre)} ►`, "ambar");
      panel.escribir(11, y++, t.estado, COLOR_ESTADO[t.estado]);
      y++;
      ACCIONES.forEach((a, i) => {
        const sel = i === elegida, estilo = sel ? { inverso: true } : null;
        if (sel) panel.rellenar(0, y, panel.ancho, 1, " ", "ambar", estilo);
        panel.escribir(1, y++, `${i + 1}. ${a.titulo}`, sel ? "ambar" : "texto", estilo);
      });
      y++;
      C.partir(ACCIONES[elegida].descripcion, panel.ancho - 2).forEach((l) => panel.escribir(1, y++, l, "textoTenue"));
      y++;
      if (suspendidas()) panel.escribir(1, y++, "AVISO: CONTENCIONES SUSPENDIDAS (D-12)", "arma");

      const fila = panel.alto - 3;
      if (paso === "elegir") panel.escribir(1, fila, ancho ? "↑↓ ACCIÓN · ←→ OBJETIVO · ENTER EJECUTAR" : "TOQUE UNA ACCIÓN", "textoTenue");
      if (paso === "confirmar") {
        panel.escribir(1, fila, `¿EJECUTAR ${ACCIONES[elegida].titulo}`, "ambar");
        panel.escribir(1, fila + 1, `SOBRE ${t.codigo}? [S/N]`, "ambar", { parpadeo: true });
      }
      if (paso === "ejecutando") panel.escribir(1, fila, "EJECUTANDO · NO APAGUE LA CONSOLA", "ambar");
      if (paso === "resultado") C.partir(resultado.texto, panel.ancho - 2).slice(0, 2).forEach((l, i) => panel.escribir(1, fila + i, l, resultado.color));

      const locales = DENDRO.local.entradas().filter((e) => e.tipo === "CONTENCIÓN");
      if (!locales.length) historial.escribir(1, 0, "SIN ACCIONES EN ESTE PUESTO", "textoTenue");
      locales.slice(0, historial.alto).forEach((e, i) => {
        historial.escribir(1, i, `${DENDRO.tau.corto(e.instante)} ${e.texto}`.slice(0, historial.ancho - 2), "texto");
      });
    }

    // Globo del objetivo rodeado por el aislante; durante la acción, los anillos se cierran.
    function vectores(raiz, ahora) {
      if (!escena) return;
      const v = escena.vectores(), t = tierra(), segundos = ahora / 1000;
      const r = Math.max(1, Math.min(v.alto * 0.32, v.ancho * v.aspecto * 0.22));
      const cx = v.ancho / 2, cy = v.alto / 2;
      v.globo(cx, cy, r, t, C.opcionesGlobo(estado, t, segundos));
      const progreso = paso === "ejecutando" ? Math.min(1, (performance.now() - inicio) / duracion) : paso === "resultado" ? 1 : 0;
      for (let k = 0; k < 3; k++) {
        const radio = r * (1.25 + k * 0.18) - progreso * r * 0.12 * (k + 1);
        v.arco(cx, cy, radio, segundos * (k % 2 ? -0.6 : 0.6), segundos * (k % 2 ? -0.6 : 0.6) + Math.PI * (1.2 + progreso * 0.8), "ambar",
          { alfa: 0.35 + progreso * 0.5, discontinua: [4, 3] });
      }
      if (paso === "ejecutando" || paso === "resultado") {
        const ancho = Math.min(30, v.ancho - 4), x = cx - ancho / 2, y = v.alto - 1.4;
        v.poligono([[x, y], [x + ancho, y], [x + ancho, y + 0.8], [x, y + 0.8]], "ambar");
        v.poligono([[x, y], [x + ancho * progreso, y], [x + ancho * progreso, y + 0.8], [x, y + 0.8]], "ambar", { relleno: "ambar", rellenoAlfa: 0.7, sinTrazo: true });
        v.texto(cx, y - 1.2, `${Math.round(progreso * 100)} %`, "texto", { tam: 1, alinear: "center" });
      }
    }

    function cambiarObjetivo(pasoTierra) {
      if (paso === "ejecutando") return;
      ui.tierraSeleccionada = ids[(ids.indexOf(ui.tierraSeleccionada) + pasoTierra + ids.length) % ids.length];
      paso = "elegir";
      ctx.redibujar();
    }

    function elegirAccion(i) {
      if (paso === "ejecutando") return;
      elegida = (i + ACCIONES.length) % ACCIONES.length;
      paso = "elegir";
      ctx.redibujar();
    }

    function confirmarOEjecutar() {
      if (paso === "elegir" || paso === "resultado") { paso = "confirmar"; ctx.redibujar(); }
      else if (paso === "confirmar") ejecutar();
    }

    return {
      animada: true,
      dibujar,
      vectores,
      actualizar(nuevo) { estado = nuevo; },
      tecla(ev) {
        const k = ev.key.toLowerCase();
        if (paso === "confirmar" && (k === "s" || k === "enter")) { ev.preventDefault(); ejecutar(); return; }
        if (paso === "confirmar" && (k === "n")) { paso = "elegir"; ctx.redibujar(); return; }
        if (ev.key === "ArrowUp") { ev.preventDefault(); elegirAccion(elegida - 1); }
        else if (ev.key === "ArrowDown") { ev.preventDefault(); elegirAccion(elegida + 1); }
        else if (ev.key === "ArrowLeft") { ev.preventDefault(); cambiarObjetivo(-1); }
        else if (ev.key === "ArrowRight") { ev.preventDefault(); cambiarObjetivo(1); }
        else if (ev.key === "Enter" && paso !== "ejecutando") { ev.preventDefault(); confirmarOEjecutar(); }
      },
      toque(punto) {
        if (!punto || !panel || paso === "ejecutando") return;
        const base = ctx.region();
        const fila = Math.floor(punto.y) - (panel.y - base.y);
        if (fila === 0) { cambiarObjetivo(punto.x < (panel.ancho / 2) ? -1 : 1); return; }
        const accion = fila - 3;
        if (accion >= 0 && accion < ACCIONES.length) {
          if (accion === elegida) confirmarOEjecutar(); else elegirAccion(accion);
        } else if (paso === "confirmar") ejecutar();
      },
      detener() { clearTimeout(temporizador); },
    };
  }

  DENDRO.vistas.registrar({ id: "contencion", tecla: "9", titulo: "CONTENCIÓN", tituloCorto: "CNT", crear });
})(window.DENDRO = window.DENDRO || {});
