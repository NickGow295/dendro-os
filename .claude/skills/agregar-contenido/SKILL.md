---
name: agregar-contenido
description: Añade o modifica contenido del mundo de DENDRO-OS (tierras, parejas de colisión, eventos, mensajes, documentos del archivo o comandos de la terminal) respetando las specs. Usar cuando se pida "agrega una tierra", "nuevo evento", "otro comando", "cambia el desenlace de una pareja" o similar.
---

# Agregar contenido a DENDRO-OS

El contenido vive en `data/` y en `specs/04-lore.md`. La lógica no se toca para añadir contenido.

## Regla de oro

**Primero la spec, después los datos.** Todo contenido nuevo se añade también a `specs/04-lore.md` en la tabla correspondiente, para que la spec siga siendo la fuente de verdad.

## Según lo que se añade

### Una tierra
1. Elegir su código jerárquico (`04-lore.md §4.1`): `MYTH` y un segmento por nivel (2, 3, 2 y 1 caracteres de `0-9A-Z` sin `I` ni `O`), colgando de una de las 13 primarias de `data/myth.js`. El catálogo reserva el camino solo; los nudos intermedios se crean si no existen.
2. Completar todos los campos de la tabla de `04-lore.md §4.2`: nombre, ω, régimen mágico (mundana, mágica baja, mágica alta o inestable), tecnología, planos anexos y carácter. `semillaGlobo` es opcional (por defecto, el código).
3. Si debe chocar, crear también su pareja (siguiente punto). Una tierra sin pareja queda ESTABLE hasta el colapso.
4. Comprobar con las pruebas que el total del catálogo sigue entre `ramasMin` y `ramasMax`.

### Una pareja de colisión nombrada
1. Siguiente ID `C-xx`, instante de contacto (`AAAA-MM-DDThh:mm`) entre `primeraColision` y `colapsoTotal`. `a` y `b` son códigos, idealmente de hermanas.
2. Postura: `hostil`, `mutua-hostil`, `evacuacion`, `aislamiento`, `negociacion` o `ignorancia`. Si es hostil, indicar `agresor` y qué arma usa (tabla de armas de `04-lore.md §6`; las armas siempre se dibujan en rojo).
3. Desenlace: `aniquilacion`, `fusion` o `superviviente:<código>`.
4. Mantener la curva: los instantes deben acumularse hacia diciembre. Las parejas generadas salen solas de `config.multiverso.cascada`.

### Un evento o mensaje
- Evento: fecha, tipo (`SISTEMA`, `COLISIÓN`, `HOSTIL`, `CONTENCIÓN`) y texto en mayúsculas sostenidas, estilo telegrama.
- Mensaje (`data/mensajes.js`): `canal` (`general` o `direccion`), instante, remitente, asunto y cuerpo; los anexos van en el cuerpo tras una línea que empieza por `──`. El general finge control (firma Ambrís); el de dirección cuenta la verdad. `visibleSinCredencial` solo para lo que todos deben ver. Nunca fechas de nuestro calendario en el texto: si hace falta, τ.
- Documento (`data/archivo.js`): carpeta, código, revisión, emisión en τ, clasificación y aprobaciones; `clasificado` y `desde` si es de dirección; `{ direccion, sello }` para líneas que solo se leen con credencial.
- Una pista con fecha: un hito en `data/revelaciones.js`, que las vistas consultan con `estado.hitos`.

### Un comando de terminal
1. Añadir al registro de órdenes de `js/vistas/terminal.js` con `{ nombre, alias, uso, ayuda, oculto, ejecutar(args, estado, ctx, sesion) }`.
2. Si es oculto, no listarlo en `ayuda` y documentarlo en `04-lore.md §12`.
3. Debe leer del `Estado` del día, nunca calcular fechas por su cuenta.

## Al terminar

1. Ejecutar la skill `verificar-cronologia` para comprobar que nada se rompió.
2. Abrir `index.html?fecha=` en la fecha del contenido nuevo y revisarlo.
3. Mantener la originalidad: nada de nombres o términos de franquicias existentes.
