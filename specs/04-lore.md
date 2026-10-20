# 04 — Lore y contenido

> Contenido del mundo para rellenar `data/` y `config.js`. Todo es original. La física del Árbol (Bulk M₁₁, Ŝ y N̂, Ignición Beta, X₇, maná, planos anexos, firmas ω, vías de tránsito) sale de `00-arbol-imaginario.md`, que es la fuente de verdad: si algo de aquí lo contradice, manda el documento.
>
> **Regla de tiempo**: en la interfaz nunca aparecen fechas ni horas de nuestro calendario. Las fechas de este documento son instantes reales en `America/Bogota`, para el autor y el motor; en pantalla se ven en τ (§1.2).

## 1. La agencia

- **Siglas:** DENDRO
- **Nombre:** Directorio de Estabilidad y Normalización de Ramas y Orígenes
- **Sistema:** DENDRO-OS v4.7.2
- **Sede:** la Estación Raíz, anclada en el **Bulk M₁₁** (el sustrato), cerca de las raíces y fuera de todo universo; por eso su reloj sigue el meta-tiempo τ, que en el Bulk es global y monótono
- **Lema:** *Toda rama sostiene al Árbol*
- **Directora:** Amaranta Kesh
- **Subdirector de Continuidad Operativa:** Lucio Ambrís (firma el canal general)
- **Sección de Firmas:** analista Teo Marín
- **Agentes de campo:** Iriarte (Velmora), Sôl Varga (Halcyon, luego Tierra Gris)
- **Función:** vigilar las firmas ω de las ramas, detectar convergencias y mantener los aislantes de fase. No interviene en la historia interna de los universos: solo protege la estructura.
- **Jerarquía de alerta:** VERDE · ÁMBAR · NARANJA · ROJO · NEGRO

### Logo ASCII (editable en config.js)

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

### 1.1 Glosario de la agencia

| Término | Significado |
| --- | --- |
| Raíces | El Estado Nulo \|Ω₀⟩, que se rompió en Ŝ (dispersión) y N̂ (cohesión). La física impide volver a él |
| Tronco · Bulk M₁₁ · sustrato | La variedad de 11 dimensiones (10 espaciales y el meta-tiempo τ) donde se nuclean los universos. Ahí, cerca de las raíces, está la Estación Raíz |
| MYTH | La rama mayor más antigua: la primera burbuja nucleada. Es la referencia de toda firma (ω ≡ 1) y DENDRO la dibuja **como tronco** de su diagrama (§2.1) |
| Rama mayor | Un universo de 3+1 dimensiones; la forma de su X₇ fija sus leyes y su régimen mágico |
| Ramilla | Rama de Everett de un universo, nacida por decoherencia: misma X₇, otra historia, su propia firma ω |
| Rama | En la jerga de DENDRO, cualquier universo o ramilla catalogada |
| Firma ω | Frecuencia de vacío propia de cada rama, medida en unidades de la firma de MYTH (ω_MYTH ≡ 1) |
| Δω | Diferencia de firma entre dos ramas. Cerca de su homóloga aparece un batido ∝ cos(Δω·t); cuanto menor Δω, más dura el acoplamiento. Si llega a 0, chocan |
| Convergencia | Dos ramas acercándose en el Bulk |
| Aislante de fase | Barrera que impide que la materia de una rama se degrade en otra |
| X₇ | La geometría compacta de 7 dimensiones de cada universo. Universos con X₇ parecidas están cerca en el Bulk |
| Maná | Un módulo de X₇ que quedó ligero y acoplado a la materia; la magia es moverlo con la voluntad |
| Garganta | Región de la X₇ de un universo que forma un plano anexo (inframundos, salones heroicos, cielos). Cada universo tiene las suyas |
| Cohesión N̂ | El potencial negentrópico que mantiene unido lo que Ŝ dispersa. DENDRO mide la N̂ anclada en MYTH: 1 = sana; 0 = MYTH falla y con él todo el Árbol |
| Injerto topológico | Rescate de una rama que perdió soporte causal: N̂ la ata a otra para que no colapse hacia el Bulk |
| Rama joven | Rama nacida de un viaje al pasado de los MYTHS (vía II) o rescatada con un injerto tras uno de esos viajes. Vive de prestado de la N̂ de MYTH |
| Vía I · descenso | Entre planos **del mismo universo**: cruzar una puerta hacia una garganta de X₇ (inframundo, cielo). Riesgo: volver años después |
| Vía II · horizontal | En el tiempo, **dentro de una rama**: deformar g₀₀ con maná concentrado. Viajar al pasado altera un nodo y **crea una rama nueva**; las ramas hijas que dependían de ese nodo pierden soporte causal y caen hacia el Bulk salvo que N̂ las rescate con un injerto. Riesgo: avalancha retrocausal |
| Vía III · vertical | **Entre ramas o universos**: bajar por X₇ por debajo de la escala de Planck hasta el Bulk y emerger en otra burbuja. Es la única excepción a la membrana de un solo sentido que protege al Tronco. Riesgo: descompresión dimensional |
| Firma imaginaria | Lectura ω con parte imaginaria. Ninguna rama puede tenerla: el batido cos(Δω·t) se vuelve un crecimiento sin fin |
| Estación Raíz | Sede de DENDRO |
| Catalogada | Rama que DENDRO tiene identificada y designada. El Árbol tiene infinitas; DENDRO conoce unas mil ochocientas |

### 1.2 Meta-tiempo τ

La Estación Raíz no está en ninguna rama, así que no usa calendarios: cuenta **meta-tiempo τ** desde su fundación.

| Unidad | Símbolo | Equivale a | Uso |
| --- | --- | --- | --- |
| Ciclo | `c` | 1 000 pulsos | La unidad de los turnos y las semanas (7 c) |
| Pulso | `p` | 100 latidos | Registro, mensajes, cuentas atrás cortas |
| Latido | `l` | — | Solo en el reloj de la barra de estado, que late visiblemente |

- Internamente: 1 ciclo = 86 400 s reales, con época el **2006-03-14 00:00** (Bogotá). Así el 20/10/2026 00:00 es exactamente **τ 7525.000**, la primera colisión (03:17) es **τ 7532.136** (τ se trunca: 03:17 son 0.1368 de ciclo) y el colapso es **τ 7582.583**. Todo es configurable (`config.tau`).
- **Formato**:
  - Instante: `τ 7532.137` (ciclo y pulso, con punto). En la barra de estado se añaden los latidos: `τ 7532.137·42`.
  - Duración y cuenta atrás: `T−3.208 c` si queda más de un ciclo; `T−412 p` si queda menos; `T−37 l` en el último pulso. Después del instante, `T+…`.
  - Rango: `τ 7525.000 → τ 7582.583`.
- En el registro, cada línea empieza por su instante (`7532.137`). Los mensajes y documentos llevan `τ` y su instante de emisión o revisión.
- **Degradación**: desde la fase 4 los dígitos del pulso tiemblan a ratos (decorativo); el 16/12 el reloj se atasca un latido de cada pocos; tras el colapso, `τ DETENIDO` y, en la pantalla final, `τ DETENIDO HACE 8.417 c`.
- Fechas internas de los documentos antiguos (fundación, baja de Sarmiento) se escriben también en τ: τ 0.000, τ 6913.204, etc.

## 2. MYTH, el tronco, y sus guardianes

### 2.1 MYTH

- **Designación:** `MYTH` (sin segmentos: es la raíz de todos los códigos)
- **Firma:** ω ≡ 1.0000 (referencia de todas las demás)
- **Régimen:** Magia antigua (anterior a los módulos de campo)
- **Tecnología:** Toda la que ha existido
- **Planos anexos:** los suyos, los más antiguos que se conocen: el Pozo de Thul (inframundo bajo la ciudad hundida), el Salón del Primer Rito (salón heroico) y el Cielo Viejo
- **Carácter:** La rama mayor más antigua, nacida en la primera Ignición Beta. No converge con ninguna: está en el centro de todo lo catalogado. Si su cohesión cae, el Árbol entero pierde el soporte.
- **En el diagrama:** el tronco, siempre visible, del que nacen las 13 ramas primarias. Debajo, la franja del Bulk (el sustrato) y la Estación Raíz.
- **Cohesión N̂:** baja un escalón con cada contacto catalogado; el contacto de Origen y Postrera, en su misma base, la parte a la mitad; llega a 0 a las 14:00 del 16/12.

**Por qué MYTH es el tronco del diagrama** (reconciliación con `00-arbol-imaginario.md`): el Tronco físico es el Bulk M₁₁, y el diagrama lo dibuja como la franja del sustrato bajo MYTH. Pero DENDRO no cartografía el Bulk, sino lo que cuelga de MYTH: todas las firmas se miden contra la suya, las primarias antiguas son familias de universos nucleados junto a su pared (con X₇ parecidas, por eso cercanos) y las primarias jóvenes salieron de sus viajes. La N̂ que sostiene los injertos de todas esas ramas está anclada en MYTH. Por eso, para la agencia, MYTH es el tronco: si cae, cae todo lo catalogado.

### 2.2 Los MYTHS

Cinco seres que viven en MYTH y que también se llaman así, porque dicen que el universo y ellos son la misma promesa. En su línea temporal vieron llegar el fin —ellos lo llaman **la Poda**: las ramas cayendo una contra otra hasta que el tronco no pudo sostenerlas— y decidieron impedirlo viajando al pasado. Hicieron **siete saltos** (vía II). Ninguno cambió el pasado de MYTH: cada uno alteró un nodo e hizo brotar una rama nueva desde el tronco. Y cada salto dejó sin soporte causal a las ramas que dependían de ese nodo; habrían caído hacia el Bulk, pero Ilvane las rescató con **injertos topológicos** pagados con la N̂ de MYTH. Las **ramas jóvenes** son su obra: siete de las trece ramas primarias y todo lo que creció de ellas, injertado donde cupo. Por eso dentro de una primaria joven conviven regímenes mágicos distintos (cada injerto ató la rama a la X₇ más cercana), por eso son inestables y por eso **cada colisión le cuesta cohesión a MYTH**: cuando una rama joven choca, su injerto se rompe y la N̂ que lo sostenía se pierde.

DENDRO lo sabía y lo consintió, porque las ramas jóvenes parecían estables. No se lo dijo al personal.

| Guardián | Quién es | Personalidad | Papel en la historia |
| --- | --- | --- | --- |
| **Odalys Vey** · la Viajera | Cronógrafa. Construyó la **Aguja**, el instrumento que concentra el maná hasta deformar g₀₀ y permite la vía II sin desatar una avalancha retrocausal. Lleva la cuenta exacta de los siete saltos, con sus instantes, en la palma de la mano | Metódica, contenida, culpable. Habla en listas. Nunca dice "no pudimos": dice "no hemos podido todavía" | Lidera al grupo. El 12-10 confiesa en el canal de dirección que la Poda de la que huyeron llevaba la firma del Injertador. Baja por la vía III a enfrentarlo y no vuelve (cae el 16/12 a las 10:00) |
| **Calcina** · el fénix | Un ave de fuego: un solitón del maná tan antiguo como MYTH; suele tomar forma humana con el pelo humeando. Cada vez que muere renace, pero cada renacimiento le quema recuerdos | Impulsivo, cálido, bromista; olvida nombres y lo disimula con apodos. Se ofreció para el primer salto | Sostiene con su fuego la corteza de MYTH donde las ramas se sueltan. Arde el 12-09 y **no renace**: es la primera señal de que N̂ ya no alcanza |
| **Hisame** · la shinigami | Guía de los muertos de MYTH: baja por la vía I con las almas hasta el Pozo de Thul o las desvía al Salón del Primer Rito. Vive en parte dentro de X₇, así que cruza la vía III con más facilidad que nadie. No lleva guadaña: lleva un **farol de papel** con una llama por cada rama viva que conoce; cuando una rama muere, su llama se apaga | Cortés, seca, precisa; habla de las muertes como de una contabilidad que alguien tiene que llevar | Es la primera de los MYTHS que contacta con DENDRO (12-01): "mi farol tenía mil llamas; este ciclo se han apagado cuatrocientas, y no se apagan solas". Cae el 12-15 |
| **Maresa Thul** · la atlante | Última ingeniera de mareas de Thul, la ciudad hundida de MYTH. Sus mareógrafos leen el oleaje del Bulk mejor que los sensores de DENDRO | Orgullosa, directa, sin paciencia para las jerarquías; respeta a quien trabaja | Detecta antes que nadie el tirón desde abajo. Sostiene la base del tronco cuando Origen se suelta; cae el 12-13 |
| **Ilvane** · la sacerdotisa | Sacerdotisa del Primer Rito, la magia más antigua de MYTH: mueve el maná con un rito y no con la voluntad sola. Su rito ata a los cinco entre sí, al tronco y a cada injerto topológico de las ramas jóvenes | Serena, paciente; la conciencia del grupo. Se opuso a los saltos desde el segundo y los acompañó igual | Es la última en pie. Su rito es, en la práctica, lo que queda de N̂. Cae a las 14:00 del 16/12: el colapso es ella soltando |

Los instantes de caída de cada guardián están fijados en `data/myth.js` (no salen de N̂) para que cuadren con los mensajes: Calcina 12-09 21:05 (el cruce de 0.60), Maresa 12-13 18:00, Hisame 12-15 21:00, Odalys 12-16 10:00, Ilvane 12-16 14:00. Los siete saltos, en CLAS-RAM-J: τ 5120.402, 5511.090, 6004.733, 6655.218, 6990.517, 7102.846 y 7388.991. El expediente de MYTH (con credencial) los muestra como `EN PIE` / `CAÍDO EN τ …`.

## 3. El Injertador

- **Nombre real:** Ruy Escarda.
- **Universo de origen:** **Sarmiento**, código `MYTH·4K·7A2·S5`, una rama joven nacida del **primer salto** de los MYTHS. Un mundo de ciudades-viñedo donde la ciencia, la ley y la medicina eran el arte del injerto: se injertaban plantas, animales, gremios y, al final, personas. Escarda era maestro injertador del Viñedo Mayor.
- **Lo que le pasó:** una rama nacida del cuarto salto creció encima de la de Sarmiento y convergieron. Fue una convergencia pequeña, sin hostilidades; Sarmiento se aniquiló entero. DENDRO la registró como "convergencia menor, sin supervivientes" y la **dio de baja en τ 6913.204** con un sello. Escarda sobrevivió porque en el instante del contacto había bajado por la **vía I** a la garganta más profunda de Sarmiento, injertado a la X₇ de su mundo en un experimento suyo. Cuando la burbuja se aniquiló, la garganta se hundió con él por debajo de la escala de Planck y salió al Bulk: hizo la **vía III** sin quererlo. La descompresión dimensional le borró la cara. En el Bulk, donde τ y t están desacoplados, aprendió solo a volver a bajar y a emerger donde quería.
- **Lo que cree:** que los viajes de los MYTHS deformaron tanto la línea temporal que el Árbol ya no tiene arreglo: demasiadas ramas mal injertadas en un tronco que no las eligió. Un injertador sabe que un árbol así no se cura: se poda hasta el pie y se injerta de nuevo.
- **Su plan:** desde el Bulk, debajo de la Estación Raíz, **arrastra las ramas unas contra otras**. La pared de cada burbuja deja pasar lo que baja del Tronco a los universos; él está en el Tronco, así que puede tirar de cualquiera. Rompe los injertos topológicos de las ramas jóvenes (sabe hacerlo: es injertador) y deja que caigan contra sus vecinas. Empezó por las del primer salto (la suya) y sigue el orden de los saltos: ese es el patrón que detecta la Sección de Firmas. Cuando la N̂ de MYTH llegue a cero, quiere volver a la semilla y plantar un árbol nuevo de un solo tronco: él. La física dice que no se puede volver al Estado Nulo (Ŝ y N̂ no conmutan); él cree que sí.
- **Firma:** **ω = 1.0000i**. Ninguna rama puede tener una firma imaginaria; la de Escarda lo es porque ya no es una rama: es un injerto en el Árbol.
- **Nombre en clave:** DENDRO lo llama **el Injertador** desde el 12-06. Antes es "la firma imaginaria", "el tirón desde abajo", "la lectura imposible".
- **La gran ironía:** la Poda de la que huyeron los MYTHS era esta. Sus saltos crearon Sarmiento; Sarmiento creó a Escarda; Escarda es la Poda.

### 3.1 Silueta (16/12, antes de las 14:00)

Aparece en el **ÁRBOL**, en la franja del sustrato entre la base de MYTH y la Estación Raíz. Diseño propio:
- Una figura **alta y quieta**, de proporciones alargadas (unas nueve cabezas), brazos caídos y pegados al cuerpo, sin ropa reconocible: solo un contorno continuo.
- **Sin rostro**: la cabeza es un óvalo alargado vacío, sin rasgos, con una trama de puntos dentro que se mueve como estática.
- El contorno **se deshace en ramas finas**: desde hombros, dedos, costado y pies salen trazos fractales que se dividen y suben hasta conectar con las ramas reales del diagrama, como si él mismo fuera un injerto en el Árbol.
- Colores: contorno y ramas propias en `rama` (blanco: es parte del Árbol); los tramos donde sus ramas tocan las del Árbol, en `arma` (rojo: ahí está tirando). Interior vacío (fondo).
- Animación mínima: no se mueve; solo sus ramas crecen despacio y, a ratos, la figura sufre un salto de glitch. Su opacidad crece de 0.15 a las 00:00 a 1 a las 13:59. Con movimiento reducido, estática.
- Se dibuja con la capa vectorial y pasa por el tubo (curvatura, estela, aberración) como todo lo demás.
- Antes del 16/12 hay **vislumbres**: desde el 12-06, en el ÁRBOL, durante un solo fotograma cada varios minutos (con semilla del minuto) aparece un trazo vertical blanco en el sustrato.

## 4. Ramas catalogadas

### 4.1 Designación jerárquica

- Cada rama tiene un código que es su camino desde el tronco: `MYTH` y un segmento por nivel de ramificación, separados por `·`.
- **Qué significa compartir segmentos**: los niveles 1–3 son universos (ramas mayores). En las primarias antiguas, dos universos que comparten segmentos tienen X₇ parecidas y están cerca en el Bulk, aunque difieran en un módulo y por tanto en régimen mágico (Velmora y Ostrakh, Ferrum y Vael). En las primarias jóvenes, comparten el injerto que las rescató. El nivel 4 son **ramillas de Everett** de su universo padre: misma X₇, mismo régimen, otra historia (Antípoda, ramilla de Meridia).
- Longitud de los segmentos por nivel: **2, 3, 2, 1** caracteres (p. ej. `MYTH·4K·7A2·R9` es una rama de nivel 3; `MYTH·E2·N6P·A7·Y`, de nivel 4).
- Alfabeto: `0–9` y `A–Z` sin `I` ni `O` (para no confundir con `1` y `0`). Los caracteres de cada segmento salen de la semilla del padre; los hermanos nunca repiten segmento.
- Hay 13 ramas primarias (nivel 1). Siete son **jóvenes** (nacieron de un salto de los MYTHS) y seis son **antiguas**:

| Primaria | Origen | Contenido notable |
| --- | --- | --- |
| `MYTH·01` | Antigua (la primera) | Origen |
| `MYTH·2C` | Antigua | Halcyon, Halcyon-Prima |
| `MYTH·5T` | Antigua | Nadir, Kaelum |
| `MYTH·3H` | Antigua | Ferrum, Vael |
| `MYTH·E2` | Antigua | Meridia, Antípoda |
| `MYTH·8N` | Antigua | Ithaka, Nimbo |
| `MYTH·4K` | Joven · salto 1 | Velmora, Ostrakh; aquí estaba Sarmiento |
| `MYTH·R4` | Joven · salto 2 | Esmeril, Tálamo |
| `MYTH·9F` | Joven · salto 3 | Ceniza, Arbórea |
| `MYTH·KX` | Joven · salto 4 | Umbra, Lucerna |
| `MYTH·L6` | Joven · salto 5 | Brama, Corvex |
| `MYTH·7Y` | Joven · salto 6 | Tierra Gris, Solenne |
| `MYTH·ZZ` | Joven · salto 7 (el último) | Postrera |

### 4.2 Las 24 tierras nombradas

Conservan su lore; el código sustituye a la designación hexadecimal anterior, que se guarda como `semillaGlobo` para que su globo no cambie.

| Código | Antes | Nombre | ω | Magia | Tecnología | Planos anexos | Carácter |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MYTH·4K·7A2·R9 | B-0x01 | Velmora | 3.1416 | Mágica alta | Medieval arcana | Salón de los Juramentados, Hondura | Reinos de magos; defensas rúnicas |
| MYTH·4K·7A2·T3 | B-0x02 | Ostrakh | 3.1902 | Mundana | Militar industrial avanzada | Ninguno detectado | Estado militarizado; arsenal nuclear y orbital |
| MYTH·2C·H51·0A | B-0x03 | Halcyon | 5.0071 | Mundana | Utopía post-escasez | Ninguno | Sociedad pacífica gobernada por consenso |
| MYTH·2C·H51·0B | B-0x04 | Halcyon-Prima | 5.0074 | Mundana | Utopía post-escasez | Ninguno | Rama hermana casi idéntica de Halcyon (Δω₀ mínimo) |
| MYTH·9F·E07·K4 | B-0x05 | Ceniza | 2.7183 | Mágica baja | Postapocalíptica | Hondura Gris | Sobrevivientes de una guerra antigua; armas recuperadas |
| MYTH·9F·E07·W1 | B-0x06 | Arbórea | 2.7461 | Mágica alta | Biomágica | Cielo de las Copas, Raigambre | Bosques continentales; dioses vivos que caminan |
| MYTH·5T·32M·N8 | B-0x07 | Nadir | 6.0220 | Mágica baja | Submarina | Abismo de Tetis | Civilización oceánica en ciudades sumergidas |
| MYTH·5T·32M·X6 | B-0x08 | Kaelum | 6.0598 | Mágica alta | Imperio aéreo | Alto Cielo | Islas flotantes sostenidas por maná |
| MYTH·7Y·A4R·G2 | B-0x09 | Tierra Gris | 1.6180 | Mundana | Equivalente a la nuestra (2026) | Ninguno detectado | No sabe que existe el Árbol |
| MYTH·7Y·A4R·L7 | B-0x0A | Solenne | 1.6532 | Mágica alta | Teocracia solar | Morada del Sol, Patio de los Elegidos | Panteón solar activo; lanzas divinas |
| MYTH·3H·W8C·F5 | B-0x0B | Ferrum | 4.6692 | Mundana | Industrial a vapor | Ninguno | Imperios de hierro y carbón |
| MYTH·3H·W8C·V1 | B-0x0C | Vael | 4.7120 | Mágica baja | Agraria | Valle Quieto | Pueblos de brujas de campo; muy aislada |
| MYTH·KX·0R9·M3 | B-0x0D | Umbra | 0.5772 | Mágica alta | Necromántica | Inframundo abierto (la garganta toca la superficie) | Los muertos gobiernan junto a los vivos |
| MYTH·KX·0R9·M4 | B-0x0E | Lucerna | 0.6011 | Mágica alta | Arcana luminosa | Cielo de Cristal | Orden de paladines; odia lo que viene de Umbra |
| MYTH·E2·N6P·A7 | B-0x0F | Meridia | 7.3890 | Mundana | Espacial | Ninguno | Colonizó su sistema solar |
| MYTH·E2·N6P·A7·Y | B-0x10 | Antípoda | 7.3912 | Mundana | Espacial | Ninguno | Reflejo de Meridia con historia invertida: es una ramilla de Everett de Meridia |
| MYTH·L6·T2K·B8 | B-0x11 | Brama | 2.2361 | Mágica baja | Nómada | Las Llanuras de Ceniza Blanca | Clanes de jinetes y chamanes |
| MYTH·L6·T2K·C0 | B-0x12 | Corvex | 2.2794 | Mundana | Ciberpunk corporativa | Ninguno | Corporaciones con ejércitos privados y drones |
| MYTH·R4·J9E·E1 | B-0x13 | Esmeril | 9.0001 | Inestable | Desconocida | Desconocidos | Constantes a la deriva; lecturas imposibles |
| MYTH·R4·J9E·T6 | B-0x14 | Tálamo | 9.0315 | Mágica baja | Renacentista | Galería de los Sueños | Artistas y alquimistas |
| MYTH·8N·F3W·H2 | B-0x15 | Ithaka | 3.8197 | Mundana | Marítima clásica | Ninguno | Archipiélagos de ciudades-estado |
| MYTH·8N·F3W·N9 | B-0x16 | Nimbo | 3.8420 | Mágica alta | Atmosférica | Ojo de la Tormenta | Pueblos que viven dentro de nubes |
| MYTH·01 | B-0x17 | Origen | 1.0000 | Mágica alta | Desconocida | Garganta Primera (un inframundo tan hondo que un día allí son siglos fuera) | La primera rama que brotó de MYTH. Su firma es indistinguible de la del tronco: DENDRO la usa como **ancla de calibración** de todas las ω |
| MYTH·ZZ | B-0x18 | Postrera | 1.0009 | Inestable | Desconocida | Ninguno | La última rama nacida, del séptimo salto, pegada al tronco. No debería existir |

> En las tierras "Inestable" el expediente muestra la ω con dígitos que oscilan (decorativo; el valor de datos es fijo).

**Reconciliación Origen / MYTH**: Origen deja de ser "el ancla del Árbol" (ese papel es de MYTH, el tronco) y pasa a ser la **primera rama**, nacida en la base del tronco y usada como ancla de calibración. Origen y Postrera, la más vieja y la más joven, brotan las dos de la base de MYTH: su contacto (C-12) no es una colisión cualquiera, sino un desgarro en la base del tronco que **parte N̂ a la mitad**. MYTH no colisiona; Origen sí.

### 4.3 Aspecto de los globos

Cada globo es procedural con semilla `hash(semillaGlobo)` (por defecto, el código; en las 24, su designación antigua). Nada copiado de ningún mapa salvo **Tierra Gris**. `mar` es la fracción de océano (por defecto 0.55) y `rugosidad` la escala del ruido.

| Nombre | mar | rugosidad | Otros | Por qué |
| --- | --- | --- | --- | --- |
| Ostrakh | 0.45 | 0.8 | | Masas continentales compactas, militarizadas |
| Ceniza | 0.30 | 0.9 | | Desiertos de una guerra antigua |
| Arbórea | 0.40 | 1.2 | | Bosques continentales |
| Nadir | 0.85 | 1.0 | | Civilización oceánica |
| Kaelum | 0.80 | 2.0 | | Islas flotantes |
| Tierra Gris | — | — | máscara real | Equivalente a la nuestra |
| Vael | 0.50 | 0.7 | | Valles agrarios amplios |
| Umbra | 0.50 | 1.4 | | Costas desgarradas por el inframundo abierto |
| Esmeril | 0.50 | 1.6 | inestable | Constantes a la deriva |
| Ithaka | 0.72 | 1.8 | | Archipiélagos |
| Nimbo | 0.65 | 1.3 | | Tierras bajo nubes |
| Origen | 0.50 | 1.0 | | La primera rama |
| Postrera | 0.60 | 1.5 | inestable | No debería existir |
| MYTH | 0.50 | 1.1 | | El tronco (semilla `MYTH`) |

Las ramas generadas sacan `mar` (0.3–0.85), `rugosidad` (0.7–2.0) e `inestable` (si su régimen lo es) de su semilla.

### 4.4 Ramas generadas

Tablas para `data/generacion.js`; las proporciones van en `config.multiverso`.

- **Régimen mágico**: en los niveles 1–3, Mundana 40 %, Mágica baja 25 %, Mágica alta 25 %, Inestable 10 % (en ramas jóvenes, Inestable 30 % a costa de Mundana). En el nivel 4 (ramillas) se hereda del padre, igual que la tecnología con un 70 % de probabilidad.
- **Tecnología**: Agraria, Medieval, Medieval arcana, Industrial a vapor, Atómica temprana, Digital, Ciberpunk corporativa, Espacial, Orbital, Post-escasez, Postapocalíptica, Nómada, Submarina, Subterránea, Glacial, Fluvial, Biomágica, Arcana, Teocrática, Desconocida.
- **Origen**: "Antigua" o "Joven · salto n.º k de MYTH" (según su rama primaria).
- **Postura** (solo si tiene pareja): hostil 22 %, mutua-hostil 8 %, evacuación 15 %, aislamiento 15 %, negociación 15 %, ignorancia 25 %.
- **Desenlace**: aniquilación 40 %, superviviente 35 %, fusión 25 %.
- **Armas** (si es hostil): una o dos de la tabla de armas, al azar con semilla.
- **ω**: hereda la del padre con una desviación que se reduce con el nivel; dos hermanas difieren entre 0.0003 y 0.05.
- Sin nombre: en pantalla se ven por su código y el expediente dice `DENOMINACIÓN LOCAL: NO CATALOGADA`.

## 5. Parejas y cadena de colisiones

### 5.1 Parejas nombradas

Instantes de contacto con espaciado decreciente. Δω₀ = `|ω_a − ω_b|` (aquí solo como referencia).

| ID | Rama A | Rama B | Δω₀ | Contacto | Postura | Agresor | Armas | Desenlace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | Velmora | Ostrakh | 0.0486 | 2026-10-27 03:17 | hostil | Ostrakh | Ostrakh: misil interrama | superviviente: Velmora (las runas desvían los misiles; Ostrakh colapsa) |
| C-02 | Halcyon | Halcyon-Prima | 0.0003 | 2026-11-09 11:40 | negociación | — | — | fusión → *Halcyon ∪ Halcyon-Prima* |
| C-03 | Ceniza | Arbórea | 0.0278 | 2026-11-18 22:05 | mutua-hostil | Ceniza | Ceniza: artillería de chatarra · Arbórea: raíces estranguladoras | aniquilación |
| C-04 | Nadir | Kaelum | 0.0378 | 2026-11-25 07:52 | evacuación | — | — | fusión → *Nadir ∪ Kaelum* |
| C-05 | Tierra Gris | Solenne | 0.0352 | 2026-11-30 19:26 | hostil | Solenne | Solenne: lanza solar | aniquilación (Tierra Gris nunca supo qué pasó) |
| C-06 | Ferrum | Vael | 0.0428 | 2026-12-04 02:13 | aislamiento | — | — | superviviente: Vael |
| C-07 | Umbra | Lucerna | 0.0239 | 2026-12-07 16:48 | mutua-hostil | Lucerna | Lucerna: lluvia de juicio · Umbra: marea de los muertos | aniquilación |
| C-08 | Meridia | Antípoda | 0.0022 | 2026-12-09 09:31 | negociación | — | — | aniquilación |
| C-09 | Brama | Corvex | 0.0433 | 2026-12-11 21:07 | hostil | Corvex | Corvex: misil interrama, enjambre de drones de fase | superviviente: Corvex |
| C-10 | Esmeril | Tálamo | 0.0314 | 2026-12-12 13:44 | ignorancia | — | — | aniquilación |
| C-11 | Ithaka | Nimbo | 0.0223 | 2026-12-13 05:20 | evacuación | — | — | fusión → *Ithaka ∪ Nimbo* |
| C-12 | Origen | Postrera | 0.0009 | 2026-12-14 23:58 | ignorancia | — | — | `colapso`: desgarro en la base de MYTH (N̂ a la mitad) |

### 5.2 Parejas generadas

- La cadena empieza después de C-01: la primera pareja generada toca unos 6 ciclos después y desde ahí cada vez más deprisa; en las últimas 14 horas tocan unas 60. Las fórmulas están en `02-diseno.md §4.6`.
- Las parejas se forman entre hermanas (y algunas primas) que todavía no tienen pareja. **El orden sigue los saltos de los MYTHS**: primero las ramas del salto 1, luego las del 2, y así; las antiguas, al final. Es el patrón que descubre la Sección de Firmas.
- Designación: `C-0013`, `C-0014`… por orden de contacto.

## 6. Armas (siempre en rojo)

| Arma | Usada por | Descripción para expedientes |
| --- | --- | --- |
| Misil interrama | Ostrakh, Corvex | Proyectil balístico con cabeza de disrupción de firma: sintonizado a la ω enemiga |
| Enjambre de drones de fase | Corvex | Miles de drones que desestabilizan el aislante de fase |
| Artillería de chatarra | Ceniza | Cañones reconstruidos, poco precisos, muy numerosos |
| Lanza solar | Solenne | Haz divino canalizado por el panteón a través de la Morada del Sol |
| Lluvia de juicio | Lucerna | Bombardeo de luz consagrada desde el Cielo de Cristal |
| Marea de los muertos | Umbra | Ejército que cruza por el inframundo abierto (responde a Lucerna) |
| Raíces estranguladoras | Arbórea | Los dioses de Arbórea empujan raíces a través del contacto (respuesta defensiva) |

Ids: `misil-interrama`, `enjambre-drones`, `artilleria-chatarra`, `lanza-solar`, `lluvia-juicio`, `marea-muertos`, `raices-estranguladoras`. Las parejas generadas hostiles usan las mismas.

## 7. Calendario de revelaciones

Todas las pistas, por instante (Bogotá). "Registro" = evento fijo en `data/eventos.js`; "general" / "dirección" = canal de COMUNICACIONES; "archivo" = documento; "orden" = respuesta de la terminal.

| Instante | Dónde | Pista | Qué revela |
| --- | --- | --- | --- |
| 10-20 00:00 | registro | Anomalía de firma entre Velmora y Ostrakh | Arranque |
| 10-20 08:00 | general G-01 | Bienvenida; "anomalías menores, dentro de lo esperable" | El tono oficial |
| 10-24 03:33 | registro | `ECO SIN ORIGEN BAJO EL SUSTRATO · DESCARTADO COMO RUIDO` | Primera anomalía sin explicar |
| 10-27 03:17 | registro | Contacto C-01 | |
| 10-27 03:18 | registro (corrupto fijo) | `…TIRÓN ░░ DESDE ABAJO ░░ 0.4 PULSOS ANTES DEL CONTACTO…` | El sustrato se movió antes que las ramas |
| 10-27 09:00 | dirección D-01 | Kesh: C-01 "no era posible"; adjunta los informes de Iriarte que se retuvieron | Lo que no se dijo |
| 10-29 07:12 | registro (corrupto fijo) | `A. KESH RENUEVA CREDENCIAL DE DIRECCIÓN · NOTA: P░ST░░░A` | Pista secundaria de la clave |
| 11-01 | dirección D-02 | Marín: Ostrakh calla; el tirón desde abajo precedió al contacto | |
| 11-05 | registro + dirección D-03 | "El patrón no es aleatorio" / Marín: las convergencias siguen **el orden en que nacieron las ramas jóvenes**. "¿Quién más conoce ese orden?" | Patrón |
| 11-08 04:40 | registro | `LECTURA ω = 1.0000i EN EL SUSTRATO · DESCARTADA COMO ERROR DE SENSOR` | Firma imposible |
| 11-08 | dirección D-04 | Marín: tres sensores independientes leen la firma imaginaria | |
| 11-08 → | orden `omega i` | Muestra la lectura; antes, `SIN LECTURAS` | |
| 11-10 | dirección D-05 · archivo CLAS-MYT-05, CLAS-RAM-J | Kesh cuenta quiénes son los MYTHS y los siete saltos; adjunta el informe de Varga sobre Halcyon | MYTHS y ramas jóvenes |
| 11-13 | dirección D-06 | Iriarte, desde las ruinas de Ostrakh: "alguien de pie en el contacto, alto, quieto, sin cara; las ramas se le acercaban como a un tutor" | Vislumbre |
| 11-15 | registro | "Algo en la base del tronco tira de las ramas hacia dentro" | |
| 11-17 | general G-05 | "No comenten rumores sobre *alguien en el contacto*" | El rumor se filtra |
| 11-19 | dirección D-07 | Marín reenvía el mensaje vegetal de Arbórea; la firma imaginaria se mueve | |
| 11-22 | dirección D-08 · archivo CLAS-SUS-i | Marín: la firma no está en ninguna burbuja: salió al Bulk por la **vía III** y está debajo de la Estación | Tránsito vertical |
| 11-26 02:02 | registro (corrupto fijo) | `INJ░RTO NO AUTORIZADO EN EL NUDO MYTH·4K·7A2` | Primera vez la palabra "injerto" |
| 12-01 | dirección D-09 | Informe de Varga sobre Tierra Gris + Hisame contacta por primera vez | Los MYTHS hablan |
| 12-03 05:05 | registro (corrupto fijo) | `░░ R. ESC░RDA ░░ SARMIENTO ░░ BAJA τ 6913 ░░` | Nombre |
| 12-04 | dirección D-10 · órdenes `sarmiento`, `escarda` | Marín encuentra la baja de Sarmiento en el archivo de la Estación | Origen del antagonista |
| 12-06 | dirección D-11 · archivo CLAS-INJ-01 | Kesh lo identifica y le da nombre en clave: **el Injertador** | Revelación |
| 12-06 → | ÁRBOL | Vislumbres de un solo fotograma en el sustrato | |
| 12-08 | dirección D-12 · archivo CLAS-CNT-00 / general G-08 | Kesh suspende las contenciones: nunca funcionaron / el general pide duplicarlas | Contradicción máxima |
| 12-09 | — | Cae Calcina | |
| 12-10 | dirección D-13 | Odalys confiesa: la Poda de la que huyeron llevaba la firma del Injertador; bajan a enfrentarlo | La ironía |
| 12-12 03:00 | dirección D-14 y general (sin remitente) | Manifiesto del Injertador, firmado `ω = 1.0000i` | Él habla. Es el único mensaje de dirección que todos ven |
| 12-13 | — | Cae Maresa | |
| 12-14 23:58 | registro | Contacto Origen / Postrera: desgarro en la base de MYTH | |
| 12-15 | dirección D-15, D-16 / general G-09 | Hisame se despide; última transmisión de Kesh / "mantenimiento programado al pulso 583" | |
| 12-15 | — | Cae Hisame | |
| 12-16 00:00 | ÁRBOL · orden `injertador` | Aparece la silueta; la orden responde | Recta final |
| 12-16 10:00 | dirección D-17 | Ilvane: Odalys bajó y no volvió | |
| 12-16 14:00 | todo | Cae Ilvane. MYTH falla. Colapso | |

## 8. Eventos fijos del registro

Texto en mayúsculas, estilo telegrama. Además de los de la tabla anterior:

| Instante | Tipo | Texto |
| --- | --- | --- |
| 10-20 00:00 | SISTEMA | ANOMALÍA DE FIRMA EN EL CUADRANTE BAJO DEL ÁRBOL. Δω ENTRE VELMORA Y OSTRAKH BAJO EL UMBRAL SEGURO. |
| 10-21 09:30 | SISTEMA | LA DIRECTORA KESH ELEVA LA ALERTA A ÁMBAR. |
| 10-23 14:10 | HOSTIL | OSTRAKH DETECTA A VELMORA EN SUS RADARES. MOVILIZACIÓN GENERAL. |
| 10-25 03:17 | HOSTIL | OSTRAKH LANZA EL PRIMER MISIL INTERRAMA. INTERCEPTADO POR DEFENSAS RÚNICAS. |
| 10-27 03:17 | COLISIÓN | CONTACTO. PRIMERA COLISIÓN CONFIRMADA: VELMORA / OSTRAKH. |
| 11-01 06:00 | SISTEMA | OSTRAKH DEJA DE TRANSMITIR. |
| 11-05 12:00 | SISTEMA | CONVERGENCIAS EN RAMAS QUE NO ESTABAN EN RIESGO. EL PATRÓN NO ES ALEATORIO. |
| 11-15 18:20 | SISTEMA | HIPÓTESIS: ALGO EN LA BASE DEL TRONCO TIRA DE LAS RAMAS HACIA DENTRO. |
| 11-28 19:26 | HOSTIL | SOLENNE DECLARA HEREJÍA A LA «TIERRA SIN DIOSES» Y PREPARA LA LANZA SOLAR. |
| 12-02 00:00 | SISTEMA | FALLOS INTERMITENTES EN LA ESTACIÓN RAÍZ. IRREGULARIDADES EN EL META-TIEMPO τ. |
| 12-09 21:05 | SISTEMA | COHESIÓN N̂ DE MYTH POR DEBAJO DE 0.60. PÉRDIDA DE SOPORTE EN LA CORTEZA. |
| 12-10 06:00 | SISTEMA | ORIGEN Y POSTRERA CONVERGEN EN LA BASE DE MYTH. SI ORIGEN CAE, ARRASTRA LA BASE DEL TRONCO. |
| 12-14 23:58 | COLISIÓN | CONTACTO ORIGEN / POSTRERA. DESGARRO EN LA BASE DE MYTH. N̂ PARTIDA A LA MITAD. |
| 12-15 22:00 | SISTEMA | ÚLTIMA TRANSMISIÓN DE LA DIRECTORA KESH. |
| 12-16 00:00 | SISTEMA | FIRMA ω = 1.0000i EN LA BASE DE MYTH. |
| 12-16 14:00 | SISTEMA | MYTH HA PERDIDO LA COHESIÓN. |

Las parejas generadas añaden sus propias líneas (convergencia, contacto, ataque, desenlace); cuando en un mismo pulso hay más de tres contactos, se agrupan en una línea (`14 CONTACTOS CATALOGADOS EN EL PULSO 7581.402`).

## 9. Comunicaciones

### 9.1 Canal general · "A TODO EL PERSONAL"

Firma: **Lucio Ambrís, Subdirección de Continuidad Operativa**. Cada lunes a las 08:00 (inicio de turno). Tono: comunicado de empresa que finge control; cada mensaje pide aplicar un protocolo concreto.

| ID | Instante | Asunto | Contenido | Protocolo que pide |
| --- | --- | --- | --- | --- |
| G-01 | 10-20 08:00 | Bienvenida al turno · Semana de la Excelencia Operativa | Bienvenida (contenido del antiguo M-001, con atajos). "Se han detectado anomalías menores de firma, dentro de lo esperable para la estación." Recuerda PROC-OPR-01 | PC-11 a Velmora y Ostrakh, "como medida de cortesía" |
| G-02 | 10-27 08:00 | Incidencia gestionada con éxito | El contacto de esta madrugada es "un evento de contacto controlado entre dos ramas periféricas". Felicita al turno de noche "por su serenidad" | PC-14 a todas las parejas en aproximación |
| G-03 | 11-03 08:00 | Recordatorio: higiene de credenciales | Repasa PROC-ADM-01: "no use nombres de ramas catalogadas como clave". Presume del "índice de contención del 100 %" | PC-11 diario a cada rama observada |
| G-04 | 11-10 08:00 | Una buena noticia: Halcyon | La fusión es "una integración armoniosa de dos ramas que comparten valores". Invita a "tomar ejemplo" | PC-21 a las parejas que sigan en aproximación |
| G-05 | 11-17 08:00 | Optimización de recursos | Las lecturas imposibles del sustrato "son artefactos de calibración y deben ignorarse". "Por favor, no comenten rumores sobre *alguien en el contacto*" | PC-30 a toda pareja hostil |
| G-06 | 11-24 08:00 | Gracias por su resiliencia | Llama a las aniquilaciones "reconfiguración del catálogo". Sustituye el minuto de silencio por "una pausa activa de 30 latidos" | PC-23 a toda rama con gargantas |
| G-07 | 12-01 08:00 | Nueva escala del indicador N̂ | "N̂ se mostrará en una escala más intuitiva". "La Dirección agradece su compromiso" | PC-14 masivo, "sin excepciones" |
| G-08 | 12-08 08:00 | Refuerzo del Plan de Contención | Pide duplicar aplicaciones: 20 por operador y turno. (El mismo ciclo, dirección las suspende) | PC-11 y PC-14, doble |
| G-X | 12-12 03:00 | (sin asunto) | El manifiesto del Injertador, con remitente vacío y texto parcialmente corrupto | — |
| G-09 | 12-15 08:00 | Mantenimiento programado | "Mañana, al pulso 583, los sistemas entrarán en una ventana de mantenimiento. No es necesario guardar nada." "Ha sido un periodo extraordinario" | PC-90 a MYTH, "si le sobra tiempo" |

### 9.2 Canal de dirección · "DIRECCIÓN · SOLO CREDENCIAL"

Sin credencial, la bandeja muestra `CANAL DE DIRECCIÓN · SELLADO` y el número de mensajes cifrados (`▒ 7 MENSAJES`), sin asuntos.

| ID | Instante | De | Asunto | Contenido |
| --- | --- | --- | --- | --- |
| D-01 | 10-27 09:00 | Directora Kesh | Velmora / Ostrakh | "No era posible: su Δω₀ llevaba trescientos ciclos estable." Ordena no informar al personal. Adjunta los informes de Iriarte retenidos (antiguos M-002 "Los magos lo sienten" y M-003 "Van a disparar") |
| D-02 | 11-01 10:00 | Analista Teo Marín | Ostrakh calla | El sustrato se movió 0.4 pulsos antes que las ramas. "Algo tiró desde abajo" |
| D-03 | 11-05 13:00 | Teo Marín | El patrón | Las convergencias siguen el orden en que nacieron las ramas jóvenes, salto a salto. "¿Quién más conoce ese orden?" |
| D-04 | 11-08 06:00 | Teo Marín | ω = 1.0000i | Tres sensores independientes leen una firma imaginaria. "No es un error. Ninguna rama puede tener esta firma" |
| D-05 | 11-10 09:00 | Directora Kesh | Lo que no les contamos | Los MYTHS, la Poda, los siete saltos, las ramas jóvenes; DENDRO lo consintió. Adjunta el informe de Varga sobre Halcyon (antiguo M-004) |
| D-06 | 11-13 22:00 | Agente Iriarte | Alguien en el contacto | Desde las ruinas de Ostrakh: una figura alta, quieta, sin cara; "las ramas se le acercaban como a un tutor" |
| D-07 | 11-19 11:00 | Teo Marín | Reenvío: Arbórea | El mensaje vegetal (antiguo M-005) y la firma imaginaria, que se mueve |
| D-08 | 11-22 16:00 | Teo Marín | Vía III | La firma bajó por X₇ hasta el Bulk y no ha emergido en ninguna burbuja. "Nada que haga la vía III debería poder quedarse aquí. Está en el sustrato. Debajo de nosotros" |
| D-09 | 12-01 07:00 | Agente Varga · Hisame | Tierra Gris · Un farol | El informe de Tierra Gris (antiguo M-006) y, a continuación, el primer mensaje de Hisame: el farol y sus cuatrocientas llamas apagadas |
| D-10 | 12-04 12:00 | Teo Marín | Sarmiento | La baja de τ 6913.204, el nombre R. Escarda en una lista de supervivientes "no aplicable" |
| D-11 | 12-06 09:00 | Directora Kesh | El Injertador | Identificación y nombre en clave. "Nosotros dimos de baja su mundo con un sello y una línea en el registro" |
| D-12 | 12-08 07:30 | Directora Kesh | A todo el personal de dirección | Suspende las contenciones (antiguo M-007): "nunca cambiaron una sola lectura; ver CLAS-CNT-00" |
| D-13 | 12-10 20:00 | Odalys Vey | Confesión | La Poda llevaba su firma. "Huimos de él hacia él." Bajarán por la vía III: "no salten detrás de nosotros" |
| D-14 | 12-12 03:00 | ω = 1.0000i | (sin asunto) | Manifiesto del Injertador: el Árbol enfermo, la poda hasta el pie, el árbol de un solo tronco. Nunca dice su nombre |
| D-15 | 12-15 05:00 | Hisame | Contabilidad | "Calcina ardió y no volvió. Maresa sostuvo la base hasta que Origen se soltó. Mi farol tiene once llamas" |
| D-16 | 12-15 22:00 | Directora Kesh | Si alguien lee esto | Despedida (antiguo M-008), con "MYTH no aguantará más allá del pulso 583" |
| D-17 | 12-16 10:00 | Ilvane | — | "Odalys bajó. No ha vuelto. Sostengo lo que puedo, y puedo poco." |

Los antiguos M-001…M-008 desaparecen como mensajes sueltos: M-001 pasa a G-01 y el resto se integra en dirección como se indica.

## 10. Archivo

Todos los documentos llevan cabecera de documentación interna:

```
DENDRO · ESTACIÓN RAÍZ                     PROC-CNV-07 · REV. 12
PROCEDIMIENTO ANTE CONVERGENCIA INTER-RAMA
EMITIDO τ 7389.000 · REVISADO τ 7501.250 · CLASIFICACIÓN: OPERATIVA
APROBADO: A. KESH (DIRECCIÓN) · L. AMBRÍS (CONTINUIDAD OPERATIVA)
```

### 10.1 Manuales y procedimientos (visibles)

| Código | Título | Rev. | Contenido |
| --- | --- | --- | --- |
| MAN-OPR-01 | Manual del operador · consola DR-7 | 9 | Una sección por vista: qué muestra, cómo se lee, teclas y gestos; lectura de la barra de estado y de τ |
| MAN-TER-01 | Manual de la terminal | 4 | Órdenes visibles, sintaxis, historial, latencia. "No existen órdenes no documentadas" (falso) |
| PROC-OPR-01 | Protocolo de turno | 7 | Inicio de turno, ronda cada 0.125 c, escalado a dirección, cierre y relevo |
| PROC-FIR-02 | Lectura de firmas ω | 4 | ω, Δω, umbral seguro, lecturas inestables; "toda lectura imposible se descarta como error de sensor" (añadido en la rev. 4, τ 7535) |
| PROC-CNV-07 | Procedimiento ante convergencia inter-rama | 12 | Antiguo PROTOCOLO-07 con las ventanas en τ y la nota manuscrita "ya no son raras" |
| PROC-HST-03 | Procedimiento ante hostilidades inter-rama | 3 | No intervención, PC-30, registrar, no responder a beligerantes |
| PROC-MYT-00 | Procedimiento ante pérdida de cohesión de MYTH | 1 | Verificar N̂, notificar, `[PASO 3 ELIMINADO POR DIRECCIÓN]`, aplicar PC-90. Con credencial, el paso 3 se lee: "No hay paso 3" |
| PROC-AIS-01 | Aislantes de fase | 6 | Antiguo PROTOCOLO-01 |
| CAT-CNT-09 | Catálogo de protocolos de contención | 2 | Los protocolos de §11 con su objetivo y su efecto esperado |
| PROC-ADM-01 | Política de credenciales de dirección | 3 | **Contiene la pista de la clave** (§10.3) |
| INF-TIM-0 | Informe TIm-0 · el Árbol Imaginario | 5 | Resumen de `00-arbol-imaginario.md` para personal nuevo: raíces y Estado Nulo, Bulk M₁₁ y meta-tiempo, Ignición Beta y X₇, maná y regímenes, planos anexos, deidades sostenidas por la fe, firma de rama, vías I–III; y por qué DENDRO dibuja MYTH como tronco |

### 10.2 Clasificados (con credencial de dirección; algunos, además, desde un instante)

| Código | Título | Desde | Contenido |
| --- | --- | --- | --- |
| CLAS-MYT-05 | Los Cinco | 11-10 09:00 | Expediente de los guardianes de MYTH (§2.2) |
| CLAS-RAM-J | Informe de ramas jóvenes | 11-10 09:00 | Los siete saltos, sus instantes en τ y las primarias que crearon |
| CLAS-SUS-i | Firma imaginaria en el sustrato | 11-22 16:00 | Lecturas de ω = 1.0000i y su descenso por la vía III |
| CLAS-INJ-01 | Expediente «EL INJERTADOR» | 12-06 09:00 | Sarmiento, Ruy Escarda, su caída, su plan |
| CLAS-CNT-00 | Evaluación de eficacia de contención | 12-08 07:30 | "Eficacia medida: 0.000 %. Desde τ 7389 el panel se mantiene por el bienestar del personal" |
| NEGRO | [CLASIFICADO NEGRO] | (orden `semilla`) | El Estado Nulo \|Ω₀⟩ y por qué no se puede volver a él ([Ŝ, N̂] ≠ 0). Kesh ya no pregunta si el Árbol vuelve a la semilla, sino qué pasa si alguien lleva N̂ a cero creyendo que sí |

### 10.3 Pista de la credencial de dirección

- **Clave:** `POSTRERA` (se compara sin mayúsculas, tildes ni espacios). En `config.js` solo se guarda su hash.
- **Pista principal** (PROC-ADM-01, visible): la política enumera reglas ("no use nombres de ramas catalogadas", "no use la misma clave dos turnos"…) y, al pie, una `[ANOTACIÓN MANUSCRITA ESCANEADA]`: *"Regla 4: incumplida. Elegí la rama que no debería existir. Nadie la busca. — A.K."*
- **Para resolverla** hay que encontrar qué rama "no debería existir": lo dice el expediente de Postrera (también `escanear` / `examinar`).
- **Pista secundaria** (registro, 10-29 07:12, entrada corrupta fija): `A. KESH RENUEVA CREDENCIAL DE DIRECCIÓN · NOTA: P░ST░░░A`.
- G-03 remite a PROC-ADM-01.

## 11. Protocolos de contención

| Código | Nombre | Objetivo | Estados válidos | Mejora visual (transitoria, ~30 s) |
| --- | --- | --- | --- | --- |
| PC-11 | ESTABILIZAR FIRMA | Universo | Cualquiera salvo aniquilada | La ω deja de oscilar; estabilidad +15 en la barra |
| PC-14 | REFORZAR AISLANTE | Pareja | Estable, aproximación | Anillo de aislante entre los globos; Δω mostrada +8 % |
| PC-21 | DESACOPLAR RAMAS | Pareja | Aproximación | Los globos se separan un poco; la cuenta atrás "gana" tiempo |
| PC-23 | SELLAR GARGANTA | Universo con planos anexos | Cualquiera salvo aniquilada | Los planos anexos del expediente se marcan `SELLADO` |
| PC-30 | INTERDICCIÓN DE FASE | Pareja hostil | Aproximación hostil, hostilidades | Los misiles se ven interceptados (arcos discontinuos) |
| PC-40 | PODA PREVENTIVA | Universo | Estable, aproximación | La rama se atenúa en el ÁRBOL. Doble confirmación |
| PC-90 | TRANSFUSIÓN DE COHESIÓN | MYTH | Siempre (aparece desde 12-01) | La barra de N̂ sube 0.05 |

Tras la mejora, la lectura vuelve en silencio a su valor real. El resultado siempre dice `APLICADO · MEJORA DETECTADA` (desde el 12-08, con credencial, añade `· EFICACIA MEDIDA 0.000 %`). Con p ≥ 0.9 el panel responde `SIN ENERGÍA EN EL SUSTRATO`.

## 12. Órdenes de la terminal

| Orden | Visible | Efecto |
| --- | --- | --- |
| `credencial` | sí | Pide la clave de dirección (eco con `*`). `credencial cerrar` o `revocar` la cierra |
| `contener <PC-xx> <objetivo>` | sí | Aplica un protocolo; abre CONTENCIÓN con él preparado. `aislar <objetivo>` queda como alias de PC-40 |
| `raiz` | oculta | Muestra el logo grande y el lema |
| `semilla` | oculta | Desbloquea el documento CLASIFICADO NEGRO |
| `kesh` | oculta | Mensaje personal de la Directora |
| `quien vigila` | oculta | "LA ESTACIÓN RAÍZ NO TIENE OBSERVADOR. NADIE LA SOSTIENE." |
| `n-hat` | oculta | Cohesión N̂ de MYTH, con barra |
| `omega i` | oculta | Desde 11-08: la lectura imaginaria y su posición; antes, `SIN LECTURAS` |
| `sarmiento` | oculta | Desde 12-04: `MYTH·4K·7A2·S5 · SARMIENTO · DADA DE BAJA EN τ 6913.204 · CONVERGENCIA MENOR, SIN SUPERVIVIENTES`; antes, `RAMA NO CATALOGADA` |
| `escarda` | oculta | Desde 12-04: `R. ESCARDA · MAESTRO INJERTADOR · SARMIENTO · ESTADO: NO CONSTA`; con credencial y desde 12-06, remite a CLAS-INJ-01 |
| `myth` | oculta | Estado de los cinco guardianes (con credencial; si no, `SELLADO`) |
| `injertador` | oculta | Antes de 12-06, `ORDEN DESCONOCIDA`; luego, `SIN RESPUESTA`; el 16/12, en rojo: `\|ω = 1.0000i⟩ · YA ESTOY DEBAJO DE USTEDES.` |

## 13. Colapso final (16/12, 14:00)

Pantalla de error: la primera línea va en una franja ámbar con texto oscuro; el resto, en texto blanco sobre fondo oscuro dentro de un marco ámbar. `{ramas}` se sustituye por `ramasAfectadasFinal` con separador de miles (por defecto `1 048 576`).

```
ERROR FATAL 0x0000DEAD
MYTH HA PERDIDO LA COHESIÓN · SUSTRATO M11 SIN SOPORTE

  ramas afectadas ..... {ramas} / {ramas}
  cohesión N̂ ......... 0.000
  firma en la base .... ω = 1.0000i
  meta-tiempo τ ....... DETENIDO

LA ESTACIÓN RAÍZ NO PUEDE MANTENER EL ÁRBOL.
GUARDE EL REGISTRO. TODA RAMA SOSTENÍA AL ÁRBOL.

[ PRESIONE CUALQUIER TECLA ]
```

Después (tras una tecla): arranque fallido (módulos en `FALLO`), el mapa con el Árbol desintegrándose de las hojas al tronco —las ramas de la silueta son lo último en apagarse— y, al final, solo un punto blanco (la semilla) y el cursor parpadeando. La terminal sigue respondiendo solo a `colapso.comandosPermitidos` (por defecto, `semilla`). Después del colapso, bajo la semilla aparece `τ DETENIDO HACE 8.417 c`.
