/**
 * Migrate from JSON-based AI validation to plain-text Coach Review.
 * Run: node scripts/migrate-coach-validation.js
 */
const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../controllers/programController.js');
const pdfPath = path.join(__dirname, '../services/programPdfService.js');

// --- 1. Program Controller ---
let ctrl = fs.readFileSync(controllerPath, 'utf8');

// Remove validateProgramWithAI and related code, add generateCoachReview
const TO_REMOVE = `/** Master validation prompt – AI as senior coach. Only sessions, reps, sets. Can only reduce/replace/simplify. */
const VALIDATION_PROMPT = \`You are a senior calisthenics coach reviewing TRAINING SESSIONS ONLY (reps, sets, exercise names). Not nutrition, materials, or PDF layout.

Your role: Verify realism, safety, fatigue control. Fix reps, sets, exercise names. Replace with regressions if needed (assisted pull-ups, knee push-ups, bench dips, box squats, step-back burpees). Adjust rest strings.

Rules: Never increase reps, sets, or intensity. Never add high-intensity methods. If beginner/overweight: movement patterns, assisted/regressed, low volume. If zero/negative reps: replace with easier variations. Week 1 = friendly.

Output: ONLY valid JSON. Same structure. Minimal – each exercise: name, sets, rest. No notes, no extra fields. Output ONLY: {"program":[{"week":1,"days":[{"day":1,"focus":"...","exercises":[{"name":"...","sets":"...","rest":"..."}]}]}]}\`;

/** Extract minimal sessions for validation (name, sets, rest only – no notes, no type). */
function extractMinimalSessions(program) {
  return (program || []).map((w) => ({
    week: w.week,
    days: (w.days || []).map((d) => ({
      day: d.day,
      focus: d.focus || '',
      exercises: (d.exercises || []).map((e) => ({
        name: e.name || '',
        sets: (e.sets || '').toString().trim().slice(0, 200),
        rest: (e.rest || '').toString().trim().slice(0, 80)
      }))
    }))
  }));
}

/** Merge AI corrections back into original program (update name, sets, rest only). */
function mergeValidationIntoProgram(original, validated) {
  if (!Array.isArray(validated) || validated.length === 0) return original;
  return original.map((w, wi) => {
    const vw = validated[wi];
    if (!vw || !vw.days) return w;
    return {
      ...w,
      days: (w.days || []).map((d, di) => {
        const vd = vw.days && vw.days[di];
        if (!vd || !vd.exercises) return d;
        return {
          ...d,
          exercises: (d.exercises || []).map((e, ei) => {
            const ve = vd.exercises && vd.exercises[ei];
            if (!ve) return e;
            return {
              ...e,
              name: (ve.name && String(ve.name).trim()) || e.name,
              sets: (ve.sets != null && String(ve.sets).trim()) ? String(ve.sets) : e.sets,
              rest: (ve.rest != null) ? String(ve.rest) : e.rest
            };
          })
        };
      })
    };
  });
}

const VALIDATION_MAX_TOKENS = 65536;
const VALIDATION_SAFETY_CAP = 5;

/** Validate program with AI (senior coach). Retries until success or safety cap. */
async function validateProgramWithAI(result, options = {}) {
  const program = result.program || [];
  if (!Array.isArray(program) || program.length === 0) return result;
  const minimal = extractMinimalSessions(program);
  const prompt = \`\${VALIDATION_PROMPT}\\n\\nSessions to review:\\n\${JSON.stringify({ program: minimal })}\`;
  let attempt = 0;
  while (attempt < VALIDATION_SAFETY_CAP) {
    attempt++;
    try {
      const content = await callOpenRouter([{ role: 'user', content: prompt }], { max_tokens: VALIDATION_MAX_TOKENS });
      const parsed = parseAIProgramResponse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = mergeValidationIntoProgram(program, parsed);
        console.log('[Program] AI validation: sessions corrected by senior coach');
        return { ...result, program: merged };
      }
    } catch (err) {
      console.warn(\`[Program] AI validation attempt \${attempt} failed:\`, err.message);
      if (attempt < VALIDATION_SAFETY_CAP) {
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.warn('[Program] AI validation safety cap reached, using original');
      }
    }
  }
  return result;
}

/** Enhance 6-week or 12-week program with AI coach note.`;

const COACH_REVIEW_ADD = `/** Build short session summaries for coach review (no full workouts). */
function buildWeekSummaryForCoach(week) {
  const days = (week.days || []).filter((d) => !d.isRest);
  const summaries = days.map((d) => {
    const exercises = (d.exercises || []).filter((e) => e.type !== 'warmup' && e.type !== 'cooldown');
    const methods = [];
    exercises.forEach((e) => {
      const text = ((e.sets || '') + (e.note || '')).toUpperCase();
      if (text.includes('EMOM')) methods.push('EMOM');
      if (text.includes('AMRAP')) methods.push('AMRAP');
      if (text.includes('FOR TIME') || text.includes('FOR TIME')) methods.push('FOR TIME');
      if (text.includes('DEGRESSIVE')) methods.push('DEGRESSIVE');
      if (text.includes('LADDER')) methods.push('LADDER');
      if (text.includes('CHIPPER')) methods.push('CHIPPER');
      if (text.includes('UNBROKEN') || text.includes('NO STOP')) methods.push('UNBROKEN');
      if (text.includes('ISOMETRIC') || text.includes('HOLD')) methods.push('ISOMETRIC');
      if (text.includes('SEPARATED') || text.includes('SEPARATED VOLUME')) methods.push('Separated volume');
    });
    const unique = [...new Set(methods)];
    const names = exercises.slice(0, 4).map((e) => (e.name || '').replace(/^Exercise \\d+:/i, '').trim()).filter(Boolean);
    return \`Day \${d.day} \${d.focus || 'Training'}: \${unique.join(', ') || 'Volume'} — \${names.slice(0, 3).join(', ') || 'main exercises'}\`;
  });
  return summaries.join('\\n');
}

const COACH_REVIEW_PROMPT = \`You are a professional calisthenics coach reviewing ONE WEEK of an algorithm-generated program. You are NOT the generator. You DO NOT change athlete max reps. You DO NOT return JSON. You DO NOT invent exercises. Output PLAIN TEXT ONLY.

Your job: Detect overload, poor method stacking, unrealistic EMOMs, insufficient rest. Protect recovery. Preserve long-term progression. Always reduce, never increase.

Output format (plain text):
Coach Review – Week X
Overall assessment: (Too hard / Appropriate / Slightly aggressive / Unsafe)
Detected issues: (bullet list)
Recommended adjustments: (bullet list – always reduce)
Rest & recovery notes: (where rest must increase)
Coach trust notes: (1–2 lines)

Keep under 500 tokens.\`;

/** Generate plain-text coach review for one week. No program mutation. */
async function generateCoachReview({ week, weekSummary, athleteStats, level, mainSport, weekIntensity }) {
  const mr = athleteStats || {};
  const prompt = \`\${COACH_REVIEW_PROMPT}

ATHLETE: Level \${level}. Max: Pull \${mr.pullUps ?? 0}, Dips \${mr.dips ?? 0}, Push \${mr.pushUps ?? 0}, Squats \${mr.squats ?? 0}, Leg raises \${mr.legRaises ?? 0}, Burpees \${mr.burpees ?? 0}\${mr.muscleUp ? \`, MU \${mr.muscleUp}\` : ''}.
Main sport: \${mainSport || 'Calisthenics'}.
Week \${week} intensity: \${weekIntensity || 'Moderate'}.

Weekly structure & session summaries:
\${weekSummary}\`;

  const content = await callOpenRouter([{ role: 'user', content: prompt }], { max_tokens: 600 });
  return (content || '').trim();
}

/** Add coach reviews (plain text) for each week. No program mutation. */
async function addCoachReviewsToProgram(result, options = {}) {
  const program = result.program || [];
  const maxReps = result.maxReps || {};
  const level = result.level || 'intermediate';
  const mainSport = options.otherSport ? String(options.otherSport) : 'Calisthenics';
  if (!Array.isArray(program) || program.length === 0) return result;
  const coachReview = {};
  for (const week of program) {
    try {
      const weekSummary = buildWeekSummaryForCoach(week);
      const text = await generateCoachReview({
        week: week.week,
        weekSummary,
        athleteStats: maxReps,
        level,
        mainSport,
        weekIntensity: week.intensityLabel || 'Moderate'
      });
      if (text) coachReview[\`week\${week.week}\`] = text;
    } catch (err) {
      console.warn(\`[Program] Coach review week \${week.week} failed:\`, err.message);
    }
  }
  return { ...result, coachReview: Object.keys(coachReview).length > 0 ? coachReview : undefined };
}

/** Enhance 6-week or 12-week program with AI coach note.`;
`;

ctrl = ctrl.replace(TO_REMOVE, COACH_REVIEW_ADD);

// Replace validateProgramWithAI with addCoachReviewsToProgram in call sites
ctrl = ctrl.replace(
  'result = await validateProgramWithAI(result, { level, goals: options.goals });',
  'result = await addCoachReviewsToProgram(result, { level, otherSport: options.otherSport });'
);
ctrl = ctrl.replace(
  'result = await validateProgramWithAI(result, { level, goals });',
  'result = await addCoachReviewsToProgram(result, { level, otherSport: options?.otherSport });'
);

// Fix the second call - it's in fulfillProgramFromPayPalData, options may not have otherSport, get from pending
// Let me check - in fulfillProgramFromPayPalData we have: const { ..., otherSport } = pending; and options = { goals } from the flow
// Actually the call is: result = await validateProgramWithAI(result, { level, goals });
// We need to pass otherSport. In fulfillProgramFromPayPalData, otherSport comes from pending. Let me add it.
// The replace will change both - but the second one is in fulfillProgramFromPayPalData. There we have access to otherSport from pending. So we need a different replace for that one.
// Let me do: first replace handles generateAndSend6WeekEmail - that has options.goals and we need options.otherSport. But generateAndSend6WeekEmail might not have otherSport in options - let me check.
// generateAndSend6WeekEmail body: level, maxReps, heightCm, weightKg, email, userName, userAge, goals
// So otherSport is not in the email flow. For PayPal fulfill we have otherSport from pending.
// I'll pass otherSport: options.otherSport for the first, and for fulfill we need to get otherSport from pending. The fulfill code:
//   if (calisthenicsMainSport === false && otherSport) options.otherSport = otherSport;
// So before the AI block they set options.otherSport. But the call is validateProgramWithAI(result, { level, goals }) - they pass level and goals only! So we need to change the fulfill call to pass otherSport too.
// Let me update the replace to pass otherSport from the right place. For fulfill: result = await addCoachReviewsToProgram(result, { level, otherSport });
// We have otherSport in scope from the destructuring. So the replacement for fulfill should be:
// result = await addCoachReviewsToProgram(result, { level, otherSport });
ctrl = ctrl.replace(
  /result = await validateProgramWithAI\(result, \{ level, goals \}\);/g,
  'result = await addCoachReviewsToProgram(result, { level, otherSport: otherSport || options?.otherSport });'
);

// For generateAndSend6WeekEmail, the body has: const { email, userName, userAge, level, maxReps, heightCm, weightKg, goals } = req.body;
// So otherSport is not there. We can pass undefined and mainSport will default to 'Calisthenics'. Good.

// Fix: In fulfillProgramFromPayPalData the variable is `otherSport` from destructuring pending. The replace uses otherSport - but in the replace we have options?.otherSport. In fulfill there's no options passed to the AI block - it's a standalone block. Let me look at the fulfill code again.
// fulfillProgramFromPayPalData:   if (process.env.OPENROUTER_API_KEY) { try { result = await validateProgramWithAI(result, { level, goals }); ...
// So they pass { level, goals }. The variable otherSport is in scope from const { ..., otherSport } = pending.
// I'll change the second call to pass otherSport: result = await addCoachReviewsToProgram(result, { level, otherSport });
// But my replace changes both calls. The first (generateAndSend6WeekEmail) doesn't have otherSport in scope - it has goals. So for that one we need options.otherSport but there's no options.otherSport in that handler. Let me check - generateAndSend6WeekEmail gets goals from req.body. otherSport might not be in the 6-week email flow. So for that handler, otherSport will be undefined - that's fine, mainSport defaults to 'Calisthenics'.

// Actually the replace uses a regex with /g so it replaces both. Both calls will become:
// result = await addCoachReviewsToProgram(result, { level, otherSport: otherSport || options?.otherSport });
// In generateAndSend6WeekEmail, otherSport is not in scope - it will be undefined. options?.otherSport - there's no options object in that block. So we'd get otherSport: undefined. Good.
// In fulfillProgramFromPayPalData, otherSport IS in scope from pending. So otherSport || options?.otherSport will use otherSport. Good.

// But wait - the fulfill call doesn't have "options" in scope. So options?.otherSport would throw ReferenceError. Let me fix - use a different approach. For fulfill the destructured variables include otherSport. So we need:
// - generateAndSend6WeekEmail: addCoachReviewsToProgram(result, { level }) - no otherSport
// - fulfillProgramFromPayPalData: addCoachReviewsToProgram(result, { level, otherSport })

// I'll do two separate replaces to be safe.
ctrl = ctrl.replace(
  'result = await addCoachReviewsToProgram(result, { level, otherSport: otherSport || options?.otherSport });\n        result = await enhancePaidProgramWithAI',
  'result = await addCoachReviewsToProgram(result, { level, otherSport });\n        result = await enhancePaidProgramWithAI'
);

// Hmm, that might break the first one. Let me think. The fulfill code block has:
//   const { ..., otherSport } = pending;
//   ...
//   result = await validateProgramWithAI(result, { level, goals });
// So after our replace it becomes addCoachReviewsToProgram(result, { level, otherSport: otherSport || options?.otherSport }). In fulfill, options is not in scope. So we get ReferenceError for options. I need to fix this.
// Simpler: just pass { level, otherSport } for the fulfill block. And for generateAndSend6WeekEmail, pass { level } only. So I need two different replacements. Let me do them based on context.
// Actually in the replace we're replacing "validateProgramWithAI(result, { level, goals })" - both calls use the same string. So one replace changes both. For generateAndSend6WeekEmail, we don't have otherSport. For fulfill we do. The safest is to pass otherSport when available. In addCoachReviewsToProgram we have options.otherSport - if it's undefined, mainSport defaults to 'Calisthenics'. So we need:
// - For both: addCoachReviewsToProgram(result, { level, otherSport: ?? })
// In generateAndSend6WeekEmail scope: we have goals. We don't have otherSport or options.
// In fulfill scope: we have otherSport, goals. We don't have options.
// So we can't use options?.otherSport in either. Let me use: otherSport: typeof otherSport !== 'undefined' ? otherSport : undefined
// But that would require otherSport to be in scope for generateAndSend6WeekEmail - it's not. So we'd get ReferenceError.
// The solution: we need different code for each. Let me search for the two occurrences and replace them differently.
// First occurrence (generateAndSend6WeekEmail): replace with addCoachReviewsToProgram(result, { level })
// Second occurrence (fulfill): replace with addCoachReviewsToProgram(result, { level, otherSport })

// I'll do the replace without the otherSport complexity - just pass { level }. The addCoachReviewsToProgram will get otherSport from options.otherSport which we need to pass. For generateAndSend6WeekEmail we don't have otherSport in the request body - the 6-week send flow might not include it. Let me check the route.
// Looking at the code - generateAndSend6WeekEmail is for when user buys without PayPal? Or it's a different flow. Let me keep it simple: pass { level } for both, and for fulfill we need to add otherSport to what we pass. The fulfill function has direct access to otherSport. So I'll do:
// Replace 1 (generateAndSend6WeekEmail): validateProgramWithAI(result, { level, goals: options.goals }) -> addCoachReviewsToProgram(result, { level })
// Replace 2 (fulfill): validateProgramWithAI(result, { level, goals }) -> addCoachReviewsToProgram(result, { level, otherSport })
// These have different signatures! The first has options.goals, the second has goals. So I can do two targeted replaces.
ctrl = ctrl.replace(
  'result = await validateProgramWithAI(result, { level, goals: options.goals });',
  'result = await addCoachReviewsToProgram(result, { level });'
);
ctrl = ctrl.replace(
  'result = await validateProgramWithAI(result, { level, goals });',
  'result = await addCoachReviewsToProgram(result, { level, otherSport });'
);

fs.writeFileSync(controllerPath, ctrl);
console.log('Updated programController.js');

// --- 2. PDF Service - add coach review display ---
let pdf = fs.readFileSync(pdfPath, 'utf8');

// Add coachReview to buildProgramHtml and inject into week template
if (!pdf.includes('coachReview')) {
  pdf = pdf.replace(
    'const program = programData.program || [];',
    'const program = programData.program || [];\n  const coachReview = programData.coachReview || {};'
  );
  pdf = pdf.replace(
    `${`${'          ${weekHeader}'}\n          <div class="days">${allDaysHtml}</div>\n        </div>`}
      </div>`,
    `${`${'          ${weekHeader}'}\n          <div class="days">${allDaysHtml}</div>\n${"          ${coachReview[`week${week.week}`] ? `<div class=\"coach-review-box\"><h4>Coach Notes – Week ${week.week}</h4><div class=\"coach-review-text\">${escapeHtml(coachReview[`week${week.week}`]).replace(/\\n/g, '<br>')}</div></div>` : ''}"}\n        </div>`}
      </div>`
  );
}

// Add CSS for coach-review-box
if (!pdf.includes('coach-review-box')) {
  pdf = pdf.replace(
    '.no-break { page-break-inside: avoid; }',
    `.no-break { page-break-inside: avoid; }
    .coach-review-box { margin-top: 20px; padding: 16px 20px; background: #fffbeb; border: 2px solid #fde68a; border-radius: 12px; page-break-inside: avoid; }
    .coach-review-box h4 { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 8px; }
    .coach-review-text { font-size: 12px; line-height: 1.6; color: #475569; white-space: pre-wrap; }`
  );
}

fs.writeFileSync(pdfPath, pdf);
console.log('Updated programPdfService.js');
console.log('Done.');
