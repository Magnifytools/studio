# Magnify Studio — brief de contexto

> Documento para dar a una IA todo lo que necesita saber antes de generar contenido para Studio.
> Última actualización: 2026-04-25.

---

## 1. Qué es Magnify Studio

Studio es una **herramienta single-HTML** (`magnify-studio.html`, ~7000 líneas) que **transforma texto estructurado en YAML/key:value en piezas exportables**: presentaciones PPTX/PDF, posts/carrousels de LinkedIn, banners, casos de estudio en PDF, dossiers longform, propuestas, portadas de informe, documentos markdown y firmas de email.

Filosofía: **el contenido es el deliverable, no el contenedor**. Escribes el texto en YAML; Studio se ocupa del diseño, tipografía, paleta y export. No hay drag-and-drop, no hay editor visual. Solo texto.

**Inputs**:
- YAML/key:value en el textarea principal (`#content`)
- Imágenes opcionales arrastradas al panel de upload (referenciadas como `img1`, `img2`...)

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

## 4. Schema YAML — Caso de Estudio (`case-study`)

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

#### `seccion-visual` — página entera con SOLO un visual (sin titulares ni prosa)
```yaml
seccion: seccion-visual
fondo: oscuro          # opcional: oscuro | claro | amarillo
eyebrow: ANEXO · CAPTURA   # opcional, único texto permitido
visual_id: img7        # img1..imgN para imagen real, o ID humano (placeholder)
```
El visual ocupa toda la página dentro del margen estándar de Studio. Sin `titular`, `cuerpo`, `pull`, `caption`. Útil para anexos, capturas full-bleed, visualizaciones que se sostienen solas.

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
```

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

### Overrides por slide aplicables a cualquier tipo
- `header: no` — suprime el top-meta del evento (logo + handle) en esa slide
- `marca: no` (alias `watermark: no`) — suprime el monograma Magnify abajo a la izquierda. Útil cuando la imagen ya tiene su propia marca o cuando se quiere un slide "limpio" sin firma (portadas alternativas, capturas full-bleed con monograma propio, etc.)
- `fondo: oscuro|claro|amarillo` — fuerza el surface en los slide-types que lo soportan

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
2. **Escribe el YAML** (frontmatter global + secciones separadas por `---`).
3. **Pega el YAML** en `magnify-studio.html` (panel izquierdo, textarea principal).
4. **Sube imágenes** si las hay (drag al panel uploads). Los `visual_id` quedarán como placeholders grises hasta que subas la imagen real con ese nombre.
5. **Click "Generar Preview"**.
6. **Revisa render** en el panel derecho.
7. **Export**: PDF para casos/dossiers/propuestas. PPTX para presentaciones.

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

**TL;DR para una IA**: Studio convierte texto YAML en piezas editoriales (PPTX/PDF) con el sistema de marca Magnify. Tres surfaces (oscuro/claro/amarillo). Tipografía PP Editorial New + NM. Highlights `[palabra]`. Voz editorial serena, datos concretos, sin corporate fluff. Para casos de estudio largos: usa `case-study-longform` con secciones `portada → tldr → divisor-seccion → seccion-cuerpo → citas-clientes → stats-6 → framework-extendido → cierre → footer-anonimizacion`. Default hueso, oscuro para divisores, amarillo solo en cierre.
