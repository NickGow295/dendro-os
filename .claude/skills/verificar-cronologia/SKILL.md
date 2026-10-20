---
name: verificar-cronologia
description: Simula el estado de DENDRO-OS en cualquier fecha o rango de fechas y comprueba los criterios de la cronología (fases, ramas afectadas, parejas, monotonía). Usar después de tocar cronologia.js, config.js o data/, o cuando se pida revisar cómo se ve la página un día concreto.
---

# Verificar la cronología

El estado de DENDRO-OS es una función pura de la fecha (`DENDRO.cronologia.calcularEstado(fecha)`). Esta skill la ejecuta fuera del navegador para revisar muchos días a la vez.

## Pasos

1. Confirmar que existen `config.js`, `data/tierras.js`, `data/colisiones.js`, `data/eventos.js` y `js/nucleo/prng.js`, `js/nucleo/reloj.js`, `js/nucleo/cronologia.js`.
2. Ejecutar desde la raíz del proyecto:

   ```bash
   node .claude/skills/verificar-cronologia/scripts/simular.js 2026-10-18 2026-12-20
   ```

   Sin argumentos usa el rango del 2026-10-18 al 2026-12-31. Imprime una fila por día (fase, alerta, p, intensidad, ramas afectadas, parejas por estado) y al final el resultado de las comprobaciones.
3. Si alguna comprobación falla, corregir `cronologia.js` o los datos y repetir. **No** relajar las comprobaciones para que pasen.
4. Para revisar el aspecto visual de un día, abrir `index.html?fecha=AAAA-MM-DD` (requiere `debug.permitirFechaURL: true`).

## Comprobaciones que hace el script

- 2026-10-19 → fase 0 NOMINAL, 0 ramas.
- 2026-10-20 → fase 1 ANOMALÍA, 0 ramas.
- 2026-10-27 → exactamente 2 ramas afectadas y C-01 en CONTACTO.
- 2026-12-16 → fase 5 COLAPSO y ramas = `ramasAfectadasFinal`.
- Ramas afectadas nunca disminuye de un día al siguiente.
- La fase nunca retrocede.
- Al menos 4 parejas con postura hostil o mutua-hostil.
- Mismo día calculado dos veces → mismo resultado (determinismo).

## Requisito del motor

`cronologia.js` debe poder cargarse sin DOM: no tocar `document` al nivel superior del archivo, solo dentro de funciones de UI. Si el script falla al cargar por eso, mover ese código a la capa de UI.
