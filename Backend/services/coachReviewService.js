/**
 * Plain-text Coach Review – AI reviews one week at a time.
 * No program mutation. Algorithm builds; AI reviews, explains, flags risk.
 * Goal Alignment Review: verify program matches selected goals (plain text only).
 */

const { GOAL_LABELS } = require('./goalDrivenConfig');

/** Build short session summaries for coach review (no full workouts). */
function buildWeekSummaryForCoach(week) {
  const days = (week.days || []).filter((d) => !d.isRest);
  const summaries = days.map((d) => {
    const exercises = (d.exercises || []).filter((e) => e.type !== 'warmup' && e.type !== 'cooldown');
    const methods = [];
    exercises.forEach((e) => {
      const text = ((e.sets || '') + (e.note || '')).toUpperCase();
      if (text.includes('EMOM')) methods.push('EMOM');
      if (text.includes('AMRAP')) methods.push('AMRAP');
      if (text.includes('FOR TIME')) methods.push('FOR TIME');
      if (text.includes('DEGRESSIVE')) methods.push('DEGRESSIVE');
      if (text.includes('LADDER')) methods.push('LADDER');
      if (text.includes('CHIPPER')) methods.push('CHIPPER');
      if (text.includes('UNBROKEN') || text.includes('NO STOP')) methods.push('UNBROKEN');
      if (text.includes('ISOMETRIC') || text.includes('HOLD')) methods.push('ISOMETRIC');
      if (text.includes('SEPARATED')) methods.push('Separated volume');
    });
    const unique = [...new Set(methods)];
    const names = exercises.slice(0, 4).map((e) => (e.name || '').replace(/^Exercise \d+:/i, '').trim()).filter(Boolean);
    return `Day ${d.day} ${d.focus || 'Training'}: ${unique.join(', ') || 'Volume'} — ${names.slice(0, 3).join(', ') || 'main exercises'}`;
  });
  return summaries.join('\n');
}

const COACH_REVIEW_PROMPT = `You are a professional calisthenics coach reviewing ONE WEEK of an algorithm-generated program. You are NOT the generator. You DO NOT change athlete max reps. You DO NOT return JSON. You DO NOT invent exercises. Output PLAIN TEXT ONLY.

Your job: Detect overload, poor method stacking, unrealistic EMOMs, insufficient rest. Protect recovery. Preserve long-term progression. Always reduce, never increase.

Output format (plain text):
Coach Review – Week X
Overall assessment: (Too hard / Appropriate / Slightly aggressive / Unsafe)
Detected issues: (bullet list)
Recommended adjustments: (bullet list – always reduce)
Rest & recovery notes: (where rest must increase)
Coach trust notes: (1–2 lines)

Keep under 500 tokens.`;

const GOAL_ALIGNMENT_REVIEW_PROMPT = `You are a professional calisthenics coach and program reviewer. Review ONE WEEK only. Output PLAIN TEXT only (no JSON).

Your job: Verify that the program matches the selected goals. Check exercise choices, secondary work, skills (prerequisites), fatigue and recovery. Flag goal conflicts if present.

Goal validation rules:
- Lose Weight → sufficient cardio density, movement density, shorter rest (not after near-max).
- Improve Endurance → repeatable sets, controlled reps (40–60% max), EMOM/AMRAP controlled.
- Build Muscle → enough volume and rest, progressive overload, limited cardio/conditioning.
- Learn New Skills → low fatigue, quality focus, skills only if prerequisites met; no EMOM+skills stacking.

If goals conflict (e.g. Lose Weight + Build Muscle): recommend which should dominate this week. You never add volume. You never increase intensity. You only rebalance and protect.

Output format (strict):
Goal Alignment Review – Week X
Selected goals: (list)
Goal match assessment: (Good / Partial / Needs adjustment)
Detected mismatches: (bullet points or None)
Suggested refinements: (bullet points – reduce or rebalance only)
Fatigue & recovery check: (short paragraph)
Coach trust note: (1–2 lines on why this structure supports the goals safely)

Keep under 400 tokens.`;

/** Generate Goal Alignment Review for one week. Plain text only. */
async function generateGoalAlignmentReview({ week, weekSummary, goals, level, athleteStats, weekIntensity }, callOpenRouterFn) {
  if (!callOpenRouterFn) return '';
  const goalsList = Array.isArray(goals) && goals.length > 0
    ? goals.map((g) => GOAL_LABELS[g] || g).join(', ')
    : 'General fitness';
  const mr = athleteStats || {};
  const prompt = `${GOAL_ALIGNMENT_REVIEW_PROMPT}

Week ${week}. Level: ${level}. Intensity: ${weekIntensity || 'Moderate'}.
Selected goals: ${goalsList}
Max: Pull ${mr.pullUps ?? 0}, Dips ${mr.dips ?? 0}, Push ${mr.pushUps ?? 0}, Squats ${mr.squats ?? 0}, Leg raises ${mr.legRaises ?? 0}, Burpees ${mr.burpees ?? 0}${mr.muscleUp ? `, MU ${mr.muscleUp}` : ''}.

Weekly structure & session summaries:
${weekSummary}

Review goal alignment. Output "Goal Alignment Review – Week ${week}" then the sections as specified.`;

  const content = await callOpenRouterFn([{ role: 'user', content: prompt }], { max_tokens: 400 });
  return (content || '').trim();
}

/** Generate plain-text coach review for one week. No program mutation. */
async function generateCoachReview({ week, weekSummary, athleteStats, level, mainSport, weekIntensity }, callOpenRouterFn) {
  if (!callOpenRouterFn) throw new Error('callOpenRouter is required');
  const callApi = callOpenRouterFn;
  const mr = athleteStats || {};
  const prompt = `${COACH_REVIEW_PROMPT}

ATHLETE: Level ${level}. Max: Pull ${mr.pullUps ?? 0}, Dips ${mr.dips ?? 0}, Push ${mr.pushUps ?? 0}, Squats ${mr.squats ?? 0}, Leg raises ${mr.legRaises ?? 0}, Burpees ${mr.burpees ?? 0}${mr.muscleUp ? `, MU ${mr.muscleUp}` : ''}.
Main sport: ${mainSport || 'Calisthenics'}.
Week ${week} intensity: ${weekIntensity || 'Moderate'}.

Weekly structure & session summaries:
${weekSummary}`;

  const content = await callApi([{ role: 'user', content: prompt }], { max_tokens: 500 });
  return (content || '').trim();
}

/** Delay helper to avoid rate limits when calling OpenRouter repeatedly. */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Process 2 weeks in parallel (each week runs coach + goal in parallel). Reduces total time vs sequential. */
const WEEKS_PER_BATCH = 2;
const DELAY_BETWEEN_BATCHES_MS = 1500;

function getFallbackText(weekNum) {
  return `Week ${weekNum}: Focus on movement quality and recovery. Follow the structure and rest as indicated.`;
}

/** Process a single week: coach + goal (if goals) in parallel. Returns [key, text]. */
async function processOneWeek(week, { maxReps, level, goals, mainSport }, callOpenRouterFn) {
  const weekNum = week.week;
  const weekSummary = buildWeekSummaryForCoach(week);
  const weekIntensity = week.intensityLabel || 'Moderate';
  const coachArgs = { week: weekNum, weekSummary, athleteStats: maxReps, level, mainSport, weekIntensity };
  const goalArgs = { week: weekNum, weekSummary, goals, level, athleteStats: maxReps, weekIntensity };

  try {
    let text;
    if (goals.length > 0) {
      const [coachText, goalText] = await Promise.all([
        generateCoachReview(coachArgs, callOpenRouterFn).catch((err) => {
          console.warn(`[Program] Coach review week ${weekNum} failed:`, err.message);
          return '';
        }),
        generateGoalAlignmentReview(goalArgs, callOpenRouterFn).catch((err) => {
          console.warn(`[Program] Goal alignment review week ${weekNum} failed:`, err.message);
          return '';
        })
      ]);
      text = [coachText, goalText].filter(Boolean).join('\n\n');
    } else {
      text = await generateCoachReview(coachArgs, callOpenRouterFn);
    }
    return [`week${weekNum}`, (text && text.trim()) ? text.trim() : getFallbackText(weekNum)];
  } catch (err) {
    console.warn(`[Program] Coach review week ${weekNum} failed:`, err.message);
    return [`week${weekNum}`, getFallbackText(weekNum)];
  }
}

/** Add coach reviews (plain text) for each week. Runs weeks in batches of 2 in parallel; cover note can be run alongside by caller. */
async function addCoachReviewsToProgram(result, options = {}, callOpenRouterFn) {
  const program = result.program || [];
  const maxReps = result.maxReps || {};
  const level = result.level || 'intermediate';
  const goals = options.goals || result.goals || [];
  const mainSport = (options.otherSport && String(options.otherSport).trim()) || 'Calisthenics';
  if (!Array.isArray(program) || program.length === 0) return result;

  const ctx = { maxReps, level, goals, mainSport };
  const coachReview = {};

  for (let b = 0; b < program.length; b += WEEKS_PER_BATCH) {
    if (b > 0) await delay(DELAY_BETWEEN_BATCHES_MS);
    const batch = program.slice(b, b + WEEKS_PER_BATCH);
    const pairs = await Promise.all(batch.map((week) => processOneWeek(week, ctx, callOpenRouterFn)));
    pairs.forEach(([key, text]) => { coachReview[key] = text; });
  }

  return { ...result, coachReview: Object.keys(coachReview).length > 0 ? coachReview : undefined };
}

module.exports = {
  buildWeekSummaryForCoach,
  generateCoachReview,
  generateGoalAlignmentReview,
  addCoachReviewsToProgram
};
