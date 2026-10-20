#!/usr/bin/env node
// Simula DENDRO.cronologia.calcularEstado(instante) fuera del navegador y comprueba los criterios.
// Uso: node .claude/skills/verificar-cronologia/scripts/simular.js [desde] [hasta] [pasoHoras]
//   desde / hasta: "AAAA-MM-DD" o "AAAA-MM-DDThh:mm" (hora local de config). pasoHoras: 24 por defecto
//   para la tabla; las comprobaciones de monotonía van siempre hora a hora.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = process.cwd();
const archivos = [
  "config.js",
  "data/myth.js",
  "data/tierras.js",
  "data/generacion.js",
  "data/colisiones.js",
  "data/eventos.js",
  "data/mensajes.js",
  "js/nucleo/prng.js",
  "js/nucleo/reloj.js",
  "js/nucleo/tau.js",
  "js/nucleo/multiverso.js",
  "js/nucleo/cronologia.js",
];

function crearContexto() {
const contexto = {
  console,
  Math, Date, JSON, Intl,
  location: { search: "", href: "file:///index.html" },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  setTimeout, clearTimeout,
};
contexto.window = contexto;
contexto.self = contexto;
vm.createContext(contexto);
for (const rel of archivos) {
  const ruta = path.join(raiz, rel);
  if (!fs.existsSync(ruta)) {
    console.error(`Falta ${rel}. Ejecuta el script desde la raíz del proyecto.`);
    process.exit(2);
  }
  vm.runInContext(fs.readFileSync(ruta, "utf8"), contexto, { filename: rel });
}
return contexto;
}
const contexto = crearContexto();

const D = contexto.DENDRO;
const cron = D && D.cronologia;
if (!cron || typeof cron.calcularEstado !== "function") {
  console.error("No se encontró DENDRO.cronologia.calcularEstado(instante).");
  process.exit(2);
}

const HORA = 3600000;
const cfg = contexto.DENDRO_CONFIG;
const cr = cfg.cronologia;
const final = cr.ramasAfectadasFinal;
const ms = (x) => D.reloj.aInstante(x);
const en = (x) => cron.calcularEstado(x);
const local = (t) => { const p = D.reloj.partesEn(t); return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`; };
const enColision = (e) => e.enColision;

const desde = ms(process.argv[2] || "2026-10-18");
const hasta = ms(process.argv[3] || "2026-12-31");
const pasoTabla = Number(process.argv[4] || 24) * HORA;

const fallos = [];
const comprobar = (ok, msg) => { if (!ok) fallos.push(msg); };

console.log("instante          τ          fase          alerta    p      int    ramas       en col.  N̂     parejas");
let anterior = null;
for (let t = desde; t <= hasta; t += HORA) {
  const e = en(t);
  if (anterior) {
    comprobar(e.ramasAfectadas >= anterior.ramasAfectadas, `${local(t)}: ramas afectadas disminuye`);
    comprobar(e.fase >= anterior.fase, `${local(t)}: la fase retrocede`);
    comprobar(enColision(e) >= enColision(anterior), `${local(t)}: ramas en colisión disminuye`);
    comprobar(e.myth.cohesion <= anterior.myth.cohesion, `${local(t)}: la cohesión N̂ crece`);
  }
  anterior = e;
  if ((t - desde) % pasoTabla) continue;
  comprobar(JSON.stringify(e) === JSON.stringify(en(t)), `${local(t)}: no determinista`);
  const conteo = {};
  for (const par of e.parejas || []) conteo[par.estado] = (conteo[par.estado] || 0) + 1;
  const resumen = Object.entries(conteo).map(([k, v]) => `${k}:${v}`).join(" ");
  console.log(
    `${local(t)}  ${D.tau.corto(t).padEnd(9)}  ${String(e.fase + " " + e.nombreFase).padEnd(13)} ${String(e.nivelAlerta).padEnd(9)} ` +
    `${e.p.toFixed(3)}  ${e.intensidad.toFixed(2)}  ${String(e.ramasAfectadas).padStart(10)}  ${String(e.enColision).padStart(5)}  ${e.myth.cohesion.toFixed(3)}  ${resumen}`
  );
}

// Criterios de 01-requisitos.md §5 y fechas clave
const c01 = (x) => en(x).parejas.find((p) => p.id === "C-01");
comprobar(en("2026-10-19T12:00").fase === 0 && en("2026-10-19T12:00").ramasAfectadas === 0, "10-19: no es nominal con 0 ramas");
comprobar(en(cr.inicioAlerta).fase === 1 && en(cr.inicioAlerta).ramasAfectadas === 0, "inicio de alerta: no es fase 1 con 0 ramas");
comprobar(en("2026-10-27T03:16").ramasAfectadas === 0 && c01("2026-10-27T03:16").estado === "APROXIMACIÓN", "10-27 03:16: ya hay colisión");
comprobar(en(cr.primeraColision).ramasAfectadas === 2 && c01(cr.primeraColision).estado === "CONTACTO", "primera colisión: no hay exactamente 2 ramas con C-01 en CONTACTO");
comprobar(en("2026-10-27T12:00").ramasAfectadas === 2 && enColision(en("2026-10-27T12:00")) === 2, "10-27 12:00: no hay exactamente 2 ramas en colisión");
comprobar(en("2026-12-16T13:59").fase === 4 && en("2026-12-16T13:59").rectaFinal, "12-16 13:59: no es recta final");
comprobar(en(cr.colapsoTotal).fase === 5 && en(cr.colapsoTotal).ramasAfectadas === final, "colapso: no es fase 5 con ramasAfectadasFinal");
comprobar(en("2026-12-25T12:00").fase === 5, "12-25: no es colapso");
comprobar(en(cr.inicioRectaFinal).intensidad === cfg.efectos.glitchMaximo, "recta final: la intensidad no es máxima");
const hostiles = en(cr.inicioAlerta).parejas.filter((p) => p.nombrada && /hostil/.test(p.postura)).length;
comprobar(hostiles >= 4, `solo ${hostiles} parejas hostiles (mínimo 4)`);
comprobar(en("2026-10-25T12:00").ataques.some((a) => a.desde === "MYTH·4K·7A2·T3" && a.hacia === "MYTH·4K·7A2·R9"), "10-25: Ostrakh no ataca a Velmora");
comprobar(D.tau.corto(ms(cr.inicioAlerta)) === "7525.000", `τ del inicio de alerta: ${D.tau.corto(ms(cr.inicioAlerta))}`);
comprobar(D.tau.corto(ms(cr.colapsoTotal)) === "7582.583", `τ del colapso: ${D.tau.corto(ms(cr.colapsoTotal))}`);

// Catálogo y cadena (02-diseno.md §4.4–4.6)
const mv = cfg.multiverso, cat = D.multiverso.catalogo();
const huella = (c) => c.nodos.map((n) => n.codigo + n.omega).join() + c.parejas.map((p) => p.id + p.a + p.b + p.contacto).join();
comprobar(cat.total >= mv.ramasMin && cat.total <= mv.ramasMax, `catálogo: ${cat.total} ramas fuera de [${mv.ramasMin}, ${mv.ramasMax}]`);
comprobar(huella(crearContexto().DENDRO.multiverso.catalogo()) === huella(cat), "catálogo: otra carga da otro catálogo");
const enContacto = en("2026-10-27T12:00").parejas.filter((p) => ["CONTACTO", "HOSTILIDADES", "INTERFERENCIA"].includes(p.estado)).map((p) => p.id);
comprobar(enContacto.join() === "C-01", `10-27: en contacto ${enContacto.join()} (solo C-01)`);
comprobar(en("2026-12-09T00:00").myth.cohesion > 0.6 && en("2026-12-10T00:00").myth.cohesion < 0.6, "N̂ no cruza 0.60 el 12-09");
comprobar(en(cr.colapsoTotal).myth.cohesion === 0, "N̂ no es 0 en el colapso");
const ultimas = cat.parejas.filter((p) => p.contacto >= ms(cr.colapsoTotal) - 14 * HORA).length;
comprobar(ultimas >= 50 && ultimas <= 70, `${ultimas} contactos en las últimas 14 horas (≈60)`);
console.log(`
catálogo: ${cat.total} ramas · ${cat.parejas.length} parejas generadas · ${ultimas} en las últimas 14 h`);

// Ninguna fecha de nuestro calendario en los textos que llegan a pantalla.
const FECHA = /20\d\d-\d\d|\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i;
for (const x of ["2026-10-27T12:00", "2026-12-15T23:00"]) {
  const e = en(x);
  const textos = [...e.registro.map((r) => r.texto), ...e.mensajesDisponibles.flatMap((m) => [m.asunto, m.de, ...m.cuerpo]),
    ...e.archivo.flatMap((d) => [d.titulo, ...d.texto])];
  const conFecha = textos.filter((s) => FECHA.test(s));
  comprobar(!conFecha.length, `${x}: textos con fecha de calendario: ${conFecha.slice(0, 3).join(" | ")}`);
}

const inicio = Date.now();
for (let i = 0; i < 20; i++) en(ms("2026-12-12T12:00") + i * 60000);
const medio = (Date.now() - inicio) / 20;
console.log(`\ncalcularEstado: ${medio.toFixed(1)} ms de media`);

console.log("");
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  for (const m of [...new Set(fallos)].slice(0, 30)) console.log("  - " + m);
  process.exit(1);
}
console.log("✓ Todas las comprobaciones pasan.");
