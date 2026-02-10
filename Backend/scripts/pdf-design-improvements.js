/**
 * PDF design improvements:
 * - Increase width (reduce margins), text size
 * - Cover: move reps table higher, keep on first page
 * - Nutrition: all on one page (reduce spacing)
 * - Merge warm-ups into protocols (remove duplicate section)
 * - Programs: larger font for visibility
 * - Week pages: one color (#fffbeb), no half-color
 * - Remove empty pages
 */
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../services/programPdfService.js');
let c = fs.readFileSync(p, 'utf8');

// 1. PDF margins - reduce for more width
c = c.replace(
  'margin: { top: 12, right: 12, bottom: 12, left: 12 }',
  'margin: { top: 10, right: 10, bottom: 10, left: 10 }'
);

// 2. Base font size 14 -> 16
c = c.replace(
  'body { font-family: \'Inter\', sans-serif; font-size: 14px; line-height: 1.4;',
  'body { font-family: \'Inter\', sans-serif; font-size: 16px; line-height: 1.45;'
);

// 3. Cover: reduce spacing so reps table stays on first page
c = c.replace('.cover .date { font-size: 12px; color: #94a3b8; margin-bottom: 48px; }',
  '.cover .date { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }');
c = c.replace('.reps-section { margin-top: 40px; text-align: left; max-width: 420px; margin-left: auto; margin-right: auto; }',
  '.reps-section { margin-top: 20px; text-align: left; max-width: 90%; margin-left: auto; margin-right: auto; }');
c = c.replace('.reps-table th { background: #eab308; color: #000; font-weight: 700; padding: 12px 14px; font-size: 14px;',
  '.reps-table th { background: #eab308; color: #000; font-weight: 700; padding: 12px 14px; font-size: 16px;');
c = c.replace('.reps-table td { padding: 10px 14px; border-bottom: 1px solid #fde68a; font-size: 14px; }',
  '.reps-table td { padding: 10px 14px; border-bottom: 1px solid #fde68a; font-size: 16px; }');
c = c.replace('.cover .sub { font-size: 30px; color: #ca8a04; font-weight: 700; margin-bottom: 32px; }',
  '.cover .sub { font-size: 28px; color: #ca8a04; font-weight: 700; margin-bottom: 16px; }');
c = c.replace('.cover-bar { height: 14px; background: linear-gradient(90deg, #eab308 0%, #ca8a04 100%); margin-bottom: 48px; }',
  '.cover-bar { height: 14px; background: linear-gradient(90deg, #eab308 0%, #ca8a04 100%); margin-bottom: 24px; }');
c = c.replace('.cover { text-align: center; padding-top: 24px; }',
  '.cover { text-align: center; padding-top: 12px; }');

// 4. Combined page padding for more width
c = c.replace('.combined-page { padding: 24px 40px; gap: 24px; }',
  '.combined-page { padding: 20px 24px; gap: 16px; max-width: 100%; }');
c = c.replace('.page { padding: 28px 36px;',
  '.page { padding: 20px 28px;');

// 5. Nutrition: tighter spacing to fit on one page
c = c.replace('.nutrition-targets { background: #fff; border: 2px solid #fde68a; border-radius: 12px; padding: 18px 24px; margin-bottom: 20px;',
  '.nutrition-targets { background: #fff; border: 2px solid #fde68a; border-radius: 12px; padding: 14px 20px; margin-bottom: 12px;');
c = c.replace('.nutrition-meal { background: #fff; border: 2px solid #fde68a; border-radius: 10px; padding: 14px 20px; margin-bottom: 12px;',
  '.nutrition-meal { background: #fff; border: 2px solid #fde68a; border-radius: 10px; padding: 10px 16px; margin-bottom: 8px;');
c = c.replace('.combined-page h1 { font-family: \'Oswald\', sans-serif; font-size: 22px;',
  '.combined-page h1 { font-family: \'Oswald\', sans-serif; font-size: 20px;');
c = c.replace('.combined-page .sub { font-size: 13px; color: #64748b; margin-bottom: 16px; }',
  '.combined-page .sub { font-size: 13px; color: #64748b; margin-bottom: 10px; }');

// 6. Remove separate warm-ups section, merge into protocols
// Find and remove the warmups page div, update warmupProtocolsHtml to include details from WARMUPS
// We need to modify the protocol card to include the quick summary. WARMUP_PROTOCOLS and WARMUPS match by title.
// Add details lookup: create a map title -> details, use in protocol
c = c.replace(
  `  const warmupsHtml = WARMUPS.map(w => {
    const iconSvg = ICONS[w.icon] || '';
    return \`
    <div class="warmup-card">
      <h3 class="warmup-title"><span class="warmup-icon" aria-hidden="true">\${iconSvg}</span>\${escapeHtml(w.title)}</h3>
      <p class="warmup-day">\${escapeHtml(w.day)}</p>
      <p class="warmup-details">\${escapeHtml(w.details)}</p>
    </div>
  \`;
  }).join('');

  const warmupProtocolsHtml = WARMUP_PROTOCOLS.map(w => {
    const iconSvg = ICONS[w.icon] || '';
    const exList = (w.exercises || []).map(e => \`<li><strong>\${escapeHtml(e.name)}</strong> — \${escapeHtml(e.prescription)}</li>\`).join('');
    return \`
    <div class="protocol-card">
      <h3 class="protocol-title"><span class="protocol-icon" aria-hidden="true">\${iconSvg}</span>\${escapeHtml(w.title)}</h3>
      <p class="protocol-day">\${escapeHtml(w.day)}</p>
      <p class="protocol-goal"><strong>Goal:</strong> \${escapeHtml(w.goal)}</p>
      <p class="protocol-materials"><strong>Materials:</strong> \${escapeHtml(w.materials)}</p>
      <ul class="protocol-exercises">\${exList}</ul>
      <p class="protocol-note">\${escapeHtml(w.coachNote)}</p>
    </div>
    \`;
  }).join('');`,
  `  const warmupDetailsByTitle = {};
  WARMUPS.forEach(w => { warmupDetailsByTitle[w.title] = w.details || ''; });
  const warmupProtocolsHtml = WARMUP_PROTOCOLS.map(w => {
    const iconSvg = ICONS[w.icon] || '';
    const quickSummary = warmupDetailsByTitle[w.title] ? \`<p class="protocol-quick">\${escapeHtml(warmupDetailsByTitle[w.title])}</p>\` : '';
    const exList = (w.exercises || []).map(e => \`<li><strong>\${escapeHtml(e.name)}</strong> — \${escapeHtml(e.prescription)}</li>\`).join('');
    return \`
    <div class="protocol-card">
      <h3 class="protocol-title"><span class="protocol-icon" aria-hidden="true">\${iconSvg}</span>\${escapeHtml(w.title)}</h3>
      <p class="protocol-day">\${escapeHtml(w.day)}</p>
      \${quickSummary}
      <p class="protocol-goal"><strong>Goal:</strong> \${escapeHtml(w.goal)}</p>
      <p class="protocol-materials"><strong>Materials:</strong> \${escapeHtml(w.materials)}</p>
      <ul class="protocol-exercises">\${exList}</ul>
      <p class="protocol-note">\${escapeHtml(w.coachNote)}</p>
    </div>
    \`;
  }).join('');`
);

// Remove warmups section page
c = c.replace(
  `  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="warmups-section">
        <h1>Warm-ups for each day</h1>
        <p class="sub">8–12 min · Preparation, not exhaustion · Follow before every session</p>
        \${warmupsHtml}
      </div>
    </div>
  </div>
  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="protocols-section">
        <h1>Warm-up protocols (detailed)</h1>
        <p class="sub">Joint-safe · Materials listed · Coach notes</p>
        \${warmupProtocolsHtml}
      </div>
    </div>
  </div>`,
  `  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="protocols-section">
        <h1>Warm-up protocols</h1>
        <p class="sub">8–12 min · Preparation, not exhaustion · Joint-safe · Follow before every session</p>
        \${warmupProtocolsHtml}
      </div>
    </div>
  </div>`
);

// Add protocol-quick style
c = c.replace('.protocol-day { font-size: 11px; color: #eab308; font-weight: 600; margin-bottom: 6px; }',
  '.protocol-day { font-size: 11px; color: #eab308; font-weight: 600; margin-bottom: 4px; }\n    .protocol-quick { font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 8px; }');

// 7. Combine Nutrition + Methods on one page to avoid overflow
c = c.replace(
  `  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="nutrition-section">
        <h1>Nutrition Guidelines</h1>
        <p class="sub">Support your training with simple, sustainable nutrition</p>
        \${buildNutritionSection6Week(nutrition, goals)}
      </div>
    </div>
  </div>
  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="methods-section">
        <h1>Training Methods Used</h1>
        <p class="sub">Endurance-focused definitions – don't skip!</p>
        <table class="methods-table"><tbody>\${methodsHtml}</tbody></table>
      </div>
    </div>
  </div>`,
  `  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
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
    </div>
  </div>`
);

// 8. Program week pages: larger font
c = c.replace('.ex-name { font-weight: 700; margin-bottom: 4px; font-size: 15px; }',
  '.ex-name { font-weight: 700; margin-bottom: 4px; font-size: 17px; }');
c = c.replace('.ex-line { margin-bottom: 2px; font-size: 14px; line-height: 1.45; }',
  '.ex-line { margin-bottom: 3px; font-size: 16px; line-height: 1.5; }');
c = c.replace('.ex-rest { font-style: italic; font-size: 12px; margin-top: 2px; opacity: 0.9; }',
  '.ex-rest { font-style: italic; font-size: 14px; margin-top: 2px; opacity: 0.9; }');
c = c.replace('.ex-note { font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic; }',
  '.ex-note { font-size: 13px; color: #64748b; margin-top: 4px; font-style: italic; }');
c = c.replace('.day-title { font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 10px;',
  '.day-title { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 10px;');
c = c.replace('.week-title { font-family: \'Oswald\', sans-serif; font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 6px; }',
  '.week-title { font-family: \'Oswald\', sans-serif; font-size: 26px; font-weight: 700; text-align: center; margin-bottom: 6px; }');
c = c.replace('.week-schedule { list-style: none; margin-bottom: 10px; font-size: 14px; }',
  '.week-schedule { list-style: none; margin-bottom: 10px; font-size: 15px; }');

// 9. Week pages: one solid color (#fffbeb), no intensity half-color
c = c.replace(
  `    return \`
      <div class="page week-page" style="background: \${bg};">
        <div class="cover-bar"></div>`,
  `    return \`
      <div class="page week-page" style="background: #fffbeb;">
        <div class="cover-bar" style="background: linear-gradient(90deg, \${barColor} 0%, \${barColor}99 100%);"></div>`
);

// 10. Intensity overview page - ensure one color (already #fffbeb from .page)
// intensity-page uses .page which has background #fffbeb - good. week-summary-row had background #fff - make it #fffbeb for consistency
c = c.replace('.week-summary-row { padding: 12px 16px; margin-bottom: 10px; background: #fff; border-radius: 8px; font-size: 14px; line-height: 1.5; }',
  '.week-summary-row { padding: 12px 16px; margin-bottom: 10px; background: #fffbeb; border-radius: 8px; font-size: 15px; line-height: 1.5; border: 1px solid #fde68a; }');

// 11. Materials, methods - increase font slightly
c = c.replace('.material-row td { padding: 10px 14px; border-radius: 8px; font-size: 13px; vertical-align: top; }',
  '.material-row td { padding: 10px 14px; border-radius: 8px; font-size: 15px; vertical-align: top; }');
c = c.replace('.method-row td { padding: 10px 14px; border-radius: 8px; vertical-align: top; font-size: 13px; }',
  '.method-row td { padding: 10px 14px; border-radius: 8px; vertical-align: top; font-size: 15px; }');

fs.writeFileSync(p, c);
console.log('PDF design improvements applied.');
