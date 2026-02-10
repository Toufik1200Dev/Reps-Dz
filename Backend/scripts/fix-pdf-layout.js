const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../services/programPdfService.js');
let c = fs.readFileSync(file, 'utf8');

// Add section-title styling and allow content flow
c = c.replace(
  '.combined-page h1 { font-family: \'Oswald\', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #0f172a; }',
  '.combined-page h1 { font-family: \'Oswald\', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; margin-top: 0; color: #0f172a; text-align: left; page-break-after: avoid; }'
);

// Consolidate pages 2, 3, 4 into ONE page - Materials + Nutrition + Methods + Warm-ups + Protocols + Intensity
const oldPages = `  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="materials-section">
        <h1>Materials Used</h1>
        <p class="sub">Equipment you need for this program</p>
        <table class="materials-table"><tbody>\${(getMaterialsList() || []).map((m, i) => \`<tr class="material-row \${i % 2 ? 'alt' : ''}"><td class="material-name">\${escapeHtml(m.name)}</td><td class="material-use">\${escapeHtml(m.use)}</td></tr>\`).join('')}</tbody></table>
      </div>
      <div class="nutrition-section">
        <h1>Nutrition Guidelines</h1>
        <p class="sub">Support your training with simple, sustainable nutrition</p>
        \${buildNutritionSection6Week(nutrition, goals)}
      </div>
      <div class="methods-section">
        <h1>Training Methods Used</h1>
        <p class="sub">Endurance-focused definitions – don't skip!</p>
        <table class="methods-table"><tbody>\${methodsHtml}</tbody></table>
      </div>
      <p class="footer" style="margin-top:20px;">Toufik Calisthenics · reps-dz.com</p>
    </div>
  </div>
  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="warmups-section">
        <h1>Warm-ups for each day</h1>
        <p class="sub">8–12 min · Preparation, not exhaustion · Follow before every session</p>
        \${warmupsHtml}
      </div>
      <div class="protocols-section">
        <h1>Warm-up protocols (detailed)</h1>
        <p class="sub">Joint-safe · Materials listed · Coach notes</p>
        \${warmupProtocolsHtml}
      </div>
      <p class="footer" style="margin-top:16px;">Toufik Calisthenics · reps-dz.com</p>
    </div>
  </div>
  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content intensity-summary-page">
      <h1>Weekly Intensity Overview</h1>`;

const newPage = `  <div class="page reference-page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="section-block materials-section">
        <h1>Materials Used</h1>
        <p class="sub">Equipment you need for this program</p>
        <table class="materials-table"><tbody>\${(getMaterialsList() || []).map((m, i) => \`<tr class="material-row \${i % 2 ? 'alt' : ''}"><td class="material-name">\${escapeHtml(m.name)}</td><td class="material-use">\${escapeHtml(m.use)}</td></tr>\`).join('')}</tbody></table>
      </div>
      <div class="section-block nutrition-section">
        <h1>Nutrition Guidelines</h1>
        <p class="sub">Support your training with simple, sustainable nutrition</p>
        \${buildNutritionSection6Week(nutrition, goals)}
      </div>
      <div class="section-block methods-section">
        <h1>Training Methods Used</h1>
        <p class="sub">Endurance-focused definitions – don't skip!</p>
        <table class="methods-table"><tbody>\${methodsHtml}</tbody></table>
      </div>
      <div class="section-block warmups-section">
        <h1>Warm-ups for each day</h1>
        <p class="sub">8–12 min · Preparation, not exhaustion · Follow before every session</p>
        \${warmupsHtml}
      </div>
      <div class="section-block protocols-section">
        <h1>Warm-up protocols (detailed)</h1>
        <p class="sub">Joint-safe · Materials listed · Coach notes</p>
        \${warmupProtocolsHtml}
      </div>
      <div class="section-block intensity-section">
        <h1>Weekly Intensity Overview</h1>`;

if (c.includes(oldPages.split('  <div class="page">')[1]?.slice(0, 80) || 'Materials Used')) {
  c = c.replace(
    /  <div class="page">\s*<div class="cover-bar"><\/div>\s*<div class="page-content combined-page">\s*<div class="materials-section">/,
    `  <div class="page reference-page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="section-block materials-section">`
  );
}

// Replace the 3-page structure with 1-page
const re = /  <div class="page">\s*<div class="cover-bar"><\/div>\s*<div class="page-content combined-page">\s*<div class="materials-section">\s*<h1>Materials Used<\/h1>[\s\S]*?<p class="footer" style="margin-top:16px;">Toufik Calisthenics · reps-dz\.com<\/p>\s*<\/div>\s*<\/div>\s*<div class="page">\s*<div class="cover-bar"><\/div>\s*<div class="page-content intensity-summary-page">\s*<h1>Weekly Intensity Overview<\/h1>/;
const match = c.match(re);
if (match) {
  c = c.replace(re, `  <div class="page reference-page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="section-block materials-section">
        <h1>Materials Used</h1>
        <p class="sub">Equipment you need for this program</p>
        <table class="materials-table"><tbody>\${(getMaterialsList() || []).map((m, i) => \`<tr class="material-row \${i % 2 ? 'alt' : ''}"><td class="material-name">\${escapeHtml(m.name)}</td><td class="material-use">\${escapeHtml(m.use)}</td></tr>\`).join('')}</tbody></table>
      </div>
      <div class="section-block nutrition-section">
        <h1>Nutrition Guidelines</h1>
        <p class="sub">Support your training with simple, sustainable nutrition</p>
        \${buildNutritionSection6Week(nutrition, goals)}
      </div>
      <div class="section-block methods-section">
        <h1>Training Methods Used</h1>
        <p class="sub">Endurance-focused definitions – don't skip!</p>
        <table class="methods-table"><tbody>\${methodsHtml}</tbody></table>
      </div>
      <div class="section-block warmups-section">
        <h1>Warm-ups for each day</h1>
        <p class="sub">8–12 min · Preparation, not exhaustion · Follow before every session</p>
        \${warmupsHtml}
      </div>
      <div class="section-block protocols-section">
        <h1>Warm-up protocols (detailed)</h1>
        <p class="sub">Joint-safe · Materials listed · Coach notes</p>
        \${warmupProtocolsHtml}
      </div>
      <div class="section-block intensity-section">
        <h1>Weekly Intensity Overview</h1>`);
  console.log('Consolidated pages');
} else {
  console.log('Pattern not found, trying simpler replace');
}

// Add section-block CSS - allow breaks within long sections, titles at top
c = c.replace(
  '.no-break { page-break-inside: avoid; }',
  `.section-block { margin-bottom: 20px; }
    .section-block h1 { page-break-after: avoid; }
    .section-block.allow-break { page-break-inside: auto; }
    .protocol-card, .warmup-card { page-break-inside: auto; }
    .no-break { page-break-inside: avoid; }`
);

fs.writeFileSync(file, c);
console.log('Done');
