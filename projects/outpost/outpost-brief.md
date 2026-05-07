# Outpost · brief de contexto para Studio

> Documento para dar a una IA todo lo que necesita saber antes de generar contenido para Outpost en Studio.
> Hereda de `Studio/STUDIO-BRIEF.md` (sistema base de Magnify). Aquí solo se documentan divergencias.
> Para qué es Outpost en términos editoriales: `Magnify/Content/OUTPOST/00-outpost-overview.md`.
> Última actualización: 2026-05-04.

---

## 0. Identidad operativa

Outpost es un canal editorial de Magnify, presentado por David Carrasco. Hereda **voz editorial completa** y **regla del crescendo del amarillo**. Diverge en **serif editorial**, **partícula técnica** y **símbolo de marca**. Toda comunicación firma como "un canal de Magnify, presentado por David Carrasco".

## 1. Sistema cromático

| Surface | Token | Color | Texto | Uso |
|---|---|---|---|---|
| Oscuro | `dk` | `#0A0A0A` | `#F5F5F0` | Default deck, divisores conceptuales, citas grandes |
| Claro / papel | `lt` | `#F5F5F0` | `#0A0A0A` | Bloques de caso, datos, dosier transcripto |
| Amarillo | `yl` | `#FFD600` | `#0A0A0A` | Manifiestos clave, cierre crescendo, CTAs |

**Diferencia con Magnify**: Outpost usa `#F5F5F0` (papel técnico cálido) en vez de `#FAFAFA` (hueso neutro de Magnify). El resto coincide.

**Sin accent secundario**. Solo `#FFD600` como señal. Para jerarquía sin amarillo, escala de neutros: `#888780` (metadata), `#444748` (texto secundario), `#2C2C2A` (divisores finos).

## 2. Tipografía

| Rol | Fuente | Peso | Uso |
|---|---|---|---|
| Headline / wordmark | **Inter** | 800 ExtraBold | Hero, h1, h2, títulos masivos (64px+) |
| Body / metadata | **Inter** | 500 Medium | Cuerpo, eyebrow, captions |
| Editorial / quotes | **DM Serif Display** | 400 Regular | Citas, hero serif, manifiesto |
| System labels | **PP Neue Montreal** | 500 Medium | Chips técnicos, footers de dossier (heredado de Magnify) |

Archivos en `fonts/`. Importar con `fonts/fonts.css`.

**Diferencia con Magnify**: Outpost usa **DM Serif Display** como serif editorial en vez de **PP Editorial New**. Es la marca tipográfica que distingue a Outpost como canal con voz propia dentro del paraguas Magnify.

## 3. Partículas

### `[BRACKETS_MAYÚSCULAS]` — partícula técnica (Outpost-específica)

Etiquetas técnicas en mayúsculas envueltas en corchetes. Equivalente del `.ing` de Magnify. Se usan en:

- **Eyebrow de slide / post**: `[FIELD_REPORT]·01`, `[ANALYSIS]·SEO+IA`
- **Chip de categorización de serie**: `[STANDARD]`, `[INTERVIEW]`, `[SPECIAL]`
- **Footer técnico de dossier**: `[SERIAL_NO: 88-02]`

Render: chip negro con texto off-white, o texto con color de accent según contexto.

### `[corchetes minúsculas]` — highlight editorial (heredado de Magnify)

Envolver palabra clave en corchetes minúsculas activa el highlight editorial. Se usa **dentro de cuerpo o titular**, máximo uno por elemento. Render exacto al de Magnify (sin cambios).

Distinción: **mayúsculas = función técnica/taxonomía** (metadata, eyebrow, chip). **Minúsculas = énfasis editorial** (cuerpo, titular).

## 4. Series

| ID | Label | Formato | Cuota |
|---|---|---|---|
| `STANDARD` | `[STANDARD]` | Episodio editorial 10-12min, David solo presentando | ~80% |
| `INTERVIEW` | `[INTERVIEW]` | Conversación 25-40min con invitado | ~10-15% |
| `SPECIAL` | `[SPECIAL]` | Edición disparada por evento del sector | máx 3/año |

**Accent único `#FFD600` para todas las series**. Diferenciación por layout, no por color:
- `STANDARD`: header limpio, una columna
- `INTERVIEW`: split screen, dos voces
- `SPECIAL`: header amarillo, alta densidad de logs técnicos

## 5. Logo

| Variante | Archivo | Cuándo usar |
|---|---|---|
| Wordmark positive | `logo/outpost-wordmark-positive.svg` | Default sobre claro |
| Wordmark negative | `logo/outpost-wordmark-negative.svg` | Sobre oscuro |
| Wordmark positive mono | `logo/outpost-wordmark-positive-mono.svg` | Impresión a una tinta, B/N, fax |
| Icon | `logo/outpost-icon.svg` | Avatar, marca de agua, contextos sin wordmark |
| Favicon | `logo/outpost-favicon.svg` | 16/32/48px (browser, app icon) |

**Geometría canónica**: tres aros casi concéntricos (radios 50/48/46) con desplazamientos mínimos de 1-3px + punto amarillo en el cuadrante superior derecho. Wordmark "UTPOST" en Inter ExtraBold a la derecha del símbolo.

## 6. Frontmatter obligatorio en todos los YAMLs de Outpost

```yaml
proyecto: outpost
serie: STANDARD | INTERVIEW | SPECIAL
episodio: NN          # numeración correlativa, padding 2 dígitos
```

Studio usa este frontmatter para activar paleta, tipografías, partículas y plantillas correctas. Sin `proyecto: outpost`, Studio renderiza con sistema Magnify por defecto.

## 7. Outputs Studio prioritarios para Outpost

| Output | Uso en pipeline |
|---|---|
| `presentacion` (charla) | Slide master 16:9 del episodio en YouTube |
| `linkedin-post` | Lanzamiento del episodio en LinkedIn |
| `linkedin-carousel` | Clip destilado del episodio (3-5 slides verticales) |
| `documento` | Transcript editorial completo en outpost.magnify.ing |
| `report-cover` | Portada de dosier ocasional derivado del episodio |

## 8. Reglas heredadas que aplican igual

- **Regla del crescendo del amarillo**: una sola señal amarilla por slide, reservada al cierre / CTA / revelación. No de relleno.
- **No em-dashes, no emojis, no hashtags decorativos, no clichés del sector**. Tuteo singular.
- **Highlight editorial máximo uno por elemento**. La puntuación final pegada entra dentro del corchete.
- **Margen mínimo 48px en slides**, **stroke estándar 1.5-2.4px** para divisores y aros.

## 9. Antipatrones específicos de Outpost

- **Doble partícula en el mismo elemento**: `[STANDARD] [análisis]` mezclado en un eyebrow. Una función por elemento.
- **Accent en relleno**: usar amarillo en bordes decorativos o backgrounds que no marquen señal. Solo crescendo.
- **Highlight en mayúsculas**: `[ANÁLISIS]` dentro de cuerpo. Si es énfasis editorial, va en minúsculas. Si es taxonomía, fuera del cuerpo.
- **Eyebrow sin partícula técnica**: en Outpost los eyebrows siempre llevan `[BRACKETS_MAYÚSCULAS]`. No "Outpost 01" sino `[STANDARD]·01`.
