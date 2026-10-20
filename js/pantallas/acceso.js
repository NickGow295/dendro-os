// Pantalla de acceso (RF-03): pide un ID de operador (cualquier texto, sin contraseña real),
// lo recuerda en el navegador y lo anuncia al conectar.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const CLAVE = "dendro.operador";
  const MAXIMO = 12;
  const filtrar = (t) => t.toLocaleUpperCase("es").replace(/[^A-Z0-9Ñ-]/g, "");

  function leer() {
    try { return localStorage.getItem(CLAVE) || ""; } catch (_) { return ""; }
  }
  function guardar(id) {
    try { localStorage.setItem(CLAVE, id); } catch (_) { /* sin almacenamiento: vale solo esta sesión */ }
  }

  const esTactil = () => window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  function crear({ alTerminar }) {
    const P = DENDRO.pantalla;
    const anterior = leer();
    let valor = anterior, error = "", conectando = false, campo = null, caja = null, escritor = null;
    const consola = DENDRO.escritor.crearConsola(() => caja.region(2, 12, caja.ancho - 4, caja.alto - 12));

    function dibujar() {
      const a = cfg().agencia;
      const r = P.raiz();
      r.limpiar();
      const ancho = Math.min(60, r.ancho - 4), alto = Math.min(18, r.alto - 2);
      caja = r.caja(Math.floor((r.ancho - ancho) / 2), Math.floor((r.alto - alto) / 2), ancho, alto, { titulo: "CONTROL DE ACCESO" });
      caja.centrar(1, `${a.sistema} v${a.version} · ${a.sede.toLocaleUpperCase("es")}`, "ambar");
      caja.centrar(2, a.terminal, "textoTenue");
      caja.rellenar(2, 3, caja.ancho - 4, 1, "─", "ambarTenue");
      caja.escribir(2, 5, "IDENTIFÍQUESE, OPERADOR.", "texto");

      const etiqueta = "ID DE OPERADOR ";
      caja.escribir(2, 7, etiqueta, "textoTenue");
      const x0 = 2 + P.largo(etiqueta);
      caja.escribir(x0, 7, "[", "ambar");
      caja.escribir(x0 + 1, 7, valor.padEnd(MAXIMO, "_"), "texto");
      caja.escribir(x0 + 1 + MAXIMO, 7, "]", "ambar");
      campo = { x: caja.x + x0 + 1 + Math.min(valor.length, MAXIMO - 1), y: caja.y + 7 };
      if (!conectando) P.ponerCursor(campo.x, campo.y); else P.ocultarCursor();

      caja.escribir(2, 9, esTactil() ? "TOQUE AQUÍ PARA ESCRIBIR · ↵ CONFIRMA" : "ENTER CONFIRMA · A-Z, 0-9 Y GUION", "textoTenue");
      if (anterior) caja.escribir(2, 10, `ÚLTIMA SESIÓN: ${anterior}`, "textoTenue");
      if (error) caja.escribir(2, 11, error, "arma");
      if (escritor) consola.dibujar();
    }

    async function confirmar() {
      if (conectando) return;
      if (!valor) {
        error = "INTRODUZCA UN ID";
        DENDRO.sonido.beep(220);
        dibujar();
        return;
      }
      conectando = true;
      error = "";
      DENDRO.teclado.soltar();
      DENDRO.sonido.beep(880);
      guardar(valor);
      DENDRO.local.registrar("SISTEMA", `OPERADOR ${valor} CONECTADO`);
      dibujar();
      escritor = DENDRO.escritor.crearEscritor(consola);
      try {
        await escritor.linea([{ t: "VERIFICANDO CREDENCIAL " }, { relleno: ".", c: "ambarTenue" }]);
        await escritor.esperar(600);
        consola.anexar({ t: " OK", c: "exito" });
        await escritor.linea([{ t: `OPERADOR ${valor} CONECTADO`, c: "exito" }], { pausa: 800 });
        alTerminar(valor);
      } catch (err) {
        if (err !== DENDRO.escritor.CANCELADO) throw err;
      }
    }

    return {
      iniciar() {
        DENDRO.teclado.pedirTexto({
          valor, maximo: MAXIMO, filtro: filtrar,
          alCambiar(v) {
            if (v === valor) return;
            valor = v;
            error = "";
            DENDRO.sonido.tecla();
            dibujar();
          },
        });
      },
      dibujar,
      tecla(ev) {
        if (conectando) return;
        if (ev.key === "Enter") { ev.preventDefault(); confirmar(); return; }
        DENDRO.teclado.recoger(ev);
      },
      toque() {
        if (!conectando) DENDRO.teclado.enfocar();
      },
      detener() {
        DENDRO.teclado.soltar();
        if (escritor) escritor.cancelar();
      },
    };
  }

  DENDRO.acceso = { crear, operador: leer };
})(window.DENDRO = window.DENDRO || {});
