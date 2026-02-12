/**
 * Generate 6-week program PDF via Puppeteer.
 * Page 1: Cover + title + max reps + estimated reps
 * Page 2: Materials Used (jump rope, weights, dips belt, pull-up bar, parallel bars, parallettes, resistance bands)
 * Page 3: Nutrition + Methods
 * Page 4: Warm-ups quick reference (8–12 min, materials)
 * Page 5: Warm-up protocols detailed (goal, materials, exercises, coach notes)
 * Page 6: Intensity overview
 * Pages 7+: Program weeks (no break mid-day, bigger text, fit to page)
 */
const puppeteer = require('puppeteer');
const { getMaterialsList } = require('./programValidation');

const TRAINING_METHODS = [
  { name: 'EMOM', def: 'Every Minute On the Minute: perform a set number of reps at the start of each minute. Rest for the remainder. Classic endurance pacing.' },
  { name: 'AMRAP', def: 'As Many Rounds/Reps As Possible. Complete maximum work in the given time (e.g. 8, 10, 12 min). Records improve week-over-week.' },
  { name: 'FOR TIME', def: 'Complete a fixed workload as fast as possible. Partition reps as needed. Rest fully after.' },
  { name: 'DEGRESSIVE', def: 'Decreasing reps each round. Start high, decrease as you fatigue. Teaches pacing under fatigue.' },
  { name: 'LADDER', def: 'Ascending or descending rep scheme (e.g. 1-2-3-4-5 or 5-4-3-2-1). Builds density and mental toughness.' },
  { name: 'CHIPPER', def: 'One large set of many exercises. Complete all reps in any order. Tests sustained output.' },
  { name: 'NO STOP / UNBROKEN', def: 'Perform exercises back-to-back without rest until the round is complete. Teaches movement efficiency.' },
  { name: 'CLUSTER SETS', def: 'Volume broken into mini-sets with 10–15s rest. Builds total reps without lactic failure.' },
  { name: 'PROGRESSIVE', def: 'Increasing reps or time each week. Linear progression for endurance.' },
  { name: 'ISOMETRIC HOLD', def: 'Hold a position without movement. Builds strength and stability.' }
];

/** Quick-reference warm-ups (Page 3) */
const WARMUPS = [
  { title: 'Pull Day Warm-up', day: 'Day 1', icon: 'pull', details: '8-12 min · Band dislocates · Scapular pull-ups · Dead hangs 3×15s · Australian pull-up activation · Materials: resistance band, pull-up bar' },
  { title: 'Push Day Warm-up', day: 'Day 2', icon: 'push', details: '8-12 min · Wrist circles & holds · Band external rotations · Incline/knee push-ups · Scapular push-ups · Materials: resistance band, floor or parallel bars' },
  { title: 'Legs + Core + Cardio Warm-up', day: 'Day 3', icon: 'legs', details: '8-12 min · Hip circles · Bodyweight squats · Walking lunges · Jump rope or light skipping · Materials: floor, jump rope' },
  { title: 'Endurance Integration Warm-up', day: 'Day 4', icon: 'endurance', details: '8-12 min · Jump rope 1 min · Jumping jacks · Arm swings · Light squats · Step-back burpees · Materials: floor, jump rope' },
  { title: 'Weighted / Strength Day Warm-up', day: 'Day 5', icon: 'strength', details: '8-12 min · Empty set rehearsal · Light weighted pull-ups/dips · Isometric holds · Materials: weight belt/vest, plates (0-20 kg), pull-up bar, parallel bars' },
  { title: 'Max Test Day Warm-up', day: 'Week 6 Day 5', icon: 'test', details: 'Light movement 5-7 min · Practice each test exercise 2-3 reps · Rest 2-3 min before testing' },
  { title: 'Active Rest Day', day: 'Rest days', icon: 'rest', details: 'Light walk 10-15 min · Full body mobility · Stretching · Foam rolling · Optional: yoga or light swim' }
];

/** Detailed warm-up protocols (Page 4) – joint-safe, level-appropriate, 8-12 min each */
const WARMUP_PROTOCOLS = [
  {
    title: 'Pull Day Warm-up',
    icon: 'pull',
    day: 'Day 1',
    goal: 'Prepare shoulders, elbows, scapular control, and grip. Avoid early elbow fatigue.',
    materials: 'Resistance band, pull-up bar',
    exercises: [
      { name: 'Band shoulder dislocates', prescription: '10–15 reps, controlled tempo' },
      { name: 'Scapular pull-ups', prescription: '2 sets × 5–8 reps' },
      { name: 'Dead hangs', prescription: '3 × 15s, controlled release' },
      { name: 'Australian pull-up activation', prescription: '2 sets × 6–10 reps, smooth' }
    ],
    coachNote: 'This sequence prepares the pulling muscles and joints. Quality over volume. No fatigue accumulation.'
  },
  {
    title: 'Push Day Warm-up',
    icon: 'push',
    day: 'Day 2',
    goal: 'Prepare shoulders, elbows, wrists, and pressing pattern. Avoid shoulder impingement.',
    materials: 'Resistance band, floor or parallel bars',
    exercises: [
      { name: 'Wrist circles & wrist lean holds', prescription: '30s each direction, 2 holds × 15s' },
      { name: 'Band external rotations', prescription: '2 sets × 12–15 reps' },
      { name: 'Incline or knee push-ups', prescription: '2 sets × 10–15 reps' },
      { name: 'Scapular push-ups', prescription: '2 sets × 6–10 reps' }
    ],
    coachNote: 'Wrist and shoulder preparation reduces injury risk. Keep intensity low.'
  },
  {
    title: 'Legs + Core + Cardio Warm-up',
    icon: 'legs',
    day: 'Day 3',
    goal: 'Prepare hips, knees, ankles. Gradually raise heart rate. No fatigue.',
    materials: 'Floor, jump rope',
    exercises: [
      { name: 'Hip circles', prescription: '10 each direction' },
      { name: 'Bodyweight squats', prescription: '2 sets × 12–15 reps' },
      { name: 'Walking lunges', prescription: '10 each leg' },
      { name: 'Jump rope or light skipping', prescription: '1–2 min, easy pace' }
    ],
    coachNote: 'Progressive activation. Finish ready to train, not tired.'
  },
  {
    title: 'Endurance Integration Warm-up',
    icon: 'endurance',
    day: 'Day 4',
    goal: 'Full-body, breathing rhythm, low-impact activation. Intensity must remain low.',
    materials: 'Floor, jump rope',
    exercises: [
      { name: 'Jump rope', prescription: '1 min, easy pace' },
      { name: 'Jumping jacks', prescription: '1 min, controlled' },
      { name: 'Arm swings', prescription: '30s forward, 30s backward' },
      { name: 'Light squats', prescription: '2 sets × 12 reps' },
      { name: 'Step-back burpees', prescription: '2 sets × 5 reps, slow tempo' }
    ],
    coachNote: 'Prepares the body for combined work without fatigue. Breathing stays steady.'
  },
  {
    title: 'Weighted / Strength Day Warm-up',
    icon: 'strength',
    day: 'Day 5',
    goal: 'Joints under load, nervous system activation, movement rehearsal. Weights 0–20 kg only. No fatigue accumulation.',
    materials: 'Weight belt or vest, plates or dumbbells (0–20 kg), pull-up bar, parallel bars',
    exercises: [
      { name: 'Empty set rehearsal', prescription: 'Bodyweight first: 2–3 reps of first exercise' },
      { name: 'Light weighted pull-ups or dips', prescription: '2 sets × 3–5 reps, minimal load' },
      { name: 'Isometric holds', prescription: 'Top and bottom positions, 10–15s each' },
      { name: 'Slow eccentric reps', prescription: '2 reps, 4s down, bodyweight' }
    ],
    coachNote: 'Movement rehearsal before load. Form first. Load only when movement is clean.'
  },
  {
    title: 'Max Test Day Warm-up',
    icon: 'test',
    day: 'Week 6 Day 5',
    goal: 'Minimal fatigue. Practice each test exercise. Rest before testing.',
    materials: 'Same as primary movement (pull-up bar, parallel bars, etc.)',
    exercises: [
      { name: 'Light movement', prescription: '5–7 min general activation' },
      { name: 'Practice each test exercise', prescription: '2–3 reps only' },
      { name: 'Rest', prescription: '2–3 min before testing' }
    ],
    coachNote: 'You are prepared, not fatigued. Rest before the test.'
  }
];

/** Intensity colors: more visible and intense so the user feels them when reading. */
const INTENSITY_COLORS = {
  green: { bg: '#d1fae5', bar: '#047857', label: 'Low' },
  yellow: { bg: '#fef9c3', bar: '#ca8a04', label: 'Moderate' },
  red: { bg: '#fecaca', bar: '#b91c1c', label: 'High' },
  orange: { bg: '#ffedd5', bar: '#c2410c', label: 'High' },
  blue: { bg: '#dbeafe', bar: '#1d4ed8', label: 'Deload' }
};
const WEEK_INTENSITY = {
  1: 'green', 2: 'yellow', 3: 'yellow', 4: 'red', 5: 'green', 6: 'green',
  7: 'green', 8: 'yellow', 9: 'yellow', 10: 'red', 11: 'green', 12: 'green'
};
const WEEK_SUMMARY = {
  1: 'Introduction – friendly, low volume. Learn the movements.',
  2: 'Build – gradual increase in volume and intensity.',
  3: 'Build – continue progression. Movement quality priority.',
  4: 'Peak – highest intensity week. Limited and controlled. Recovery after.',
  5: 'Deload – mandatory recovery. Reduced volume.',
  6: 'Taper – light before max test. Record your numbers.',
  7: 'Block 2 intro – renewed focus. Low volume.',
  8: 'Build – gradual increase.',
  9: 'Build – continue progression.',
  10: 'Peak – highest intensity. Recovery after.',
  11: 'Deload – mandatory recovery.',
  12: 'Taper – final week. Max test.'
};

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Split coach note into labeled sections for clearer PDF layout (with lines). */
function formatCoachNoteAsSections(text) {
  if (!text || typeof text !== 'string') return '';
  const raw = text.trim();
  if (!raw) return '';
  const sections = [];
  const lines = raw.split(/\r?\n/);
  const headerLike = /^(Coach Review|Goal Alignment Review|Overall assessment|Detected issues|Recommended adjustments|Rest & recovery notes|Coach trust notes?|Selected goals|Goal match assessment|Detected mismatches|Suggested refinements|Fatigue & recovery check)\s*[:\-]/i;
  let currentLabel = '';
  let currentBody = [];
  function flush() {
    if (currentLabel || currentBody.length) {
      const body = currentBody.join('\n').trim();
      if (body || currentLabel) sections.push({ label: currentLabel.trim(), body });
    }
    currentLabel = '';
    currentBody = [];
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headerLike);
    if (match) {
      flush();
      const afterColon = line.replace(/^[^:\-]+[\-:]?\s*/, '').trim();
      currentLabel = line.replace(/\s*[:\-].*$/, '').trim();
      if (afterColon) currentBody.push(afterColon);
    } else if (line.trim()) {
      currentBody.push(line.trim());
    }
  }
  flush();
  if (sections.length === 0) return `<p class="coach-section-body">${escapeHtml(raw).replace(/\n/g, '<br>')}</p>`;
  return sections.map(({ label, body }) => `
    <div class="coach-review-section">
      ${label ? `<span class="coach-section-label">${escapeHtml(label)}</span>` : ''}
      <p class="coach-section-body">${escapeHtml(body).replace(/\n/g, '<br>')}</p>
    </div>
  `).join('');
}

function focusToIcon(focus) {
  if (!focus || typeof focus !== 'string') return 'exercise';
  const f = focus.toLowerCase();
  if (f.includes('pull')) return 'pull';
  if (f.includes('push')) return 'push';
  if (f.includes('leg') || f.includes('core') || f.includes('cardio')) return 'legs';
  if (f.includes('endurance')) return 'endurance';
  if (f.includes('strength') || f.includes('weight')) return 'strength';
  if (f.includes('test') || f.includes('max')) return 'test';
  if (f.includes('rest') || f.includes('active')) return 'rest';
  return 'exercise';
}

/** Minimal inline SVG icons – professional, stroke-based */
const ICONS = {
  pull: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="12" y1="8" x2="12" y2="20"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  push: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V4M9 7l3-3 3 3M9 17l3 3 3-3"/></svg>',
  legs: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v8M8 12l4 4 4-4M8 20h8"/></svg>',
  endurance: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2-4 2 8 2-4h4"/></svg>',
  strength: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="6"/><line x1="8" y1="6" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="18"/><line x1="4" y1="12" x2="20" y2="12"/></svg>',
  test: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  rest: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  method: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>',
  exercise: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  dayPull: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="8" x2="20" y2="8"/><line x1="12" y1="8" x2="12" y2="20"/></svg>',
  dayPush: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19V5M9 8l3-3 3 3"/></svg>',
  dayLegs: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v8M8 12l4 4 4-4"/></svg>',
  dayEndurance: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12h4l2-4 2 8 2-4h4"/></svg>'
};

/** Estimated max reps at end of program (projected improvement), not session reps. */
const GOAL_LABELS = {
  lose_weight: 'Lose Weight',
  improve_endurance: 'Improve Endurance',
  build_muscle: 'Build Muscle',
  learn_skills: 'Learn New Skills'
};

function buildNutritionSection6Week(nutrition, goals = []) {
  const hasNutrition = nutrition && (nutrition.tdee != null || nutrition.proteinG != null);
  if (!hasNutrition) {
    return '<p style="color:#64748b;">Add your height and weight when generating the program to see your daily calorie and protein targets.</p>';
  }
  const goalLabels = goals.length > 0
    ? goals.map((g) => GOAL_LABELS[g] || g).join(', ')
    : null;
  let coachNote = 'Calories and protein are adjusted to support your training and recovery. Whole foods, simple meals.';
  if (goals.includes('lose_weight')) {
    coachNote = 'Moderate calorie deficit with higher protein for satiety and muscle preservation. Focus on whole foods.';
  } else if (goals.includes('build_muscle')) {
    coachNote = 'Slight surplus and higher protein to support muscle growth. Post-workout carbs and protein help recovery.';
  } else if (goals.includes('improve_endurance')) {
    coachNote = 'Maintenance calories with adequate carbs for endurance days. Hydrate well before and after training.';
  } else if (goals.includes('learn_skills')) {
    coachNote = 'Stable energy for skill work. No aggressive deficits. Focus on recovery and consistency.';
  }
  const targetsHtml = `
    <div class="nutrition-targets">
      <h2>Daily Targets</h2>
      <p><strong>Calories:</strong> ~${nutrition.tdee || '—'} kcal</p>
      <p><strong>Protein:</strong> ~${nutrition.proteinG || '—'}g per day</p>
      ${goalLabels ? `<p style="margin-top:8px;font-size:13px;color:#64748b;"><strong>Goal:</strong> ${escapeHtml(goalLabels)}</p>` : ''}
      <p style="margin-top:12px;font-size:13px;line-height:1.6;color:#475569;">${escapeHtml(coachNote)}</p>
      <p style="margin-top:12px;font-size:13px;color:#475569;"><strong>Hydration:</strong> Drink water throughout the day. Before and after training.</p>
    </div>
  `;
  let mealsHtml = '';
  if (nutrition.sampleMeals && Array.isArray(nutrition.sampleMeals) && nutrition.sampleMeals.length > 0) {
    mealsHtml = `
    <h2 style="font-size:16px;font-weight:700;margin-bottom:12px;color:#0f172a;">Sample Daily Meals</h2>
    ${nutrition.sampleMeals.map((m) => {
      const foodList = (m.foods || []).map((f) => `<li>${escapeHtml(f.name)} — ${escapeHtml(f.qty || '')}</li>`).join('');
      return `
      <div class="nutrition-meal">
        <div class="meal-time">${escapeHtml(m.time || '')}</div>
        <div class="meal-name">${escapeHtml(m.name || 'Meal')}</div>
        ${foodList ? `<ul>${foodList}</ul>` : ''}
      </div>
    `;
    }).join('')}
    `;
  }
  return targetsHtml + mealsHtml;
}

function estEndMax(max) {
  if (!max || max < 1) return '—';
  const lo = Math.max(1, Math.round(max * 1.05));
  const hi = Math.max(1, Math.round(max * 1.15));
  return lo === hi ? `~${lo}` : `~${lo}-${hi}`;
}

function buildProgramHtml(programData, options = {}) {
  const { userName = '', userAge, level = 'intermediate', weeksCount = 6, goals = [] } = options;
  const program = programData.program || [];
  const coachReview = programData.coachReview || {};
  const maxReps = programData.maxReps || {};
  const nutrition = programData.nutrition || {};
  const levelStr = (level || 'intermediate').charAt(0).toUpperCase() + (level || 'intermediate').slice(1);
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const mr = maxReps;
  const maxRepsRows = [
    { label: 'Muscle-ups', max: mr.muscleUp, est: estEndMax(mr.muscleUp) },
    { label: 'Pull-ups', max: mr.pullUps ?? 0, est: estEndMax(mr.pullUps) },
    { label: 'Dips', max: mr.dips ?? 0, est: estEndMax(mr.dips) },
    { label: 'Push-ups', max: mr.pushUps ?? 0, est: estEndMax(mr.pushUps) },
    { label: 'Squats', max: mr.squats ?? 0, est: estEndMax(mr.squats) },
    { label: 'Leg raises', max: mr.legRaises ?? 0, est: estEndMax(mr.legRaises) },
    { label: 'Burpees', max: mr.burpees ?? 0, est: estEndMax(mr.burpees) }
  ];

  const maxRepsHtml = maxRepsRows.map(r => `
    <tr><td class="rep-label">${escapeHtml(r.label)}</td><td class="rep-max">${r.max ?? 0}</td><td class="rep-est">${r.est}</td></tr>
  `).join('');

  const methodsHtml = TRAINING_METHODS.map((row, i) => `
    <tr class="method-row ${i % 2 ? 'alt' : ''}">
      <td class="method-name"><span class="method-icon" aria-hidden="true">${ICONS.method}</span>${escapeHtml(row.name)}</td>
      <td class="method-def">${escapeHtml(row.def)}</td>
    </tr>
  `).join('');

  const warmupDetailsByTitle = {}; WARMUPS.forEach(w => { warmupDetailsByTitle[w.title] = w.details || ''; });
  const warmupsHtml = WARMUPS.map(w => {
    const iconSvg = ICONS[w.icon] || '';
    return `
    <div class="warmup-card">
      <h3 class="warmup-title"><span class="warmup-icon" aria-hidden="true">${iconSvg}</span>${escapeHtml(w.title)}</h3>
      <p class="warmup-day">${escapeHtml(w.day)}</p>
      <p class="warmup-details">${escapeHtml(w.details)}</p>
    </div>
  `;
  }).join('');

  const warmupProtocolsHtml = WARMUP_PROTOCOLS.map(w => {
    const iconSvg = ICONS[w.icon] || '';
    const details = warmupDetailsByTitle[w.title] ? `<p class="protocol-details"><strong>Details:</strong> ${escapeHtml(warmupDetailsByTitle[w.title])}</p>` : '';
    const exList = (w.exercises || []).map(e => `<li><strong>${escapeHtml(e.name)}</strong> — ${escapeHtml(e.prescription)}</li>`).join('');
    return `
    <div class="protocol-card">
      <h3 class="protocol-title"><span class="protocol-icon" aria-hidden="true">${iconSvg}</span>${escapeHtml(w.title)}</h3>
      <p class="protocol-day">${escapeHtml(w.day)}</p>
      ${details}
      <p class="protocol-goal"><strong>Goal:</strong> ${escapeHtml(w.goal)}</p>
      <p class="protocol-materials"><strong>Materials:</strong> ${escapeHtml(w.materials)}</p>
      <ul class="protocol-exercises">${exList}</ul>
      <p class="protocol-note">${escapeHtml(w.coachNote)}</p>
    </div>
    `;
  }).join('');

  const weeksHtml = program.map(week => {
    const intensityKey = week.intensityColor || WEEK_INTENSITY[week.week] || 'yellow';
    const ic = INTENSITY_COLORS[intensityKey] || INTENSITY_COLORS.yellow;
    const bg = ic.bg;
    const barColor = ic.bar;
    const scheduleHtml = (week.weekSchedule || []).map(s =>
      `<li>${escapeHtml(s.dayLabel)}: ${s.isRest ? 'Rest' : escapeHtml(s.focus)}</li>`
    ).join('');
    const allDaysHtml = (week.days || []).map(day => {
      const exercises = (day.exercises || []).filter(ex => ex.type !== 'warmup' && ex.type !== 'cooldown');
      const exHtml = exercises.map(ex => {
        const name = (ex.name || '').replace(/^Exercise \d+:\s*/i, '').trim() || 'Exercise';
        const sets = (ex.sets || '').toString().split('\n').filter(Boolean).map(l => `<div class="ex-line">${escapeHtml(l.trim())}</div>`).join('');
        const rest = ex.rest ? `<div class="ex-rest">Rest: ${escapeHtml(ex.rest)}</div>` : '';
        const note = ex.note ? `<div class="ex-note">${escapeHtml(ex.note)}</div>` : '';
        return `
          <div class="exercise no-break">
            <div class="ex-name">${escapeHtml(name)}</div>
            ${sets}
            ${rest}
            ${note}
          </div>
        `;
      }).join('');
      const dayIcon = ICONS[focusToIcon(day.focus)] || '';
      return `
        <div class="day-block no-break">
          <h3 class="day-title"><span class="day-icon" aria-hidden="true">${dayIcon}</span>Day ${day.day}: ${escapeHtml(day.focus)}</h3>
          <div class="exercises">${exHtml}</div>
        </div>
      `;
    }).join('');
    const intensityLabel = week.intensityLabel || ic.label;
    const weekHeader = `
      <div class="week-bar" style="background: ${barColor}; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
      <h1 class="week-title">Week ${week.week}</h1>
      <p class="week-intensity-badge" style="background-color: ${barColor}; color: ${(intensityKey === 'red' || intensityKey === 'orange' || intensityKey === 'blue') ? '#fff' : '#0f172a'}; -webkit-print-color-adjust: exact; print-color-adjust: exact;">${escapeHtml(intensityLabel)}</p>
      ${(week.week === 6 || week.week === 12) ? '<p class="week-subtitle">Test your limits</p>' : ''}
      ${scheduleHtml ? `<ul class="week-schedule">${scheduleHtml}</ul>` : ''}
    `;
    return `
      <div class="page week-page" style="background-color: ${bg}; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <div class="cover-bar"></div>
        <div class="page-content week-page-inner">
          ${weekHeader}
          <div class="days">${allDaysHtml}</div>
${coachReview["week" + week.week] ? `<div class="coach-review-box"><h4>Coach Notes – Week ${week.week}</h4><div class="coach-review-text">${formatCoachNoteAsSections(coachReview["week" + week.week])}</div></div>` : ""}
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.45; color: #1e293b; background: #fffbeb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 24px 32px; page-break-after: always; background: #fffbeb; min-height: 297mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-cover { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 0; }
    .page:not(.page-cover) { min-height: 297mm; display: flex; flex-direction: column; }
    .page:last-child { page-break-after: auto; }
    .page-content { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; }
    .section-page { page-break-before: always; padding: 28px 36px; background: #fffbeb; }
    .section-page:first-of-type { page-break-before: auto; }
    .section-page .cover-bar { margin-bottom: 24px; }
    .cover-bar { width: 100%; height: 10px; background: #ca8a04; margin-bottom: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { text-align: center; padding: 0 16px; max-width: 480px; margin: 0 auto; }
    .cover h1 { font-family: 'Oswald', sans-serif; font-size: 36px; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 4px; color: #0f172a; }
    .cover .sub { font-size: 20px; color: #b45309; font-weight: 700; margin-bottom: 10px; }
    .cover .meta { font-size: 14px; color: #64748b; margin-bottom: 2px; }
    .cover .cover-goal { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .cover-goal { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .cover .cover-coach-note { display: block; margin-bottom: 8px; }
    .cover .date { font-size: 12px; color: #94a3b8; margin-bottom: 12px; }
    .reps-section { margin-top: 12px; text-align: center; width: 100%; max-width: 380px; margin-left: auto; margin-right: auto; page-break-inside: avoid; break-inside: avoid; }
    .reps-section h2 { font-size: 14px; font-weight: 700; margin-bottom: 8px; text-align: center; color: #0f172a; }
    .reps-table { width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #b45309; border-radius: 8px; overflow: hidden; page-break-inside: avoid; break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .reps-table th { background: #ca8a04; color: #1e293b; font-weight: 700; padding: 6px 10px; font-size: 13px; text-align: left; }
    .reps-table th:nth-child(1) { width: 45%; }
    .reps-table th:nth-child(2), .reps-table th:nth-child(3) { width: 27.5%; text-align: center; }
    .reps-table td { padding: 6px 10px; border-bottom: 1px solid #fde68a; font-size: 13px; background: #fff; }
    .reps-table tr:nth-child(even) td { background: #fefce8; }
    .reps-table tr:last-child td { border-bottom: none; }
    .rep-label { font-weight: 600; text-align: left; }
    .rep-max { text-align: center; font-weight: 700; }
    .rep-est { text-align: center; color: #64748b; }
    .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 12px; page-break-before: avoid; }
    .page-cover .cover { padding-top: 4px; }
    .page-cover .cover h1 { font-size: 32px; margin-bottom: 4px; }
    .page-cover .cover .sub { font-size: 18px; margin-bottom: 8px; }
    .page-cover .cover .meta { font-size: 13px; margin-bottom: 2px; }
    .page-cover .cover .cover-goal, .page-cover .cover-goal { font-size: 14px; margin-bottom: 6px; }
    .page-cover .cover .date { font-size: 11px; margin-bottom: 10px; }
    .page-cover .reps-section { margin-top: 10px; }
    .page-cover .reps-section h2 { font-size: 13px; margin-bottom: 6px; }
    .page-cover .reps-table th, .page-cover .reps-table td { padding: 5px 8px; font-size: 12px; }
    .page-cover .footer { margin-top: 10px; }
    .combined-page { padding: 28px 40px; gap: 28px; max-width: 100%; }
    .combined-page h1 { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; margin-top: 0; color: #0f172a; text-align: left; page-break-after: avoid; }
    .combined-page .sub { font-size: 13px; color: #64748b; margin-bottom: 16px; }
    .nutrition-section, .methods-section, .warmups-section, .protocols-section, .materials-section { margin-bottom: 20px; }
    .section-block { width: 100%; }
    .materials-section { page-break-inside: avoid; break-inside: avoid; }
    .materials-page { min-height: 0; }
    .materials-table { width: 100%; border-collapse: collapse; border: 2px solid #b45309; border-radius: 8px; overflow: hidden; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .materials-table th { background: #ca8a04; color: #1e293b; font-weight: 700; padding: 10px 14px; font-size: 14px; text-align: left; }
    .materials-table td { padding: 10px 14px; font-size: 13px; vertical-align: middle; border-bottom: 1px solid #fde68a; background: #fff; }
    .materials-table tr:last-child td { border-bottom: none; }
    .materials-table tr:nth-child(even) td { background: #fefce8; }
    .materials-table .material-name { width: 160px; font-weight: 700; }
    .materials-table .material-use { line-height: 1.5; }
    .methods-table { width: 100%; border-collapse: collapse; border: 2px solid #b45309; border-radius: 8px; overflow: hidden; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .methods-table th { background: #ca8a04; color: #1e293b; font-weight: 700; padding: 10px 14px; font-size: 14px; text-align: left; }
    .methods-table td { padding: 10px 14px; font-size: 13px; vertical-align: middle; border-bottom: 1px solid #fde68a; background: #fff; line-height: 1.5; }
    .methods-table tr:last-child td { border-bottom: none; }
    .methods-table tr:nth-child(even) td { background: #fefce8; }
    .methods-table .method-name { width: 180px; font-weight: 700; }
    .method-icon { display: inline-flex; flex-shrink: 0; color: #ca8a04; margin-right: 6px; vertical-align: middle; }
    .methods-page { padding: 36px 40px; }
    .methods-page h1 { font-family: 'Oswald', sans-serif; font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 10px; }
    .methods-page .sub { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 28px; }
    .warmups-page { padding: 36px 40px; }
    .warmups-page h1 { font-family: 'Oswald', sans-serif; font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 8px; }
    .warmups-page .sub { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px; }
    .warmup-card { background: #fff; border: 2px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; page-break-inside: avoid; }
    .warmup-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: #0f172a; display: flex; align-items: center; gap: 10px; }
    .warmup-icon { display: inline-flex; flex-shrink: 0; color: #ca8a04; }
    .protocol-icon { display: inline-flex; flex-shrink: 0; color: #ca8a04; }
    .warmup-day { font-size: 12px; color: #eab308; font-weight: 600; margin-bottom: 8px; }
    .warmup-details { font-size: 14px; line-height: 1.55; color: #475569; }
    .protocols-page { padding: 36px 40px; }
    .protocols-page h1 { font-family: 'Oswald', sans-serif; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 6px; }
    .protocols-page .sub { font-size: 13px; color: #64748b; text-align: center; margin-bottom: 20px; }
    .protocol-card { background: #fff; border: 2px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; page-break-inside: avoid; }
    .protocol-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f172a; display: flex; align-items: center; gap: 10px; }
    .protocol-day { font-size: 11px; color: #eab308; font-weight: 600; margin-bottom: 6px; }
    .protocol-goal, .protocol-materials { font-size: 12px; line-height: 1.5; margin-bottom: 6px; color: #475569; }
    .protocol-exercises { font-size: 12px; margin: 8px 0 8px 18px; line-height: 1.6; color: #334155; }
    .protocol-exercises li { margin-bottom: 4px; }
    .protocol-note { font-size: 11px; font-style: italic; color: #64748b; margin-top: 8px; padding-top: 8px; border-top: 1px solid #fde68a; }
    .nutrition-page { padding: 36px 40px; }
    .nutrition-page h1 { font-family: 'Oswald', sans-serif; font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 10px; }
    .nutrition-page .sub { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px; }
    .nutrition-targets { background: #fff; border: 2px solid #fde68a; border-radius: 12px; padding: 18px 24px; margin-bottom: 20px; page-break-inside: avoid; }
    .nutrition-targets h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .nutrition-meal { background: #fff; border: 2px solid #fde68a; border-radius: 10px; padding: 14px 20px; margin-bottom: 12px; page-break-inside: avoid; }
    .nutrition-meal .meal-name { font-weight: 700; margin-bottom: 6px; color: #0f172a; }
    .nutrition-meal .meal-time { font-size: 12px; color: #eab308; font-weight: 600; margin-bottom: 4px; }
    .nutrition-meal ul { margin: 6px 0 0 16px; font-size: 13px; line-height: 1.6; }
    .page.week-page { min-height: 297mm; display: flex; flex-direction: column; }
    .week-page { padding: 20px 28px; page-break-after: always; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .week-page .page-content { flex: 1; min-height: 0; }
    .week-bar { height: 10px; background: linear-gradient(90deg, #eab308 0%, #ca8a04 100%); margin-bottom: 16px; }
    .week-title { font-family: 'Oswald', sans-serif; font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 6px; }
    .week-subtitle { font-size: 14px; text-align: center; margin-bottom: 16px; opacity: 0.9; }
    .week-schedule { list-style: none; margin-bottom: 10px; font-size: 14px; }
    .week-schedule li { padding: 2px 0; }
    .week-intensity-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
    .intensity-section-inline { page-break-inside: avoid; }
    .intensity-inline-title { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 700; text-align: left; margin-bottom: 6px; margin-top: 0; color: #0f172a; page-break-after: avoid; }
    .intensity-legend { text-align: left; font-size: 14px; margin-bottom: 16px; }
    .intensity-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin: 0 4px 0 12px; vertical-align: middle; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .week-summary-list { margin-bottom: 16px; width: 100%; }
    .week-summary-row { padding: 10px 14px; margin-bottom: 8px; background: #fff; border-radius: 8px; font-size: 14px; line-height: 1.5; border-left: 4px solid #ca8a04; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .intensity-note { font-size: 13px; color: #64748b; font-style: italic; }
    .protocols-and-intensity-page { min-height: 0; }
    .day-block { margin-bottom: 14px; page-break-inside: avoid; }
    .day-title { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .day-icon { display: inline-flex; flex-shrink: 0; color: inherit; opacity: 0.9; }
    .exercise { margin-bottom: 10px; padding-left: 12px; border-left: 4px solid rgba(0,0,0,0.25); page-break-inside: avoid; }
    .ex-name { font-weight: 700; margin-bottom: 4px; font-size: 17px; }
    .ex-line { margin-bottom: 3px; font-size: 16px; line-height: 1.5; }
    .ex-rest { font-style: italic; font-size: 14px; margin-top: 2px; opacity: 0.9; }
    .ex-note { font-size: 13px; color: #64748b; margin-top: 4px; font-style: italic; }
    .week-dark { color: #fff; }
    .week-dark .week-title, .week-dark .day-title, .week-dark .ex-name { color: #fff; }
    .week-dark .week-schedule li, .week-dark .ex-line, .week-dark .ex-rest, .week-dark .ex-note { color: rgba(255,255,255,0.92); }
    .week-dark .exercise { border-left-color: rgba(255,255,255,0.5); }
    .no-break { page-break-inside: avoid; }
    .coach-review-box { margin-top: 20px; padding: 16px 20px; background: #fffbeb; border: 2px solid #ca8a04; border-radius: 12px; page-break-inside: avoid; }
    .coach-review-box h4 { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eab308; }
    .coach-review-text { font-size: 12px; line-height: 1.6; color: #334155; }
    .coach-review-section { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #fde68a; }
    .coach-review-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .coach-section-label { display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #b45309; margin-bottom: 4px; }
    .coach-section-body { margin: 0; font-size: 12px; line-height: 1.55; color: #475569; }
  </style>
</head>
<body>
  <div class="page page-cover">
    <div class="cover-bar"></div>
    <div class="cover page-content">
      <h1>YOUR ${weeksCount === 12 ? '12-' : '6-'}WEEK</h1>
      <div class="sub">CALISTHENICS PROGRAM</div>
      ${goals && goals.length > 0 ? `<p class="cover-goal"><strong>Goal:</strong> ${goals.map((g) => escapeHtml(GOAL_LABELS[g] || g)).join(', ')}</p>` : ''}
      ${programData.aiCoachNote ? `<p class="cover-coach-note" style="font-size:14px;font-style:italic;color:#475569;margin:12px auto;max-width:400px;">${escapeHtml(programData.aiCoachNote)}</p>` : ''}
      <p class="meta">Level: ${escapeHtml(levelStr)}</p>
      ${userName && String(userName).trim() && userName !== 'None' ? `<p class="meta">Created for ${escapeHtml(String(userName).trim())}${userAge != null && userAge >= 13 && userAge <= 120 ? `, ${userAge} years` : ''}</p>` : ''}
      <p class="date">${escapeHtml(dateStr)}</p>
      <div class="reps-section">
        <h2>Your Max Reps &amp; Est. Max at End of Program</h2>
        <table class="reps-table">
          <thead><tr><th>Exercise</th><th>Your Max</th><th>Est. Max at End</th></tr></thead>
          <tbody>${maxRepsHtml}</tbody>
        </table>
      </div>
      <p class="footer">Toufik Calisthenics · toufik-calisthenics.com</p>
    </div>
  </div>
  <div class="page materials-page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page materials-page-content">
      <div class="section-block materials-section">
        <h1>Materials Used</h1>
        <p class="sub">Equipment you need for this program</p>
        <table class="materials-table"><thead><tr><th>Equipment</th><th>Use</th></tr></thead><tbody>${(getMaterialsList() || []).map((m, i) => `<tr><td class="material-name">${escapeHtml(m.name)}</td><td class="material-use">${escapeHtml(m.use)}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>
  </div>
  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="nutrition-section">
        <h1>Nutrition Guidelines</h1>
        <p class="sub">Support your training with simple, sustainable nutrition</p>
        ${buildNutritionSection6Week(nutrition, goals)}
      </div>
      <div class="methods-section" style="margin-top: 24px;">
        <h1>Training Methods Used</h1>
        <p class="sub">Endurance-focused definitions – don't skip!</p>
        <table class="methods-table"><thead><tr><th>Method</th><th>Definition</th></tr></thead><tbody>${methodsHtml}</tbody></table>
      </div>
    </div>
  </div>
  <div class="page protocols-and-intensity-page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="protocols-section">
        <h1>Warm-up protocols (detailed)</h1>
        <p class="sub">Joint-safe · Materials listed · Coach notes</p>
        ${warmupProtocolsHtml}
      </div>
      <div class="intensity-section-inline" style="margin-top: 28px; padding-top: 20px; border-top: 2px solid #fde68a;">
        <h1 class="intensity-inline-title">Weekly Intensity Overview</h1>
        <p class="sub">Prioritize sustainability and long-term progression. No back-to-back high-intensity days.</p>
        <div class="intensity-legend">
          <span class="intensity-dot" style="background:#047857;"></span> Green = Low (intro/deload)
          <span class="intensity-dot" style="background:#ca8a04;"></span> Yellow = Moderate (build)
          <span class="intensity-dot" style="background:#b91c1c;"></span> Red = High (peak)
          <span class="intensity-dot" style="background:#c2410c;"></span> Orange = High
          <span class="intensity-dot" style="background:#1d4ed8;"></span> Blue = Deload
        </div>
        <div class="week-summary-list">
          ${program.map(w => {
            const key = w.intensityColor || WEEK_INTENSITY[w.week] || 'yellow';
            const summary = WEEK_SUMMARY[w.week] || '';
            const ic = INTENSITY_COLORS[key] || INTENSITY_COLORS.yellow;
            return `<div class="week-summary-row" style="border-left: 4px solid ${ic.bar}; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
              <strong>Week ${w.week}</strong> — ${escapeHtml(summary)}
            </div>`;
          }).join('')}
        </div>
        <p class="intensity-note">Week 1 is introductory. Intensity progresses gradually. ${weeksCount === 12 ? 'Weeks 5–6 and 11–12 are mandatory deload/taper.' : 'Weeks 5–6 are mandatory deload/taper.'}</p>
      </div>
      <p class="footer" style="margin-top:20px;">Toufik Calisthenics · toufik-calisthenics.com</p>
    </div>
  </div>
  ${weeksHtml}
</body>
</html>`;
}

async function generate6WeekPdfBuffer(programData, options = {}) {
  const html = buildProgramHtml(programData, options);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 10, right: 10, bottom: 10, left: 10 }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) await browser.close();
  }
}

/** Simplified nutrition for 1-week: estimations, goal note, no sample meals. */
function buildNutritionSection1Week(nutrition, goals = []) {
  const hasNutrition = nutrition && (nutrition.tdee != null || nutrition.proteinG != null);
  if (!hasNutrition) {
    return '<p style="color:#64748b;">Add your height and weight when generating the program to see your daily calorie and protein targets.</p>';
  }
  const goalLabels = goals.length > 0 ? goals.map((g) => GOAL_LABELS[g] || g).join(', ') : null;
  let coachNote = 'Calories and protein are estimates to support training. Whole foods, simple meals.';
  if (goals.includes('lose_weight')) {
    coachNote = 'Moderate calorie deficit with higher protein for satiety. Focus on whole foods.';
  } else if (goals.includes('build_muscle')) {
    coachNote = 'Slight surplus and higher protein to support muscle growth. Post-workout carbs help recovery.';
  } else if (goals.includes('improve_endurance')) {
    coachNote = 'Maintenance calories with adequate carbs for endurance days. Hydrate well.';
  } else if (goals.includes('learn_skills')) {
    coachNote = 'Stable energy for skill work. No aggressive deficits. Focus on recovery.';
  }
  return `
    <div class="nutrition-targets">
      <h2>Daily Targets (estimates)</h2>
      <p><strong>Calories:</strong> ~${nutrition.tdee || '—'} kcal</p>
      <p><strong>Protein:</strong> ~${nutrition.proteinG || '—'}g per day</p>
      ${goalLabels ? `<p style="margin-top:8px;font-size:13px;color:#64748b;"><strong>Goal:</strong> ${escapeHtml(goalLabels)}</p>` : ''}
      <p style="margin-top:12px;font-size:13px;line-height:1.6;color:#475569;">${escapeHtml(coachNote)}</p>
      <p style="margin-top:12px;font-size:13px;color:#475569;"><strong>Hydration:</strong> Drink water throughout the day. Before and after training.</p>
    </div>
  `;
}

/** Key methods used in 1-week (condensed list). */
const TRAINING_METHODS_1WEEK = [
  { name: 'EMOM', def: 'Every Minute On the Minute: perform reps at the start of each minute. Rest for the remainder.' },
  { name: 'AMRAP', def: 'As Many Rounds/Reps As Possible in the given time. Records improve week-over-week.' },
  { name: 'FOR TIME', def: 'Complete a fixed workload as fast as possible. Partition reps as needed.' },
  { name: 'DEGRESSIVE', def: 'Decreasing reps each round. Teaches pacing under fatigue.' },
  { name: 'LADDER', def: 'Ascending or descending rep scheme. Builds density and mental toughness.' },
  { name: 'CHIPPER', def: 'One large set of many exercises. Complete all reps in any order.' }
];

/** 1-week free program PDF: same rules as paid – cover, nutrition, warm-ups, methods, intensity, 4 sessions. */
function build1WeekProgramHtml(programData, options = {}) {
  const { userName = '', userAge, level = 'intermediate', goals = [] } = options;
  const program = programData.program || [];
  const maxReps = programData.maxReps || {};
  const nutrition = programData.nutrition || {};
  const levelStr = (level || 'intermediate').charAt(0).toUpperCase() + (level || 'intermediate').slice(1);
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const mr = maxReps;
  const maxRepsRows = [
    { label: 'Muscle-ups', max: mr.muscleUp ?? 0, est: estEndMax(mr.muscleUp) },
    { label: 'Pull-ups', max: mr.pullUps ?? 0, est: estEndMax(mr.pullUps) },
    { label: 'Dips', max: mr.dips ?? 0, est: estEndMax(mr.dips) },
    { label: 'Push-ups', max: mr.pushUps ?? 0, est: estEndMax(mr.pushUps) },
    { label: 'Squats', max: mr.squats ?? 0, est: estEndMax(mr.squats) },
    { label: 'Leg raises', max: mr.legRaises ?? 0, est: estEndMax(mr.legRaises) },
    { label: 'Burpees', max: mr.burpees ?? 0, est: estEndMax(mr.burpees) }
  ];
  const maxRepsHtml = maxRepsRows.map(r =>
    `<tr><td class="rep-label">${escapeHtml(r.label)}</td><td class="rep-max">${r.max}</td><td class="rep-est">${r.est}</td></tr>`
  ).join('');

  const nutritionHtml = buildNutritionSection1Week(nutrition, goals);

  const warmups1Week = WARMUPS.slice(0, 4);
  const warmupsHtml = warmups1Week.map(w => {
    const iconSvg = ICONS[w.icon] || '';
    return `
    <div class="warmup-card">
      <h3 class="warmup-title"><span class="warmup-icon" aria-hidden="true">${iconSvg}</span>${escapeHtml(w.title)}</h3>
      <p class="warmup-day">${escapeHtml(w.day)}</p>
      <p class="warmup-details">${escapeHtml(w.details)}</p>
    </div>
    `;
  }).join('');

  const methodsHtml = TRAINING_METHODS_1WEEK.map((row, i) => `
    <tr class="method-row ${i % 2 ? 'alt' : ''}">
      <td class="method-name"><span class="method-icon" aria-hidden="true">${ICONS.method}</span>${escapeHtml(row.name)}</td>
      <td class="method-def">${escapeHtml(row.def)}</td>
    </tr>
  `).join('');

  const week = program[0];
  const intensityKey = (week && week.intensityColor) || 'green';
  const ic = INTENSITY_COLORS[intensityKey] || INTENSITY_COLORS.green;
  const intensitySummaryHtml = `
    <div class="week-summary-row" style="border-left: 4px solid ${ic.bar};">
      <strong>Week 1</strong> — Introduction – friendly, low volume. Learn the movements.
    </div>
  `;

  const daysHtml = (week?.days || []).map(day => {
    const exercises = (day.exercises || []).filter(ex => ex.type !== 'warmup' && ex.type !== 'cooldown');
    const exHtml = exercises.map(ex => {
      const name = (ex.name || '').replace(/^Exercise \d+:\s*/i, '').trim() || 'Exercise';
      const sets = (ex.sets || '').toString().split('\n').filter(Boolean).map(l => `<div class="ex-line">${escapeHtml(l.trim())}</div>`).join('');
      const rest = ex.rest ? `<div class="ex-rest">Rest: ${escapeHtml(ex.rest)}</div>` : '';
      const note = ex.note ? `<div class="ex-note">${escapeHtml(ex.note)}</div>` : '';
      return `<div class="exercise no-break"><div class="ex-name">${escapeHtml(name)}</div>${sets}${rest}${note}</div>`;
    }).join('');
    const dayIcon = ICONS[focusToIcon(day.focus)] || '';
    return `<div class="day-block no-break"><h3 class="day-title"><span class="day-icon" aria-hidden="true">${dayIcon}</span>Day ${day.day}: ${escapeHtml(day.focus)}</h3><div class="exercises">${exHtml}</div></div>`;
  }).join('');

  const weekBg = ic.bg;
  const weekBarColor = ic.bar;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.45; color: #1e293b; background: #fffbeb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 24px 32px; page-break-after: always; background: #fffbeb; min-height: 297mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-cover { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
    .page:not(.page-cover) { min-height: 297mm; display: flex; flex-direction: column; }
    .page:last-child { page-break-after: auto; }
    .page-content { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; }
    .section-page { page-break-before: always; padding: 28px 36px; background: #fffbeb; }
    .section-page:first-of-type { page-break-before: auto; }
    .section-page .cover-bar { margin-bottom: 24px; }
    .cover-bar { width: 100%; height: 12px; background: #ca8a04; margin-bottom: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { text-align: center; padding: 0 16px; max-width: 520px; margin: 0 auto; }
    .cover h1 { font-family: 'Oswald', sans-serif; font-size: 42px; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 8px; color: #0f172a; }
    .cover .sub { font-size: 24px; color: #b45309; font-weight: 700; margin-bottom: 20px; }
    .cover .meta { font-size: 15px; color: #64748b; margin-bottom: 6px; }
    .cover-goal { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .cover .date { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
    .reps-section { margin-top: 24px; text-align: center; width: 100%; max-width: 400px; margin-left: auto; margin-right: auto; page-break-inside: avoid; break-inside: avoid; }
    .reps-section h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; text-align: center; color: #0f172a; }
    .reps-table { width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #b45309; border-radius: 8px; overflow: hidden; page-break-inside: avoid; break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .reps-table th { background: #ca8a04; color: #1e293b; font-weight: 700; padding: 10px 12px; font-size: 14px; text-align: left; }
    .reps-table th:nth-child(1) { width: 45%; }
    .reps-table th:nth-child(2), .reps-table th:nth-child(3) { width: 27.5%; text-align: center; }
    .reps-table td { padding: 10px 12px; border-bottom: 1px solid #fde68a; font-size: 14px; background: #fff; }
    .reps-table tr:nth-child(even) td { background: #fefce8; }
    .reps-table tr:last-child td { border-bottom: none; }
    .rep-label { font-weight: 600; text-align: left; }
    .rep-max { text-align: center; font-weight: 700; }
    .rep-est { text-align: center; color: #64748b; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 28px; page-break-before: avoid; }
    .page-cover .cover { padding-top: 8px; }
    .page-cover .cover h1 { font-size: 34px; margin-bottom: 6px; }
    .page-cover .cover .sub { font-size: 20px; margin-bottom: 16px; }
    .page-cover .cover .meta { font-size: 14px; margin-bottom: 4px; }
    .page-cover .cover-goal { font-size: 15px; margin-bottom: 8px; }
    .page-cover .cover .date { font-size: 12px; margin-bottom: 20px; }
    .page-cover .reps-section { margin-top: 20px; }
    .page-cover .reps-section h2 { font-size: 15px; margin-bottom: 10px; }
    .page-cover .reps-table th, .page-cover .reps-table td { padding: 8px 10px; font-size: 13px; }
    .page-cover .footer { margin-top: 24px; }
    .combined-page { padding: 24px 40px; gap: 24px; }
    .combined-page h1 { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; margin-top: 0; color: #0f172a; text-align: left; page-break-after: avoid; }
    .combined-page .sub { font-size: 13px; color: #64748b; margin-bottom: 16px; }
    .nutrition-section, .warmups-section, .methods-section, .intensity-section { margin-bottom: 20px; }
    .nutrition-targets { background: #fff; border: 2px solid #fde68a; border-radius: 12px; padding: 18px 24px; margin-bottom: 20px; page-break-inside: avoid; }
    .nutrition-targets h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .warmup-card { background: #fff; border: 2px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; page-break-inside: avoid; }
    .warmup-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: #0f172a; display: flex; align-items: center; gap: 10px; }
    .warmup-icon { display: inline-flex; flex-shrink: 0; color: #ca8a04; }
    .warmup-day { font-size: 12px; color: #eab308; font-weight: 600; margin-bottom: 8px; }
    .warmup-details { font-size: 14px; line-height: 1.55; color: #475569; }
    .methods-table { width: 100%; border-collapse: collapse; border: 2px solid #b45309; border-radius: 8px; overflow: hidden; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .methods-table th { background: #ca8a04; color: #1e293b; font-weight: 700; padding: 10px 14px; font-size: 14px; text-align: left; }
    .methods-table td { padding: 10px 14px; font-size: 13px; vertical-align: middle; border-bottom: 1px solid #fde68a; background: #fff; line-height: 1.5; }
    .methods-table tr:last-child td { border-bottom: none; }
    .methods-table tr:nth-child(even) td { background: #fefce8; }
    .methods-table .method-name { width: 180px; font-weight: 700; }
    .method-icon { display: inline-flex; flex-shrink: 0; color: #ca8a04; margin-right: 6px; vertical-align: middle; }
    .intensity-legend { text-align: center; font-size: 14px; margin-bottom: 20px; }
    .intensity-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin: 0 4px 0 12px; vertical-align: middle; }
    .week-summary-list { width: 100%; }
    .week-summary-row { padding: 12px 16px; margin-bottom: 10px; background: #fff; border-radius: 8px; font-size: 14px; line-height: 1.5; border-left: 4px solid #ca8a04; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .intensity-note { font-size: 13px; color: #64748b; font-style: italic; }
    .page.week-page { min-height: 297mm; display: flex; flex-direction: column; }
    .week-page { padding: 28px 36px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .week-page .page-content { flex: 1; min-height: 0; }
    .week-bar { height: 10px; margin-bottom: 16px; }
    .week-title { font-family: 'Oswald', sans-serif; font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 6px; }
    .week-intensity-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
    .day-block { margin-bottom: 14px; page-break-inside: avoid; }
    .day-title { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .day-icon { display: inline-flex; flex-shrink: 0; color: inherit; opacity: 0.9; }
    .exercise { margin-bottom: 10px; padding-left: 12px; border-left: 4px solid rgba(0,0,0,0.25); page-break-inside: avoid; }
    .ex-name { font-weight: 700; margin-bottom: 4px; font-size: 17px; }
    .ex-line { margin-bottom: 3px; font-size: 16px; line-height: 1.5; }
    .ex-rest { font-style: italic; font-size: 14px; margin-top: 2px; opacity: 0.9; }
    .ex-note { font-size: 13px; color: #64748b; margin-top: 4px; font-style: italic; }
    .no-break { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="page page-cover">
    <div class="cover-bar"></div>
    <div class="cover page-content">
      <h1>YOUR 1-WEEK</h1>
      <div class="sub">CALISTHENICS PROGRAM</div>
      ${goals && goals.length > 0 ? `<p class="cover-goal"><strong>Goal:</strong> ${goals.map((g) => escapeHtml(GOAL_LABELS[g] || g)).join(', ')}</p>` : ''}
      ${programData.aiCoachNote ? `<p class="cover-coach-note" style="font-size:14px;font-style:italic;color:#475569;margin:12px auto;max-width:400px;">${escapeHtml(programData.aiCoachNote)}</p>` : ''}
      <p class="meta">Level: ${escapeHtml(levelStr)}</p>
      ${userName && String(userName).trim() && userName !== 'None' ? `<p class="meta">Created for ${escapeHtml(String(userName).trim())}${userAge != null && userAge >= 13 && userAge <= 120 ? `, ${userAge} years` : ''}</p>` : ''}
      <p class="date">${escapeHtml(dateStr)}</p>
      <div class="reps-section">
        <h2>Your Max Reps &amp; Est. Max at End of Program</h2>
        <table class="reps-table">
          <thead><tr><th>Exercise</th><th>Your Max</th><th>Est. Max at End</th></tr></thead>
          <tbody>${maxRepsHtml}</tbody>
        </table>
      </div>
      <p class="footer">Toufik Calisthenics · toufik-calisthenics.com</p>
    </div>
  </div>
  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="nutrition-section">
        <h1>Nutrition Guidelines</h1>
        <p class="sub">Estimates to support your training – whole foods, simple meals</p>
        ${nutritionHtml}
      </div>
      <div class="warmups-section">
        <h1>Warm-ups for each day</h1>
        <p class="sub">8–12 min · Follow before every session</p>
        ${warmupsHtml}
      </div>
      <p class="footer" style="margin-top:20px;">Toufik Calisthenics · toufik-calisthenics.com</p>
    </div>
  </div>
  <div class="page">
    <div class="cover-bar"></div>
    <div class="page-content combined-page">
      <div class="methods-section">
        <h1>Training Methods Used</h1>
        <p class="sub">Key definitions – don't skip!</p>
        <table class="methods-table"><thead><tr><th>Method</th><th>Definition</th></tr></thead><tbody>${methodsHtml}</tbody></table>
      </div>
      <div class="intensity-section">
        <h1>Week 1 Intensity</h1>
        <p class="sub">Introduction week – low volume, learn the movements</p>
        <div class="intensity-legend">
          <span class="intensity-dot" style="background:#047857;"></span> Green = Low
          <span class="intensity-dot" style="background:#ca8a04;"></span> Yellow = Moderate
          <span class="intensity-dot" style="background:#b91c1c;"></span> Red = High
        </div>
        <div class="week-summary-list">${intensitySummaryHtml}</div>
        <p class="intensity-note">Week 1 is introductory. Intensity is kept low to learn movements.</p>
      </div>
      <p class="footer" style="margin-top:20px;">Toufik Calisthenics · toufik-calisthenics.com</p>
    </div>
  </div>
  <div class="page" style="background-color: ${weekBg}; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
    <div class="cover-bar"></div>
    <div class="page-content week-page" style="padding:28px 36px;">
      <div class="week-bar" style="background: ${weekBarColor}; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
      <h1 class="week-title">Week 1 – 4 Sessions</h1>
      <p class="week-intensity-badge" style="background-color: ${weekBarColor}; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact;">Low</p>
      <div class="days">${daysHtml}</div>
      <p class="footer" style="margin-top:24px;">Toufik Calisthenics · toufik-calisthenics.com</p>
    </div>
  </div>
</body>
</html>`;
}

async function generate1WeekPdfBuffer(programData, options = {}) {
  const html = build1WeekProgramHtml(programData, options);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 10, right: 10, bottom: 10, left: 10 }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generate6WeekPdfBuffer, generate1WeekPdfBuffer };


