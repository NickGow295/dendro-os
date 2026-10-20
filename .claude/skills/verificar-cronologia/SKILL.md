---
name: verificar-cronologia
description: Simula el estado de DENDRO-OS en cualquier instante o rango (minuto a minuto) y comprueba los criterios de la cronología (fases, recta final, colapso a las 14:00, ramas afectadas, parejas, monotonía, τ, ninguna fecha visible). Usar después de tocar cronologia.js, reloj.js, tau.js, config.js o data/, o cuando se pida revisar cómo se ve la página en un momento concreto.
---

# Verificar la cronología

El estado de DENDRO-OS es una función pura del instante, truncado al minuto (`DENDRO.cronologia.calcularEstado(instante)`; `instante` en ms o `"AAAA-MM-DDThh:mm"` en la zona de config). Esta skill la ejecuta fuera del navegador para revisar muchos instantes a la vez.

## Pasos

1. Confirmar que existen `config.js`, `data/myth.js`, `data/tierras.js`, `data/generacion.js`, `data/colisiones.js`, `data/eventos.js`, `data/mensajes.js` y `js/nucleo/prng.js`, `reloj.js`, `tau.js`, `multiverso.js`, `cronologia.js`.
2. Ejecutar desde la raíz del proyecto:

   ```bash
   node .claude/skills/verificar-cronologia/scripts/simular.js 2026-10-18 2026-12-18 24
   ```

   Argumentos: desde, hasta (`AAAA-MM-DD` o `AAAA-MM-DDThh:mm`) y cada cuántas horas imprimir una fila (24 por defecto). La monotonía se comprueba siempre hora a hora. Cada fila: instante local, τ, fase, alerta, p, intensidad, ramas afectadas, ramas en colisión, cohesión N̂ y parejas por estado (nombradas y generadas). Al final, el tiempo medio de `calcularEstado` y el resultado de las comprobaciones.
3. Si alguna comprobación falla, corregir el motor o los datos y repetir. **No** relajar las comprobaciones para que pasen.
4. Para revisar el aspecto visual, abrir `index.html?fecha=AAAA-MM-DD` (las 12:00) o `?fecha=AAAA-MM-DDThh:mm`. El reloj sigue corriendo desde ese instante; `&congelar=1` lo fija.
5. Las mismas comprobaciones, y más, están en `tests/cronologia.test.html`.

## Comprobaciones que hace el script

- 10-19 → fase 0 NOMINAL, 0 ramas. Inicio de alerta → fase 1, 0 ramas.
- 10-27 03:16 → ninguna colisión; 03:17 → exactamente 2 ramas y C-01 en CONTACTO; 10-27 12:00 → 2 ramas en colisión.
- 12-16 13:59 → fase 4 en recta final con intensidad máxima; 14:00 → fase 5 y ramas = `ramasAfectadasFinal`; 12-25 → colapso.
- Ramas afectadas, ramas en colisión y fase nunca retroceden de una hora a la siguiente; N̂ nunca crece.
- Catálogo entre `ramasMin` y `ramasMax`, idéntico en una segunda carga; el 10-27 solo C-01 está en contacto; ~60 contactos en las últimas 14 horas; N̂ cruza 0.60 el 12-09 y es 0 en el colapso.
- Al menos 4 parejas nombradas hostiles; Ostrakh ataca a Velmora el 10-25.
- τ del inicio de alerta = 7525.000 y del colapso = 7582.583.
- Ningún texto de registro, mensajes o archivo contiene fechas de nuestro calendario.
- Mismo instante calculado dos veces → mismo resultado (determinismo).

## Requisito del motor

`cronologia.js`, `reloj.js` y `tau.js` deben poder cargarse sin DOM: no tocar `document` al nivel superior del archivo. Si el script falla al cargar por eso, mover ese código a la capa de UI.
