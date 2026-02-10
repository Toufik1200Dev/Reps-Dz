const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../services/programPdfService.js');
let c = fs.readFileSync(p, 'utf8');
if (!c.includes('coachReview')) {
  c = c.replace(
    'const program = programData.program || [];',
    'const program = programData.program || [];\n  const coachReview = programData.coachReview || {};'
  );
  c = c.replace(
    '<div class="days">${allDaysHtml}</div>\n        </div>\n      </div>',
    '<div class="days">${allDaysHtml}</div>\n${coachReview["week" + week.week] ? `<div class="coach-review-box"><h4>Coach Notes – Week ${week.week}</h4><div class="coach-review-text">${escapeHtml(coachReview["week" + week.week]).replace(/\\n/g, "<br>")}</div></div>` : ""}\n        </div>\n      </div>'
  );
  c = c.replace(
    '.no-break { page-break-inside: avoid; }',
    `.no-break { page-break-inside: avoid; }
    .coach-review-box { margin-top: 20px; padding: 16px 20px; background: #fffbeb; border: 2px solid #fde68a; border-radius: 12px; page-break-inside: avoid; }
    .coach-review-box h4 { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 8px; }
    .coach-review-text { font-size: 12px; line-height: 1.6; color: #475569; white-space: pre-wrap; }`
  );
  fs.writeFileSync(p, c);
  console.log('Added coach review to PDF');
} else {
  console.log('Already has coachReview');
}
