// Globos de alambre (RF-13): modelo procedural por tierra (en caché) y dibujo ortográfico.
// El modelo sale solo de la semilla hash(id) y de los parámetros de data/; la rotación, del reloj.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG.vectores;
  const PLACAS = 7;           // trozos en que se rompe un globo aniquilado
  const IMPACTOS = 14;        // posiciones posibles de daño por globo
  const PASOS_MERIDIANO = 24, PASOS_PARALELO = 48;
  const cache = new Map();

  function aVector(lon, lat) {
    const c = Math.cos(lat);
    return [c * Math.sin(lon), Math.sin(lat), c * Math.cos(lon)];
  }

  // ── Modelo ────────────────────────────────────────────────────────────────

  function campoDeMascara(mascara, W, H) {
    const valores = new Float32Array(W * H);
    for (let j = 0; j < H; j++) {
      const fila = mascara.filas[Math.min(mascara.alto - 1, Math.floor(((j + 0.5) / H) * mascara.alto))];
      for (let i = 0; i < W; i++) {
        const k = Math.min(mascara.ancho - 1, Math.floor(((i + 0.5) / W) * mascara.ancho));
        valores[j * W + i] = fila[k] === "#" ? 1 : 0;
      }
    }
    return { valores, umbral: 0.5 };
  }

  function campoDeRuido(ruido, desplazamiento, params, W, H) {
    const g = cfg().globo;
    const valores = new Float32Array(W * H);
    const escala = 1.4 * (params.rugosidad || 1);
    for (let j = 0; j < H; j++) {
      const lat = Math.PI / 2 - ((j + 0.5) / H) * Math.PI;
      for (let i = 0; i < W; i++) {
        const p = aVector(((i + 0.5) / W) * Math.PI * 2 - Math.PI, lat);
        valores[j * W + i] = ruido.fbm(
          p[0] * escala + desplazamiento[0], p[1] * escala + desplazamiento[1], p[2] * escala + desplazamiento[2], g.octavas);
      }
    }
    const orden = Float32Array.from(valores).sort();
    const mar = params.mar === undefined ? g.nivelMarPorDefecto : params.mar;
    return { valores, umbral: orden[Math.min(orden.length - 1, Math.floor(mar * orden.length))] };
  }

  function muestrear(campo, W, H, lon, lat) {
    const x = ((lon + Math.PI) / (Math.PI * 2)) * W - 0.5;
    const y = Math.max(0, Math.min(H - 1.001, ((Math.PI / 2 - lat) / Math.PI) * H - 0.5));
    const i0 = Math.floor(x), j0 = Math.floor(y), fx = x - i0, fy = y - j0;
    const a = (i, j) => campo[j * W + (((i % W) + W) % W)];
    const arriba = a(i0, j0) * (1 - fx) + a(i0 + 1, j0) * fx;
    const abajo = a(i0, j0 + 1) * (1 - fx) + a(i0 + 1, j0 + 1) * fx;
    return arriba * (1 - fy) + abajo * fy;
  }

  // Marching squares con la longitud cerrada sobre sí misma; devuelve segmentos 3D.
  function costas(campo, umbral, W, H) {
    const segs = [];
    const f = (i, j) => campo[j * W + (i % W)] - umbral;
    const aPunto = (x, y) => aVector(((x + 0.5) / W) * Math.PI * 2 - Math.PI, Math.PI / 2 - ((y + 0.5) / H) * Math.PI);
    const corte = (p, q) => p / (p - q);
    for (let j = 0; j < H - 1; j++) {
      for (let i = 0; i < W; i++) {
        const a = f(i, j), b = f(i + 1, j), c = f(i + 1, j + 1), d = f(i, j + 1);
        const caso = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
        if (caso === 0 || caso === 15) continue;
        const arriba = () => [i + corte(a, b), j];
        const derecha = () => [i + 1, j + corte(b, c)];
        const abajo = () => [i + corte(d, c), j + 1];
        const izquierda = () => [i, j + corte(a, d)];
        const pares = {
          1: [[izquierda, abajo]], 2: [[abajo, derecha]], 3: [[izquierda, derecha]], 4: [[arriba, derecha]],
          5: [[izquierda, arriba], [abajo, derecha]], 6: [[arriba, abajo]], 7: [[izquierda, arriba]],
          8: [[izquierda, arriba]], 9: [[arriba, abajo]], 10: [[arriba, derecha], [izquierda, abajo]],
          11: [[arriba, derecha]], 12: [[izquierda, derecha]], 13: [[abajo, derecha]], 14: [[izquierda, abajo]],
        }[caso];
        for (const [p, q] of pares) {
          const [x1, y1] = p(), [x2, y2] = q();
          segs.push(...aPunto(x1, y1), ...aPunto(x2, y2));
        }
      }
    }
    return Float32Array.from(segs);
  }

  function reducir(campo, W, H) {
    const w = W / 2, h = H / 2, salida = new Float32Array(w * h);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        salida[j * w + i] = (campo[2 * j * W + 2 * i] + campo[2 * j * W + 2 * i + 1] +
          campo[(2 * j + 1) * W + 2 * i] + campo[(2 * j + 1) * W + 2 * i + 1]) / 4;
      }
    }
    return salida;
  }

  function placaDe(centros, x, y, z) {
    let mejor = 0, max = -2;
    for (let k = 0; k < centros.length; k++) {
      const d = centros[k][0] * x + centros[k][1] * y + centros[k][2] * z;
      if (d > max) { max = d; mejor = k; }
    }
    return mejor;
  }

  function reticula() {
    const g = cfg().globo, lineas = [];
    for (let k = 0; k < g.meridianos; k++) {
      const lon = (k / g.meridianos) * Math.PI * 2, l = [];
      for (let s = 0; s <= PASOS_MERIDIANO; s++) l.push(...aVector(lon, -Math.PI / 2 + (s / PASOS_MERIDIANO) * Math.PI));
      lineas.push(Float32Array.from(l));
    }
    for (let k = 0; k < g.paralelos; k++) {
      const lat = -Math.PI / 2 + (Math.PI * (k + 1)) / (g.paralelos + 1), l = [];
      for (let s = 0; s <= PASOS_PARALELO; s++) l.push(...aVector((s / PASOS_PARALELO) * Math.PI * 2, lat));
      lineas.push(Float32Array.from(l));
    }
    return lineas;
  }

  function construir(clave, params) {
    const g = cfg().globo;
    const [W, H] = g.resolucion;
    const semilla = DENDRO.prng.hash(clave);
    const rng = DENDRO.prng.mulberry32(semilla ^ 0x9e3779b9);
    const ruido = DENDRO.ruido.crear(semilla);
    const desplazamiento = [rng() * 50, rng() * 50, rng() * 50];
    const mascara = params.mascara && window.DENDRO_MASCARAS && window.DENDRO_MASCARAS[params.mascara];
    const { valores, umbral } = mascara ? campoDeMascara(mascara, W, H) : campoDeRuido(ruido, desplazamiento, params, W, H);

    const centros = [];
    for (let k = 0; k < PLACAS; k++) centros.push(aVector(rng() * Math.PI * 2 - Math.PI, Math.asin(rng() * 2 - 1)));

    const conPlacas = (segs) => {
      const placas = new Uint8Array(segs.length / 6);
      for (let s = 0; s < placas.length; s++) placas[s] = placaDe(centros, segs[s * 6], segs[s * 6 + 1], segs[s * 6 + 2]);
      return { segs, placas };
    };

    // Trama de tierra: espiral de Fibonacci filtrada por el campo.
    const trama = [], placasTrama = [];
    for (let k = 0; k < g.puntos; k++) {
      const y = 1 - ((k + 0.5) / g.puntos) * 2, radio = Math.sqrt(1 - y * y), th = k * 2.399963229728653;
      const x = Math.cos(th) * radio, z = Math.sin(th) * radio;
      if (muestrear(valores, W, H, Math.atan2(x, z), Math.asin(y)) > umbral) {
        trama.push(x, y, z);
        placasTrama.push(placaDe(centros, x, y, z));
      }
    }

    const impactos = [];
    for (let k = 0; k < IMPACTOS; k++) impactos.push(aVector(rng() * Math.PI * 2 - Math.PI, Math.asin(rng() * 1.6 - 0.8)));

    return {
      costas: conPlacas(costas(valores, umbral, W, H)),
      costasBajas: conPlacas(costas(reducir(valores, W, H), umbral, W / 2, H / 2)),
      trama: Float32Array.from(trama), placasTrama: Uint8Array.from(placasTrama),
      reticula: reticula(), centros, impactos, ruido,
      desfase: rng() * Math.PI * 2,
      inestable: !!params.inestable,
    };
  }

  function modelo(clave, params) {
    params = params || {};
    const llave = clave + "|" + (params.mascara || "") + "|" + (params.mar || "") + "|" + (params.rugosidad || "");
    let m = cache.get(llave);
    if (!m) { m = construir(clave, params); cache.set(llave, m); }
    return m;
  }

  // ── Dibujo ────────────────────────────────────────────────────────────────

  function dibujar(v, cx, cy, r, tierra, o) {
    const clave = typeof tierra === "string" ? tierra : tierra.id;
    const params = (typeof tierra === "object" && tierra.globo) || {};
    const m = modelo(clave, params);
    const g = cfg().globo;
    const R = r * v.unidad, CX = v.px(cx), CY = v.py(cy);
    const t = v.ahora() / 1000;
    const ang = m.desfase + (t * g.gradosPorSegundo * Math.PI) / 180;
    const incl = (g.inclinacion * Math.PI) / 180;
    const ca = Math.cos(ang), sa = Math.sin(ang), ci = Math.cos(incl), si = Math.sin(incl);
    const alfa = o.alfa === undefined ? 1 : o.alfa;
    const frag = o.fragmentacion || 0;
    const grosor = cfg().grosorLinea * v.escala;
    const inestable = m.inestable || o.inestable;
    const p = { x: 0, y: 0, z: 0 };

    function proyectar(x, y, z) {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      p.y = y * ci - z1 * si;
      p.z = y * si + z1 * ci;
      p.x = x1;
      if (inestable) {
        const k = 1 + 0.07 * m.ruido.ruido(x * 2.2 + t * 0.5, y * 2.2, z * 2.2);
        p.x *= k; p.y *= k;
      }
      return p;
    }

    v.recortado((c) => {
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = c.fillStyle = v.color("tierra");

      if (o.halo) {
        const pulso = 0.5 + 0.5 * Math.sin(t * 3);
        c.lineWidth = grosor;
        c.globalAlpha = alfa * o.halo * (0.25 + 0.4 * pulso);
        c.beginPath(); c.arc(CX, CY, R * (1.1 + 0.05 * pulso), 0, Math.PI * 2); c.stroke();
        c.setLineDash([3 * v.escala, 5 * v.escala]);
        c.globalAlpha = alfa * o.halo * 0.25;
        c.beginPath(); c.arc(CX, CY, R * (1.24 + 0.05 * pulso), 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
      }

      const pasadas = frag > 0 ? PLACAS : 1;
      const lineas = R < 45 * v.escala ? m.costasBajas : m.costas;
      const fraccion = Math.min(1, Math.pow(R / (170 * v.escala), 2));
      const salto = Math.max(1, Math.min(24, Math.round(1 / Math.max(fraccion, 0.04))));
      const tamPunto = Math.max(1, Math.round(v.escala * 1.1));

      for (let placa = 0; placa < pasadas; placa++) {
        const filtrar = frag > 0;
        let dx = 0, dy = 0;
        if (filtrar) {
          const cpl = m.centros[placa];
          const q = proyectar(cpl[0], cpl[1], cpl[2]);
          dx = q.x * R * 0.9 * frag;
          dy = -q.y * R * 0.9 * frag + R * 0.25 * frag * frag;
        }
        const alfaPlaca = alfa * (1 - frag);
        if (alfaPlaca <= 0.01) continue;
        c.save();
        c.translate(CX + dx, CY + dy);

        if (!filtrar) {
          // Limbo y retícula.
          c.lineWidth = grosor;
          c.globalAlpha = alfaPlaca;
          c.beginPath();
          if (inestable) {
            for (let s = 0; s <= 72; s++) {
              const a = (s / 72) * Math.PI * 2;
              const k = 1 + 0.07 * m.ruido.ruido(Math.cos(a) * 2 + t * 0.5, Math.sin(a) * 2, 0.5);
              const x = Math.cos(a) * R * k, y = Math.sin(a) * R * k;
              if (s === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
          } else c.arc(0, 0, R, 0, Math.PI * 2);
          c.stroke();

          c.globalAlpha = alfaPlaca * 0.28;
          c.beginPath();
          for (const l of m.reticula) {
            let antes = false;
            for (let s = 0; s < l.length; s += 3) {
              const q = proyectar(l[s], l[s + 1], l[s + 2]);
              if (q.z > 0) {
                if (antes) c.lineTo(q.x * R, -q.y * R); else c.moveTo(q.x * R, -q.y * R);
                antes = true;
              } else antes = false;
            }
          }
          c.stroke();
        }

        // Costas.
        c.globalAlpha = alfaPlaca;
        c.lineWidth = grosor;
        c.beginPath();
        const segs = lineas.segs;
        for (let s = 0; s < lineas.placas.length; s++) {
          if (filtrar && lineas.placas[s] !== placa) continue;
          const k = s * 6;
          const a = proyectar(segs[k], segs[k + 1], segs[k + 2]);
          if (a.z <= 0) continue;
          const ax = a.x * R, ay = -a.y * R;
          const b = proyectar(segs[k + 3], segs[k + 4], segs[k + 5]);
          if (b.z <= 0) continue;
          c.moveTo(ax, ay);
          c.lineTo(b.x * R, -b.y * R);
        }
        c.stroke();

        // Trama de tierra, más tenue hacia el limbo.
        const tr = m.trama;
        for (const [minZ, maxZ, brillo] of [[0, 0.45, 0.35], [0.45, 2, 0.8]]) {
          c.globalAlpha = alfaPlaca * brillo;
          c.beginPath();
          for (let s = 0; s < tr.length / 3; s += salto) {
            if (filtrar && m.placasTrama[s] !== placa) continue;
            const q = proyectar(tr[s * 3], tr[s * 3 + 1], tr[s * 3 + 2]);
            if (q.z <= minZ || q.z > maxZ) continue;
            c.rect(q.x * R - tamPunto / 2, -q.y * R - tamPunto / 2, tamPunto, tamPunto);
          }
          c.fill();
        }
        c.restore();
      }

      // Impactos en rojo.
      if (o.danos > 0 && frag < 1) {
        const n = Math.ceil(o.danos * IMPACTOS);
        c.strokeStyle = v.color("arma");
        c.lineWidth = grosor;
        for (let k = 0; k < n; k++) {
          const im = m.impactos[k];
          const q = proyectar(im[0], im[1], im[2]);
          if (q.z <= 0.05) continue;
          const x = CX + q.x * R, y = CY - q.y * R, rad = R * 0.07 * (0.6 + 0.4 * q.z);
          c.globalAlpha = alfa * (1 - frag) * (0.6 + 0.4 * Math.sin(t * 9 + k * 1.7));
          c.beginPath();
          c.arc(x, y, rad, 0, Math.PI * 2);
          c.moveTo(x - rad * 1.6, y); c.lineTo(x + rad * 1.6, y);
          c.moveTo(x, y - rad * 1.6); c.lineTo(x, y + rad * 1.6);
          c.stroke();
        }
      }
    });

    if (o.fusion && o.fusion.tierra) {
      dibujar(v, cx, cy, r, o.fusion.tierra, { alfa: alfa * (o.fusion.mezcla === undefined ? 0.6 : o.fusion.mezcla) });
    }
  }

  DENDRO.globo = { modelo, dibujar };
})(window.DENDRO = window.DENDRO || {});
