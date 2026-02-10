const fs = require('fs');
let c = fs.readFileSync('services/programPdfService.js', 'utf8');

// 1. Build warmupDetailsByTitle map and merge details into protocol cards
const warmupsMap = `  const warmupDetailsByTitle = {}; WARMUPS.forEach(w => { warmupDetailsByTitle[w.title] = w.details || ""; });\n  `;
c = c.replace(/  const warmupsHtml = WARMUPS\.map\(/, warmupsMap + 'const warmupsHtml = WARMUPS.map(');

// 2. Replace warmupProtocolsHtml to include details in each protocol card
c = c.replace(
  /const warmupProtocolsHtml = WARMUP_PROTOCOLS\.map\(w => \{[\s\S]*?\}\)\(\).join\(''\);/,
  `const warmupProtocolsHtml = WARMUP_PROTOCOLS.map(w => {
    const iconSvg = ICONS[w.icon] || '';
    const details = warmupDetailsByTitle[w.title] ? \`<p class="protocol-details"><strong>Details:</strong> \${escapeHtml(warmupDetailsByTitle[w.title])}</p>\` : '';
    const exList = (w.exercises || []).map(e => \`<li><strong>\${escapeHtml(e.name)}</strong> — \${escapeHtml(e.prescription)}</li>\`).join('');
    return \`
    <div class="protocol-card">
      <h3 class="protocol-title"><span class="protocol-icon" aria-hidden="true">\${iconSvg}</span>\${escapeHtml(w.title)}</h3>
      <p class="protocol-day">\${escapeHtml(w.day)}</p>
      \${details}
      <p class="protocol-goal"><strong>Goal:</strong> \${escapeHtml(w.goal)}</p>
      <p class="protocol-materials"><strong>Materials:</strong> \${escapeHtml(w.materials)}</p>
      <ul class="protocol-exercises">\${exList}</ul>
      <p class="protocol-note">\${escapeHtml(w.coachNote)}</p>
    </div>
    \`;
  }).join('');`
);

// 3. Remove warmups section page, keep only protocols (merge them)
c = c.replace(
  /<div class="page section-page"><div class="cover-bar"><\/div><h1 class="section-title">Warm-ups for each day<\/h1><div class="warmup-grid">\$\{warmupsHtml\}<\/div><\/div>\s*/g,
  ''
);

// 4. Put Nutrition and Methods on one page (single section-page)
c = c.replace(
  /<div class="page section-page"><div class="cover-bar"><\/div><h1 class="section-title">Nutrition Guidelines<\/h1>([\s\S]*?)<\/div>\s*<div class="page section-page"><div class="cover-bar"><\/div><h1 class="section-title">Methods<\/h1>([\s\S]*?)<\/div>/,
  `<div class="page section-page"><div class="cover-bar"></div><h1 class="section-title">Nutrition & Methods</h1>$1<div class="methods-section" style="margin-top:20px">$2</div></div>`
);

// 5. Increase reps table font
c = c.replace(/\.reps-table td, \.reps-table th \{ font-size: 14px;/g, '.reps-table td, .reps-table th { font-size: 16px;');

fs.writeFileSync('services/programPdfService.js', c);
console.log('Done');
