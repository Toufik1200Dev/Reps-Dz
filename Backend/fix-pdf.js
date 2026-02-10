const fs = require('fs');
let c = fs.readFileSync('./services/programPdfService.js', 'utf8');
c = c.replace(
  ".combined-page h1 { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #0f172a; }",
  ".combined-page h1 { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; margin-top: 0; color: #0f172a; text-align: left; page-break-after: avoid; }"
);
c = c.replace(
  ".intensity-summary-page h1 { font-family: 'Oswald', sans-serif; font-size: 26px; font-weight: 700; text-align: center; margin-bottom: 8px; }",
  ".intensity-summary-page h1 { font-family: 'Oswald', sans-serif; font-size: 26px; font-weight: 700; text-align: left; margin-bottom: 8px; margin-top: 0; page-break-after: avoid; }"
);
// Consolidate pages 2+3+4 into one flowing page to avoid empty pages
const before = /  <div class="page">\s+<div class="cover-bar"><\/div>\s+<div class="page-content combined-page">\s+<div class="materials-section">/;
const after = '  <div class="page reference-page">\n    <div class="cover-bar"></div>\n    <div class="page-content combined-page">\n      <div class="section-block materials-section">';
if (before.test(c)) {
  c = c.replace(before, after);
}
// Remove the 2nd and 3rd page divs - merge warmups+protocols+intensity into same page
c = c.replace(
  /<\/div>\s+<\/div>\s+<div class="page">\s+<div class="cover-bar"><\/div>\s+<div class="page-content combined-page">\s+<div class="warmups-section">/,
  '</div>\n      <div class="section-block warmups-section">'
);
c = c.replace(
  /<p class="footer" style="margin-top:16px;">Toufik Calisthenics · reps-dz\.com<\/p>\s+<\/div>\s+<\/div>\s+<div class="page">\s+<div class="cover-bar"><\/div>\s+<div class="page-content intensity-summary-page">\s+<h1>Weekly Intensity Overview<\/h1>/,
  '<div class="section-block intensity-section"><h1>Weekly Intensity Overview</h1>'
);
// Fix closing - intensity-section should wrap its content and we need one footer
c = c.replace(
  /<p class="intensity-note">Week 1 is introductory[^<]+<\/p>\s+<p class="footer" style="margin-top:24px;">Toufik Calisthenics · reps-dz\.com<\/p>\s+<\/div>\s+<\/div>\s+<div class="page reference-page">/,
  '<p class="intensity-note">Week 1 is introductory. Intensity progresses gradually. Weeks 5–6 are mandatory deload/taper.</p>\n      <p class="footer" style="margin-top:24px;">Toufik Calisthenics · reps-dz.com</p>\n    </div>\n  </div>\n  <div class="page reference-page">'
);
fs.writeFileSync('./services/programPdfService.js', c);
console.log('Done');
