// Encendido y apagado del tubo (RF-11). Anima los parámetros del haz que leen
// el shader (DENDRO.crt.tubo) o, en el respaldo CSS, la transformación del tubo.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;
  const e = { raiz: null, tubo: null, haz: null, estado: "apagado", reducido: false, cuadro: 0, oyentes: [] };

  const limitar = (x) => Math.max(0, Math.min(1, x));
  const tramo = (t, a, b) => limitar((t - a) / (b - a));
  const suave = (t) => t * t * (3 - 2 * t);
  const mezclar = (a, b, t) => a + (b - a) * t;

  // punto → línea horizontal → apertura vertical → calentamiento del fósforo
  function curvaEncendido(t) {
    if (e.reducido) return { sx: 1, sy: 1, haz: 0, calor: suave(t), ondulacion: 0 };
    const punto = tramo(t, 0, 0.12), linea = tramo(t, 0.12, 0.34);
    const abre = tramo(t, 0.34, 0.56), calienta = tramo(t, 0.56, 1);
    return {
      sx: t < 0.12 ? mezclar(0, 0.025, suave(punto)) : mezclar(0.025, 1, suave(linea)),
      sy: mezclar(0.004, 1, suave(abre)),
      haz: 1.6 * punto * (1 - 0.45 * abre) * (1 - calienta),
      calor: 0.3 * abre + 0.7 * Math.pow(calienta, 1.6),
      ondulacion: 0.004 * abre * (1 - calienta),
    };
  }

  // imagen → línea → punto; luego el punto se apaga despacio (resplandor residual)
  function curvaApagado(t, resplandor) {
    if (e.reducido) return { sx: 1, sy: 1, haz: 0, calor: 1 - suave(t), ondulacion: 0 };
    if (resplandor === undefined) {
      const v = tramo(t, 0, 0.5), h = tramo(t, 0.5, 1);
      return {
        sx: mezclar(1, 0.02, suave(h)),
        sy: mezclar(1, 0.004, suave(v)),
        haz: 1.4 * v,
        calor: (1 + 0.6 * v) * (1 - h),
        ondulacion: 0,
      };
    }
    return { sx: mezclar(0.02, 0.006, resplandor), sy: 0.004, haz: 1.4 * Math.exp(-4.5 * resplandor) * (1 - resplandor), calor: 0, ondulacion: 0 };
  }

  function aplicar(v) {
    Object.assign(DENDRO.crt.tubo, v);
    if (DENDRO.crt.activo()) return;
    // Respaldo CSS
    e.tubo.style.transform = `scale(${Math.max(v.sx, 0.0001)}, ${Math.max(v.sy, 0.0001)})`;
    e.tubo.style.filter = `brightness(${(v.calor + v.haz).toFixed(3)})`;
    e.haz.style.opacity = Math.min(1, v.haz).toFixed(3);
    e.haz.style.transform = `translate(-50%, -50%) scale(${Math.max(v.sx, 0.01)}, 1)`;
  }

  function animar(duracion, curva) {
    cancelAnimationFrame(e.cuadro);
    return new Promise((ok) => {
      const inicio = performance.now();
      const paso = (ahora) => {
        const t = limitar((ahora - inicio) / duracion);
        aplicar(curva(t));
        if (t < 1) e.cuadro = requestAnimationFrame(paso);
        else ok();
      };
      e.cuadro = requestAnimationFrame(paso);
    });
  }

  function cambiar(estado) {
    e.estado = estado;
    e.raiz.dataset.estado = estado;
    for (const fn of e.oyentes) fn(estado);
  }

  async function encender() {
    if (e.estado !== "apagado") return;
    cambiar("encendiendo");
    const ef = cfg().efectos;
    await animar(e.reducido ? 300 : ef.encendido.duracionMs, curvaEncendido);
    aplicar({ sx: 1, sy: 1, haz: 0, calor: 1, ondulacion: 0 });
    cambiar("encendido");
  }

  async function apagar() {
    if (e.estado !== "encendido") return;
    cambiar("apagando");
    const ef = cfg().efectos;
    await animar(e.reducido ? 300 : ef.apagado.duracionMs, (t) => curvaApagado(t));
    if (!e.reducido) await animar(ef.apagado.resplandorMs, (t) => curvaApagado(1, t));
    aplicar({ sx: 0, sy: 0, haz: 0, calor: 0, ondulacion: 0 });
    cambiar("apagado");
  }

  function iniciar({ raiz, tubo, haz, reducido }) {
    e.raiz = raiz; e.tubo = tubo; e.haz = haz; e.reducido = !!reducido;
    aplicar({ sx: 0, sy: 0, haz: 0, calor: 0, ondulacion: 0 });
    cambiar("apagado");
  }

  DENDRO.monitor = {
    iniciar, encender, apagar,
    estado: () => e.estado,
    alCambiar: (fn) => e.oyentes.push(fn),
  };
})(window.DENDRO = window.DENDRO || {});
