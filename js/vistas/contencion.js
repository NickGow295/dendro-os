// V9 CONTENCIÓN (02-diseno.md §6, RF-20): panel de protocolos de la agencia (data/protocolos.js).
// Elegir protocolo → objetivo (lista filtrable con los válidos para su estado) → confirmar (PC-40 dos
// veces) → progreso → APLICADO · MEJORA DETECTADA. La mejora es transitoria y solo del dibujo
// (ui.efectosContencion); el Estado no cambia nunca. Queda en el registro local del operador.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO } = C;
  const MENSAJE_SUSPENSION = "D-12";   // canal de dirección: solo lo ve quien tiene credencial
  const ANCHO_PROTOCOLOS = 34;

  function crear(ctx) {
    const { ui } = ctx;
    let estado = ctx.estado;
    let indice = 0, objetivo = null, paso = "elegir", inicio = 0, duracion = 0, resultado = null, temporizador = 0;
    let panel = null, info = null, escena = null, historial = null;

    const protocolos = () => estado.protocolos;
    const proto = () => protocolos()[indice];
    const sinEnergia = () => estado.modulosCaidos.includes("contencion");
    const suspendidas = () => DENDRO.local.credencial() && estado.mensajes.some((m) => m.id === MENSAJE_SUSPENSION);

    function etiqueta(id) {
      if (id === "MYTH") return "MYTH · TRONCO";
      const par = C.pareja(estado, id);
      if (par) return `${par.id} · ${C.nombresPareja(estado, par)}`;
      const t = C.tierra(estado, id);
      return t ? (t.nombre ? `${C.codigoCorto(t.codigo)} ${MAYUS(t.nombre)}` : t.codigo) : id;
    }
    function estadoDe(id) {
      if (id === "MYTH") return { texto: `N̂ ${estado.myth.cohesion.toFixed(3)}`, color: "rama" };
      const par = C.pareja(estado, id) || C.tierra(estado, id);
      return { texto: par.estado, color: COLOR_ESTADO[par.estado] };
    }

    // Objetivo por defecto: la selección compartida, si el protocolo la admite.
    function objetivoPorDefecto() {
      const p = proto();
      if (p.objetivo === "myth") return "MYTH";
      const candidato = p.objetivo === "pareja" ? ui.parejaSeleccionada : ui.tierraSeleccionada;
      return candidato && C.admite(p, candidato, estado) ? candidato : null;
    }

    const lista = DENDRO.lista.crear({
      titulo: (n) => `OBJETIVOS VÁLIDOS PARA ${proto().codigo}: ${n}`,
      elementos: () => C.objetivosDe(proto(), estado),
      chips: [
        { id: "todos", etiqueta: "TODOS", filtro: null },
        { id: "nombradas", etiqueta: "NOMBRADAS", filtro: (id) => { const x = C.pareja(estado, id) || C.tierra(estado, id); return !!(x && x.nombrada); } },
        { id: "activas", etiqueta: "ACTIVAS", filtro: (id) => { const x = C.pareja(estado, id) || C.tierra(estado, id); return !!x && C.ACTIVOS.includes(x.estado); } },
      ],
      buscar: (id) => `${id} ${etiqueta(id)}`,
      fila: (id, ancho) => {
        const e = estadoDe(id);
        return [{ t: etiqueta(id).padEnd(Math.max(10, ancho - 16)).slice(0, Math.max(10, ancho - 16)) + " ", c: "texto" }, { t: e.texto, c: e.color }];
      },
      actual: () => objetivo,
      alElegir: (id) => { objetivo = id; paso = "elegir"; },
      redibujar: () => ctx.redibujar(),
    });

    // Una orden `contener` de la terminal deja el protocolo y el objetivo preparados.
    if (ui.contencionPendiente) {
      const i = protocolos().findIndex((p) => p.codigo === ui.contencionPendiente.protocolo);
      if (i >= 0) { indice = i; objetivo = ui.contencionPendiente.objetivo; }
      ui.contencionPendiente = null;
    } else objetivo = objetivoPorDefecto();

    function concluir() {
      const p = proto();
      const eficacia = DENDRO.local.credencial() && estado.hitos.eficacia ? " · EFICACIA MEDIDA 0.000 %" : "";
      resultado = `APLICADO · MEJORA DETECTADA${eficacia}`;
      ui.efectosContencion = [...(ui.efectosContencion || []), { objetivo, protocolo: p.codigo, hasta: performance.now() + window.DENDRO_CONFIG.contencion.mejoraMs }];
      // Las demás vistas abren sobre el objetivo, para que se vea la mejora.
      if (p.objetivo === "pareja") ui.parejaSeleccionada = objetivo;
      else ui.tierraSeleccionada = objetivo;
      DENDRO.local.registrar("CONTENCIÓN", `${p.codigo} ${p.nombre} · ${objetivo === "MYTH" ? "MYTH" : (C.pareja(estado, objetivo) || {}).id || objetivo} · APLICADO`);
      DENDRO.sonido.beep(880);
      paso = "resultado";
      ctx.redibujar();
    }

    function ejecutar() {
      if (!objetivo || !C.admite(proto(), objetivo, estado)) { paso = "elegir"; objetivo = null; ctx.redibujar(); return; }
      paso = "ejecutando";
      inicio = performance.now();
      duracion = proto().duracionMs * (1 + estado.intensidad);
      ctx.redibujar();
      temporizador = setTimeout(concluir, duracion);
    }

    function avanzar() {
      if (sinEnergia() || paso === "ejecutando") return;
      if (paso === "resultado") { paso = "elegir"; ctx.redibujar(); return; }
      if (!objetivo) { lista.abrir(); return; }
      if (paso === "elegir") paso = "confirmar";
      else if (paso === "confirmar" && proto().dobleConfirmacion) paso = "confirmar2";
      else { ejecutar(); return; }
      ctx.redibujar();
    }

    function elegirProtocolo(i) {
      if (paso === "ejecutando") return;
      indice = (i + protocolos().length) % protocolos().length;
      objetivo = objetivoPorDefecto();
      paso = "elegir";
      lista.invalidar();
      ctx.redibujar();
    }

    // ── Texto ───────────────────────────────────────────────────────────────
    function dibujarProtocolos(caja) {
      protocolos().forEach((p, i) => {
        if (i >= caja.alto) return;
        const sel = i === indice, estilo = sel ? { inverso: true } : null;
        if (sel) caja.rellenar(0, i, caja.ancho, 1, " ", "ambar", estilo);
        caja.escribir(1, i, `${p.codigo} ${p.nombre}`.slice(0, caja.ancho - 2), sel ? "ambar" : "texto", estilo);
      });
    }

    function dibujarInfo(caja, ancho) {
      const p = proto();
      let y = 0;
      const fila = (etq, valor, color) => { if (y < caja.alto) { caja.escribir(1, y, etq, "textoTenue"); caja.escribir(14, y++, String(valor).slice(0, caja.ancho - 15), color || "texto"); } };
      fila("PROTOCOLO", `${p.codigo} · ${p.nombre}`, "ambar");
      fila("OBJETIVO", objetivo ? etiqueta(objetivo) : "— (ENTER O TOQUE PARA ELEGIR)", objetivo ? "texto" : "textoTenue");
      if (objetivo) { const e = estadoDe(objetivo); fila("ESTADO", e.texto, e.color); }
      fila("DURACIÓN", DENDRO.tau.duracion(p.duracionMs * (1 + estado.intensidad)));
      C.partir(p.efecto, caja.ancho - 16).forEach((l, i) => fila(i ? "" : "EFECTO", l, "exito"));
      if (ancho) C.partir(p.descripcion, caja.ancho - 16).forEach((l, i) => fila(i ? "" : "DESCRIPCIÓN", l, "textoTenue"));
      if (suspendidas()) fila("AVISO", "CONTENCIONES SUSPENDIDAS (D-12)", "arma");

      const f = caja.alto - 1;
      if (sinEnergia()) caja.escribir(1, f, "SIN ENERGÍA EN EL SUSTRATO", "arma", { parpadeo: true });
      else if (paso === "elegir") caja.escribir(1, f, ancho ? "↑↓ PROTOCOLO · O OBJETIVO · ENTER APLICAR" : "TOQUE PROTOCOLO Y OBJETIVO", "textoTenue");
      else if (paso === "confirmar") caja.escribir(1, f, `¿APLICAR ${p.codigo} SOBRE ${objetivo}? [S/N]`.slice(0, caja.ancho - 2), "ambar", { parpadeo: true });
      else if (paso === "confirmar2") caja.escribir(1, f, "PODA IRREVERSIBLE. ¿CONFIRMA DE NUEVO? [S/N]", "arma", { parpadeo: true });
      else if (paso === "ejecutando") caja.escribir(1, f, "EJECUTANDO · NO APAGUE LA CONSOLA", "ambar");
      else if (paso === "resultado") caja.escribir(1, f, resultado.slice(0, caja.ancho - 2), "exito");
    }

    function dibujarHistorial(caja) {
      const locales = DENDRO.local.entradas().filter((e) => e.tipo === "CONTENCIÓN");
      if (!locales.length) caja.escribir(1, 0, "SIN ACCIONES EN ESTE PUESTO", "textoTenue");
      locales.slice(0, caja.alto).forEach((e, i) => caja.escribir(1, i, `${DENDRO.tau.corto(e.instante)} ${e.texto}`.slice(0, caja.ancho - 2), "texto"));
    }

    function dibujar(reg) {
      const ancho = reg.ancho >= 80;
      if (ancho) {
        panel = reg.caja(0, 0, ANCHO_PROTOCOLOS, reg.alto - 8, { titulo: "PROTOCOLOS" });
        info = reg.caja(ANCHO_PROTOCOLOS, 0, reg.ancho - ANCHO_PROTOCOLOS, 11, { titulo: "OBJETIVO Y EJECUCIÓN", doble: false });
        escena = reg.region(ANCHO_PROTOCOLOS, 11, reg.ancho - ANCHO_PROTOCOLOS, reg.alto - 11 - 8);
        historial = reg.caja(0, reg.alto - 8, reg.ancho, 8, { titulo: "HISTORIAL LOCAL", doble: false });
      } else {
        const altoLista = protocolos().length + 2;
        panel = reg.caja(0, 0, reg.ancho, altoLista, { titulo: "PROTOCOLOS" });
        info = reg.caja(0, altoLista, reg.ancho, 9, { titulo: "OBJETIVO", doble: false });
        escena = reg.region(0, altoLista + 9, reg.ancho, reg.alto - altoLista - 9);
        historial = null;
      }
      dibujarProtocolos(panel);
      dibujarInfo(info, ancho);
      if (historial) dibujarHistorial(historial);
      if (lista.abierta) { escena = null; lista.dibujar(reg); }
    }

    // ── Escena: el objetivo rodeado por anillos que se cierran durante el protocolo ──
    function vectores(raiz, ahora) {
      if (!escena || !objetivo) return;
      const v = escena.vectores(), segundos = ahora / 1000;
      const r = Math.max(1, Math.min(v.alto * 0.3, v.ancho * v.aspecto * 0.18));
      const cx = v.ancho / 2, cy = v.alto / 2 - 0.5;
      const par = C.pareja(estado, objetivo);
      if (par) {
        const ta = C.tierra(estado, par.a), tb = C.tierra(estado, par.b), d = (r * 1.25) / v.aspecto;
        v.globo(cx - d, cy, r * 0.8, ta, C.opcionesGlobo(estado, ta, segundos));
        v.globo(cx + d, cy, r * 0.8, tb, C.opcionesGlobo(estado, tb, segundos));
      } else {
        const t = C.tierra(estado, objetivo);
        if (t) v.globo(cx, cy, r, t, C.opcionesGlobo(estado, t, segundos));
      }
      const progreso = paso === "ejecutando" ? Math.min(1, (performance.now() - inicio) / duracion) : paso === "resultado" ? 1 : 0;
      for (let k = 0; k < 3; k++) {
        const radio = r * (1.3 + k * 0.18) - progreso * r * 0.12 * (k + 1);
        const a0 = segundos * (k % 2 ? -0.6 : 0.6);
        v.arco(cx, cy, radio * (par ? 1.4 : 1), a0, a0 + Math.PI * (1.2 + progreso * 0.8), paso === "resultado" ? "exito" : "ambar",
          { alfa: 0.35 + progreso * 0.5, discontinua: [4, 3] });
      }
      if (objetivo === "MYTH") {
        const efecto = C.efecto(ui, ["MYTH"], ["PC-90"]);
        const n = Math.min(1, estado.myth.cohesion + (efecto ? 0.05 : 0));
        v.texto(cx, cy + r * 1.7, `N̂ ${n.toFixed(3)}`, efecto ? "exito" : "rama", { tam: 1, alinear: "center" });
        C.barraEstabilidad(v, cx - 8, cy + r * 1.7 + 1.2, 16, Math.round(n * 100));
      }
      if (paso === "ejecutando" || paso === "resultado") {
        const ancho = Math.min(30, v.ancho - 4), x = cx - ancho / 2, y = v.alto - 1.2;
        v.poligono([[x, y], [x + ancho, y], [x + ancho, y + 0.8], [x, y + 0.8]], "ambar");
        v.poligono([[x, y], [x + ancho * progreso, y], [x + ancho * progreso, y + 0.8], [x, y + 0.8]], "ambar", { relleno: "ambar", rellenoAlfa: 0.7, sinTrazo: true });
        v.texto(cx, y - 1.1, `${Math.round(progreso * 100)} %`, "texto", { tam: 1, alinear: "center" });
      }
    }

    return {
      animada: true,
      dibujar,
      vectores,
      get capturaTeclado() { return lista.abierta; },
      get usaTab() { return lista.abierta; },
      capturaEscape: () => lista.abierta || paso === "confirmar" || paso === "confirmar2",
      actualizar(nuevo) {
        estado = nuevo;
        indice = Math.min(indice, protocolos().length - 1);
        lista.invalidar();
      },
      tecla(ev) {
        if (lista.tecla(ev)) return;
        const k = ev.key.toLowerCase();
        if (paso === "confirmar" || paso === "confirmar2") {
          if (k === "s" || k === "enter") { ev.preventDefault(); avanzar(); }
          else if (k === "n" || k === "escape") { ev.preventDefault(); paso = "elegir"; ctx.redibujar(); }
          return;
        }
        if (ev.key === "ArrowUp") { ev.preventDefault(); elegirProtocolo(indice - 1); }
        else if (ev.key === "ArrowDown") { ev.preventDefault(); elegirProtocolo(indice + 1); }
        else if ((k === "o" || ev.key === "ArrowRight") && paso !== "ejecutando" && !sinEnergia()) { ev.preventDefault(); lista.abrir(); }
        else if (ev.key === "Enter") { ev.preventDefault(); avanzar(); }
      },
      toque(punto) {
        if (!punto) return;
        const reg = ctx.region();
        if (lista.abierta) { lista.toque(punto, reg); return; }
        if (paso === "ejecutando" || !panel) return;
        const fila = Math.floor(punto.y) - (panel.y - reg.y);
        const enPanel = punto.x >= panel.x - reg.x && punto.x < panel.x - reg.x + panel.ancho;
        if (enPanel && fila >= 0 && fila < protocolos().length) {
          if (fila === indice) avanzar(); else elegirProtocolo(fila);
          return;
        }
        const filaInfo = Math.floor(punto.y) - (info.y - reg.y);
        if (filaInfo === 1 && !sinEnergia()) lista.abrir();
        else if (filaInfo >= 0 && filaInfo < info.alto + 1) avanzar();
      },
      detener() { clearTimeout(temporizador); lista.cerrar(); },
    };
  }

  DENDRO.vistas.registrar({ id: "contencion", tecla: "9", titulo: "CONTENCIÓN", tituloCorto: "CNT", crear });
})(window.DENDRO = window.DENDRO || {});
