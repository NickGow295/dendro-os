#!/usr/bin/env node
// Simula DENDRO.cronologia.calcularEstado día a día fuera del navegador.
// Uso: node .claude/skills/verificar-cronologia/scripts/simular.js [desde] [hasta]
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = process.cwd();
const archivos = [
  "config.js",
  "data/tierras.js",
  "data/colisiones.js",
  "data/eventos.js",
  "data/mensajes.js",
  "js/nucleo/prng.js",
  "js/nucleo/reloj.js",
  "js/nucleo/cronologia.js",
];

const contexto = {
  console,
  Math, Date, JSON, Intl,
  location: { search: "", href: "file:///index.html" },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
};
contexto.window = contexto;
contexto.self = contexto;
vm.createContext(contexto);

for (const rel of archivos) {
  const ruta = path.join(raiz, rel);
  if (!fs.existsSync(ruta)) {
    if (rel === "data/mensajes.js") continue; // opcional para esta prueba
    console.error(`Falta ${rel}. Ejecuta el script desde la raíz del proyecto.`);
    process.exit(2);
  }
  vm.runInContext(fs.readFileSync(ruta, "utf8"), contexto, { filename: rel });
}

const cron = contexto.DENDRO && contexto.DENDRO.cronologia;
if (!cron || typeof cron.calcularEstado !== "function") {
  console.error("No se encontró DENDRO.cronologia.calcularEstado(fecha).");
  process.exit(2);
}

const sumarDias = (iso, n) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const desde = process.argv[2] || "2026-10-18";
const hasta = process.argv[3] || "2026-12-31";
const cfg = contexto.DENDRO_CONFIG;
const final = cfg.cronologia.ramasAfectadasFinal;

const fallos = [];
const comprobar = (ok, msg) => { if (!ok) fallos.push(msg); };

console.log("fecha       fase          alerta    p      int    ramas        parejas");
let anterior = null;
for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
  const e = cron.calcularEstado(f);
  const e2 = cron.calcularEstado(f);
  comprobar(JSON.stringify(e) === JSON.stringify(e2), `${f}: no determinista`);

  const conteo = {};
  for (const par of e.parejas || []) conteo[par.estado] = (conteo[par.estado] || 0) + 1;
  const resumen = Object.entries(conteo).map(([k, v]) => `${k}:${v}`).join(" ");
  console.log(
    `${f}  ${String(e.fase + " " + e.nombreFase).padEnd(13)} ${String(e.nivelAlerta).padEnd(9)} ` +
    `${e.p.toFixed(3)}  ${e.intensidad.toFixed(2)}  ${String(e.ramasAfectadas).padStart(10)}   ${resumen}`
  );

  if (anterior) {
    comprobar(e.ramasAfectadas >= anterior.ramasAfectadas, `${f}: ramas afectadas disminuye`);
    comprobar(e.fase >= anterior.fase, `${f}: la fase retrocede`);
  }
  anterior = e;
}

const en = (f) => cron.calcularEstado(f);
const cr = cfg.cronologia;
comprobar(en(sumarDias(cr.inicioAlerta, -1)).fase === 0, "día previo al inicio no es fase 0");
comprobar(en(sumarDias(cr.inicioAlerta, -1)).ramasAfectadas === 0, "día previo al inicio con ramas > 0");
comprobar(en(cr.inicioAlerta).fase === 1, "inicio de alerta no es fase 1");
comprobar(en(cr.inicioAlerta).ramasAfectadas === 0, "inicio de alerta con ramas > 0");
comprobar(en(cr.primeraColision).ramasAfectadas === 2, "primera colisión no tiene exactamente 2 ramas");
const c01 = (en(cr.primeraColision).parejas || []).find((p) => p.id === "C-01");
comprobar(c01 && /CONTACTO/i.test(c01.estado), "C-01 no está en CONTACTO el día de la primera colisión");
comprobar(en(cr.colapsoTotal).fase === 5, "día del colapso no es fase 5");
comprobar(en(cr.colapsoTotal).ramasAfectadas === final, "día del colapso no alcanza ramasAfectadasFinal");
const hostiles = (en(cr.inicioAlerta).parejas || []).filter((p) => /hostil/.test(p.postura)).length;
comprobar(hostiles >= 4, `solo ${hostiles} parejas hostiles (mínimo 4)`);

console.log("");
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  for (const m of [...new Set(fallos)]) console.log("  - " + m);
  process.exit(1);
}
console.log("✓ Todas las comprobaciones pasan.");
