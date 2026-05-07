# Magnify Studio — brief de contexto

> Documento para dar a una IA todo lo que necesita saber antes de generar contenido para Studio.
> Última actualización: 2026-04-25.

---

## 0. CLI · `studio validate`

Antes de generar el PDF (que tarda minutos en headless o requiere browser), validar el YAML en consola:

```bash
node studio-validate.js path/to/dossier.yaml
node studio-validate.js path/to/dossier.yaml --imgs path/to/imgs   # si las imágenes viven en otro dir
```

Comprueba sin abrir Studio:
- **Imágenes**: cada `visual_id: imgN` referenciado tiene archivo (`imgN.svg|png|jpg|jpeg|webp|gif`) en el dir indicado. Reporta como **error fatal** (exit code 1).
- **Presupuesto de palabras** por tipo de sección (mismas reglas que el `validateCSL` del motor): titulares ≤12 palabras, items de lista ≤30 (≤22 con 5+ items), pasos de framework ≤24, cuerpo de `seccion-cuerpo` 70-180 según slots ocupados.
- **Antipatrones**: `stats`/`stats-6` sin `metodo:`/`nota:`/`fuente:` declarado, `citas-clientes` con autor consultor (anti-pattern del corpus de case studies).

Exit codes: `0` OK (con o sin warnings), `1` error fatal. Pensado para integrar en pre-commit hook o pipeline CI antes del headless render.

---

## 1. Qué es Magnify Studio

Studio es una **herramienta single-HTML** (`magnify-studio.html`, ~7000 líneas) que **transforma texto estructurado en YAML/key:value en piezas exportables**: presentaciones PPTX/PDF, posts/carrousels de LinkedIn, banners, casos de estudio en PDF, dossiers longform, propuestas, portadas de informe, documentos markdown y firmas de email.

Filosofía: **el contenido es el deliverable, no el contenedor**. Escribes el texto en YAML; Studio se ocupa del diseño, tipografía, paleta y export. No hay drag-and-drop, no hay editor visual. Solo texto.

**Inputs**:
- YAML/key:value en el textarea principal (`#content`)
- Imágenes/visuales opcionales arrastradas al panel de upload: `svg`, `png`, `jpg/jpeg`, `webp`, `gif` (referenciadas como `img1`, `img2`...)

**Outputs**:
- Preview HTML escalado en pantalla
- PPTX editable (vía `pptxgenjs`)
- PDF (vía `html2canvas` + `jsPDF`)

**Stack**: HTML/CSS/Vanilla JS. Sin framework. Sin build step. Sin dependencias propias. Solo CDNs de pptxgenjs/jspdf/jszip/html2canvas/marked.

**Deploy**: GitHub Pages → magnifytools.com (workflow `.github/workflows/deploy-tools.yml` watcha `Tools/**`).

---

## 2. Sistema de marca

### Tipografía
| Rol | Fuente | Peso | Uso |
|---|---|---|---|
| Titular grande | **PP Editorial New** (fallback DM Serif Display, Georgia) | 400 Regular, 400 italic | Hero, manifiesto, h1, h2, citas |
| Cuerpo / sans | **NM** (PP Neue Montreal: Book/Medium/Bold), fallback Helvetica Neue/Arial | 400 cuerpo · 500 énfasis · 700 eyebrow | Body, eyebrow, meta |
| Mono | JetBrains Mono / SF Mono | 600 | Headers/footers de dossier, metadatos |

Helvetica Neue/Arial cubren glyphs griegos que NM no tiene (`τέλος`, `Έ`, etc.).

### Sistema cromático — tres "surfaces"
| Surface | Clase | Background | Texto | Uso |
|---|---|---|---|---|
| **Oscuro** | `dk` | `#0A0A0A` | `#FAFAFA` | Default deck, divisores conceptuales, citas grandes |
| **Claro / hueso** | `lt` | `#FAFAFA` | `#0A0A0A` | Bloques de caso, datos, contraste con bloque oscuro |
| **Amarillo** | `yl` | `#FFD600` | `#0A0A0A` | Manifiestos clave, cierre crescendo, CTAs |

**Regla del crescendo**: en un dossier longform o deck, el amarillo se reserva para el cierre / CTA o frase ancla. No se usa de relleno.

### Highlights editoriales — `[palabra]`
Envolver una palabra clave en corchetes activa el "highlight":
```
titular: La causa es [identidad].
```
- Sobre fondo oscuro: amarillo italic bold sin fondo
- Sobre fondo claro/hueso: negro italic con underline grueso
- Sobre fondo amarillo: negro con underline (sin contraste perdido)
- La puntuación final pegada (`.,;:!?`) entra dentro del highlight: `[realidad].` se renderiza como un único bloque visual `realidad.` resaltado.

**Limitaciones a tener presentes**:
- **No anidar con bold**: `[**identidad**]` no funciona — el highlight se aplica antes que el markdown bold y los asteriscos quedan literales. Para énfasis dentro de un highlight, parte la frase: `La causa es [identidad]. **Marca real**, mal traducida.`
- **No anidar highlights**: `[[doble]]` rompe el regex. Un solo nivel.
- **Eyebrows**: el eyebrow usa `text-transform:uppercase` + `letter-spacing:0.2em`. Con más de ~8 palabras (o un par de separadores `·`) envuelve a 2 líneas y empuja el h2. Recomendación operativa: eyebrow ≤8 palabras.

### Hilo griego (F3)
Campo opcional `griego:` o `subtitular_griego:` añade un stamp serif italic tenue encima del titular (manifiestos, hero, imagen-split). Coherente con el branding "Magnify" (de magni-fication, telos, gnōthi seautón).

### El particle ".ing"
La marca usa `.ing-ap` como acento amarillo: `magnify.ing`, `prioritiz.ing`, `diagnos.ing`. Esto se renderiza con color de acento (amarillo en oscuro/claro, negro+underline en amarillo).

---

## 3. Tipos de output

| Tipo | Botón | Descripción | Export |
|---|---|---|---|
| `linkedin-post` | Post LinkedIn | Single tarjeta cuadrada para feed | PPTX |
| `linkedin-carousel` | Carousel LinkedIn | Slides verticales conectadas | PPTX |
| `banner` | Banner / Logo | Asset gráfico standalone | PPTX |
| `case-study` | Caso de Estudio | Doc A4 multipágina, single layout | PDF |
| `case-study-longform` | Dossier (longform) | Doc A4 16-20pp editorial con divisores, TL;DR, visuals | PDF |
| `propuesta` | Propuesta | Propuesta comercial A4 multipágina | PDF |
| `report-cover` | Portada Informe | Cover page A4 standalone | PDF |
| `presentacion` | Presentación | Slides 16:9. Tiene 3 sub-variantes: Diagnóstico de marca · Propuesta de servicios · **Charla / Keynote** | PPTX |
| `documento` | Documento (MD) | Markdown formateado a A4 editorial | PDF |
| `email-sig` | Firma Email | HTML firma email | HTML inline |

---

## 3.bis Schema YAML — Plantillas de `linkedin-post` (cuadrado 1200×1200)

Cada bloque YAML de un `linkedin-post` declara una `plantilla:` que selecciona el layout. Todas las plantillas comparten el sistema cromático Magnify (`color: dark | light | yellow`) y el wordmark inferior. El frame es **1200×1200 cuadrado** salvo `quote-landscape` (1200×628).

Plantillas: `quote`, `stats-grid`, `stats-hero`, `framework`, `servicio`, `antes-despues`, `comparativa`, `quote-landscape`, `cuadrante`.

### Bloque común

| Campo | Tipo | Descripción |
|---|---|---|
| `plantilla` | requerido | Una de las 9 plantillas listadas. |
| `color` | opcional | `dark | light | yellow`. Cada plantilla tiene su default propio (ver más abajo). |

> Los `[brackets]` aplican highlights editoriales sobre amarillo en cualquier campo de rich text (`titular`, `subtitulo`, `descripcion`, `cita`, `cuerpo`, items de listas). No funcionan dentro de bold markdown.

### `quote` — Cita / insight editorial

Cita o insight centrado, watermark + eyebrow + serif grande + atribución. **Default: `dark`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `eyebrow` | opcional | Etiqueta superior, mayúsculas. |
| `titular` | recomendado | La cita o insight. Acepta `[brackets]`. |
| `atribucion` | opcional | Pie con autor/contexto. |

```yaml
plantilla: quote
eyebrow: DIAGNÓSTICO DE MARCA
titular: Las marcas que no se [miden] no se mejoran. Se improvisan.
atribucion: Insight de nuestro trabajo con +50 marcas B2B
```

### `stats-grid` — Grilla 2×2 de stats

Cuatro métricas en cuadrícula. La primera celda usa acento amarillo. **Default: `light`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `eyebrow` | opcional | Etiqueta superior. |
| `stat1..stat4` | recomendado | Número/dato de cada celda. Alias: `num1..num4`. |
| `label1..label4` | recomendado | Etiqueta debajo del número. Alias: `etiqueta1..etiqueta4`. |

```yaml
plantilla: stats-grid
eyebrow: RESULTADOS TÍPICOS
stat1: 73%
label1: mejora en coherencia de mensaje
stat2: 2.4x
label2: engagement en LinkedIn
stat3: +45%
label3: leads cualificados
stat4: 3x
label4: velocidad de decisión interna
```

### `stats-hero` — Stat dominante

Una stat enorme centrada con sufijo + descripción + meta. **Default: `dark`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `eyebrow` | opcional | Etiqueta superior. |
| `numero` | recomendado | Stat principal. Alias: `stat`. |
| `sufijo` | opcional | Símbolo (`%`, `x`, `:1`...). Default `%`. Alias: `suffix`. |
| `descripcion` | recomendado | Texto debajo. Alias: `cuerpo`. Acepta `[brackets]`. |
| `meta` | opcional | Pie con fuente/contexto. |

```yaml
plantilla: stats-hero
eyebrow: DATO CLAVE
numero: 73
sufijo: %
descripcion: de marcas B2B no puede articular qué las [diferencia]
meta: Encuesta interna · +50 líderes de marketing
```

### `framework` — Pasos numerados

Hasta 6 pasos con número (`01`, `02`...) + título + descripción. **Default: `light`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `eyebrow` | opcional | Etiqueta superior. |
| `titular` | recomendado | Headline (acepta `[brackets]`). |
| `titulo1..titulo6` | recomendado | Título del paso. Alias: `item1..item6`. |
| `desc1..desc6` | opcional | Descripción del paso. Alias: `descripcion1..descripcion6`. |

```yaml
plantilla: framework
eyebrow: CÓMO LO HACEMOS
titular: Diagnóstico en [3 fases]
titulo1: Auditoría de percepción
desc1: Entrevistas internas y externas + análisis competitivo.
titulo2: Priorización
desc2: Framework de impacto vs. esfuerzo con los hallazgos clave.
titulo3: Rollout
desc3: Acompañamiento de ejecución semanal durante 6 semanas.
```

### `servicio` — Promoción de servicio

Eyebrow + titular + descripción + barra CTA inferior amarilla. **Default: `light`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `eyebrow` | opcional | Etiqueta superior. |
| `titular` | recomendado | Headline (acepta `[brackets]`). |
| `descripcion` | recomendado | Texto del servicio. Alias: `cuerpo`. |
| `cta` | opcional | Texto de la barra inferior. Default: `Solicitar info`. |

```yaml
plantilla: servicio
eyebrow: SERVICIO
titular: Diagnóstico de [visibilidad]
descripcion: Una auditoría completa de cómo te ven buscadores, IA y clientes. En 4 semanas tienes un mapa de prioridades ejecutables.
cta: Hablar con Magnify
```

### `antes-despues` — Contraste con framing valorativo

Dos columnas (izquierda con × tachado, derecha con ✓ amarillo) sobre divisor amarillo central. Sugiere progresión "peor → mejor", "viejo → nuevo", "tradicional → Magnify". **Default: `dark`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `label_antes` | opcional | Eyebrow columna izquierda. Default: `MODELO TRADICIONAL`. |
| `label_despues` | opcional | Eyebrow columna derecha. Default: `MAGNIFY`. |
| `titulo_antes` / `titulo_despues` | opcional | Título serif por columna (44px). Acepta `[brackets]`. |
| `subtitulo_antes` / `subtitulo_despues` | opcional | Subtítulo serif italic (24px). |
| `antes1..antes6` | recomendado | Bullets columna izquierda. Alias: `a1..a6`. |
| `despues1..despues6` | recomendado | Bullets columna derecha. Alias: `b1..b6`. |

```yaml
plantilla: antes-despues
label_antes: MODELO TRADICIONAL
titulo_antes: Ruido constante
subtitulo_antes: Decisiones reactivas, sin framework
a1: Mensajes inconsistentes entre canales
a2: Diferenciación ambigua
a3: Decisiones reactivas
a4: Sin framework de priorización
label_despues: MAGNIFY
titulo_despues: Señal nítida
subtitulo_despues: Narrativa unificada en 90 días
b1: Narrativa unificada
b2: Posicionamiento documentado
b3: Roadmap de 90 días
b4: KPIs medibles de marca
```

> **Cuándo usar:** posicionar Magnify (o el cliente) frente a una alternativa peor. La columna izquierda usa color atenuado y × como bullet; la derecha es h2 puro y ✓ amarillo. Si comparas dos opciones equivalentes (sin connotar peor/mejor), usa `comparativa`.

### `comparativa` — Comparación neutral entre dos casos externos

Mismo layout que `antes-despues` pero **sin connotación valorativa**: divisor central neutro, ambos bullets con guión amarillo, etiquetas sin defaults Magnify. Para comparar dos casos externos sin sugerir cuál es mejor. **Default: `dark`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `label_a` / `label_b` | opcional | Eyebrow por columna. **Sin defaults** — vacíos si no se proveen. Alias: `label_1` / `label_2`. |
| `titulo_a` / `titulo_b` | opcional | Título serif por columna (44px). Alias: `titulo_1` / `titulo_2`. Acepta `[brackets]`. |
| `subtitulo_a` / `subtitulo_b` | opcional | Subtítulo serif italic (24px). Alias: `subtitulo_1` / `subtitulo_2`. |
| `a1..a6` | recomendado | Bullets columna A. |
| `b1..b6` | recomendado | Bullets columna B. |

```yaml
plantilla: comparativa
label_a: MARCA A
titulo_a: Notion
subtitulo_a: Workspace todo-en-uno
a1: Editor bloque a bloque
a2: Templates de la comunidad
a3: Curva de aprendizaje suave
a4: Sincronización en tiempo real
label_b: MARCA B
titulo_b: Linear
subtitulo_b: Issue tracker para equipos
b1: Velocidad y atajos teclado
b2: Roadmap visual integrado
b3: Cycles automáticos
b4: GitHub/Slack nativo
```

> **Diferencia con `antes-despues`:**
> - `antes-despues` → iconos × / ✓, divisor amarillo central que sugiere progresión, defaults Magnify-céntricos.
> - `comparativa` → guión amarillo en ambas columnas, divisor neutro, sin defaults: el lector evalúa por sí mismo.
>
> Regla: si una columna es objetivamente "peor" en el argumento del post, `antes-despues`. Si las dos son alternativas legítimas, `comparativa`.

### `quote-landscape` — Cita en formato landscape

Cita con sidebar derecha. Frame **1200×628** (no cuadrado), pensado para OG/share. **Default: `light`.**

| Campo | Tipo | Descripción |
|---|---|---|
| `eyebrow` | opcional | Etiqueta superior. |
| `titular` | recomendado | Cita (acepta `[brackets]`). |
| `sidebar` | opcional | Texto del sidebar derecho. Alias: `descripcion`. |

```yaml
plantilla: quote-landscape
eyebrow: CLIENTES
titular: Tenemos la marca más limpia del sector y nadie lo sabe.
sidebar: CMO, SaaS B2B · Barcelona
```

### `cuadrante` — Matriz 2×2 de posicionamiento

4 celdas con nombre + descripción + tag, sobre dos ejes con etiquetas en los extremos. **Default: `light`.**

Disposición de cuadrantes (ejes con origen abajo-izquierda):

```
        ALTA
   q1  │  q2
  ─────┼─────
   q3  │  q4
        BAJA
   BAJA      ALTA
```

| Campo | Tipo | Descripción |
|---|---|---|
| `eyebrow` | opcional | Etiqueta superior. |
| `titular` | opcional | Headline arriba. Alias: `subtitulo`. |
| `eje_x` / `eje_y` | recomendado | Nombre del eje. |
| `eje_x_min` / `eje_x_max` | opcional | Etiquetas extremos eje X. Defaults: `Baja` / `Alta`. |
| `eje_y_min` / `eje_y_max` | opcional | Etiquetas extremos eje Y. Defaults: `Baja` / `Alta`. |
| `q1..q4_nombre` | recomendado | Nombre del cuadrante. |
| `q1..q4_desc` | opcional | Descripción corta. |
| `q1..q4_tag` | opcional | Tag con prefijo simbólico opcional: `-> ` → flecha, `* ` → estrella, `x ` → aspa, `! ` → aviso. |
| `q1..q4_highlight` | opcional | `si` aplica acento amarillo (cuadrante objetivo). |
| `q1..q4_dimmed` | opcional | `si` reduce el peso visual (punto ciego). |

```yaml
plantilla: cuadrante
eyebrow: CUADRANTE MAGNIFY
titular: ¿Dónde está tu marca?
eje_x: VISIBILIDAD
eje_x_min: BAJA
eje_x_max: ALTA
eje_y: FORTALEZA DE MARCA
eje_y_min: BAJA
eje_y_max: ALTA
q1_nombre: JOYA ESCONDIDA
q1_desc: Buena marca, poca visibilidad. Nadie encuentra lo que ofreces.
q1_tag: -> NECESITAS VISIBILIDAD
q2_nombre: MARCA CONECTADA
q2_desc: Lo que eres y cómo te ven está alineado.
q2_tag: * OBJETIVO
q2_highlight: si
q3_nombre: INVISIBLE
q3_desc: Sin marca ni visibilidad. No existes para el mercado.
q3_tag: x PUNTO CIEGO
q3_dimmed: si
q4_nombre: MUCHO RUIDO, POCA MARCA
q4_desc: Visible pero sin sustancia. Google te indexa. Nadie te recuerda.
q4_tag: -> NECESITAS COHERENCIA
```

---

## 4. Schema YAML — Caso de Estudio (`case-study`)

> ### ⚠️ El parser de Studio NO es YAML real
>
> Es un parser propio línea-a-línea (`parseBlock` en `magnify-studio.html`). Soporta el subconjunto que documenta este brief, pero hay dos trampas a evitar al redactar:
>
> 1. **Líneas tipo `palabra: cosa` dentro de un bloque `cuerpo: |` se reinterpretan como una clave nueva**. Ejemplo que rompe: dentro de un párrafo escribir literalmente *"objetivo: bajar coste"* — el parser lo trata como `objetivo` siendo una nueva clave del block actual y descarta el resto del cuerpo. Workaround: reescribir esa frase como *"objetivo — bajar coste"* o usar comillas para forzar texto: *"el objetivo (bajar coste)"*.
> 2. **Las secciones se separan por `---` solo en una línea propia** (no `--- ` con espacio, no `----` con cuatro). Si una sección no aparece en el render, el primer sospechoso es un separador mal formado.
>
> Otras observaciones útiles del parser:
> - Comillas envolventes (`""`, `''`) se eliminan automáticamente. Por eso `numero: ""` significa "vacío", no la cadena literal `""`.
> - Líneas que empiezan con `#` son comentarios y se ignoran.
> - `numero: 01` se preserva como string `"01"` (no se interpreta como octal). Cualquier dígito puro se padea a 2 dígitos: `1` → `01`.
> - Continuación multilínea: cualquier línea sin formato `clave: valor` se concatena a la clave anterior con un `\n`. El parser respeta `cuerpo: |` y `cuerpo: >` como inicio de bloque literal.

Single-layout, multi-page A4. Para casos cortos (3-5pp).

```yaml
tipo: case-study
cliente: TechCorp
industria: SaaS B2B
fecha: Marzo 2026
---
seccion: portada
titular: Cómo TechCorp multiplicó por [2.4] su engagement
subtitulo: Diagnóstico y reposicionamiento en 8 semanas
---
seccion: reto
titulo: El Reto
cuerpo: TechCorp tenía un posicionamiento genérico que no les diferenciaba de 15 competidores directos.
stat1: 15 / competidores directos        # formato "valor / etiqueta"
stat2: 0% / diferenciación percibida
---
seccion: solucion
titulo: La Solución
paso1_titulo: Auditoría de percepción
paso1_desc: Entrevistas con 30 stakeholders internos y externos.
paso2_titulo: Redefinición del territorio
paso2_desc: Nueva narrativa diferencial basada en datos de mercado.
paso3_titulo: Implementación
paso3_desc: Rollout en todos los touchpoints digitales.
# hasta paso4_*
---
seccion: resultados
titular: Impacto medible
stat1: 73% / mejora en coherencia
stat2: 2.4x / engagement
stat3: +45% / leads cualificados
narrativa: Los números reflejan un cambio profundo en cómo el mercado percibe a TechCorp.
---
seccion: quote
cita: Magnify no solo diagnosticó el problema, nos dio un framework accionable.
autor: María López, CMO TechCorp
---
seccion: cierre
titulo: Siguiente paso
cuerpo: ¿Tu marca necesita un diagnóstico similar? Agenda en magnify.ing/agendar
```

**Per-page fondo override**: cada `seccion` puede llevar `fondo: oscuro|claro|amarillo` para alternar surfaces.

---

## 5. Schema YAML — Dossier (longform) `case-study-longform`

Editorial multi-página (16-20pp). El formato premium para casos de marca/cliente. Incluye TL;DR, divisores conceptuales, visuals, framework, citas de clientes, stats grid, cierre crescendo amarillo.

### Reglas de composición para dossiers

- **Márgenes**: retícula A4 con margen lateral constante de 72px, cabecera a 34px y footer reservado. Nada importante debe tocar cabecera, footer o borde visual.
- **Lectura en pantalla**: cuerpo principal a 22px fijo, primer párrafo a 25px, h2 a 44px. Studio **no compacta** la tipografía si el contenido excede el alto de A4 — desbordará y el runtime warning te avisa para partir. Es una regla, no un fallback.

#### Budgets de contenido por tipo de sección (HARD LIMITS)

> Si Claude o tú redactáis por encima de estos topes, la página desborda. **Partir es la única vía**.

| Sección | Tope cuerpo (palabras) | Tope titular | Otros límites |
|---|---|---|---|
| `seccion-cuerpo` solo cuerpo | **180** | ≤12 | — |
| `seccion-cuerpo` con `pull` | **150** | ≤12 | pull ≤30 palabras |
| `seccion-cuerpo` con `idea_clave` / `sec-key` | **140** | ≤12 | key ≤25 palabras |
| `seccion-cuerpo` con `visual_id` embebido | **70** | ≤10 | sin pull ni key |
| `seccion-visual` (página entera) | 0 (sin cuerpo) | (no aplica) | solo `eyebrow` opcional |
| `tldr` | (no `cuerpo`) | ≤10 | deck ≤25 palabras · 5–8 puntos · cada punto ≤25 palabras |
| `divisor-seccion` | (sin `cuerpo`) | ≤10 | deck ≤25 palabras |
| `framework-extendido` | (no `cuerpo`) | ≤10 | hasta 4 pasos · paso_subtitulo ≤8 palabras · paso_desc ≤24 palabras |
| `stats-6` | (no `cuerpo`) | ≤10 | hasta 6 stats · label ≤4 palabras · desc ≤12 palabras |
| `citas-clientes` | (no `cuerpo`) | ≤10 | hasta 6 citas · cita ≤20 palabras |
| `cierre` | (no `cuerpo`) | ≤8 | deck ≤20 palabras · cta ≤2 líneas |
| `footer-anonimizacion` | **120** | ≤10 | meta 1 línea |

**Por qué los topes son tan bajos**: el ancho útil del cuerpo no es A4 entero (794px) sino una columna editorial de **600px** (`--csl-measure: 600px`). En castellano caben ~7 palabras por línea. Una página A4 completa de cuerpo aguanta ~28-30 líneas antes de pisar el footer. 180 palabras × ~7 wpl = 26 líneas → cabe; 290 palabras → 41 líneas → desborda.

#### Reglas de partición cuando excedes tope

Si tu contenido no cabe en una sección, parte en dos `seccion-cuerpo` hermanas:
1. **Misma plantilla, eyebrow continuado**: `BASE` → `BASE · CONTINÚA` (o eyebrow nuevo coherente).
2. **Cada mitad con su propio titular**: nunca dejes una página huérfana sin h2.
3. **El pull / key / visual va en una sola** de las dos páginas, no se duplica.
4. **No mover el corte para hacer cuadrar**: si un párrafo entra en la mitad B, va entero, no se rompe a media frase.

#### Aliases de campos (todos válidos, escoge uno)

- **Bloque sec-key** (caja amarilla con idea operativa): `idea_clave` ≡ `diagnostico` ≡ `lectura` ≡ `conclusion`. El renderer toma el primero que encuentre.
- **Imagen referenciada**: `visual_id: img1` ≡ `imagen: img1` ≡ `visual: img1`. Si combinas (`visual_id: VISUAL_01` con `visual: img1`), Studio mantiene `VISUAL_01` como label visible y carga `img1` dentro de la caja — útil para captionar diagramas con código humano.
- **Toggle off**: `header: no` ≡ `top_meta: no`. `footer: no` ≡ `foot: no`. Acepta también `off`, `false`, `none`, `hidden`, `0`. Importante: **`footer: no` oculta también el número de página `XX / NN`**, no solo la URL — si quieres una página limpia pero numerada, no lo desactives.


- **Una página, una función**: cada página debe ser impacto, lectura, evidencia, método, transformación, resumen ejecutivo o CTA. Si mezcla varias funciones, se divide.
- **One visual, one job**: un visual no debe mezclar árbol, manifiesto, cierre y leyenda compitiendo. Título en lenguaje natural, visual limpio y una lectura ejecutiva visible.
- **Simetría y peso**: comparativas y diagramas deben equilibrar columnas, capas y ramas. La jerarquía sale de posición, acento y estructura; no de hacer un lado arbitrariamente más grande.
- **Amarillo con gramática**: fondo amarillo = conclusión/CTA; caja amarilla = diagnóstico o decisión; número amarillo = secuencia; punto/línea amarilla en gráfico = foco crítico. Máximo dos roles amarillos por página.
- **Visuales raster**: si el texto pequeño vive dentro de un PNG, Studio no puede ampliarlo sin degradar la composición. Regenerar el visual siguiendo `magnify-visuals-system.md` o convertirlo a módulo HTML/SVG.

### Bloque global
```yaml
tipo: case-study-longform
cliente: H&W Brand
industria: Salud y bienestar
fecha: Abril 2026
documento: Dossier 01 — Identity Debt
referencia: H&W
url: magnify.[ing]
```

### Tipos de sección (en orden recomendado)

#### `portada` — primera página dark
```yaml
seccion: portada
eyebrow: CASE STUDY · CONFIDENCIAL
titular: Cuando el [catálogo] cambia después del comprador.
subtitulo: Una marca de salud y bienestar que rehace su arquitectura escuchando a sus clientes.
confidencial: INTERNAL · NO DISTRIBUIR
wordmark: arriba          # opcional: arriba (default) | abajo (firma editorial al pie) | oculto
header: no                # opcional: oculta wordmark+eyebrow del top
footer: no                # opcional: oculta el pt-bottom (URL + Confidencial)
```
**`wordmark: abajo`** invierte la jerarquía editorial: el contenido manda arriba, la marca firma al pie ("Mírate. — Magnify" en lugar de "Magnify presenta: Mírate"). Para documentos editoriales serios.

#### `tldr` — resumen ejecutivo, lista numerada con números amarillos
```yaml
seccion: tldr
eyebrow: TL;DR
titular: Cinco cosas que recordar.
deck: La historia entera en una página, por si solo lees esta.
punto1: La marca tenía **8× más tráfico al blog que a la tienda**. Para Google era un blog que casualmente vendía.
punto2: La causa no era SEO. Era **identidad mal traducida**.
# hasta punto8
```
Markdown bold (`**texto**`) renderiza como énfasis dentro de los puntos.

#### `divisor-seccion` — chapter break full-bleed
```yaml
seccion: divisor-seccion
fondo: oscuro          # oscuro | claro | amarillo (último solo en cierre)
numero: 01
eyebrow: PROBLEMA
titular: El [síntoma] que muchos diagnosticamos como SEO.
deck: Antes de empezar el trabajo, lo que veíamos eran los síntomas. La causa estaba en otro nivel.
```

#### `seccion-cuerpo` — texto editorial denso con visual opcional
```yaml
seccion: seccion-cuerpo
fondo: oscuro          # opcional
eyebrow: DIAGNÓSTICO
titular: Una web que producía contenido. Y una tienda que casi no vendía.
cuerpo: La marca llevaba años publicando contenido educativo de calidad...
pull: Para Google, esto era un blog de salud que casualmente tenía una tienda.   # quote tipo "callout"
visual_id: VISUAL_01
visual_caption: <strong>Distribución de tráfico orgánico, 6 meses pre-intervención.</strong> El blog acumula 87% de las sesiones.
```
`visual_id` referencia un placeholder de imagen que Studio renderiza como caja gris con el ID dentro (luego sustituyes con un export real). `visual_caption` admite HTML inline (`<strong>`, `<em>`).

##### Sub-modo `lista-numerada` — para enumeraciones (Cuatro pilares, Seis cosas, Cinco preguntas)
```yaml
seccion: seccion-cuerpo
modo: lista-numerada
eyebrow: QUÉ ES BRANDING
titular: Cuatro pilares. El cuarto es donde [vivimos].
item1_titulo: Posicionamiento.
item1_cuerpo: Qué dices que eres y para quién.
item2_titulo: Lenguaje.
item2_cuerpo: Cómo lo cuentas en cada nivel.
item3_titulo: Identidad visual.
item3_cuerpo: Una cuarta parte de la marca.
item3_nota: Atascado — la mayoría asume que esto es la marca entera. No lo es.   # opcional, italic
item4_titulo: Coherencia.
item4_cuerpo: Si los tres anteriores están alineados.
item4_label: "0X"      # opcional: override de la numeración por item (default = 01..0N)
pull: La identidad visual es una cuarta parte. La coherencia decide.
```
Renderiza numeración mono UPPERCASE a la izquierda + título serif intermedio + cuerpo serif body indentado. La nota es italic para troubleshooting o caveats por item. **Modo se activa con `modo: lista-numerada` o por presencia de `item1_titulo`**. Densidad auto cuando hay 5+ items. Validador avisa si un item supera 30 palabras (22 con 5+ items) — acorta o parte la lista.

##### Listas markdown inline en `cuerpo:` — bullets y numeradas compactas

Para cheatsheets y referencias rápidas donde una secuencia de items no debería inflar la altura como párrafos sueltos. Si un bloque (entre `\n\n`) tiene **todas** sus líneas con prefijo `- `/`* ` o `1. `/`2. `/etc., se renderiza como `<ul>`/`<ol>` compacta:

```yaml
seccion: seccion-cuerpo
eyebrow: CHEATSHEET
titular: Las cinco preguntas del protocolo.
cuerpo: |
  Las preguntas se contestan con datos que ya tienes.

  - ¿Qué dice tu marca que es?
  - ¿Qué comunica tu web?
  - ¿Qué devuelven las plataformas?
  - ¿Qué dice tu cliente real?
  - ¿Coinciden las cuatro respuestas?

  La mayor distancia entre dos respuestas es tu primera intervención.
```

Renderiza:
- **Bullets `-`/`*`** → `·` amarillo a la izquierda + texto serif body. Items con margen 9px (vs 22px entre párrafos).
- **Numeradas `1.` `2.` `3.`** → numeración mono UPPERCASE `01/02/03` amarilla en escala 0.78em a la izquierda + texto.

Detección estricta: el bloque entero (entre `\n\n`) debe ser íntegramente bullet o íntegramente numerada. Si hay líneas mezcladas o prosa intercalada, se trata como párrafo normal — sin riesgo de falsos positivos en cuerpos existentes que tengan algún `-` literal.

##### Slot `aside_*` — caja de troubleshooting/advertencia embebida
```yaml
seccion: seccion-cuerpo
eyebrow: BASE METODOLÓGICA
titular: La marca no se inventa. Se [descubre].
cuerpo: La marca ya existe en datos. El trabajo no es crearla, es encontrarla.
aside_titulo: SI NO HAY DATOS RECIENTES
aside_cuerpo: |
  Pregunta a tres clientes recientes en lugar de revisar GSC. La señal cualitativa fresca bate al
  histórico cuantitativo cuando el negocio acaba de pivotar.
```
Filete izquierdo gris + título mono UPPERCASE pequeño + cuerpo serif italic. Útil para guías profesionales (patrón Tiny Habits, Food Lab, manuales militares) — embebido en el flujo principal sin romper la maqueta. Aliases: `aside_h`/`aside_d`/`troubleshooting_titulo`/`troubleshooting`.

#### `seccion-visual` — página entera con SOLO un visual (sin titulares ni prosa)
```yaml
seccion: seccion-visual
fondo: oscuro          # opcional: oscuro | claro | amarillo
eyebrow: FIGURA 03 · CUADRANTE MÍRATE   # opcional, leyenda del visual
visual_id: img7        # img1..imgN para imagen real, o ID humano (placeholder)
leyenda_pos: bottom    # opcional: bottom (default, convención editorial) | top
```
El visual ocupa toda la página dentro del margen estándar de Studio. Sin `titular`, `cuerpo`, `pull`, `caption`. Útil para anexos, capturas full-bleed, visualizaciones que se sostienen solas.

**`leyenda_pos:`** controla dónde aparece el `eyebrow` respecto al visual. Default `bottom` (caption editorial estándar) con filete sutil de separación. Override `top` solo si una pieza concreta lo necesita.

#### Modo workbook — primitivas para piezas ejecutables

Cuando el dossier es un workbook (lector rellena con datos propios), se activa con cualquiera de estas señales en el **bloque global**:

```yaml
tipo: workbook              # o cualquier `tipo` que contenga "workbook"
documento: WORKBOOK MÍRATE  # o cualquier `documento` que contenga "workbook"
workbook: si                # flag explícito (alias `wb: si`)
version: blank              # opcional: oculta callouts ⚐ y pulls (versión imprimible en blanco)
```

Un workbook activado:
- **Márgenes laterales más amplios** (96px lateral, default 64px) pensados para escritura a mano si se imprime.
- **Reconoce 3 primitivas** dentro de cualquier `cuerpo:` de `seccion-cuerpo`:

| Convención YAML | Render |
|---|---|
| `___________` (3+ guiones bajos) | Línea de escritura horizontal real, ancho proporcional al número de `_` (8px/char, máx 600px). Inline-block: convive con texto en la misma frase (`Cliente dice ___ · H1 dice ___`). |
| `☐` (U+2610) | Checkbox real con caja sólida 14×14 px. |
| `⚐ *texto*` | Callout sutil de troubleshooting: bandera ⚐ gris + texto en italic. Patrón usado en cada acción del workbook para ofrecer alternativas si la pista no funciona. |

`version: blank` produce una variante imprimible que oculta los callouts ⚐ y los `pull:` instructivos, conservando títulos, headings y primitivas (líneas, checkboxes). Útil para distribuir un workbook que el lector rellena en frío sin pistas.

#### `citas-clientes` — grid 2×3 sobre hueso
```yaml
seccion: citas-clientes
eyebrow: PREGUNTAMOS A 200 CLIENTES
titular: Sus respuestas no eran categorías de producto.
cita1: ¿Cómo duermo mejor de forma natural?
autor1: Cliente · 38 años
# hasta cita6 / autor6
```

#### `stats-6` — grid 3×2 con número grande + label + descripción
```yaml
seccion: stats-6
eyebrow: KPI · 6 MESES POST-INTERVENCIÓN
titular: Lo que cambia cuando la marca traduce mejor.
num1: ×3
label1: SESIONES ORGÁNICAS
desc1: Multiplicadas en la tienda
# hasta num6 / label6 / desc6
metodo: Ventana 6 meses · GA4 sesiones orgánicas no-brand · Baseline trailing 12 meses · Cifras incluyen 3 core updates — ver Nota sobre atribución.
```
**`metodo:`** (alias `nota:`/`fuente:`) — caption mono al pie del grid con baseline, ventana y método. Cumple la regla del corpus *"toda cifra con baseline, ventana, método"*. El validador avisa si una `stats`/`stats-6` no lo declara.

#### `framework-extendido` — pasos numerados con párrafos largos
```yaml
seccion: framework-extendido
eyebrow: MÉTODO
titular: Tres movimientos en seis meses.
paso1_titulo: Reorganizamos el contenido alrededor de problemas
paso1_subtitulo: Del producto al momento de uso
paso1_desc: Los artículos del blog dejaron de hablar de "beneficios del omega-3"...
# hasta paso4_*
```

#### `cierre` — divisor amarillo crescendo (la única página amarilla)
```yaml
seccion: cierre
numero: 08
titular: El espejo se volvió [HD].
deck: La IA no inventó el problema. Lo hizo visible.
cta: Agéndate un Identity Debt Check
```

#### `footer-anonimizacion` — nota legal-editorial en la última página
```yaml
seccion: footer-anonimizacion
eyebrow: NOTA SOBRE ANONIMIZACIÓN
titular: Sobre los datos y la identidad del cliente
cuerpo: Este caso de estudio describe un proyecto real desarrollado por Magnify entre Q3 2025 y Q1 2026. El nombre del cliente, las cifras absolutas y los testimonios han sido anonimizados...
meta: Magnify Digital SL · CIF B-XXXXXXXX · Edición abril 2026
```

### Reglas de paleta para dossier

- **Default = hueso (lt)** para bloque caso/datos
- **Oscuro (dk)** para divisores conceptuales (típicamente 01, 05, 06, 07)
- **Amarillo (yl)** SOLO para cierre — regla del crescendo
- **Cadencia de cierre**: tras el `cierre` amarillo, la `footer-anonimizacion` debe llevar `fondo: oscuro` para cerrar como contraportada (amarillo → oscuro = punto y final visual)

#### `fondo:` NO funciona en todas las secciones

No todas las plantillas aceptan override de surface. Antes de poner `fondo: oscuro` en una sección, verifica:

| Sección | `fondo:` override | Surface fija |
|---|---|---|
| `portada` | ✅ acepta oscuro/claro/amarillo | — |
| `seccion-cuerpo` | ✅ acepta oscuro/claro/amarillo | — |
| `seccion-visual` | ✅ acepta oscuro/claro/amarillo | — |
| `divisor-seccion` | ✅ acepta oscuro/claro/amarillo | — |
| `cierre` | ✅ acepta oscuro/claro (default amarillo) | — |
| `tldr` | ❌ ignora `fondo:` | crema `#F5F1EA` siempre |
| `citas-clientes` | ❌ ignora `fondo:` | hueso siempre |
| `stats-6` | ❌ ignora `fondo:` | hueso siempre |
| `framework-extendido` | ❌ ignora `fondo:` | hueso siempre |
| `footer-anonimizacion` | ✅ acepta oscuro/claro | — |

Si Claude pone `fondo: oscuro` en un `tldr`, el render lo ignora silencioso y sale crema. Para tener un TL;DR oscuro habría que hacerlo como `seccion-cuerpo` con la lista numerada manual (no recomendado, rompe el módulo).

---

## 5.bis Normas para infografías y visuales del dossier

Cuando subes un PNG/JPG/SVG como `img1`, `img2`... y lo referencias desde una sección del dossier, Studio lo encaja en el área útil de la página manteniendo proporción. Para que el resultado sea editorialmente coherente, sigue estas normas al producir el visual.

### Slots por tipo de sección

| Sección | Slot disponible (A4 794×1123 px) | Ratio nativo |
|---|---|---|
| `seccion: visual` (default subordinado) | caja con `aspect-ratio: 16/9` dentro del body | **16:9** ideal |
| `seccion: visual` con `layout: protagonista` | todo el body (ancho 666 × alto restante ~860) sin caja ni borde | **3:4** (vertical) o cualquiera |
| `seccion-visual` | mismo que protagonista — todo el body, sin titular ni caption | **3:4** o cualquiera |
| `seccion-cuerpo` con `visual_id` embebido | caja 16:9 abajo del cuerpo | **16:9** ideal |

El padding estándar del body es `56px arriba, 64px laterales, 84px abajo`. Eso deja un **ancho útil de 666 px** y un alto que depende del contenido restante. La imagen se ajusta con `object-fit:contain` — no se recorta nunca, siempre cabe.

### Cómo se renderiza un visual SIN imagen subida

Cuando una sección referencia `visual_id: img1` pero no has subido `img1` al panel uploads, Studio **no deja la caja gris/negra**. Renderiza un placeholder editorial visible:

- Para `seccion-visual` (página entera): caja con borde amarillo punteado fino, fondo transparente, texto serif italic centrado con el ID — `[ img1 ]` o `[ VISUAL_01 ]`. Diseñado para que el dossier pre-imagen siga siendo legible y el cliente entienda que esa página espera una infografía concreta.
- Para `seccion-cuerpo` con `visual_id` embebido: misma caja con label arriba (`VISUAL_01` si usaste etiqueta humana, vacío si usaste `img1` directo). Fondo coherente con el surface de la página (oscuro/hueso/amarillo).
- Para `seccion: visual` (modo subordinado): caja 16:9 con borde + label centrado.

Esto significa que **puedes exportar el PDF antes de tener los visuales** y enseñarlo como preliminar — los slots se ven como espacios reservados, no como bugs. Cuando subas `img1.png` al panel uploads, esa caja se sustituye automáticamente por la imagen.

**Cómo Studio asigna IDs al subir**: arrastra los archivos al panel uploads del lateral izquierdo. Studio los renombra a `img1, img2, img3...` por **orden alfabético del filesystem**, no por orden de arrastre. Si quieres controlar el mapping, nombra tus archivos `01_taxonomia.png`, `02_arquitectura.png`, etc. — el orden alfabético = el orden de los `imgN`. Los botones ↑/↓ del thumb permiten reordenar después y reasignan IDs en consecuencia.

**Atajo: si tus archivos ya se llaman `img1.svg`, `img2.svg`, ..., `imgN.svg`**, Studio los mapea **directamente** al slot que indica el nombre — sin pasar por orden alfabético. Es el flujo recomendado cuando generas los visuales con un script o pides a Claude que produzca exactamente N infografías numeradas.

### Formatos soportados y comportamiento por formato

| Formato | Cómo se inyecta | html2canvas (export PDF) | Notas |
|---|---|---|---|
| **PNG / JPG / WebP / GIF** | `<img src="data:...">` con `fitContainOnLoad` | ✅ rasteriza correctamente | Lo más universal. Resolución mínima 1400px lado largo. |
| **SVG** | **inline `<svg>...</svg>`** (decodificado del data URL en `renderUploadedImage`) | ✅ rasteriza correctamente | Studio detecta el SVG y lo inyecta inline porque html2canvas NO rasteriza `<img src="data:image/svg+xml;...">`. El usuario no tiene que hacer nada — pero tener presente que el SVG entra al DOM, así que IDs y clases internas conviven con las del documento (evita IDs genéricos como `#bg`, `#title`). |
| **PDF** | ❌ no soportado | — | Conviértelo a PNG o re-genera el visual como SVG. |

> Si subes un SVG y la caja sale vacía en el PDF exportado: comprueba que el archivo tiene `xmlns="http://www.w3.org/2000/svg"` en el `<svg>` raíz. Sin xmlns, el browser lo trata como XML genérico y no lo renderiza.

### Checklist obligatorio antes de exportar PDF

Studio renderiza el preview HTML aunque falten archivos — los slots vacíos salen como placeholders editoriales. Pero el **PDF final** captura lo que ve el preview en ese momento. Antes de pulsar "Exportar PDF":

1. ✅ **Cada `visual_id: imgN` del YAML tiene su archivo en el panel uploads.** Cuenta los thumbs de la columna izquierda y compara con el número de referencias `imgN` distintas en el YAML. Si tienes 8 referencias y solo 6 thumbs, dos páginas saldrán con placeholder.
2. ✅ **Re-generar el preview** después de subir archivos (botón "Generar Preview"). El preview no se auto-actualiza al añadir thumbs nuevos.
3. ✅ **Revisar el panel de warnings** (lateral izquierdo abajo). Si lista páginas con desbordamiento o budget excedido, decide si lo dejas pasar o vuelves al YAML a partirlas.
4. ✅ **Mirar las dos primeras páginas del preview** antes de exportar — el cliente las verá primero, son la primera impresión y suelen ser las más sensibles a problemas de layout (portada con titular largo, TL;DR con deck demasiado denso).

### Dimensiones recomendadas

- **Para `aspect-ratio:16/9`** (visuales subordinados): cualquier resolución 16:9. Ej. `1920×1080`, `1600×900`, `1280×720`.
- **Para protagonista vertical**: ratio entre **3:4 y 4:5** (más alto que ancho). Ej. `1400×1700`, `1200×1500`. Si la imagen es panorámica (16:9) en un slot vertical, queda con bandas blancas arriba y abajo — sigue funcionando pero desperdicia espacio.
- **Resolución mínima**: `1400 px` en el lado largo, para que al escalar a A4 (~666 px utilizables) no se pixele.

### Tipografía interna del visual

Si el visual lleva texto incrustado (gráficos, infografías, mockups con anotaciones), usa las mismas fuentes y tamaños que Studio:

| Elemento del visual | Fuente | Tamaño aproximado | Color |
|---|---|---|---|
| Título interno (si hace falta) | DM Serif Display | 36-48 px | `#0A0A0A` o `#FAFAFA` |
| Eyebrow técnico | PP Neue Montreal Medium | 14-16 px, letter-spacing 0.2em | `#666` o `rgba(255,255,255,0.55)` |
| Etiquetas / labels | PP Neue Montreal Medium | 12-14 px | `#444` o `#999` |
| Cuerpo / nota | PP Neue Montreal | 14-16 px | `#333` o `rgba(255,255,255,0.78)` |
| Mono (URLs, códigos) | JetBrains Mono | 11-13 px | mismo que el surface |

**Importante**: si Studio ya pone eyebrow + titular en la página (porque la sección los lleva), **NO repitas título ni eyebrow dentro del visual** — produce doble titulación. Para eso existe `layout: protagonista`: tu visual va sin título interno y los `eyebrow + titular` de la sección actúan como título único.

### Paleta admitida

Cualquier visual debe usar exclusivamente:

- **Surfaces**: `#0A0A0A` (oscuro), `#FAFAFA` (hueso), `#FFD600` (amarillo)
- **Acentos**: el amarillo `#FFD600` para destacar (no usar otros colores como rojo, verde, azul de "data viz")
- **Grises**: rangos de neutros entre `#1A1A1A` y `#F0F0F0`
- **Texto sobre oscuro**: blanco hueso `#FAFAFA` con alphas (`rgba(250,250,250,0.78)` para cuerpo)

Si necesitas codificar variables múltiples en un gráfico, usa **escala de grises + amarillo como destacado**, no paleta cromática. Pattern Magnify Design System.

### Margen interno del visual

Cuando produces un SVG/PNG con su propio "lienzo", deja **8-10% de padding interior** en blanco/oscuro al borde de la imagen. Esto evita que el contenido toque los límites del slot cuando Studio lo coloca. Ej. en una imagen de 1400×1700, deja 100-140 px de margen por dentro.

### Checklist antes de subir

- [ ] Resolución ≥ 1400 px en el lado largo
- [ ] Aspect ratio coincide con el slot del tipo de sección
- [ ] Tipografía interna usa DM Serif Display + PP Neue Montreal
- [ ] Paleta solo `#0A0A0A` / `#FAFAFA` / `#FFD600` + grises
- [ ] No replica eyebrow ni titular de la sección
- [ ] 8-10% de padding interior en el borde
- [ ] Nombre del archivo: `visual_NN_descripcion.png` (ej. `visual_01_distribucion_landings.png`)

---

## 6. Schema YAML — Presentación (Charla / Keynote)

16:9, exportable a PPTX. La variante "Charla" añade prefijo `ps-` en el render y soporta logo + handle del evento.

### Bloque global
```yaml
tipo: presentacion
titulo: Gnōthi seautón
autor: David Carrasco
fecha: 5 de mayo de 2026
evento_nombre: SEARCH BARCELONA · 2026
evento_handle: '@SearchLDN'
paginacion: no       # no = sin contador, default = paginación XX/XX
```

### Slide types principales

| Slide type | Schema | Notas |
|---|---|---|
| `hero` | `titular` + `autor` + `fecha` + opcional `griego:` | Portada |
| `manifiesto` | `titular` (single line poderoso) + opcional `fondo`, `griego` | Frase ancla. Soporta `\|` literal block para forzar saltos. Si titular ≤ 15 chars, se centra horizontalmente |
| `divisor-charla` | `numero` + `eyebrow` + `titulo` | Acto N — divisor narrativo |
| `standard` | `eyebrow` + `titular` + `cuerpo` | Slide texto general |
| `stat-hero` | `numero` + `sufijo` + `eyebrow` + `descripcion` + `fuente` | Stat grande tipo poster |
| `stats-charla` | `titular` + `num1..4` + `label1..4` + `desc1..4` + `layout: 2x2 \| 1x3 \| 1x4`. `hi3: si` pinta cell de rojo (mala noticia) | Grid de KPIs |
| `imagen-full` | `imagen` + `eyebrow` + `titular` + opcional `imagen_ajuste: contain` (para 2:1, infografías) | Full-bleed image |
| `imagen-split` | `imagen` + `posicion: izquierda\|derecha` + `eyebrow` + `titular` + `cuerpo` + `meta` + opcional `imagen_ajuste`, `imagen_zoom: 60` | Split panel imagen + texto |
| `diptych` | `imagen_a/b` + `label_a/b` + `titulo_a/b` | Comparación 2 imágenes con caption opaco |
| `triptych` | `imagen1..3` + `num1..3` + `titulo1..3` + `descripcion1..3` | 3 tiles editoriales |
| `quote-big` | `cita` + `nombre` + `rol` + opcional `fondo: oscuro` | Cita central grande |
| `citas-grid` | `titular` + `cita1..4` + `autor1..4` | Grid 2×2 testimonios |
| `compare` | `titular` + `label_a/b` + `a1..a4` + `b1..b4` | Hoy / Debería ser |
| `framework` | `titular` + `paso1_titulo..paso4_titulo` | Framework horizontal 4 pasos |
| `cta-final` | `eyebrow` + `titular` + `contacto` + `qr` (referencia a imagen QR) + opcional `qr_size: grande` | Call to action al final |
| `recursos-agrupados` | `titular` + `cat1_titulo` + `cat1_item1..` (hasta 5 categorías × 5 items, items soportan formato `Nombre — url`) | Para slide de "para profundizar" |
| `cierre` | `contacto` (multi-línea) | "GRACIAS" |

### Imágenes en slides
- Las imágenes se referencian por nombre: `imagen: img5` o `imagen1: img6`
- Studio mapea `img1`, `img2`... según orden alfabético del filesystem al subirlas
- Sin imagen → render con placeholder gradiente
- Con imagen → `<img>` real con `object-fit:cover` (default) o `contain` (vía `imagen_ajuste: contain`)

### Reglas de composición para slides

- **Safe area**: todo texto importante debe quedar dentro de una retícula segura de 96px laterales y 72px verticales. Las imágenes full-bleed pueden ocupar borde, pero sus textos/captions no.
- **Simetría**: comparativas, timelines, grids y frameworks deben equilibrar columnas y número de elementos. Si una columna tiene mucho más peso que otra, se parte el contenido o se reescribe.
- **Accesibilidad**: ningún texto crítico debe depender de gris medio sobre negro. En fondo oscuro, títulos, fuentes, roles, footers y metadatos importantes usan blanco o gris claro.
- **Densidad**: máximo 4 stats, 4 fases de timeline, 5 recursos por categoría, 6 puntos por columna de compare y 8 filas en tabla. Por encima, crea otra slide.
- **Infografías**: deben ocupar suficiente área visible. Si la leyenda o los ejes no se leen en pantalla, sube un SVG limpio o una versión 16:9 específica.
- **Una idea por slide**: slide de impacto, argumento, evidencia, método, comparación, cita o CTA. Si una slide cumple dos funciones fuertes, se divide.

### Overrides por slide aplicables a cualquier tipo
- `header: no` — suprime el top-meta del evento (logo + handle) en esa slide
- `marca: no` (alias `watermark: no`) — suprime el monograma Magnify abajo a la izquierda. Útil cuando la imagen ya tiene su propia marca o cuando se quiere un slide "limpio" sin firma (portadas alternativas, capturas full-bleed con monograma propio, etc.)
- `fondo: oscuro|claro|amarillo` — fuerza el surface en los slide-types que lo soportan

---

## 6.bis Reglas operativas para presentación-charla (extraídas de Search BCN 2026)

> Reglas verificadas inspeccionando `Search BCN 2026.pptx` — 49 slides, charla final entregable. Esto es lo que el deck producido por humano usa, y lo que Studio debería reproducir 1:1 para que un YAML→PPTX salga indistinguible del manual.

### Tokens cromáticos exactos

| Token | Hex | Cuándo |
|---|---|---|
| Surface oscuro | `#0A0A0A` | manifiestos, divisores conceptuales, citas, cierre — ~50% del deck |
| Surface hueso | `#FAFAFA` | casos, datos numéricos, lecturas frías — ~30% |
| Surface amarillo | `#FFD600` | divisores de acto Α/Β/Γ — **3 slides en 49**, regla del crescendo en sus tres aperturas |
| Surface crema | `#F5F1ED` | encarte editorial puntual (≤1 slide) — opcional, no obligatorio |
| Texto sobre oscuro | `#F0F0F0` | NUNCA blanco puro `#FFFFFF` |
| Texto sobre hueso | `#0A0A0A` | — |
| Acento amarillo | `#FFD600` | números grandes, highlights, ing-ap |
| Highlight band yellow | `#FED602` | variante usada cuando el highlight tiene fondo banda |
| Meta gris (en oscuro) | `#999999` | autor, fecha, eyebrow técnico, atribuciones |
| Meta gris (en hueso) | `#666666` | eyebrow editorial, atribuciones |
| Letra griega sobre amarillo | `#444444` | gris oscuro — **NO** negro puro |
| Letra griega ámbar (eyebrow secundario) | `#B8A000` | versión apagada del amarillo para eyebrow griego |
| Rojo alarma | `#D32F2F` | **una sola vez** en toda la charla, marca el dato malo |

### Tamaños tipográficos exactos (PowerPoint 16:9 1920×1080)

**Regla operativa: menos cifras = más grande.** El tamaño de la cifra escala inverso al número de elementos. La diapositiva manda — si solo hay un número, ocupa lo que se merece. Si hay cuatro, comparten eje. La escala calibrada al deck Search BCN 2026:

| Cifras en slide | Tamaño cifra | Plantilla | Ejemplo del deck |
|---|---|---|---|
| **1** | **150pt** (300px CSS) | `stat-hero` | Slide 24 (`8:1`), 35 (`-37%`), 36 (`120`) |
| **2** | 120pt (240px CSS) | `stats-charla layout: 2x1` | (extrapolado, sin slide en deck) |
| **3** | 80pt (160px CSS) | `stats-charla layout: 1x3` | Slide 34 (×3 / ×6 / 45%) |
| **4** | 96pt (192px CSS) | `stats-charla layout: 1x4` | Slide 39 (timeline pipeline 55/10/5/30) |

> Por qué 4 cifras es **más grande** que 3: el subgrid de 4 lleva label + desc cortos (timeline tipo pipeline), libera eje vertical. El subgrid de 3 lleva desc larga (modulo case-study post-intervención), aprieta el eje.

**Resto del sistema tipográfico:**

| Rol | Tamaño | Familia |
|---|---|---|
| Hero titular full-bleed | 80pt | DM Serif Display |
| Letra griega marker (Α/Β/Γ) en divisor | 80pt (co-igual con título de acto) | DM Serif Display |
| Letra griega en grid (mapa de actos) | 96pt | DM Serif Display |
| Manifiesto split (2 líneas) | 64pt | DM Serif Display |
| Quote body | 44pt | DM Serif Display |
| Quote `"` decorativa | 48pt amarillo | DM Serif Display |
| Titular de módulo (stats grid, compare) | 52pt | DM Serif Display |
| Subtitular / autor en hero | 32-36pt | DM Serif Display / PP Neue Montreal |
| Body / item de timeline | 24-28pt | PP Neue Montreal Book |
| Eyebrow editorial (en módulo) | 36pt | DM Serif Display |
| Eyebrow técnico (mono-feel, uppercase) | 20-22pt + letter-spacing 0.2em | PP Neue Montreal Book |
| Quote autor / atribución | 28pt | PP Neue Montreal |
| Mini meta (linkedin, fecha, handle) | 20-22pt | PP Neue Montreal |

**Regla**: si una tabla pide un tamaño no listado aquí (ej. 70pt), redondea al inmediato del sistema (64 o 80) — la coherencia de tamaños es lo que hace que dos slides hermanas se vean parientes.

### 12 plantillas verificadas en producción

| # | Plantilla | Receta YAML mínima |
|---|---|---|
| 1 | **Portada** (1 slide) | `slide: hero` + `griego: Γνῶθι σεαυτόν` + `titular` + `autor` + `fecha` + `evento_handle` |
| 2 | **Acto divisor** (Α/Β/Γ) | `slide: divisor-charla` + `numero: Α` + `titulo: El diagnóstico`, `fondo: amarillo` |
| 3 | **Manifiesto hero dark** | `slide: manifiesto` + `titular: ¿Qué es el SEO?` + `fondo: oscuro` |
| 4 | **Manifiesto split** (2 líneas) | `slide: manifiesto` + titular literal block con `\|` y dos líneas, `[palabra]` highlight en una |
| 5 | **Quote dark** | `slide: quote-big` + `cita` + `nombre` + `rol/fuente` + `fondo: oscuro` |
| 6 | **Stat hero** (1 cifra a 150pt) | `slide: stat-hero` + `numero: 8:1` + `eyebrow: BLOG vs. TIENDA` |
| 7 | **Stats horizontal grid 3** | `slide: stats-charla` + `layout: 1x3` + `titular` + `num1..3 / label1..3 / desc1..3` |
| 8 | **Compare 2-col** | `slide: compare` + `label_a: CÓMO EMPEZAMOS HOY` (gris) + `label_b: CÓMO DEBERÍAMOS` (amarillo) + `a1..3 / b1..3` |
| 9 | **Imagen full-bleed** | `slide: imagen-full` + `imagen: imgN` (sin titulares) |
| 10 | **Build-up additive** | repetir la misma plantilla N veces, cada slide añade UN item nuevo a la lista. NO usar animación PowerPoint, usar slides hermanas. |
| 11 | **Timeline pipeline** (cifras + etapas) | `slide: stats-charla` + `layout: 1x4` + `hi3: si` para marcar 1 cifra en rojo `#D32F2F` |
| 12 | **Cierre + τέλος** | `slide: cierre` con concepto griego (no CTA agresivo) + slide siguiente con `slide: cta-final` minimal y mini-meta |

### Reglas operativas (cómo se construye un deck Magnify)

1. **Estructura de 3 actos con marcadores griegos**. Α diagnóstico → Β caso → Γ espejo. El amarillo full-bleed se reserva exclusivamente para abrir actos. La portada y el cierre son oscuros, no amarillos.
2. **Una idea por slide**. Máximo 2 elementos visuales. Si hay grid (stats-3, timeline-4, compare-2), es comparación cuantitativa explícita; si no, slide single-element.
3. **Build-up additive en lugar de listas**. Cuando hay 4 ítems para revelar, son 4 slides hermanas que van sumando un ítem por slide (slides 27→30 del deck final). Nunca una slide con 4 viñetas reveladas a la vez.
4. **El rojo se reserva para 1 dato malo en toda la presentación**. No es paleta, es señal. Usarlo más diluye su efecto.
5. **Repetir eyebrow para conectar slides hermanas** (¿QUÉ ES EL SEO? en 9 y 10; PREGUNTAMOS A LOS CLIENTES en 27-30). Misma plantilla + mismo eyebrow = mismo bloque narrativo.
6. **Cierre con concepto griego** (`τέλος` = fin/propósito/causa final). Cierra el arco abierto por `gnōthi seautón` en la portada. La última slide firma con el concepto, no con CTA.
7. **Letra griega pequeña como sello editorial** debajo o encima del titular hero para marcar sección filosófica (`Γνῶθι σεαυτόν` en eyebrow griego de portada y cierre).
8. **Crescendo invertido del amarillo en charla**: a diferencia del dossier (donde el amarillo solo cierra), en charla el amarillo abre los 3 actos. Sigue siendo una decisión estructural, no decorativa.
9. **Las letras griegas marker (Α/Β/Γ) sobre amarillo van en gris oscuro `#444444`**, no en negro puro. Es el contraste editorial que diferencia un Magnify de un PowerPoint corporate.
10. **Texto sobre oscuro a `#F0F0F0`, NUNCA `#FFFFFF`**. La diferencia es sutil pero clave para que la pantalla no queme.

---

## 7. Voz editorial Magnify

**Lo que SÍ es Magnify**:
- Frase corta, una idea por slide
- Italic para énfasis editorial
- Highlights `[palabra]` para tensión semántica, no para decoración
- Datos concretos (×3, 8:1, 200 entrevistas) en lugar de adjetivos
- Pull quotes en tono "diagnóstico", no "venta"
- Brand voice: serenidad observacional, no urgencia comercial
- Citas reales (paráfrasis de transcripts) > testimonios fabricados
- Marca propia visible solo donde aporta (header, watermark, cierre) — no en cada slide

**Lo que NO es Magnify**:
- Palabras como "transformamos", "elevamos", "potenciamos" (corporate fluff)
- Stock photography
- Stat genéricos sin fuente ("aumentamos un 40%")
- Calls to action agresivos
- Listas de servicios
- Beneficios sin evidencia

**Tics retóricos del fundador (David)**:
- Uso del griego (`gnōthi seautón`, `telos`, `metric debt`) cuando aporta
- Estructura síntoma → causa → método → resultado
- Frases ancla bicolor: "El síntoma es SEO. La causa es [marca]."
- Construcciones "A. B. Y entonces C." con puntos como respiración

---

## 8. Workflow para generar un caso

1. **Decide el tipo**: si es 3-5 páginas → `case-study`. Si es 16-20pp editorial → `case-study-longform` (dossier). Si es comercial → `propuesta`.
2. **Escribe el YAML** (frontmatter global + secciones separadas por `---`). **Antes de pegarlo**: cuenta palabras de cada `cuerpo:` y `deck:` y verifica que están bajo el budget de §5. Es más rápido recortar antes que descubrir el desbordamiento al ver el preview.
3. **Pega el YAML** en `magnify-studio.html` (panel izquierdo, textarea principal).
4. **Sube visuales** si los hay (drag al panel uploads). Acepta `svg`, `png`, `jpg/jpeg`, `webp`, `gif`, además de `.yaml` y `.md` de mapping. Si los nombras `img1.ext`–`imgN.ext` se mapean directos al slot que indica el nombre. Si los nombras de otra forma, Studio asigna IDs por orden alfabético del filesystem. Para infografías con texto, prefiere `svg` (Studio los inyecta inline para que html2canvas los rasterice en el PDF).
5. **Click "Generar Preview"**.
6. **Revisa render** en el panel derecho. Pasa por el checklist de §5.bis: ¿todos los `visual_id` tienen su archivo subido? ¿el panel de warnings está limpio? ¿las primeras dos páginas se ven bien?
7. **Export**: PDF para casos/dossiers/propuestas. PPTX para presentaciones.

### Errores frecuentes y diagnóstico rápido

| Síntoma en el PDF | Causa probable | Cómo se arregla |
|---|---|---|
| Caja vacía donde debería haber un visual | Archivo no está subido al panel uploads, o `visual_id` apunta a un `imgN` que no existe | Verifica que el thumb del `imgN` está en el panel y re-genera el preview |
| Caja gris/blanca (no placeholder amarillo) en `seccion-cuerpo` con visual | SVG con `xmlns` mal o sin `<svg>` raíz parseable | Abre el SVG y comprueba `<svg xmlns="http://www.w3.org/2000/svg" ...>` en la primera línea (después del `<?xml...?>` opcional) |
| Texto de cuerpo cortado por el footer | Cuerpo excede budget de §5 (180 palabras solo cuerpo, 150 con pull, 140 con key, 70 con visual) | Parte la sección en dos `seccion-cuerpo` hermanas |
| TL;DR con último punto cortado | `deck` excede 25 palabras o la suma de puntos × ~25 excede el alto disponible | Recorta el deck y verifica que cada `puntoN` está bajo 25 palabras |
| Footer hidden en una página inesperada | `header: no` o `footer: no` en esa sección | Quita el override si quieres recuperar URL + número de página |
| Dos páginas con el mismo número | El YAML tiene `numero: ""` en alguna sección que el renderer sigue reservando — comprobado, NO ocurre con el motor actual; si lo ves, abre issue | — |
| `fondo: oscuro` en `tldr` no funciona | Surface fija — `tldr`, `citas-clientes`, `stats-6`, `framework-extendido` ignoran `fondo:` (ver §5) | Convierte a `seccion-cuerpo` si necesitas un TL;DR oscuro (rompe el módulo, normalmente no merece la pena) |

---

## 9. Cómo dar contexto a otra IA

Si vas a darle a Claude (o a otra IA) la tarea de generar contenido para Studio:

1. **Sube este documento** (`STUDIO-BRIEF.md`) como contexto
2. **Especifica el tipo exacto**: `case-study-longform`, `presentacion-charla`, etc.
3. **Da el brief del caso**: cliente real (o ficticio anonimizado), industria, problema a resolver, datos disponibles, voz deseada
4. **Pide el YAML completo** con secciones separadas por `---`, sin explicar (Claude tiende a explicar lo que hace; aquí solo queremos el YAML)
5. **Si necesitas imágenes**: pídele a Claude descripciones detalladas de qué imagen iría en cada `visual_id` o `imagen` referenced (luego las generas/exportas y subes con el mismo nombre que dijo Claude)

### Ejemplo de prompt de invocación
> Eres mi asistente de contenido para Magnify Studio. Acabo de subirte el brief STUDIO-BRIEF.md.
>
> Genera un YAML completo para `case-study-longform` sobre [cliente real o anonimizado: descripción]. El reto fue [X], la solución [Y], los resultados medidos fueron [Z]. Adopta la voz editorial Magnify (serena, datos concretos, sin corporate fluff). Devuelve SOLO el YAML, sin texto explicativo.
>
> **Respeta los budgets de la sección 5 (HARD LIMITS):** Studio NO compacta tipografía. Si una `seccion-cuerpo` se acerca a 180 palabras (o 150 con pull / 140 con key / 70 con visual), parte la idea en dos `seccion-cuerpo` hermanas con eyebrow continuado en lugar de meterlo todo en una página. Antes de devolver el YAML, cuenta palabras de cada `cuerpo:` y verifica que cada sección está bajo su tope. **No olvides el `tldr.deck`**: tope 25 palabras — el sitio donde más fácil te pasas porque "es solo un resumen" suele convertirse en 50-60 palabras silenciosamente.
>
> **No tropieces con el parser** (sección 4, recuadro ⚠️): no metas `palabra: cosa` dentro de un `cuerpo: |` — se reinterpreta como clave nueva y descarta el resto del párrafo. Reescribe esas frases con guión, comillas o paréntesis. Separadores `---` siempre en línea propia, sin espacios extra.
>
> **Surfaces que ignoran `fondo:`** (sección 5): `tldr`, `citas-clientes`, `stats-6`, `framework-extendido` tienen surface fija. No les pongas `fondo: oscuro`, lo ignora silencioso.
>
> **Highlights** (sección 2): `[palabra]` y `**bold**` no se anidan. Eyebrow ≤8 palabras. Si quieres énfasis dentro de un highlight, parte la frase.
>
> Para cada `visual_id` o referencia a imagen, añade un comentario YAML (`# imagen: ...`) describiendo qué debería contener para poder generarla después.

---

## 10. Referencias en el código (para Claude editor)

- `Tools/magnify-studio.html` — toda la app (CSS + render + export pipeline)
- Sección CSS de Charla: líneas ~1140-1500
- Sección CSS de dossier (`csl-*`): líneas ~780-1000
- Función `renderPsManifiesto`: ~4715
- Función `renderPsTriptych`: ~4960
- Función `buildPptxImagenFull`: ~5860
- `case-study` template/example: ~1800
- `case-study-longform` template/example: ~1852

---

**TL;DR para una IA**: Studio convierte texto YAML en piezas editoriales (PPTX/PDF) con el sistema de marca Magnify. Tres surfaces (oscuro/claro/amarillo). Tipografía PP Editorial New + NM. Highlights `[palabra]` (no anidan con `**bold**`). Voz editorial serena, datos concretos, sin corporate fluff. Para casos de estudio largos: usa `case-study-longform` con secciones `portada → tldr → divisor-seccion → seccion-cuerpo → citas-clientes → stats-6 → framework-extendido → cierre → footer-anonimizacion`. Default hueso, oscuro para divisores, amarillo solo en cierre. **Hard limits de palabras en §5: 180 para `seccion-cuerpo` solo cuerpo, 150 con pull, 140 con key, 70 con visual; tldr.deck ≤25.** **Studio NO compacta — si excedes, parte en dos páginas hermanas.** **Parser propio (no YAML real, ver §4):** evita `palabra: cosa` dentro de `cuerpo: |`. **Surface fija** en `tldr`/`citas-clientes`/`stats-6`/`framework-extendido` — `fondo:` se ignora. **Visuales sin upload** salen como placeholder editorial con borde amarillo y label `[ imgN ]`, no como caja negra. **SVG soportado** vía inyección inline (Studio detecta y decodifica, html2canvas rasteriza); PNG/JPG/WebP/GIF como `<img>`. **Pre-export**: cada `visual_id` referenciado debe tener su archivo en el panel uploads, re-generar preview, leer warnings. **`footer: no` también oculta el número de página**.
