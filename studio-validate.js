#!/usr/bin/env node
/**
 * studio-validate.js — Pre-flight validator para YAML de Magnify Studio.
 *
 * Comprueba antes de generar el PDF:
 *   1. Imágenes referenciadas (visual_id: imgN, visual: imgN) existen en el directorio dado.
 *   2. Presupuestos de palabras por tipo de sección (mismas reglas que validateCSL del HTML).
 *   3. Antipatrones: stats sin metodología, citas-clientes con consultor, items de lista largos.
 *
 * Uso:
 *   node studio-validate.js path/to/dossier.yaml
 *   node studio-validate.js path/to/dossier.yaml --imgs path/to/imgs
 *
 * Exit codes:
 *   0 — OK (puede haber warnings)
 *   1 — error fatal (imágenes faltantes o reglas críticas violadas)
 */

const fs = require('fs');
const path = require('path');

// ── ARGS ──
const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
  console.log('Uso: node studio-validate.js <yaml> [--imgs <dir>]');
  process.exit(argv.length === 0 ? 1 : 0);
}
const yamlPath = argv[0];
const imgsArgIdx = argv.indexOf('--imgs');
const imgsDir = imgsArgIdx >= 0 ? argv[imgsArgIdx + 1] : path.dirname(yamlPath);

if (!fs.existsSync(yamlPath)) {
  console.error(`✗ YAML no encontrado: ${yamlPath}`);
  process.exit(1);
}

// ── PARSER (réplica del ad-hoc de Studio: key:value, multi-line con `|`) ──
function parseBlock(text) {
  const data = {};
  const lines = text.trim().split('\n');
  let currentKey = null;
  const unquote = (v) => {
    const s = v.trim();
    if ((s.startsWith('"') && s.endsWith('"') && s.length > 1) ||
        (s.startsWith("'") && s.endsWith("'") && s.length > 1)) {
      return s.slice(1, -1);
    }
    return s;
  };
  for (const line of lines) {
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^(\w+(?:[-_]\w+)*):\s*(.*)$/);
    if (m) {
      currentKey = m[1].toLowerCase();
      let val = unquote(m[2]);
      if (val === '|' || val === '>' || /^[|>][-+]?$/.test(val)) val = '';
      data[currentKey] = val;
    } else if (currentKey) {
      const piece = unquote(line.replace(/^\s+/, ''));
      data[currentKey] = data[currentKey] ? data[currentKey] + '\n' + piece : piece;
    }
  }
  for (const k of Object.keys(data)) data[k] = unquote(data[k]);
  return data;
}

function parseMultiDoc(raw) {
  const blocks = raw.split(/^---\s*$/m).map(b => b.trim()).filter(Boolean);
  if (blocks.length === 0) return { global: {}, sections: [] };
  const global = parseBlock(blocks[0]);
  const sections = blocks.slice(1).map(parseBlock);
  return { global, sections };
}

const countWords = (s) => (s || '').toString().trim().split(/\s+/).filter(Boolean).length;

// ── VALIDACIONES ──
const yaml = fs.readFileSync(yamlPath, 'utf8');
const { global, sections } = parseMultiDoc(yaml);

const errors = [];
const warnings = [];

// 1. Imágenes referenciadas
const imgRefs = new Set();
for (const s of sections) {
  for (const k of ['visual', 'imagen', 'visual_id', 'id']) {
    const v = (s[k] || '').trim();
    if (/^img\d+$/i.test(v)) imgRefs.add(v.toLowerCase());
  }
}
const exts = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
const missing = [];
for (const ref of imgRefs) {
  const found = exts.some(e => fs.existsSync(path.join(imgsDir, `${ref}.${e}`)));
  if (!found) missing.push(ref);
}
if (missing.length) {
  errors.push(`Imágenes faltantes en ${imgsDir}: ${missing.join(', ')}`);
}

// 2. Reglas por sección (réplica de validateCSL del motor)
sections.forEach((s, idx) => {
  const n = idx + 1;
  const key = (s.seccion || '').toLowerCase().trim();
  const titWords = countWords(s.titular || s.titulo);
  if (titWords > 12) warnings.push(`Página ${n} (${key}): titular ${titWords} palabras (≤12).`);

  if (key === 'tldr') {
    for (let i = 1; i <= 8; i++) {
      const w = countWords(s[`punto${i}`]);
      if (w > 40) warnings.push(`Página ${n} (tldr) punto ${i}: ${w} palabras (≤25-40).`);
    }
  }

  if (key === 'seccion' || key === 'seccion-cuerpo') {
    const isList = (s.modo || s.mode || '').toString().toLowerCase().trim() === 'lista-numerada' ||
                   ['item1_titulo', 'item1_h', 'item1_titular'].some(k => s[k]);
    if (isList) {
      let nItems = 0;
      for (let i = 1; i <= 8; i++) if (s[`item${i}_titulo`] || s[`item${i}_h`]) nItems++;
      const budget = nItems >= 5 ? 22 : 30;
      for (let i = 1; i <= 8; i++) {
        const body = s[`item${i}_cuerpo`] || s[`item${i}_d`] || s[`item${i}_desc`] || '';
        const w = countWords(body);
        if (w > budget) warnings.push(`Página ${n} (lista-numerada) item ${i}: ${w} palabras (tope ${budget}, ${nItems} items).`);
      }
    } else {
      const w = countWords(s.cuerpo);
      const visualish = !!(s.visual || s.imagen || s.visual_id || s.visual_caption);
      const hasPull = !!s.pull;
      const hasKey = !!(s.idea_clave || s.diagnostico || s.lectura || s.conclusion);
      let budget;
      if (visualish) budget = 70;
      else if (hasKey) budget = 140;
      else if (hasPull) budget = 150;
      else budget = 180;
      if (w > budget) warnings.push(`Página ${n} (${key}): cuerpo ${w} palabras (tope ${budget}). Parte la página.`);
    }
  }

  if (key === 'framework-extendido') {
    for (let i = 1; i <= 6; i++) {
      const w = countWords(s[`paso${i}_desc`] || s[`paso${i}_d`] || '');
      if (w > 24) warnings.push(`Página ${n} (framework-extendido) paso ${i}: ${w} palabras (≤24).`);
    }
  }

  if (key === 'stats' || key === 'stats-6') {
    if (!s.metodo && !s.nota && !s.fuente) {
      warnings.push(`Página ${n} (${key}): sin metodo:/nota:/fuente: declarado. Cifras leen como vanity.`);
    }
  }

  if (key === 'citas' || key === 'citas-clientes') {
    for (let i = 1; i <= 8; i++) {
      const autor = s[`autor${i}`] || '';
      if (/magnify|david\s+carrasco/i.test(autor)) {
        warnings.push(`Página ${n} (${key}) cita ${i}: autor "${autor}" es consultor. Sácalo de citas-clientes.`);
      }
    }
  }
});

// 3. Reglas de modo
const mode = (global.modo || global.mode || '').toString().toLowerCase().trim();
const hasExec = sections.some(s => ['resumen-ejecutivo', 'oferta', 'mapa-caso'].includes((s.seccion || '').toLowerCase().trim()));
if ((mode === 'comercial' || mode === 'presentacion') && !hasExec) {
  warnings.push(`Modo ${mode} sin resumen-ejecutivo.`);
}

// ── REPORTE ──
console.log(`\n📋 studio validate · ${path.basename(yamlPath)}`);
console.log(`   ${sections.length} secciones · ${imgRefs.size} imágenes referenciadas\n`);

if (errors.length === 0 && warnings.length === 0) {
  console.log('✓ Sin issues. El YAML está listo para generar.\n');
  process.exit(0);
}

if (errors.length) {
  console.log(`✗ ${errors.length} error(es) crítico(s):`);
  errors.forEach(e => console.log(`  · ${e}`));
  console.log('');
}
if (warnings.length) {
  console.log(`⚠ ${warnings.length} warning(s):`);
  warnings.forEach(w => console.log(`  · ${w}`));
  console.log('');
}

process.exit(errors.length ? 1 : 0);
