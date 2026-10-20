// Tubo CRT en WebGL (RF-12): dos pasadas sobre la imagen de la rejilla.
//  1. Fósforo: mezcla la imagen nueva con la anterior atenuada (persistencia).
//  2. Tubo: curvatura de barril, aberración en los bordes, resplandor, scanlines,
//     máscara RGB, ruido, parpadeo, banda rodante, viñeta, reflejo y haz de encendido.
// Si WebGL no está disponible, activo() devuelve false y manda el respaldo CSS.
(function (DENDRO) {
  "use strict";

  const cfg = () => window.DENDRO_CONFIG;

  const VERTICES = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const PRECISION = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif`;

  const FOSFORO = PRECISION + `
    uniform sampler2D uFuente;
    uniform sampler2D uPrevio;
    uniform float uDecaimiento;
    varying vec2 vUv;
    void main() {
      vec3 actual = texture2D(uFuente, vUv).rgb;
      // El -1.5/255 evita que el redondeo a 8 bits deje fantasmas eternos.
      vec3 previo = max(texture2D(uPrevio, vUv).rgb * uDecaimiento - 1.5 / 255.0, 0.0);
      gl_FragColor = vec4(max(actual, previo), 1.0);
    }`;

  const TUBO = PRECISION + `
    uniform sampler2D uImagen;
    uniform vec2 uTexel;
    uniform vec2 uResolucion;
    uniform float uTiempo, uTiempoRuido;
    uniform float uCurvatura, uAberracion, uRuido, uParpadeo, uBanda, uResplandor;
    uniform float uScanlines, uFilasScan, uMascara, uVineta, uReflejo;
    uniform vec2 uEscala;
    uniform float uHaz, uCalor, uOndulacion;
    uniform vec3 uColorFondo, uColorHaz;
    varying vec2 vUv;

    float azar(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    vec2 curvar(vec2 uv) {
      vec2 c = uv * 2.0 - 1.0;
      c *= (1.0 + uCurvatura * dot(c, c)) / (1.0 + uCurvatura);
      return c * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = curvar(vUv);
      vec2 dentro = step(vec2(0.0), uv) * step(uv, vec2(1.0));
      vec2 distBorde = min(uv, 1.0 - uv) * uResolucion;
      float vidrio = dentro.x * dentro.y * clamp(min(distBorde.x, distBorde.y) / 2.5, 0.0, 1.0);

      // Encendido / apagado: la imagen se comprime hacia el centro.
      vec2 c = uv - 0.5;
      c.x += sin(uv.y * 38.0 + uTiempo * 24.0) * uOndulacion;
      vec2 q = c / max(uEscala, vec2(0.0001)) + 0.5;
      float visible = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);

      vec2 dc = q - 0.5;
      vec2 desvio = dc * uAberracion * dot(dc, dc) * 4.0;
      vec3 color;
      color.r = texture2D(uImagen, q + desvio).r;
      color.g = texture2D(uImagen, q).g;
      color.b = texture2D(uImagen, q - desvio).b;

      // Resplandor del fósforo: 8 muestras bilineales en dos radios.
      vec2 a = uTexel * 1.5, b = uTexel * 4.0;
      vec3 halo = texture2D(uImagen, q + vec2(a.x, a.y)).rgb + texture2D(uImagen, q + vec2(-a.x, a.y)).rgb
                + texture2D(uImagen, q + vec2(a.x, -a.y)).rgb + texture2D(uImagen, q + vec2(-a.x, -a.y)).rgb;
      vec3 haloAncho = texture2D(uImagen, q + vec2(b.x, 0.0)).rgb + texture2D(uImagen, q - vec2(b.x, 0.0)).rgb
                     + texture2D(uImagen, q + vec2(0.0, b.y)).rgb + texture2D(uImagen, q - vec2(0.0, b.y)).rgb;
      color += (halo * 0.16 + haloAncho * 0.09) * uResplandor;
      color *= visible * uCalor;

      // Scanlines que siguen la curvatura y máscara de apertura.
      float s = 0.5 + 0.5 * cos(uv.y * uFilasScan * 6.2831853);
      color *= (1.0 - uScanlines * (1.0 - s)) * (1.0 + uScanlines * 0.4);
      if (uMascara > 0.0) {
        float m = mod(floor(gl_FragCoord.x), 3.0);
        vec3 tri = vec3(m < 0.5 ? 1.0 : 1.0 - uMascara, (m > 0.5 && m < 1.5) ? 1.0 : 1.0 - uMascara, m > 1.5 ? 1.0 : 1.0 - uMascara);
        color *= tri * (1.0 + uMascara * 0.5);
      }

      // Banda de interferencia que sube despacio y parpadeo de la fuente.
      float y = fract(uv.y * 0.6 - uTiempo * 0.11);
      float banda = pow(sin(y * 3.14159), 12.0);
      color *= 1.0 - uBanda * banda;
      color *= 1.0 - uParpadeo * azar(vec2(floor(uTiempo * 60.0), 1.7));

      // Haz del cañón durante el encendido/apagado.
      float hx = abs(c.x) / max(uEscala.x * 0.5, 0.0015);
      float hy = abs(c.y) / max(uEscala.y * 0.5, 0.0012);
      color += uColorHaz * uHaz * exp(-hx * hx * hx * hx * 0.7) * exp(-hy * hy * 1.4);

      // Vidrio: base oscura, ruido de señal, viñeta y reflejo de la sala.
      color = max(color, uColorFondo * 0.55);
      float n = azar(gl_FragCoord.xy + fract(uTiempoRuido * 7.13) * vec2(311.7, 183.3));
      color += vec3(n - 0.5) * uRuido * (0.25 + color);
      vec2 v = uv * (1.0 - uv);
      color *= mix(1.0, pow(clamp(v.x * v.y * 16.0, 0.0, 1.0), 0.25), uVineta);
      float reflejo = smoothstep(0.5, 0.0, length((uv - vec2(0.2, 0.84)) * vec2(1.0, 1.7)));
      color += uColorHaz * reflejo * uReflejo;

      gl_FragColor = vec4(mix(uColorFondo * 0.15, color, vidrio), 1.0);
    }`;

  const e = {
    activo: false, gl: null, lienzo: null, fuente: null,
    progFosforo: null, progTubo: null, uf: {}, ut: {},
    texFuente: null, buferes: [], indice: 0, ancho: 0, alto: 0,
    anterior: 0, movimientoReducido: false, intensidad: 0,
    tubo: { sx: 0, sy: 0, haz: 0, calor: 0, ondulacion: 0 },
  };

  function compilar(gl, tipo, fuente) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function programa(gl, fragmento) {
    const p = gl.createProgram();
    gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, VERTICES));
    gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, fragmento));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  function textura(gl, ancho, alto) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (ancho) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ancho, alto, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }

  function crearBuferes() {
    const gl = e.gl;
    for (const b of e.buferes) { gl.deleteTexture(b.tex); gl.deleteFramebuffer(b.fb); }
    e.buferes = [0, 1].map(() => {
      const tex = textura(gl, e.ancho, e.alto);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const [r, g, b] = DENDRO.tema.rgb("fondo");
      gl.clearColor(r, g, b, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function iniciar(contenedor, lienzoFuente, opciones) {
    e.fuente = lienzoFuente;
    e.movimientoReducido = !!(opciones && opciones.movimientoReducido);
    if (!cfg().efectos.webgl) return false;
    try {
      e.lienzo = document.createElement("canvas");
      e.lienzo.className = "lienzo-crt";
      e.lienzo.setAttribute("aria-hidden", "true");
      const gl = e.lienzo.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
      if (!gl) return false;
      e.gl = gl;
      const f = programa(gl, FOSFORO), t = programa(gl, TUBO);
      e.progFosforo = f.p; e.uf = f.u;
      e.progTubo = t.p; e.ut = t.u;
      const cuadro = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cuadro);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      e.texFuente = textura(gl, 0, 0);
      contenedor.appendChild(e.lienzo);
      e.lienzo.addEventListener("webglcontextlost", (ev) => {
        ev.preventDefault();
        e.activo = false;
        if (opciones && opciones.alPerderContexto) opciones.alPerderContexto();
      });
      e.activo = true;
      redimensionar();
      return true;
    } catch (error) {
      console.warn("DENDRO-OS: WebGL no disponible, se usa el respaldo CSS.", error);
      if (e.lienzo && e.lienzo.parentNode) e.lienzo.parentNode.removeChild(e.lienzo);
      e.activo = false;
      return false;
    }
  }

  function redimensionar() {
    if (!e.activo) return;
    e.ancho = e.fuente.width;
    e.alto = e.fuente.height;
    e.lienzo.width = e.ancho;
    e.lienzo.height = e.alto;
    crearBuferes();
  }

  function parametros() {
    const c = cfg().efectos.crt, ef = cfg().efectos;
    const empeora = 1 + c.escalaConIntensidad * e.intensidad;
    const quieto = e.movimientoReducido;
    // Sin haz no hay señal: el vidrio apagado no tiene nieve ni parpadeo.
    const energia = Math.min(1, e.tubo.calor + e.tubo.haz);
    return {
      curvatura: ef.curvatura ? c.curvaturaBarril : 0,
      aberracion: c.aberracion * empeora,
      ruido: c.ruido * empeora * energia * (quieto ? 0.5 : 1),
      parpadeo: ef.parpadeo && !quieto ? c.parpadeo * empeora * energia : 0,
      banda: quieto ? 0 : c.bandaRodante * empeora * energia,
      scanlines: ef.scanlines ? c.intensidadScanlines : 0,
      mascara: (window.devicePixelRatio || 1) >= 1.5 ? c.mascara : 0,
      persistencia: quieto ? Math.min(c.persistencia, 0.5) : c.persistencia,
    };
  }

  // Un fotograma. `subir` indica que la imagen de la rejilla cambió.
  function dibujar(ahora, subir) {
    if (!e.activo) return;
    const gl = e.gl, p = parametros();
    const dt = e.anterior ? Math.min(0.1, (ahora - e.anterior) / 1000) : 1 / 60;
    e.anterior = ahora;

    gl.viewport(0, 0, e.ancho, e.alto);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, e.texFuente);
    if (subir) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, e.fuente);
    }

    // Pasada 1: fósforo (ping-pong).
    const previo = e.buferes[e.indice], destino = e.buferes[1 - e.indice];
    gl.useProgram(e.progFosforo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, destino.fb);
    gl.uniform1i(e.uf.uFuente, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, previo.tex);
    gl.uniform1i(e.uf.uPrevio, 1);
    gl.uniform1f(e.uf.uDecaimiento, Math.pow(p.persistencia, dt * 60));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    e.indice = 1 - e.indice;

    // Pasada 2: tubo.
    const t = e.tubo, u = e.ut, segundos = ahora / 1000;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(e.progTubo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, destino.tex);
    gl.uniform1i(u.uImagen, 0);
    gl.uniform2f(u.uTexel, 1 / e.ancho, 1 / e.alto);
    gl.uniform2f(u.uResolucion, e.ancho, e.alto);
    gl.uniform1f(u.uTiempo, segundos % 1000);
    gl.uniform1f(u.uTiempoRuido, e.movimientoReducido ? 0 : segundos % 1000);
    gl.uniform1f(u.uCurvatura, p.curvatura);
    gl.uniform1f(u.uAberracion, p.aberracion);
    gl.uniform1f(u.uRuido, p.ruido);
    gl.uniform1f(u.uParpadeo, p.parpadeo);
    gl.uniform1f(u.uBanda, p.banda);
    gl.uniform1f(u.uResplandor, cfg().efectos.brillo);
    gl.uniform1f(u.uScanlines, p.scanlines);
    gl.uniform1f(u.uFilasScan, e.alto / (DENDRO.pantalla.info().escala * 3));
    gl.uniform1f(u.uMascara, p.mascara);
    gl.uniform1f(u.uVineta, cfg().efectos.crt.vineta);
    gl.uniform1f(u.uReflejo, cfg().efectos.crt.reflejo);
    gl.uniform2f(u.uEscala, t.sx, t.sy);
    gl.uniform1f(u.uHaz, t.haz);
    gl.uniform1f(u.uCalor, t.calor);
    gl.uniform1f(u.uOndulacion, e.movimientoReducido ? 0 : t.ondulacion);
    gl.uniform3fv(u.uColorFondo, DENDRO.tema.rgb("fondo"));
    gl.uniform3fv(u.uColorHaz, DENDRO.tema.rgb("rama"));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Punto de la pantalla (0..1, y hacia abajo) → punto de la imagen de la rejilla, con la misma curvatura del shader.
  function pantallaAImagen(u, v) {
    const k = parametros().curvatura;
    let cx = u * 2 - 1, cy = (1 - v) * 2 - 1;
    const f = (1 + k * (cx * cx + cy * cy)) / (1 + k);
    cx *= f; cy *= f;
    const x = cx * 0.5 + 0.5, y = cy * 0.5 + 0.5;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { u: x, v: 1 - y };
  }

  DENDRO.crt = {
    iniciar, redimensionar, dibujar, pantallaAImagen,
    activo: () => e.activo,
    tubo: e.tubo,
    fijarIntensidad: (x) => { e.intensidad = Math.max(0, Math.min(1, x)); },
  };
})(window.DENDRO = window.DENDRO || {});
