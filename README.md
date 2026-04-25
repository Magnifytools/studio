# Magnify Studio

Single-HTML tool that turns structured YAML/text into editorial pieces (PPTX/PDF): presentations, posts, carousels, banners, case studies, dossiers, proposals, report covers, markdown documents, email signatures.

**Live**: served from `magnify-studio.html` as a static page.

## Structure

```
.
├── magnify-studio.html              # the tool (single file, ~7000 lines, vanilla JS)
├── fonts/                           # PP Neue Montreal (Book/Medium/Bold)
├── STUDIO-BRIEF.md                  # full context for AI-assisted content generation
└── decks/                           # presentation content (yamls + images)
    └── search-barcelona-2026/
        ├── yaml_v13.yaml
        └── images/
```

## Quick start

1. Open `magnify-studio.html` in a browser (or serve with `python3 -m http.server`)
2. Pick a format from the sidebar
3. Paste your YAML in the textarea
4. Drag images into the upload panel (referenced as `img1`, `img2`...)
5. Click **Generar Preview**
6. Export PPTX or PDF

## For AI-assisted content

Read [STUDIO-BRIEF.md](STUDIO-BRIEF.md). It contains the full schema for each output type, the brand system (typography, surfaces, highlights), and the editorial voice. Upload it as context when asking an AI to generate YAML for Studio.

## Brand

- **Surfaces**: dark `#0A0A0A`, hueso `#FAFAFA`, yellow `#FFD600`
- **Type**: PP Editorial New (serif), PP Neue Montreal / NM (sans), JetBrains Mono
- **Highlights**: wrap a word in `[brackets]` for editorial accent
- **Particle**: `.ing` is the brand accent (`magnify.ing`, `prioritiz.ing`)

## History

Extracted from `Magnifytools/accent-app` preserving git history of `Tools/magnify-studio.html` and `Tools/fonts/`.
