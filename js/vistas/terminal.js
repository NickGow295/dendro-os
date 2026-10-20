// V0 TERMINAL (02-diseno.md §6): vista secundaria de órdenes. Registro { nombre, alias, ayuda,
// oculto, ejecutar(args, estado, ctx, sesion) }, historial ↑/↓, Tab, latencia deliberada según
// intensidad, órdenes de varias palabras y fallos sembrados cuando el sistema se degrada.
// ejecutar devuelve null cuando la orden todavía no existe (las ocultas que esperan su hito).
// La credencial de dirección se pide con eco *, nunca entra en el historial y solo se guarda su hash.
(function (DENDRO) {
  "use strict";

  const C = DENDRO.vistasComun;
  const { MAYUS, COLOR_ESTADO } = C;
  const cfg = () => window.DENDRO_CONFIG;
  const PROMPT = [{ t: "OPERADOR@DR-7", c: "ambar" }, { t: "> ", c: "ambarTenue" }];
  const PROMPT_CLAVE = [{ t: "CLAVE", c: "arma" }, { t: "> ", c: "ambarTenue" }];
  const ESPERA_FALLO_CLAVE = 900;   // ms extra por cada intento fallido de la sesión
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

  // Código completo, sufijo (7A2·R9; vale "." o "-" como separador) o nombre de una nombrada.
  function buscarTierra(estado, texto) {
    if (!texto) return null;
    const q = MAYUS(texto.trim()).replace(/[\s._/-]+/g, "·");
    const porNombre = estado.tierras.nombradas.find((t) => MAYUS(t.nombre) === MAYUS(texto.trim()));
    if (porNombre) return porNombre;
    const exacta = estado.tierras.porCodigo(q) || estado.tierras.porCodigo("MYTH·" + q);
    if (exacta) return exacta;
    const plano = q.replace(/·/g, "");
    if (plano.length < 4) return null;
    const sufijo = DENDRO.multiverso.catalogo().nodos.filter((n) => !n.baja && n.codigo.replace(/·/g, "").endsWith(plano) &&
      (q.includes("·") ? n.codigo.endsWith("·" + q) : true));
    return sufijo.length === 1 ? estado.tierras.porCodigo(sufijo[0].codigo) : null;
  }
  const POR_PAGINA_COLISIONES = 12;

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
        L(T("CÓDIGO  NOMBRE        EST  ESTAB.", "textoTenue")),
        ...e.tierras.nombradas.map((t) => L(T(C.codigoCorto(t.codigo).padEnd(8), "tierra"), T(MAYUS(t.nombre).padEnd(13).slice(0, 13) + " ", "texto"),
          T(C.ABREVIATURA[t.estado].padEnd(5), COLOR_ESTADO[t.estado]), T(`${String(t.estabilidad).padStart(3)}%`, C.colorEstabilidad(t.estabilidad)))),
      ] : [
        L(T("CÓDIGO             NOMBRE          ω        ESTADO         EST.", "textoTenue")),
        ...e.tierras.nombradas.map((t) => L(
          T(t.codigo.padEnd(19), "tierra"), T(MAYUS(t.nombre).padEnd(15).slice(0, 15) + " ", "texto"),
          T(t.magia === "Inestable" ? "?.????   " : `${t.omega.toFixed(4)}   `, "tierra"),
          T(t.estado.padEnd(15), COLOR_ESTADO[t.estado]), T(`${String(t.estabilidad).padStart(3)}%`, C.colorEstabilidad(t.estabilidad)))),
      ],
    },
    {
      nombre: "examinar", alias: ["ver"], uso: "<código|nombre>", ayuda: "ficha breve de una rama",
      ejecutar: (args, e, ctx, sesion) => {
        const t = buscarTierra(e, args.join(" "));
        if (!t) return [L(T("RAMA DESCONOCIDA. USE UN CÓDIGO (7A2·R9) O UN NOMBRE.", "arma"))];
        ctx.ui.tierraSeleccionada = t.codigo;
        sesion.pendiente = "expediente";
        if (!t.nombrada) {
          return [
            L(T(`${t.codigo} · ${t.raiz ? "TRONCO" : "DENOMINACIÓN LOCAL: NO CATALOGADA"}`, "ambar")),
            L(T("ω ", "textoTenue"), T(t.omega.toFixed(4), "tierra"), T("  RÉGIMEN ", "textoTenue"), T(MAYUS(t.regimen))),
            L(T("ESTADO ", "textoTenue"), T(t.estado, COLOR_ESTADO[t.estado]), T(`  ${t.raiz ? "COHESIÓN N̂" : "ESTABILIDAD"} ${t.estabilidad}%`, "textoTenue")),
            L(T("[ENTER] ABRIR EXPEDIENTE", "ambarTenue")),
          ];
        }
        return [
          L(T(`${t.codigo} · ${MAYUS(t.nombre)}`, "ambar")),
          L(T("ω ", "textoTenue"), T(t.magia === "Inestable" ? "LECTURA IMPOSIBLE" : t.omega.toFixed(4), "tierra"), T("  RÉGIMEN ", "textoTenue"), T(MAYUS(t.magia))),
          L(T("ESTADO ", "textoTenue"), T(t.estado, COLOR_ESTADO[t.estado]), T(`  ESTABILIDAD ${t.estabilidad}%`, "textoTenue")),
          L(T(MAYUS(t.caracter), "textoTenue")),
          L(T("[ENTER] ABRIR EXPEDIENTE", "ambarTenue")),
        ];
      },
    },
    {
      nombre: "colisiones", alias: ["parejas"], uso: "[página]", ayuda: "parejas activas y su convergencia",
      ejecutar: (args, e, ctx, sesion) => {
        sesion.pendiente = "colision";
        const activas = e.activas.map((id) => C.pareja(e, id)).sort((a, b) => (b.nombrada - a.nombrada) || (a.contacto - b.contacto));
        const lista = activas.length ? activas : e.parejas.filter((p) => p.nombrada);
        const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA_COLISIONES));
        const pagina = Math.max(1, Math.min(paginas, parseInt(args[0], 10) || 1));
        return [
          L(T(activas.length ? `ACTIVAS: ${activas.length} · PÁGINA ${pagina}/${paginas}` : "SIN CONVERGENCIAS ACTIVAS · PAREJAS NOMBRADAS", "ambar")),
          L(T("PAR     RAMAS                        ESTADO         Δω      T", "textoTenue")),
          ...lista.slice((pagina - 1) * POR_PAGINA_COLISIONES, pagina * POR_PAGINA_COLISIONES).map((p) => {
            const t = p.estado === "ESTABLE" ? "—" : DENDRO.tau.cuenta(p.paraContacto);
            if (sesion.estrecha) {
              return L(T(`${p.id.padEnd(6)} `, "ambar"), T(C.ABREVIATURA[p.estado].padEnd(5), COLOR_ESTADO[p.estado]), T(`Δω ${p.deltaOmega.toFixed(4)} `, "tierra"), T(t, "textoTenue"));
            }
            const nombres = p.nombrada ? `${C.nombre(C.tierra(e, p.a))}/${C.nombre(C.tierra(e, p.b))}` : `${C.codigoCorto(p.a)}/${C.codigoCorto(p.b)}`;
            return L(T(`${p.id.padEnd(6)}  `, "ambar"), T(nombres.padEnd(28).slice(0, 28) + " ", "texto"), T(p.estado.padEnd(15), COLOR_ESTADO[p.estado]),
              T(`${p.deltaOmega.toFixed(4)}  `, "tierra"), T(t, "textoTenue"));
          }),
          L(T("[ENTER] ABRIR COLISIÓN", "ambarTenue")),
        ];
      },
    },
    {
      nombre: "contener", alias: ["aislar"], uso: "<PC-xx> <objetivo>", ayuda: "prepara un protocolo de contención",
      ejecutar: (args, e, ctx, sesion, nombre) => contener(nombre === "aislar" ? ["PC-40", ...args] : args, e, ctx, sesion),
    },
    {
      nombre: "credencial", uso: "[cerrar]", ayuda: "credencial de dirección",
      ejecutar: (args, e, ctx, sesion) => {
        if (["cerrar", "revocar"].includes(args[0])) {
          if (!DENDRO.local.credencial()) return [L(T("NO HAY CREDENCIAL DE DIRECCIÓN ACTIVA.", "textoTenue"))];
          DENDRO.local.credencial(null);
          DENDRO.local.registrar("SISTEMA", "CREDENCIAL DE DIRECCIÓN CERRADA");
          ctx.redibujar();
          return [L(T("CREDENCIAL DE DIRECCIÓN CERRADA. EL CANAL DE DIRECCIÓN Y LOS CLASIFICADOS QUEDAN SELLADOS.", "ambar"))];
        }
        if (DENDRO.local.credencial()) return [L(T("CREDENCIAL DE DIRECCIÓN YA ACTIVA · ", "ambar"), T("credencial cerrar", "texto"), T(" PARA SELLAR.", "ambar"))];
        sesion.pedirClave = true;
        return [L(T("INTRODUZCA LA CLAVE DE DIRECCIÓN (ESC CANCELA):", "ambar"))];
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
        const n = e.myth.cohesion;
        const llenos = Math.round(n * 30);
        const color = n > 0.6 ? "tierra" : n > 0.2 ? "ambar" : "arma";
        return [
          L(T("COHESIÓN N̂ ANCLADA EN MYTH", "ambar")),
          L(T("N̂ = ", "textoTenue"), T(n.toFixed(3), color)),
          L(T("█".repeat(llenos), color), T("░".repeat(30 - llenos), "ambarTenue")),
        ];
      },
    },
    {
      nombre: "omega i", alias: ["omega", "ωi", "ω i", "omega-i"], oculto: true,
      ejecutar: (args, e) => {
        if (!e.hitos.omegaI) return [L(T("SIN LECTURAS.", "textoTenue"))];
        return [
          L(T("LECTURA ", "textoTenue"), T("ω = 1.0000i", "arma"), T(" · PARTE IMAGINARIA PURA", "textoTenue")),
          L(T("POSICIÓN  ", "textoTenue"), T(posicionFirma(e), "ambar")),
          L(T("BATIDO    ", "textoTenue"), T("NO OSCILA · CRECE SIN LÍMITE", "arma")),
        ];
      },
    },
    {
      nombre: "sarmiento", oculto: true,
      ejecutar: (args, e) => [e.hitos.sarmiento
        ? L(T("MYTH·4K·7A2·S5 · SARMIENTO · DADA DE BAJA EN τ 6913.204 · CONVERGENCIA MENOR, SIN SUPERVIVIENTES", "ambar"))
        : L(T("RAMA NO CATALOGADA.", "textoTenue"))],
    },
    {
      nombre: "escarda", oculto: true,
      ejecutar: (args, e) => {
        if (!e.hitos.sarmiento) return null;
        const lineas = [L(T("R. ESCARDA · MAESTRO INJERTADOR · SARMIENTO · ESTADO: NO CONSTA", "ambar"))];
        if (DENDRO.local.credencial() && e.hitos.injertador) lineas.push(L(T("VÉASE CLAS-INJ-01 EN EL ARCHIVO (8).", "textoTenue")));
        return lineas;
      },
    },
    {
      nombre: "myth", alias: ["guardianes", "los cinco"], oculto: true,
      ejecutar: (args, e) => {
        const lineas = [L(T("MYTH · TRONCO · ", "ambar"), T(`N̂ ${e.myth.cohesion.toFixed(3)}`, e.myth.cohesion > 0.6 ? "tierra" : "arma"))];
        if (!DENDRO.local.credencial()) return [...lineas, L(T("GUARDIANES · SELLADO · REQUIERE CREDENCIAL DE DIRECCIÓN", "arma"))];
        for (const g of e.myth.guardianes) {
          lineas.push(L(T(`  ${MAYUS(g.nombre)} · ${MAYUS(g.titulo)}`.padEnd(32), "texto"),
            g.caido ? T(`CAÍDO EN ${DENDRO.tau.instante(g.cae)}`, "arma") : T("EN PIE", "tierra")));
        }
        return lineas;
      },
    },
    {
      nombre: "injertador", alias: ["el injertador"], oculto: true,
      ejecutar: (args, e) => {
        if (!e.hitos.injertador) return null;
        if (e.hitos.silueta) return [L(T("|ω = 1.0000i⟩ · YA ESTOY DEBAJO DE USTEDES.", "arma"))];
        return [L(T("SIN RESPUESTA.", "textoTenue"))];
      },
    },
  ];

  // contener <PC-xx> <objetivo>: valida protocolo y objetivo y deja CONTENCIÓN preparada (aislar = PC-40).
  function contener(args, e, ctx, sesion) {
    const codigo = (args[0] || "").toUpperCase().replace(/^PC(\d)/, "PC-$1");
    const proto = e.protocolos.find((p) => p.codigo === codigo);
    if (!proto) return [L(T("PROTOCOLO DESCONOCIDO. CATÁLOGO: ", "arma"), T(e.protocolos.map((p) => p.codigo).join(" "), "ambar"))];
    if (e.modulosCaidos.includes("contencion")) return [L(T("SIN ENERGÍA EN EL SUSTRATO.", "arma"))];
    const texto = args.slice(1).join(" ");
    let objetivo = null;
    if (proto.objetivo === "myth") objetivo = "MYTH";
    else if (proto.objetivo === "pareja") {
      const par = C.pareja(e, texto.toUpperCase()) || C.pareja(e, texto.toUpperCase().replace(/^C-?(\d+)$/,(m, n) => (n.length <= 2 ? "C-" + n.padStart(2, "0") : "C-" + n.padStart(4, "0"))));
      objetivo = par ? par.id : null;
    } else {
      const t = buscarTierra(e, texto);
      objetivo = t ? t.codigo : null;
    }
    if (!objetivo) return [L(T(`INDIQUE UN OBJETIVO: ${proto.objetivo === "pareja" ? "contener PC-14 C-03" : "contener PC-11 ceniza"}`, "arma"))];
    if (!C.admite(proto, objetivo, e)) return [L(T(`${proto.codigo} NO ADMITE ${objetivo} EN SU ESTADO ACTUAL.`, "arma"))];
    ctx.ui.contencionPendiente = { protocolo: proto.codigo, objetivo };
    sesion.pendiente = "contencion";
    return [
      L(T(`${proto.codigo} ${proto.nombre}`, "ambar"), T(` · ${objetivo}`, "texto")),
      L(T(proto.efecto, "textoTenue")),
      L(T("[ENTER] ABRIR CONTENCIÓN", "ambarTenue")),
    ];
  }

  // Dónde leen los sensores la firma imaginaria: bajo la primaria que está cayendo, y más abajo cada vez.
  function posicionFirma(e) {
    if (e.hitos.silueta) return "BASE DE MYTH";
    if (e.hitos.viaIII) return "BULK · DEBAJO DE LA ESTACIÓN RAÍZ";
    const activas = e.activas.map((id) => C.pareja(e, id)).filter((p) => !p.nombrada && p.paraContacto <= 0);
    if (!activas.length) return "SUSTRATO · CUADRANTE BAJO";
    const ultima = activas.reduce((m, p) => (p.contacto > m.contacto ? p : m));
    return `SUSTRATO · BAJO ${C.tierra(e, ultima.a).primaria}`;
  }

  // Coincidencia más larga primero, para admitir órdenes de varias palabras (`quien vigila`).
  const NOMBRES = ORDENES.flatMap((o) => [o.nombre, ...(o.alias || [])].map((n) => ({ n, o })))
    .sort((a, b) => b.n.split(" ").length - a.n.split(" ").length || b.n.length - a.n.length);

  function analizar(linea) {
    const limpia = linea.trim().toLowerCase().replace(/\s+/g, " ");
    for (const { n, o } of NOMBRES) {
      if (limpia === n || limpia.startsWith(n + " ")) return { orden: o, nombreUsado: n, args: limpia.slice(n.length).trim().split(" ").filter(Boolean) };
    }
    return { orden: null, args: [] };
  }

  function crear(ctx) {
    let estado = ctx.estado;
    const P = DENDRO.pantalla;
    let area = null;
    const consola = DENDRO.escritor.crearConsola(() => area);
    const sesion = { pendiente: null, limpiar: false, estrecha: false, pedirClave: false };
    let modoClave = false, fallosClave = 0;
    const historial = [];
    let entrada = "", posHistorial = -1, ocupada = false, cancelar = null, cuenta = 0;

    function lineaPrompt(marca) {
      const texto = modoClave ? "*".repeat(Array.from(entrada).length) : entrada;
      return [...(modoClave ? PROMPT_CLAVE : PROMPT), { t: texto, c: "texto" }, ...(marca ? [{ t: marca, c: "ambar", e: { parpadeo: true } }] : [])];
    }

    function refrescar() {
      consola.reemplazarUltima(lineaPrompt(ocupada ? "▒" : null));
      if (ocupada) P.ocultarCursor();
      else { const f = consola.finalDeLinea(); P.ponerCursor(f.x, f.y); }
    }

    function nuevoPrompt() {
      entrada = "";
      modoClave = sesion.pedirClave;
      sesion.pedirClave = false;
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

    // Compara sha256(sal + clave normalizada) con config; la espera crece con cada fallo.
    async function validarClave() {
      const clave = entrada;
      modoClave = false;
      entrada = "";
      consola.reemplazarUltima([...PROMPT_CLAVE, { t: "*".repeat(Array.from(clave).length), c: "texto" }]);
      const hash = DENDRO.credencial.hash(clave);
      const valida = DENDRO.credencial.valida(hash);
      ocupada = true;
      refrescar();
      const completa = await esperar(400 + (valida ? 0 : ESPERA_FALLO_CLAVE * (fallosClave + 1)));
      ocupada = false;
      cancelar = null;
      if (!completa) consola.agregar(L(T("INTERRUMPIDO", "ambar")));
      else if (valida) {
        fallosClave = 0;
        DENDRO.local.credencial(hash);
        DENDRO.local.registrar("SISTEMA", "CREDENCIAL DE DIRECCIÓN ACEPTADA");
        await imprimir([
          L(T("CREDENCIAL DE DIRECCIÓN ACEPTADA.", "exito")),
          L(T("CANAL DE DIRECCIÓN (7) Y CLASIFICADOS (8) ABIERTOS.", "textoTenue")),
        ]);
        ctx.redibujar();
      } else {
        fallosClave++;
        DENDRO.local.registrar("SISTEMA", "INTENTO FALLIDO DE CREDENCIAL DE DIRECCIÓN");
        await imprimir([L(T("CLAVE INCORRECTA.", "arma"))]);
      }
      DENDRO.sonido.beep(completa && valida ? 1200 : 300);
      nuevoPrompt();
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
      if (modoClave) { await validarClave(); return; }
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
      const { orden, args, nombreUsado } = analizar(linea);
      const rng = DENDRO.prng.crear(estado.dia, "terminal", ++cuenta);
      const lat = cfg().texto.latenciaTerminal;
      const espera = (lat.minMs + (lat.maxMs - lat.minMs) * estado.intensidad) * (0.7 + 0.6 * rng());

      ocupada = true;
      refrescar();
      const completa = await esperar(espera);
      ocupada = false;
      cancelar = null;
      const desconocida = [L(T(`ORDEN DESCONOCIDA: ${linea.split(" ")[0]} · ESCRIBA `, "arma"), T("ayuda", "ambar"))];
      if (!completa) {
        consola.agregar(L(T("INTERRUMPIDO", "ambar")));
      } else if (!orden) {
        await imprimir(desconocida);
      } else if (!orden.oculto && !SIN_FALLOS.has(orden.nombre) && orden.nombre !== "credencial" && rng() < estado.intensidad * 0.25) {
        // El sistema degradado a veces no responde o responde basura (RF-07).
        if (rng() < 0.5) consola.agregar(L(T("TIEMPO DE ESPERA AGOTADO", "arma")));
        else consola.agregar(L(T(Array.from({ length: 36 }, () => BASURA[Math.floor(rng() * BASURA.length)]).join(""), "arma")));
      } else {
        const lineas = orden.ejecutar(args, estado, ctx, sesion, nombreUsado);
        if (sesion.limpiar) { sesion.limpiar = false; consola.limpiar(); }
        await imprimir(lineas === null ? desconocida : lineas);
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
        if (modoClave && ev.key === "Escape") {
          ev.preventDefault();
          modoClave = false;
          consola.reemplazarUltima([...PROMPT_CLAVE, { t: "CANCELADO", c: "textoTenue" }]);
          nuevoPrompt();
          return;
        }
        if (modoClave && (ev.key === "ArrowUp" || ev.key === "ArrowDown" || ev.key === "Tab")) { ev.preventDefault(); return; }
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
