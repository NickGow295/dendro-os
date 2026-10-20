// V0 TERMINAL (02-diseno.md §6): vista secundaria de órdenes. Registro { nombre, alias, ayuda,
// oculto, ejecutar(args, estado, ctx) }, historial ↑/↓, Tab, latencia deliberada según intensidad,
// órdenes de varias palabras y fallos sembrados cuando el sistema se degrada.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO } = C;
  const cfg = () => window.DENDRO_CONFIG;
  const PROMPT = [{ t: "OPERADOR@DR-7", c: "ambar" }, { t: "> ", c: "ambarTenue" }];
  const SIN_FALLOS = new Set(["ayuda", "limpiar", "salir"]);
  const BASURA = "▒░▓#%&@$?¿¡/\\|{}<>~ΔωτΩ";
  const PAUSA_LINEA = 14;   // ms entre líneas de una respuesta, como un teletipo

  const L = (...segmentos) => segmentos.map((s) => (typeof s === "string" ? { t: s } : s));
  const T = (t, c) => ({ t, c });

  // Parte una línea de segmentos en varias de como mucho `ancho` caracteres, cortando por espacios.
  function ajustar(segmentos, ancho) {
    const letras = [];
    for (const s of segmentos) for (const ch of Array.from(s.t || "")) letras.push({ ch, c: s.c, e: s.e });
    if (letras.length <= ancho) return [segmentos];
    const lineas = [];
    let inicio = 0;
    while (inicio < letras.length) {
      let fin = Math.min(letras.length, inicio + ancho);
      if (fin < letras.length) {
        const espacio = letras.slice(inicio, fin).map((l) => l.ch).lastIndexOf(" ");
        if (espacio > ancho / 3) fin = inicio + espacio + 1;
      }
      const linea = [];
      for (const l of letras.slice(inicio, fin)) {
        const ultimo = linea[linea.length - 1];
        if (ultimo && ultimo.c === l.c && ultimo.e === l.e) ultimo.t += l.ch;
        else linea.push({ t: l.ch, c: l.c, e: l.e });
      }
      lineas.push(linea);
      inicio = fin;
    }
    return lineas;
  }

  function buscarTierra(estado, texto) {
    if (!texto) return null;
    const q = texto.toLowerCase();
    return estado.tierras.find((t) => t.id.toLowerCase() === q || t.id.toLowerCase().endsWith(q.replace(/^b-/, "")) && q.length >= 3
      || t.nombre.toLowerCase() === q);
  }

  // ── Órdenes ─────────────────────────────────────────────────────────────
  const ORDENES = [
    {
      nombre: "ayuda", alias: ["help", "?"], ayuda: "lista de órdenes",
      ejecutar: () => [
        L(T("ÓRDENES DISPONIBLES", "ambar")),
        ...ORDENES.filter((o) => !o.oculto).map((o) => L(T(`  ${(o.nombre + (o.uso ? " " + o.uso : "")).padEnd(18)}`, "texto"), T(o.ayuda, "textoTenue"))),
      ],
    },
    {
      nombre: "estado", alias: ["status"], ayuda: "situación del día",
      ejecutar: (args, e) => {
        const revelado = e.fase >= 4;
        return [
          L(T("META-TIEMPO ", "textoTenue"), T(DENDRO.tau.instante(DENDRO.reloj.ahora()))),
          L(T("FASE        ", "textoTenue"), T(`${e.fase} ${e.nombreFase}`, "ambar")),
          L(T("ALERTA      ", "textoTenue"), T(e.nivelAlerta, e.fase >= 3 ? "arma" : "ambar")),
          L(T("RAMAS       ", "textoTenue"), T(DENDRO.escritorio.formatoRamas(e.ramasAfectadas), e.fase >= 3 ? "arma" : "texto")),
          L(T("AL COLAPSO  ", "textoTenue"), revelado ? T(DENDRO.tau.cuenta(e.paraColapso), "arma") : T("???", "arma")),
          L(T("PRINCIPAL   ", "textoTenue"), T(`${e.parejaPrincipal} · ${C.pareja(e, e.parejaPrincipal).estado}`, "ambar")),
        ];
      },
    },
    {
      nombre: "escanear", alias: ["scan"], ayuda: "barrido de las 24 firmas",
      ejecutar: (args, e, ctx, sesion) => sesion.estrecha ? [
        L(T("ID    NOMBRE        EST  ESTAB.", "textoTenue")),
        ...e.tierras.map((t) => L(T(t.id.slice(2) + "  ", "tierra"), T(MAYUS(t.nombre).padEnd(13).slice(0, 13) + " ", "texto"),
          T(C.ABREVIATURA[t.estado].padEnd(5), COLOR_ESTADO[t.estado]), T(`${String(t.estabilidad).padStart(3)}%`, C.colorEstabilidad(t.estabilidad)))),
      ] : [
        L(T("ID      NOMBRE          ω        ESTADO         EST.", "textoTenue")),
        ...e.tierras.map((t) => L(
          T(`${t.id}  `, "tierra"), T(MAYUS(t.nombre).padEnd(15).slice(0, 15) + " ", "texto"),
          T(t.magia === "Inestable" ? "?.????   " : `${t.omega.toFixed(4)}   `, "tierra"),
          T(t.estado.padEnd(15), COLOR_ESTADO[t.estado]), T(`${String(t.estabilidad).padStart(3)}%`, C.colorEstabilidad(t.estabilidad)))),
      ],
    },
    {
      nombre: "examinar", alias: ["ver"], uso: "<id|nombre>", ayuda: "ficha breve de una tierra",
      ejecutar: (args, e, ctx, sesion) => {
        const t = buscarTierra(e, args.join(" "));
        if (!t) return [L(T("TIERRA DESCONOCIDA. USE UN ID (B-0x05) O UN NOMBRE.", "arma"))];
        ctx.ui.tierraSeleccionada = t.id;
        sesion.pendiente = "expediente";
        return [
          L(T(`${t.id} · ${MAYUS(t.nombre)}`, "ambar")),
          L(T("ω ", "textoTenue"), T(t.magia === "Inestable" ? "LECTURA IMPOSIBLE" : t.omega.toFixed(4), "tierra"), T("  RÉGIMEN ", "textoTenue"), T(MAYUS(t.magia))),
          L(T("ESTADO ", "textoTenue"), T(t.estado, COLOR_ESTADO[t.estado]), T(`  ESTABILIDAD ${t.estabilidad}%`, "textoTenue")),
          L(T(MAYUS(t.caracter), "textoTenue")),
          L(T("[ENTER] ABRIR EXPEDIENTE", "ambarTenue")),
        ];
      },
    },
    {
      nombre: "colisiones", alias: ["parejas"], ayuda: "parejas y su convergencia",
      ejecutar: (args, e, ctx, sesion) => {
        sesion.pendiente = "colision";
        return [
          L(T("PAR   RAMAS                        ESTADO         Δω      T", "textoTenue")),
          ...e.parejas.map((p) => {
            const t = p.estado === "ESTABLE" ? "—" : DENDRO.tau.cuenta(p.paraContacto);
            if (sesion.estrecha) {
              return L(T(`${p.id} `, "ambar"), T(C.ABREVIATURA[p.estado].padEnd(5), COLOR_ESTADO[p.estado]), T(`Δω ${p.deltaOmega.toFixed(4)} `, "tierra"), T(t, "textoTenue"));
            }
            const nombres = `${MAYUS(C.tierra(e, p.a).nombre)}/${MAYUS(C.tierra(e, p.b).nombre)}`;
            return L(T(`${p.id}  `, "ambar"), T(nombres.padEnd(28).slice(0, 28) + " ", "texto"), T(p.estado.padEnd(15), COLOR_ESTADO[p.estado]),
              T(`${p.deltaOmega.toFixed(4)}  `, "tierra"), T(t, "textoTenue"));
          }),
          L(T("[ENTER] ABRIR COLISIÓN", "ambarTenue")),
        ];
      },
    },
    {
      nombre: "aislar", uso: "<id|nombre>", ayuda: "aislante de emergencia (local)",
      ejecutar: (args, e) => {
        const t = buscarTierra(e, args.join(" "));
        if (!t) return [L(T("INDIQUE UNA TIERRA: aislar B-0x05", "arma"))];
        const texto = ["ANIQUILADA", "COLAPSO"].includes(t.estado) ? "OBJETIVO SIN SEÑAL · ACCIÓN ABORTADA" : "AISLANTE ACTIVADO · SIN EFECTO MEDIBLE EN Δω";
        DENDRO.local.registrar("CONTENCIÓN", `AISLAR RAMA (TERMINAL) · ${t.id} ${MAYUS(t.nombre)} · ${texto}`);
        return [L(T(`${t.id} ${MAYUS(t.nombre)}: `, "texto"), T(texto, texto.startsWith("OBJETIVO") ? "arma" : "exito"))];
      },
    },
    {
      nombre: "registro", alias: ["log"], uso: "[n]", ayuda: "últimas entradas de la bitácora",
      ejecutar: (args, e) => {
        const n = Math.max(1, Math.min(50, parseInt(args[0], 10) || 10));
        const todas = [...e.registro, ...DENDRO.local.entradas()].sort((a, b) => b.instante - a.instante);
        return todas.slice(0, n).map((ev) => L(T(`${DENDRO.tau.corto(ev.instante)} `, "textoTenue"),
          T(`[${ev.tipo}] `, C.COLOR_TIPO[ev.tipo]), T(ev.texto, ev.origen === "local" ? "ambar" : "texto")));
      },
    },
    {
      nombre: "limpiar", alias: ["cls", "clear"], ayuda: "borra la pantalla",
      ejecutar: (args, e, ctx, sesion) => { sesion.limpiar = true; return []; },
    },
    {
      nombre: "salir", alias: ["exit", "logout"], ayuda: "cierra la sesión y apaga el monitor",
      ejecutar: (args, e, ctx) => {
        DENDRO.local.registrar("SISTEMA", "SESIÓN CERRADA DESDE LA TERMINAL");
        setTimeout(() => ctx.salir(), 600);
        return [L(T("CERRANDO SESIÓN…", "ambar"))];
      },
    },

    // Ocultas (04-lore.md §8): no salen en `ayuda`.
    {
      nombre: "raiz", alias: ["raíz"], oculto: true,
      ejecutar: () => [
        ...cfg().agencia.logoASCII.map((l) => L(T(l, "ambar"))),
        L(""),
        L(T(`  « ${cfg().agencia.lema} »`, "textoTenue")),
      ],
    },
    {
      nombre: "semilla", oculto: true,
      ejecutar: () => {
        const nuevo = DENDRO.local.desbloquear("negro");
        if (nuevo) DENDRO.local.registrar("SISTEMA", "ACCESO DE NIVEL NEGRO CONCEDIDO AL OPERADOR");
        return [
          L(T("|Ω₀⟩", "rama")),
          L(T(nuevo ? "AUTORIZACIÓN DE NIVEL NEGRO CONCEDIDA." : "LA SEMILLA YA FUE PLANTADA.", "ambar")),
          L(T("EL DOCUMENTO [CLASIFICADO NEGRO] ESTÁ ABIERTO EN EL ARCHIVO (8).", "textoTenue")),
        ];
      },
    },
    {
      nombre: "kesh", oculto: true,
      ejecutar: () => [
        L(T("DE: DIRECTORA AMARANTA KESH · CANAL PERSONAL", "ambar")),
        L(""),
        L(T("Si escribe mi nombre en una terminal es que pregunta más de lo que")),
        L(T("le pedimos. Bien. Siga mirando. Y cuando no haya nada que mirar,")),
        L(T("recuerde que alguien estuvo aquí.")),
      ],
    },
    {
      nombre: "quien vigila", alias: ["quién vigila"], oculto: true,
      ejecutar: () => [L(T("LA ESTACIÓN RAÍZ NO TIENE OBSERVADOR. NADIE LA SOSTIENE.", "arma"))],
    },
    {
      nombre: "n-hat", alias: ["nhat", "n"], oculto: true,
      ejecutar: (args, e) => {
        const n = Math.max(0, 1 - e.p * (e.fase >= 2 ? 1 : 0));
        const llenos = Math.round(n * 30);
        const color = n > 0.5 ? "tierra" : n > 0.2 ? "ambar" : "arma";
        return [
          L(T("POTENCIAL DE COHESIÓN DEL TRONCO", "ambar")),
          L(T("N = ", "textoTenue"), T(n.toFixed(3), color)),
          L(T("█".repeat(llenos), color), T("░".repeat(30 - llenos), "ambarTenue")),
        ];
      },
    },
  ];

  // Coincidencia más larga primero, para admitir órdenes de varias palabras (`quien vigila`).
  const NOMBRES = ORDENES.flatMap((o) => [o.nombre, ...(o.alias || [])].map((n) => ({ n, o })))
    .sort((a, b) => b.n.split(" ").length - a.n.split(" ").length || b.n.length - a.n.length);

  function analizar(linea) {
    const limpia = linea.trim().toLowerCase().replace(/\s+/g, " ");
    for (const { n, o } of NOMBRES) {
      if (limpia === n || limpia.startsWith(n + " ")) return { orden: o, args: limpia.slice(n.length).trim().split(" ").filter(Boolean) };
    }
    return { orden: null, args: [] };
  }

  function crear(ctx) {
    let estado = ctx.estado;
    const P = DENDRO.pantalla;
    let area = null;
    const consola = DENDRO.escritor.crearConsola(() => area);
    const sesion = { pendiente: null, limpiar: false, estrecha: false };
    const historial = [];
    let entrada = "", posHistorial = -1, ocupada = false, cancelar = null, cuenta = 0;

    function lineaPrompt(marca) {
      return [...PROMPT, { t: entrada, c: "texto" }, ...(marca ? [{ t: marca, c: "ambar", e: { parpadeo: true } }] : [])];
    }

    function refrescar() {
      consola.reemplazarUltima(lineaPrompt(ocupada ? "▒" : null));
      if (ocupada) P.ocultarCursor();
      else { const f = consola.finalDeLinea(); P.ponerCursor(f.x, f.y); }
    }

    function nuevoPrompt() {
      entrada = "";
      consola.agregar(lineaPrompt());
      DENDRO.teclado.pedirTexto({ valor: "", maximo: 80, alCambiar });
      refrescar();
    }

    function alCambiar(v) {
      if (ocupada || v === entrada) return;
      entrada = v;
      DENDRO.sonido.tecla();
      refrescar();
    }

    // Espera cancelable (Esc), con la latencia de 02-diseno.md §6.
    function esperar(ms) {
      return new Promise((ok) => {
        const id = setTimeout(() => ok(true), ms);
        cancelar = () => { clearTimeout(id); ok(false); };
      });
    }

    async function imprimir(lineas) {
      for (const l of lineas.flatMap((x) => ajustar(x, area.ancho))) {
        consola.agregar(l);
        await new Promise((ok) => setTimeout(ok, PAUSA_LINEA));
      }
    }

    async function ejecutar() {
      const linea = entrada.trim();
      consola.reemplazarUltima(lineaPrompt());
      if (!linea) {
        if (sesion.pendiente) { const vista = sesion.pendiente; sesion.pendiente = null; ctx.abrir(vista); return; }
        nuevoPrompt();
        return;
      }
      historial.unshift(linea);
      posHistorial = -1;
      sesion.pendiente = null;
      const { orden, args } = analizar(linea);
      const rng = DENDRO.prng.crear(estado.dia, "terminal", ++cuenta);
      const lat = cfg().texto.latenciaTerminal;
      const espera = (lat.minMs + (lat.maxMs - lat.minMs) * estado.intensidad) * (0.7 + 0.6 * rng());

      ocupada = true;
      refrescar();
      const completa = await esperar(espera);
      ocupada = false;
      cancelar = null;
      if (!completa) {
        consola.agregar(L(T("INTERRUMPIDO", "ambar")));
      } else if (!orden) {
        await imprimir([L(T(`ORDEN DESCONOCIDA: ${linea.split(" ")[0]} · ESCRIBA `, "arma"), T("ayuda", "ambar"))]);
      } else if (!orden.oculto && !SIN_FALLOS.has(orden.nombre) && rng() < estado.intensidad * 0.25) {
        // El sistema degradado a veces no responde o responde basura (RF-07).
        if (rng() < 0.5) consola.agregar(L(T("TIEMPO DE ESPERA AGOTADO", "arma")));
        else consola.agregar(L(T(Array.from({ length: 36 }, () => BASURA[Math.floor(rng() * BASURA.length)]).join(""), "arma")));
      } else {
        const lineas = orden.ejecutar(args, estado, ctx, sesion);
        if (sesion.limpiar) { sesion.limpiar = false; consola.limpiar(); }
        await imprimir(lineas);
      }
      DENDRO.sonido.beep(completa && orden ? 1200 : 300);
      nuevoPrompt();
    }

    function completar() {
      const q = entrada.trim().toLowerCase();
      if (!q) return;
      const candidatos = ORDENES.filter((o) => !o.oculto && o.nombre.startsWith(q)).map((o) => o.nombre);
      if (candidatos.length === 1) {
        DENDRO.teclado.pedirTexto({ valor: candidatos[0] + " ", maximo: 80, alCambiar });
      } else if (candidatos.length > 1) {
        consola.agregar(L(T(candidatos.join("   "), "textoTenue")));
        consola.agregar(lineaPrompt());
        refrescar();
      }
    }

    function recordar(paso) {
      if (!historial.length) return;
      posHistorial = Math.max(-1, Math.min(historial.length - 1, posHistorial + paso));
      DENDRO.teclado.pedirTexto({ valor: posHistorial < 0 ? "" : historial[posHistorial], maximo: 80, alCambiar });
    }

    function dibujar(reg) {
      area = reg.region(1, 0, reg.ancho - 2, reg.alto);
      sesion.estrecha = area.ancho < 60;
      consola.dibujar();
      refrescar();
    }

    return {
      animada: false,
      capturaTeclado: true,
      ocupada: () => ocupada,
      iniciar() {
        consola.agregar(L(T(`${cfg().agencia.sistema} v${cfg().agencia.version} · TERMINAL DE OPERACIONES`, "ambar")));
        consola.agregar(L(T("ESCRIBA ", "textoTenue"), T("ayuda", "ambar"), T(" PARA VER LAS ÓRDENES.", "textoTenue")));
        consola.agregar(L(""));
        nuevoPrompt();
      },
      dibujar,
      actualizar(nuevo) { estado = nuevo; },
      tecla(ev) {
        if (ocupada) {
          ev.preventDefault();
          if (ev.key === "Escape" && cancelar) cancelar();
          return;
        }
        if (ev.key === "Enter") { ev.preventDefault(); ejecutar(); }
        else if (ev.key === "Tab") { ev.preventDefault(); completar(); }
        else if (ev.key === "ArrowUp") { ev.preventDefault(); recordar(1); }
        else if (ev.key === "ArrowDown") { ev.preventDefault(); recordar(-1); }
        else DENDRO.teclado.recoger(ev);
      },
      toque() { DENDRO.teclado.enfocar(); },
      detener() {
        if (cancelar) cancelar();
        DENDRO.teclado.soltar();
      },
    };
  }

  DENDRO.vistas.registrar({ id: "terminal", tecla: "0", titulo: "TERMINAL", tituloCorto: "TER", crear });
})(window.DENDRO = window.DENDRO || {});
