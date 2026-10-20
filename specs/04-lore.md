# 04 — Lore y contenido

> Contenido del mundo para rellenar `data/` y `config.js`. Todo es original. Basado en el documento "El Árbol Imaginario" (multiverso con Tronco de 11 dimensiones, universos de 3+1 dimensiones, magia por campos de módulos, planos anexos y firmas de rama ω).

## 1. La agencia

- **Siglas:** DENDRO
- **Nombre:** Directorio de Estabilidad y Normalización de Ramas y Orígenes
- **Sistema:** DENDRO-OS v4.7.2
- **Sede:** la Estación Raíz, anclada en el Bulk (fuera de todo universo, por eso su reloj sigue el meta-tiempo τ)
- **Lema:** *Toda rama sostiene al Árbol*
- **Directora:** Amaranta Kesh
- **Función:** vigilar las firmas ω de las ramas, detectar convergencias y mantener los aislantes de fase. No interviene en la historia interna de los universos: solo protege la estructura.
- **Jerarquía de alerta:** VERDE · ÁMBAR · NARANJA · ROJO · NEGRO

### Logo ASCII (propuesta, editable en config.js)

```
           .   *   .
        *  \\ | //  *
      .--\\\\ | ////--.
          \\\\|////
            \\|//
             |||
             |||
      ═══════╧╧╧═══════
       D · E · N · D · R · O
```

> En JavaScript las barras invertidas van dobles dentro de cadenas; usar un array de líneas con `String.raw` o escaparlas.

### Glosario de la agencia

| Término | Significado |
| --- | --- |
| Rama | Un universo o una de sus historias alternativas |
| Firma ω | Frecuencia de vacío propia de cada rama |
| Δω | Diferencia de firma entre dos ramas; si llega a 0, chocan |
| Convergencia | Dos ramas acercándose en el Bulk |
| Aislante de fase | Barrera que impide que la materia de una rama interfiera con otra |
| Garganta | Región de la geometría compacta que forma un plano anexo (inframundos, cielos) |
| Injerto | Reparación de una rama dañada usando cohesión (N̂) |
| Estación Raíz | Sede de DENDRO |

## 2. Las 24 tierras

Designación hexadecimal, nombre, firma ω, régimen mágico (de la sección 4 del documento), tecnología, planos anexos conocidos y carácter.

| ID | Nombre | ω | Magia | Tecnología | Planos anexos | Carácter |
| --- | --- | --- | --- | --- | --- | --- |
| B-0x01 | Velmora | 3.1416 | Mágica alta | Medieval arcana | Salón de los Juramentados, Hondura | Reinos de magos; defensas rúnicas |
| B-0x02 | Ostrakh | 3.1902 | Mundana | Militar industrial avanzada | Ninguno detectado | Estado militarizado; arsenal nuclear y orbital |
| B-0x03 | Halcyon | 5.0071 | Mundana | Utopía post-escasez | Ninguno | Sociedad pacífica gobernada por consenso |
| B-0x04 | Halcyon-Prima | 5.0074 | Mundana | Utopía post-escasez | Ninguno | Rama hermana casi idéntica de Halcyon (Δω₀ mínimo) |
| B-0x05 | Ceniza | 2.7183 | Mágica baja | Postapocalíptica | Hondura Gris | Sobrevivientes de una guerra antigua; armas recuperadas |
| B-0x06 | Arbórea | 2.7461 | Mágica alta | Biomágica | Cielo de las Copas, Raigambre | Bosques continentales; dioses vivos que caminan |
| B-0x07 | Nadir | 6.0220 | Mágica baja | Submarina | Abismo de Tetis | Civilización oceánica en ciudades sumergidas |
| B-0x08 | Kaelum | 6.0598 | Mágica alta | Imperio aéreo | Alto Cielo | Islas flotantes sostenidas por maná |
| B-0x09 | Tierra Gris | 1.6180 | Mundana | Equivalente a la nuestra (2026) | Ninguno detectado | No sabe que existe el Árbol |
| B-0x0A | Solenne | 1.6532 | Mágica alta | Teocracia solar | Morada del Sol, Patio de los Elegidos | Panteón solar activo; lanzas divinas |
| B-0x0B | Ferrum | 4.6692 | Mundana | Industrial a vapor | Ninguno | Imperios de hierro y carbón |
| B-0x0C | Vael | 4.7120 | Mágica baja | Agraria | Valle Quieto | Pueblos de brujas de campo; muy aislada |
| B-0x0D | Umbra | 0.5772 | Mágica alta | Necromántica | Inframundo abierto (la garganta toca la superficie) | Los muertos gobiernan junto a los vivos |
| B-0x0E | Lucerna | 0.6011 | Mágica alta | Arcana luminosa | Cielo de Cristal | Orden de paladines; odia lo que viene de Umbra |
| B-0x0F | Meridia | 7.3890 | Mundana | Espacial | Ninguno | Colonizó su sistema solar |
| B-0x10 | Antípoda | 7.3912 | Mundana | Espacial | Ninguno | Reflejo de Meridia con historia invertida |
| B-0x11 | Brama | 2.2361 | Mágica baja | Nómada | Las Llanuras de Ceniza Blanca | Clanes de jinetes y chamanes |
| B-0x12 | Corvex | 2.2794 | Mundana | Ciberpunk corporativa | Ninguno | Corporaciones con ejércitos privados y drones |
| B-0x13 | Esmeril | 9.0001 | Inestable | Desconocida | Desconocidos | Constantes a la deriva; lecturas imposibles |
| B-0x14 | Tálamo | 9.0315 | Mágica baja | Renacentista | Galería de los Sueños | Artistas y alquimistas |
| B-0x15 | Ithaka | 3.8197 | Mundana | Marítima clásica | Ninguno | Archipiélagos de ciudades-estado |
| B-0x16 | Nimbo | 3.8420 | Mágica alta | Atmosférica | Ojo de la Tormenta | Pueblos que viven dentro de nubes |
| B-0x17 | Origen | 1.0000 | Mágica alta | Desconocida | Todos los planos conocidos convergen aquí | Primera rama nucleada; el ancla del Árbol |
| B-0x18 | Postrera | 1.0009 | Inestable | Desconocida | Ninguno | La última rama nacida; no debería existir |

> En las tierras "Inestable" el expediente muestra la ω con dígitos que oscilan (decorativo; el valor de datos es fijo).

### 2.1 Aspecto de los globos

Cada globo es procedural con semilla `hash(id)` (ver `02-diseno.md §7.4`): nada copiado de ningún mapa salvo **Tierra Gris**, que usa los continentes de nuestra Tierra. `mar` es la fracción de océano (por defecto 0.55) y `rugosidad` la escala del ruido (1 = normal; más alto, costas más fragmentadas). Solo se listan las que se apartan del valor por defecto.

| ID | Nombre | mar | rugosidad | Otros | Por qué |
| --- | --- | --- | --- | --- | --- |
| B-0x02 | Ostrakh | 0.45 | 0.8 | | Masas continentales compactas, militarizadas |
| B-0x05 | Ceniza | 0.30 | 0.9 | | Desiertos de una guerra antigua |
| B-0x06 | Arbórea | 0.40 | 1.2 | | Bosques continentales |
| B-0x07 | Nadir | 0.85 | 1.0 | | Civilización oceánica |
| B-0x08 | Kaelum | 0.80 | 2.0 | | Islas flotantes |
| B-0x09 | Tierra Gris | — | — | máscara real | Equivalente a la nuestra |
| B-0x0C | Vael | 0.50 | 0.7 | | Valles agrarios amplios |
| B-0x0D | Umbra | 0.50 | 1.4 | | Costas desgarradas por el inframundo abierto |
| B-0x13 | Esmeril | 0.50 | 1.6 | inestable | Constantes a la deriva |
| B-0x15 | Ithaka | 0.72 | 1.8 | | Archipiélagos |
| B-0x16 | Nimbo | 0.65 | 1.3 | | Tierras bajo nubes |
| B-0x17 | Origen | 0.50 | 1.0 | | La primera rama |
| B-0x18 | Postrera | 0.60 | 1.5 | inestable | No debería existir |

## 3. Parejas de colisión

Fechas de contacto con espaciado decreciente (crecimiento exponencial). Al menos 5 parejas hostiles. Δω₀ se calcula como `|ω_a − ω_b|` (aquí solo como referencia).

| ID | Rama A | Rama B | Δω₀ | Contacto | Postura | Agresor | Armas | Desenlace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | Velmora | Ostrakh | 0.0486 | 2026-10-27 | hostil | Ostrakh | Ostrakh: misil interrama | superviviente: Velmora (las runas desvían los misiles; Ostrakh colapsa) |
| C-02 | Halcyon | Halcyon-Prima | 0.0003 | 2026-11-09 | negociación | — | — | fusión → *Halcyon ∪ Halcyon-Prima* |
| C-03 | Ceniza | Arbórea | 0.0278 | 2026-11-18 | mutua-hostil | Ceniza | Ceniza: artillería de chatarra · Arbórea: raíces estranguladoras | aniquilación |
| C-04 | Nadir | Kaelum | 0.0378 | 2026-11-25 | evacuación | — | — | fusión → *Nadir ∪ Kaelum* |
| C-05 | Tierra Gris | Solenne | 0.0352 | 2026-11-30 | hostil | Solenne | Solenne: lanza solar | aniquilación (Tierra Gris nunca supo qué pasó) |
| C-06 | Ferrum | Vael | 0.0428 | 2026-12-04 | aislamiento | — | — | superviviente: Vael |
| C-07 | Umbra | Lucerna | 0.0239 | 2026-12-07 | mutua-hostil | Lucerna | Lucerna: lluvia de juicio · Umbra: marea de los muertos | aniquilación |
| C-08 | Meridia | Antípoda | 0.0022 | 2026-12-09 | negociación | — | — | aniquilación |
| C-09 | Brama | Corvex | 0.0433 | 2026-12-11 | hostil | Corvex | Corvex: misil interrama, enjambre de drones de fase | superviviente: Corvex |
| C-10 | Esmeril | Tálamo | 0.0314 | 2026-12-12 | ignorancia | — | — | aniquilación |
| C-11 | Ithaka | Nimbo | 0.0223 | 2026-12-13 | evacuación | — | — | fusión → *Ithaka ∪ Nimbo* |
| C-12 | Origen | Postrera | 0.0009 | 2026-12-14 | ignorancia | — | — | `colapso`: caída del ancla → dispara el colapso total del 16/12 |

Ids de arma para `data/colisiones.js`: `misil-interrama`, `enjambre-drones`, `artilleria-chatarra`, `lanza-solar`, `lluvia-juicio`, `marea-muertos`, `raices-estranguladoras`.

## 4. Armas (siempre en rojo)

| Arma | Usada por | Descripción para expedientes |
| --- | --- | --- |
| Misil interrama | Ostrakh, Corvex | Proyectil balístico con cabeza de disrupción de firma: sintonizado a la ω enemiga |
| Enjambre de drones de fase | Corvex | Miles de drones que desestabilizan el aislante de fase |
| Artillería de chatarra | Ceniza | Cañones reconstruidos, poco precisos, muy numerosos |
| Lanza solar | Solenne | Haz divino canalizado por el panteón a través de la Morada del Sol |
| Lluvia de juicio | Lucerna | Bombardeo de luz consagrada desde el Cielo de Cristal |
| Marea de los muertos | Umbra | Ejército que cruza por el inframundo abierto (responde a Lucerna) |
| Raíces estranguladoras | Arbórea | Los dioses de Arbórea empujan raíces a través del contacto (respuesta defensiva) |

En el mapa: trayectorias curvas rojas del agresor a la víctima; en mutua-hostil, en ambos sentidos. Los ataques empiezan dos días antes del contacto (ver `02-diseno.md §4.5`), lo que concuerda con el misil del 25/10 y la Lanza Solar del 28/11.

## 5. Eventos fijos (narrativa)

| Fecha | Tipo | Texto |
| --- | --- | --- |
| 2026-10-20 | SISTEMA | Anomalía de firma detectada en el cuadrante bajo del Árbol. Δω entre B-0x01 y B-0x02 por debajo del umbral seguro. |
| 2026-10-21 | SISTEMA | Directora Kesh eleva la alerta a ÁMBAR. |
| 2026-10-23 | HOSTIL | Ostrakh detecta a Velmora en sus radares. Movilización general. |
| 2026-10-25 | HOSTIL | Ostrakh lanza el primer misil interrama. Interceptado por defensas rúnicas. |
| 2026-10-27 | COLISIÓN | CONTACTO. Primera colisión confirmada: B-0x01 / B-0x02. |
| 2026-11-01 | SISTEMA | Ostrakh deja de transmitir. |
| 2026-11-05 | SISTEMA | Aparecen convergencias en ramas que no estaban en riesgo. El patrón no es aleatorio. |
| 2026-11-15 | SISTEMA | Hipótesis: algo en la base del Tronco está tirando de las ramas hacia dentro. |
| 2026-11-28 | HOSTIL | Solenne declara que la "tierra sin dioses" es una herejía y prepara la Lanza Solar. |
| 2026-12-02 | SISTEMA | Fallos intermitentes en la Estación Raíz. El meta-tiempo muestra irregularidades. |
| 2026-12-10 | SISTEMA | Origen y Postrera convergen. Si el ancla cae, cae todo. |
| 2026-12-14 | COLISIÓN | Contacto Origen / Postrera. Pérdida de cohesión N̂ en el Tronco. |
| 2026-12-15 | SISTEMA | Última transmisión de la Directora Kesh (ver mensajes). |

## 6. Comunicaciones (se desbloquean por fecha)

| Fecha | De | Asunto | Resumen del cuerpo |
| --- | --- | --- | --- |
| 2026-10-20 | Sistema | Bienvenida al turno | Instrucciones del operador; recordar revisar el monitor cada día. |
| 2026-10-22 | Agente Iriarte (campo, Velmora) | Los magos lo sienten | Los astrólogos de Velmora ven "otro cielo" superpuesto al suyo. |
| 2026-10-26 | Agente Iriarte | Van a disparar | Ostrakh apunta a todo lo que no entiende. Pide autorización para evacuar. Sin respuesta. |
| 2026-11-10 | Agente Sôl Varga (Halcyon) | Se dieron la mano | Las dos Halcyon votaron fusionarse. Fue hermoso y aterrador. |
| 2026-11-19 | Desconocido (Arbórea) | — | Mensaje en una lengua vegetal. El traductor devuelve: "Nos quemaron las raíces." |
| 2026-12-01 | Agente Varga | Tierra Gris | Nadie allí supo nada. Solo vieron un amanecer en el cielo equivocado. |
| 2026-12-08 | Directora Kesh | A todo el personal | Se suspenden las contenciones locales. Prioridad: proteger el ancla. |
| 2026-12-15 | Directora Kesh | Si alguien lee esto | Despedida: la agencia hizo lo que pudo; pide al operador que guarde el registro. |

## 7. Documentos del Archivo

- **PROTOCOLO-01: Aislantes de fase** — cómo se mantienen, por qué fallan.
- **PROTOCOLO-07: Convergencia inter-rama** — fases de aproximación, contacto, desenlace.
- **INFORME TIm-0** — resumen del documento "El Árbol Imaginario" (Tronco, Ramas, magia como módulos, planos anexos, deidades sostenidas por la fe).
- **MANUAL DEL OPERADOR** — lista de comandos y módulos.
- **[CLASIFICADO NEGRO]** — se desbloquea con el comando oculto `semilla`: describe al Estado Nulo |Ω₀⟩ y sugiere que el colapso es el Árbol "volviendo a la semilla".

## 8. Comandos ocultos de la terminal

| Comando | Efecto |
| --- | --- |
| `raiz` | Muestra el logo grande y el lema |
| `semilla` | Desbloquea el documento CLASIFICADO NEGRO |
| `kesh` | Mensaje personal de la Directora |
| `quien vigila` | "LA ESTACIÓN RAÍZ NO TIENE OBSERVADOR. NADIE LA SOSTIENE." |
| `n-hat` | Lectura del potencial de cohesión del Tronco (cae con p) |

## 9. Colapso final (16/12)

Pantalla de error: la primera línea va en una franja ámbar con texto oscuro; el resto, en texto blanco sobre fondo oscuro dentro de un marco ámbar. `{ramas}` se sustituye por `ramasAfectadasFinal` con separador de miles (por defecto `1 048 576`).

```
ERROR FATAL 0x0000DEAD
PÉRDIDA TOTAL DE COHESIÓN EN EL SUSTRATO M11

  ramas afectadas ..... {ramas} / {ramas}
  firma del ancla ..... ω = NaN
  meta-tiempo τ ....... DETENIDO

LA ESTACIÓN RAÍZ NO PUEDE MANTENER EL ÁRBOL.
GUARDE EL REGISTRO. TODA RAMA SOSTENÍA AL ÁRBOL.

[ PRESIONE CUALQUIER TECLA ]
```

Después: arranque fallido (módulos en `FALLO`), el mapa con el Árbol desintegrándose de las hojas al tronco y, al final, solo un punto blanco (la semilla) y el cursor parpadeando. La terminal sigue respondiendo solo a `colapso.comandosPermitidos` (por defecto, `semilla`). Si la fecha es posterior al 16/12, bajo la semilla aparece `τ DETENIDO HACE N DÍAS`.
