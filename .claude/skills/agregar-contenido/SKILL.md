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
1. Elegir el siguiente ID hexadecimal libre (`B-0x19`, `B-0x1A`, …).
2. Completar todos los campos de la tabla de tierras de `04-lore.md §2`: nombre, régimen mágico (mundana, mágica baja, mágica alta o inestable), tecnología, planos anexos y carácter.
3. Si debe chocar, crear también su pareja (siguiente punto). Una tierra sin pareja queda ESTABLE hasta el colapso.
4. El mapa la ubica sola en una punta libre del árbol; comprobar que no se superpone con otra.

### Una pareja de colisión
1. Siguiente ID `C-xx`, fecha de contacto entre `primeraColision` y el día anterior a `colapsoTotal`.
2. Postura: `hostil`, `mutua-hostil`, `evacuacion`, `aislamiento`, `negociacion` o `ignorancia`. Si es hostil, indicar `agresor` y qué arma usa (tabla de armas de `04-lore.md §4`; las armas siempre se dibujan en rojo).
3. Desenlace: `aniquilacion`, `fusion` o `superviviente:<ID>`.
4. Mantener la curva: las fechas deben acumularse hacia diciembre.

### Un evento o mensaje
- Evento: fecha, tipo (`SISTEMA`, `COLISIÓN`, `HOSTIL`, `CONTENCIÓN`) y texto en mayúsculas sostenidas, estilo telegrama.
- Mensaje: fecha de desbloqueo, remitente, asunto y cuerpo. Voz de personaje: agentes de campo cansados, la Directora Kesh sobria y directa.

### Un comando de terminal
1. Añadir al registro de comandos de `js/modulos/terminal.js` con `{ nombre, alias, ayuda, ejecutar(args, estado) }`.
2. Si es oculto, no listarlo en `ayuda` y documentarlo en `04-lore.md §8`.
3. Debe leer del `Estado` del día, nunca calcular fechas por su cuenta.

## Al terminar

1. Ejecutar la skill `verificar-cronologia` para comprobar que nada se rompió.
2. Abrir `index.html?fecha=` en la fecha del contenido nuevo y revisarlo.
3. Mantener la originalidad: nada de nombres o términos de franquicias existentes.
