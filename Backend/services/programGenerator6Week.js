/**
 * Paid 6-Week Calisthenics Program Generator
 * - Auto level detection from reps
 * - 6-week progression: W1 light, W2 more, W3-4 high, W5 deload, W6 50% + max test day
 * - Layer 1: NEVER negative reps, impossible sets, fatigue stacking
 * - Max reps per set ≤ 50% | EMOM ≤ 35% | No high-intensity methods for beginners
 * - Week 1 = friendly
 */

const { sanitizeReps, capRepsPerSet, capEmomReps: capEmom, getRegressionForExercise } = require('./programValidation');
const {
  getGoalWeights,
  getRestBiasForGoals,
  getCardioDensityForGoals,
  getLimitsForGoals,
  getSkillDaySettings,
  hasGoalConflict,
  getDominantGoalForDay,
  getWeekIntensityTag,
  WEEK_INTENSITY_TAG
} = require('./goalDrivenConfig');

// ----- Coach Logic & Fatigue Rules -----
// EMOM reps must not exceed 35% of athlete's max
// Skill exercises (muscle-ups, handstands): performed fresh, low volume, never after high-fatigue methods
// Max 1 high-intensity method per session – never stack EMOM, AMRAP, circuits, unbroken
// Max 7–8 fatigue points per session. If intensity high, reduce volume.
// Heavy/skill rest: 2–4 min. High fatigue: "Rest until you can perform next set with clean reps."

// ----- Session & Week Intensity -----
// Week 1: friendly, introductory (green). Progress gradually. No back-to-back high days.
// Intensity: green = low (intro/deload), yellow = moderate (build), red = high (peak)

// ----- Helpers -----

/** Diminishing factor for high-rep athletes; prevents impossible sets. Layer 1: cap at 50% max. */
const calculateSmartReps = (maxReps, intensity, isEndurance = false) => {
  let diminishingFactor = 1.0;
  if (maxReps > 20) diminishingFactor = 0.90;
  if (maxReps > 40) diminishingFactor = 0.85;
  if (maxReps > 60) diminishingFactor = 0.80;
  const target = Math.floor((maxReps || 0) * intensity * diminishingFactor);
  return capRepsPerSet(target, maxReps);
};

/** Endurance rep prescription: 50–65% of max for sustained work. Capped for movement quality. */
const calculateEnduranceReps = (maxReps, week, level) => {
  const weekMult = [0.50, 0.55, 0.58, 0.62, 0.55, 0.50][week - 1];
  const levelMult = { beginner: 0.90, intermediate: 1.0, advanced: 1.08 }[level];
  const raw = Math.max(3, Math.round(calculateSmartReps(maxReps, weekMult * levelMult, true)));
  return capRepsPerSet(raw, maxReps);
};

/** EMOM reps capped at 35% of max (Layer 1 rule). */
const calculateEmomReps = (maxReps, level = 'intermediate') => capEmom((maxReps || 0) * 0.35, maxReps);

/** Rest for heavy or skill-based exercises (2–4 min). */
const REST_HEAVY_SKILL = '2–4 min between sets';
/** Rest when fatigue is high – coach priority: movement quality. */
const REST_UNTIL_CLEAN = 'Rest until you can perform the next set with clean reps.';

/** AMRAP time domains by week: 5→6→8→10→8→6 min. Progressive then taper. */
const getAmrapMinutes = (week, improveEndurance) => {
  const base = [5, 6, 8, 10, 8, 6][week - 1];
  return improveEndurance ? Math.min(12, base + 2) : base;
};

/** Progressive rest by week. type: 'strength' | 'endurance'. Strength/skill always 2–4 min. */
const getDynamicRest = (week, type) => {
  if (type === 'strength') return REST_HEAVY_SKILL;
  switch (week) {
    case 1: return '90s (allow movement quality)';
    case 2: return '75s';
    case 3: return '60s';
    case 4: return '45s. Rest longer if reps break down.';
    default: return '90s';
  }
};

/** Goal-aware rest: Build Muscle = longer; Lose Weight = shorter (never after near-max). */
function getRestForGoals(week, type, goals = []) {
  const bias = getRestBiasForGoals(goals);
  if (type === 'strength') {
    return bias === 'longer' ? '3–4 min between sets' : REST_HEAVY_SKILL;
  }
  if (type === 'endurance' && bias === 'shorter') {
    return week === 1 ? '75s' : week <= 3 ? '45–60s' : '45s. Rest longer if reps break down.';
  }
  return getDynamicRest(week, type);
}

/** Updated: higher base volume for beginners (0-3 pull-ups). */
const getAustralianPullUpReps = (pullReps, week) => {
  if (pullReps < 5) return 8 + (week * 2);
  return Math.max(8, Math.round(pullReps * (week <= 2 ? 1.8 : 2.2)));
};

const seededRandom = (seed) => {
  let value = seed;
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

/** Auto-detect level from maxReps. */
const detectLevelFromReps = (maxReps) => {
  const pull = maxReps.pullUps || 0;
  const dips = maxReps.dips || 0;
  const mu = maxReps.muscleUp || 0;
  if (pull < 5 && dips < 10) return 'beginner';
  if (pull >= 20 && (mu >= 5 || dips >= 40)) return 'advanced';
  return 'intermediate';
};

/** Calories & nutrition from height (cm), weight (kg), goals. Goal-aware adjustments:
 * - lose_weight: slight deficit, higher protein
 * - improve_endurance: maintenance, higher carbs
 * - build_muscle: surplus, higher protein
 * - learn_skills: maintenance
 */
const calculateNutrition = (heightCm, weightKg, goals = []) => {
  if (!heightCm || !weightKg || heightCm < 100 || weightKg < 30) {
    return { bmr: null, tdee: null, proteinG: null, note: 'Add height and weight for estimates.', sampleMeals: null };
  }
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 + 5;
  const activityFactor = 1.55;
  let tdee = Math.round(bmr * activityFactor);
  let proteinMultiplier = 1.8;
  if (Array.isArray(goals) && goals.length > 0) {
    if (goals.includes('lose_weight')) {
      tdee = Math.round(tdee * 0.9);
      proteinMultiplier = 2.0;
    } else if (goals.includes('build_muscle')) {
      tdee = Math.round(tdee * 1.08);
      proteinMultiplier = 2.2;
    } else if (goals.includes('improve_endurance')) {
      tdee = Math.round(tdee * 1.02);
    }
  }
  const proteinG = Math.round(weightKg * proteinMultiplier);
  const sampleMeals = getSampleMealPlan(tdee, proteinG);
  return {
    bmr: Math.round(bmr),
    tdee,
    proteinG,
    goals: Array.isArray(goals) ? goals : [],
    note: `~${tdee} kcal/day (5 training days), ~${proteinG}g protein. Adjust based on goals.`,
    sampleMeals
  };
};

/** Budget-friendly sample meals. Food-first approach, no supplements. */
function getSampleMealPlan(tdee, proteinG) {
  if (!tdee || tdee < 1200 || !proteinG) return null;
  const scale = Math.min(1.4, Math.max(0.7, tdee / 2500));
  const pScale = Math.min(1.3, Math.max(0.8, proteinG / 135));
  const round = (n) => Math.round(n);

  return [
    {
      time: '7:00',
      name: 'Breakfast',
      foods: [
        { name: 'Oats with milk', qty: `${round(60 * scale)}g oats` },
        { name: 'Banana', qty: '1' },
        { name: 'Peanut butter', qty: '1 tbsp' },
        { name: 'Boiled eggs', qty: '3-4' }
      ],
      kcal: round(500 * scale),
      protein: round(30 * pScale)
    },
    {
      time: '10:00',
      name: 'Snack',
      foods: [
        { name: 'Greek yogurt', qty: `${round(150 * scale)}g` },
        { name: 'Oats or seeds', qty: 'small handful' }
      ],
      kcal: round(250 * scale),
      protein: round(18 * pScale)
    },
    {
      time: '13:00',
      name: 'Lunch',
      foods: [
        { name: 'Brown rice + lentils', qty: `${round(120 * scale)}g cooked` },
        { name: 'Sautéed vegetables', qty: '1 serving' },
        { name: 'Chicken thighs or canned tuna', qty: `${round(120 * pScale)}g` }
      ],
      kcal: round(600 * scale),
      protein: round(42 * pScale)
    },
    {
      time: '16:00',
      name: 'Pre/Post-workout',
      foods: [
        { name: 'Banana', qty: '1' },
        { name: 'Milk', qty: '1 glass' },
        { name: 'Or: Rice + beans + chicken', qty: 'small portion' }
      ],
      kcal: round(250 * scale),
      protein: round(18 * pScale)
    },
    {
      time: '19:00',
      name: 'Dinner',
      foods: [
        { name: 'Sweet potato', qty: `${round(150 * scale)}g` },
        { name: 'Baked chicken or fish', qty: `${round(100 * pScale)}g` },
        { name: 'Mixed vegetables', qty: '1 bowl' }
      ],
      kcal: round(550 * scale),
      protein: round(35 * pScale)
    }
  ];
}

// ----- 6-week intensity curve -----
// Week 1: friendly, introductory (green)
// Week 2-3: build (yellow)
// Week 4: peak, limited and controlled (red)
// Week 5-6: deload/taper (green) – mandatory recovery
const WEEK_SETTINGS_6 = [
  { volume: 0.50, intensity: 0.50, style: 'intro', intensityColor: 'green', intensityLabel: 'Low – Introduction' },
  { volume: 0.60, intensity: 0.60, style: 'build', intensityColor: 'yellow', intensityLabel: 'Moderate – Build' },
  { volume: 0.72, intensity: 0.72, style: 'build', intensityColor: 'yellow', intensityLabel: 'Moderate – Build' },
  { volume: 0.82, intensity: 0.82, style: 'peak', intensityColor: 'red', intensityLabel: 'High – Peak' },
  { volume: 0.60, intensity: 0.60, style: 'deload', intensityColor: 'green', intensityLabel: 'Low – Deload' },
  { volume: 0.50, intensity: 0.50, style: 'taper', intensityColor: 'green', intensityLabel: 'Low – Taper' }
];

/**
 * Generate 6-week program. 5 days per week; week 6 day 5 = max reps test.
 * Options: { heightCm, weightKg } for nutrition.
 */
function generate6WeekProgram(level, maxReps, seed = Date.now(), options = {}) {
  const detectedLevel = level || detectLevelFromReps(maxReps);
  const safeLevel = ['beginner', 'intermediate', 'advanced'].includes(detectedLevel) ? detectedLevel : 'intermediate';
  const payloadMaxReps = { ...maxReps };
  if (safeLevel === 'beginner') payloadMaxReps.muscleUp = 0;

  const usedMethods = {};
  const weeks = [];

  // Planned week: 2 workouts, rest, 2 workouts, rest, 1 workout (Mon–Sun)
  const SCHEDULE_SLOTS = [
    { dayLabel: 'Monday', focus: 'Pull Day', dayIndex: 1 },
    { dayLabel: 'Tuesday', focus: 'Push Day', dayIndex: 2 },
    { dayLabel: 'Wednesday', focus: 'Rest', dayIndex: null },
    { dayLabel: 'Thursday', focus: 'Legs + Core + Cardio', dayIndex: 3 },
    { dayLabel: 'Friday', focus: 'Endurance Integration', dayIndex: 4 },
    { dayLabel: 'Saturday', focus: 'Rest', dayIndex: null },
    { dayLabel: 'Sunday', focus: 'Strength / Weights', dayIndex: 5 }
  ];

  const goals = Array.isArray(options.goals) ? options.goals : [];
  for (let week = 1; week <= 6; week++) {
    const settings = WEEK_SETTINGS_6[week - 1];
    const isTestWeek = week === 6;
    const days = generateWeekDays6(week, safeLevel, payloadMaxReps, settings, seed, usedMethods, isTestWeek, goals);
    const schedule = SCHEDULE_SLOTS.map((slot, i) => ({
      dayLabel: slot.dayLabel,
      focus: isTestWeek && slot.dayIndex === 5 ? 'Max Reps Test' : slot.focus,
      dayIndex: slot.dayIndex,
      isRest: slot.dayIndex === null
    }));
    const weekTag = getWeekIntensityTag(week);
    const tagToColor = { friendly: 'green', progressive: 'yellow', intense: 'orange', controlled_peak: 'orange', deload: 'blue' };
    weeks.push({
      week,
      days,
      weekSchedule: schedule,
      intensityColor: tagToColor[weekTag] || settings.intensityColor || 'yellow',
      intensityLabel: settings.intensityLabel || (weekTag === 'friendly' ? 'Friendly' : weekTag === 'deload' ? 'Deload' : weekTag === 'intense' ? 'Intense' : 'Moderate')
    });
  }

  const nutrition = (options.heightCm && options.weightKg)
    ? calculateNutrition(options.heightCm, options.weightKg, goals)
    : calculateNutrition(null, null, goals);

  return {
    level: safeLevel,
    maxReps: payloadMaxReps,
    program: weeks,
    nutrition,
    plannedWeekDescription: 'Each week: 2 training days, 1 rest day, 2 training days, 1 rest day, 1 training day (rest after every 2 workouts).'
  };
}

/** 5 days: Pull, Push, Legs+Core+Cardio, Endurance, Strength/Weights (or Day 5 = max test in week 6). */
function generateWeekDays6(week, level, maxReps, settings, seed, usedMethods, isTestWeek, goals = []) {
  const days = [];
  const weekKey = `week${week}`;
  if (!usedMethods[weekKey]) usedMethods[weekKey] = [];

  days.push(generateDay1_Pull6(week, level, maxReps, settings, seed, usedMethods[weekKey], goals));
  days.push(generateDay2_Push6(week, level, maxReps, settings, seed, usedMethods[weekKey], goals));
  days.push(generateDay3_LegsCardioCore6(week, level, maxReps, settings, seed, goals));
  days.push(generateDay4_EnduranceSets6(week, level, maxReps, settings, seed, goals));
  if (isTestWeek) {
    days.push(generateDay5_MaxTest6(maxReps, level));
  } else {
    days.push(generateDay5_StrengthWeights6(week, level, maxReps, settings, seed, goals));
  }
  return days;
}

// ----- DAY 1: PULL (with Cluster Sets option) -----
function generateDay1_Pull6(week, level, maxReps, settings, seed, usedMethods, goals = []) {
  const exercises = [];
  const muMax = level === 'beginner' ? 0 : maxReps.muscleUp;
  const pullMax = maxReps.pullUps;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  const pullPercentage = level === 'beginner' ? 0.60 : 0.75;

  exercises.push({
    name: 'Warm-up (5-7 min)',
    sets: level === 'beginner' ? 'Tempo pull-ups x10-15\nArm circles, shoulder mobility\nHang holds: 3x15s\nAustralian pull-up practice' : 'Tempo pull-ups x10-15\nArm circles, shoulder mobility\nHang holds: 3x15s\nMuscle-up practice (if applicable)',
    rest: 'No rest needed',
    type: 'warmup'
  });

  const methods = selectDay1Methods6(week, level, muMax, pullMax, pullPercentage, settings, levelMult, seed, usedMethods, goals);
  exercises.push(...methods);

  const finisher = getDay1Finisher6(week, level, muMax, pullMax, pullPercentage, levelMult);
  exercises.push(finisher);

  renumberExercises(exercises);
  return {
    day: 1,
    focus: 'Pull Day',
    methods: methods.map(m => m.format || 'volume_sets'),
    exercises,
    coachingNote: week === 6 ? 'Light day before test.' : 'Movement quality first. Rest 2–4 min after heavy sets.'
  };
}

/** Max 1 high-intensity method per session. Never stack EMOM+AMRAP+circuit+unbroken. */
function selectDay1Methods6(week, level, muMax, pullMax, pullPercentage, settings, levelMult, seed, usedMethods, goals = []) {
  const schedule = [
    ['separated_volume'],
    ['emom_block'],
    ['degressive_pull_mu'],
    ['emom_block'],
    ['pyramids'],
    ['separated_volume']
  ];
  const row = schedule[week - 1] || schedule[0];
  const selected = row.map(m => (m === 'degressive_pull_mu' && level === 'beginner') ? 'degressive_pull_australian' : m);
  selected.forEach(m => usedMethods.push(m));

  const methods = [];
  selected.forEach(methodType => {
    switch (methodType) {
      case 'degressive_pull_mu':
        methods.push(method1_DegressivePullMU6(muMax, pullMax, pullPercentage));
        break;
      case 'degressive_pull_australian':
        methods.push(method1_BeginnerDegressiveAustralian6(week, pullMax, pullPercentage));
        break;
      case 'emom_block':
        methods.push(method2_EMOMBlock6(week, level, pullMax, muMax, pullPercentage, settings, levelMult, goals));
        break;
      case 'separated_volume':
        methods.push(method3_SeparatedVolume6(week, level, muMax, pullMax, pullPercentage));
        break;
      case 'pyramids':
        methods.push(method4_Pyramids6(week, level, pullMax, muMax, pullPercentage));
        break;
      case 'superset_pull':
        methods.push(method5_SupersetPull6(week, pullMax, muMax, level));
        break;
      case 'cluster_sets':
        methods.push(method_ClusterSets6(pullMax, muMax, level, week));
        break;
      case 'timed_challenge':
        methods.push(method6_TimerChallenge6(week, level, pullMax, muMax, pullPercentage));
        break;
      case 'isometric_ladder':
        methods.push(method7_IsometricLadder6(pullMax, level));
        break;
      default:
        methods.push(method3_SeparatedVolume6(week, level, muMax, pullMax, pullPercentage));
    }
  });
  return methods;
}

function method1_DegressivePullMU6(muMax, pullMax, pullPercentage) {
  const startReps = Math.max(4, Math.min(calculateSmartReps(pullMax, 0.65), Math.floor(pullMax * 0.5)));
  const rounds = Math.min(6, Math.max(4, Math.ceil(startReps / 2)));
  let setsDesc = '';
  for (let i = 0; i < rounds; i++) {
    const reps = Math.max(0, startReps - (i * 2));
    if (reps > 0) setsDesc += `${reps} pull-ups${muMax > 0 && i < 2 ? ' + 1 muscle-up' : ''}\n`;
  }
  return {
    name: 'Degressive Pull + Muscle-Up',
    format: 'DEGRESSIVE',
    duration: `${rounds} rounds`,
    sets: setsDesc.trim(),
    rest: REST_UNTIL_CLEAN,
    note: 'Start with pull-ups, decrease by 2 each round. Add 1 MU per round if applicable.',
    exercise: 'pull-up, muscle-up'
  };
}

function method1_BeginnerDegressiveAustralian6(week, pullMax, pullPercentage) {
  const startReps = calculateSmartReps(pullMax, pullPercentage);
  const rounds = Math.min(8, Math.ceil(startReps / 2));
  let setsDesc = '';
  for (let i = 0; i < rounds; i++) {
    const reps = Math.max(0, startReps - (i * 2));
    if (reps > 0) {
      const ausReps = getAustralianPullUpReps(reps, week);
      setsDesc += `${reps} pull-ups\n${ausReps} Australian pull-ups\n`;
    }
  }
  return {
    name: 'Degressive Pull + Australian Pull-Ups',
    format: 'DEGRESSIVE',
    duration: `${rounds} rounds`,
    sets: setsDesc.trim(),
    rest: REST_UNTIL_CLEAN,
    note: 'Australian pull-ups at 1.8x–2.2x pull-up reps by week.',
    exercise: 'pull-up, australian-pull-up'
  };
}

function method2_EMOMBlock6(week, level, pullMax, muMax, pullPercentage, settings, levelMult, goals = []) {
  const durations = week <= 2 ? [5, 6] : week <= 4 ? [8, 10] : [8, 8];
  const rawPull = calculateEnduranceReps(pullMax, week, level);
  const pullReps1 = Math.min(rawPull, calculateEmomReps(pullMax, level));
  const pullReps2 = Math.max(2, pullReps1 - 1);
  let setsDesc = '';
  setsDesc += `EMOM ${durations[0]} min: ${pullReps1} pull-ups\nEMOM ${durations[1]} min: ${pullReps2} pull-ups`;
  if (level === 'beginner') {
    const ausReps = Math.min(getAustralianPullUpReps(pullReps1, week), 12);
    setsDesc += `\nAustralian pull-ups: ${ausReps} reps per min (same time)`;
  } else if (muMax > 0 && week >= 3) {
    const muReps = Math.min(2, calculateEmomReps(muMax, level));
    if (muReps >= 1) setsDesc += `\n+ ${muReps} muscle-up per min (first block only – skill protected)`;
  }
  return {
    name: 'EMOM Block',
    format: 'EMOM',
    duration: `${durations[0] + durations[1]} min total`,
    sets: setsDesc.trim(),
    rest: getRestForGoals(week, 'endurance', goals),
    note: 'Endurance pacing: reps at start of each minute. Rest remainder.',
    exercise: level === 'beginner' ? 'pull-up, australian-pull-up' : (muMax > 0 ? 'pull-up, muscle-up' : 'pull-up')
  };
}

function method3_SeparatedVolume6(week, level, muMax, pullMax, pullPercentage) {
  const pull80 = Math.min(calculateSmartReps(pullMax, 0.75 * pullPercentage), Math.floor(pullMax * 0.55));
  const pull60 = Math.min(calculateSmartReps(pullMax, 0.60 * pullPercentage), pull80 - 1);
  const pull50 = Math.min(calculateSmartReps(pullMax, 0.50 * pullPercentage), pull60 - 1);
  let setsDesc = '';
  if (level === 'beginner') {
    setsDesc += `Pull-ups:\n4 sets × ${pull80}\n5 sets × ${pull60}\n6 sets × ${pull50}\n\n`;
    setsDesc += `Australian pull-ups:\n4 sets × ${getAustralianPullUpReps(pull80, week)}\n5 sets × ${getAustralianPullUpReps(pull60, week)}\n6 sets × ${getAustralianPullUpReps(pull50, week)}`;
  } else {
    if (muMax > 0) {
      const muReps = Math.min(3, calculateEmomReps(muMax, level));
      setsDesc += `Muscle-ups (first – skill protected):\n4 sets × ${muReps}\n\n`;
    }
    setsDesc += `Pull-ups:\n4 sets × ${pull80}\n5 sets × ${pull60}\n6 sets × ${pull50}`;
  }
  return {
    name: 'Separated Volume',
    format: 'Volume Sets',
    duration: '15 sets total',
    sets: setsDesc,
    rest: REST_HEAVY_SKILL,
    note: 'Complete all sets before moving to next.',
    exercise: level === 'beginner' ? 'pull-up, australian-pull-up' : ('pull-up' + (muMax > 0 ? ', muscle-up' : ''))
  };
}

function method4_Pyramids6(week, level, pullMax, muMax, pullPercentage) {
  const topPull = Math.min(calculateSmartReps(pullMax, 0.65 * pullPercentage), Math.floor(pullMax * 0.55));
  let setsDesc = `Pull-ups: 1 → ${topPull} → 1\nIncrease by 2-3 reps per step\n`;
  if (level === 'beginner') {
    setsDesc += `\nAustralian pull-ups: 1 → ${getAustralianPullUpReps(topPull, week)} → 1\n`;
  } else if (muMax > 0) {
    const topMU = Math.min(3, calculateEmomReps(muMax, level));
    setsDesc += `\nMuscle-ups: 1 → ${topMU} → 1 (skill – low volume)\n`;
  }
  return {
    name: 'Pyramids (PROGRESSIVE)',
    format: 'PROGRESSIVE',
    duration: 'Variable',
    sets: setsDesc,
    rest: REST_HEAVY_SKILL,
    note: 'Start at 1, work up to top, come back down to 1. PROGRESSIVE loading.',
    exercise: level === 'beginner' ? 'pull-up, australian-pull-up' : ('pull-up' + (muMax > 0 ? ', muscle-up' : ''))
  };
}

function method5_SupersetPull6(week, pullMax, muMax, level) {
  const pullReps = Math.max(8, calculateSmartReps(pullMax, 0.5));
  const chinReps = Math.max(8, calculateSmartReps(pullMax, 0.6));
  const ausReps = level === 'beginner' ? getAustralianPullUpReps(pullReps, week) : Math.max(15, calculateSmartReps(pullMax, 1.2));
  let setsDesc = '';
  if (muMax > 0 && level !== 'beginner') {
    const muReps = Math.min(3, calculateEmomReps(muMax, level));
    setsDesc += `${muReps} muscle-ups (first – skill protected)\n`;
  }
  setsDesc += `${pullReps} pull-ups\n${chinReps} chin-ups\n${ausReps} Australian pull-ups`;
  setsDesc += '\n× 4 rounds';
  return {
    name: 'Superset Pull (SET)',
    format: 'SET',
    duration: '4 rounds',
    sets: setsDesc,
    rest: REST_HEAVY_SKILL,
    note: 'Complete all exercises in order without stopping.',
    exercise: 'pull-up, chin-up, australian-pull-up' + (muMax > 0 && level !== 'beginner' ? ', muscle-up' : '')
  };
}

/** Cluster Sets: volume in mini-sets. MUs excluded – clusters too fatiguing for skill work. */
function method_ClusterSets6(pullMax, muMax, level, week) {
  const totalVolumePull = Math.max(1, Math.round(pullMax * 1.0));
  const miniSetSize = Math.max(1, Math.min(Math.round(pullMax * 0.30), calculateEmomReps(pullMax, 'intermediate') + 2));
  const numMiniSets = Math.ceil(totalVolumePull / miniSetSize);
  let setsDesc = `Total ${totalVolumePull} pull-ups in mini-sets of ${miniSetSize} reps\n10-15s rest between mini-sets\n`;
  if (level === 'beginner') {
    const ausTotal = Math.max(1, Math.round(totalVolumePull * 1.2));
    const ausMini = Math.max(1, Math.min(8, Math.round(miniSetSize * 1.2)));
    setsDesc += `Australian pull-ups: ${ausTotal} total in mini-sets of ${ausMini}\n`;
  }
  return {
    name: 'Cluster Sets (SET)',
    format: 'SET',
    duration: `${numMiniSets} mini-sets`,
    sets: setsDesc,
    rest: '10-15s between mini-sets. Allow movement quality.',
    note: 'Pro endurance method: build volume without lactic failure. MUs excluded – clusters too fatiguing for skill work.',
    exercise: level === 'beginner' ? 'pull-up, australian-pull-up' : 'pull-up'
  };
}

function method6_TimerChallenge6(week, level, pullMax, muMax, pullPercentage) {
  const targetPull = Math.min(80, Math.round(pullMax * 1.2));
  const targetAus = level === 'beginner' ? getAustralianPullUpReps(targetPull, week) : 0;
  let setsDesc = `${targetPull} pull-ups`;
  if (level === 'beginner') setsDesc += `\n${targetAus} Australian pull-ups`;
  setsDesc += '\nFor time (partition as needed)';
  return {
    name: 'Timed Challenge',
    format: 'Timed Challenge',
    duration: 'For time',
    sets: setsDesc,
    rest: REST_UNTIL_CLEAN,
    note: 'Complete all reps as quickly as possible with good form.',
    exercise: level === 'beginner' ? 'pull-up, australian-pull-up' : 'pull-up'
  };
}

function method7_IsometricLadder6(pullMax, level) {
  const holdTimes = level === 'beginner' ? [5, 7, 10] : level === 'intermediate' ? [7, 10, 12] : [10, 12, 15];
  const pullReps = Math.max(4, Math.min(calculateSmartReps(pullMax, 0.30), calculateEmomReps(pullMax, level)));
  const setsDesc = `Hold at top ${holdTimes[0]}s → Hold in middle ${holdTimes[1]}s → Dead hang ${holdTimes[2]}s → ${pullReps} pull-ups\n× 3 rounds`;
  return {
    name: 'Isometric Ladder (ISOMETRIC HOLD)',
    format: 'ISOMETRIC HOLD',
    duration: '3 rounds',
    sets: setsDesc,
    rest: REST_UNTIL_CLEAN,
    note: 'Do not let go of the bar until all reps are complete.',
    exercise: 'isometric-hold, pull-up'
  };
}

function getDay1Finisher6(week, level, muMax, pullMax, pullPercentage, levelMult) {
  const basePullReps = Math.max(12, Math.min(25, calculateSmartReps(pullMax, 0.8 * pullPercentage)));
  const ausReps = level === 'beginner' ? getAustralianPullUpReps(basePullReps, week) : basePullReps;
  if (level === 'beginner') {
    return {
      name: 'Finisher: Australian Pull-Up',
      sets: `10 sets × ${ausReps} reps`,
      rest: '30s between sets',
      note: 'Horizontal pull-ups. Keep body straight.',
      exercise: 'australian-pull-up'
    };
  }
  return {
    name: 'Finisher: Isometric Hold + Max Pull',
    sets: 'Hold at top 10s → Hold in middle 10s → Dead hang 10s → Max pull-ups\n× 3 rounds',
    rest: REST_UNTIL_CLEAN,
    note: 'Do not let go until max pull-ups complete.',
    exercise: 'isometric-hold, pull-up'
  };
}

// ----- DAY 2: PUSH (with Cluster Sets option) -----
function generateDay2_Push6(week, level, maxReps, settings, seed, usedMethods, goals = []) {
  const exercises = [];
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  const muMax = level === 'beginner' ? 0 : maxReps.muscleUp;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];

  exercises.push({
    name: 'Warm-up (5-7 min)',
    sets: 'Tempo push-ups x15-20\nShoulder circles and stretches\nArm swings\nTempo dips x10-15',
    rest: 'No rest needed',
    type: 'warmup'
  });

  const methods = selectDay2Methods6(week, level, dipsMax, pushUpsMax, muMax, settings, levelMult, seed, usedMethods, goals);
  exercises.push(...methods);
  exercises.push(getDay2Finisher6(pushUpsMax));
  renumberExercises(exercises);

  return {
    day: 2,
    focus: 'Push Day',
    methods: methods.map(m => m.format || 'volume_sets'),
    exercises,
    coachingNote: 'Movement quality first. Rest 2–4 min after heavy sets.'
  };
}

function selectDay2Methods6(week, level, dipsMax, pushUpsMax, muMax, settings, levelMult, seed, usedMethods, goals = []) {
  /** Max 1 high-intensity method per session. Never stack EMOM+circuit+unbroken. */
  const schedule = [
    ['separated_volume_push'],
    ['emom_blocks'],
    ['density_circuit'],
    ['emom_blocks'],
    ['separated_volume_push'],
    ['emom_blocks']
  ];
  const row = schedule[week - 1] || schedule[0];
  const selected = row.filter(Boolean);
  selected.forEach(m => usedMethods.push(m));

  const methods = [];
  selected.forEach(methodType => {
    switch (methodType) {
      case 'density_circuit':
        methods.push(methodPush1_DensityCircuit6(dipsMax, pushUpsMax));
        break;
      case 'emom_blocks':
        methods.push(methodPush2_EMOMBlocks6(dipsMax, pushUpsMax, week, level, goals));
        break;
      case 'emom_mu_combo':
        methods.push(methodPush3_EMOMMUCombo6(muMax, dipsMax));
        break;
      case 'separated_volume_push':
        methods.push(methodPush4_SeparatedVolumePush6(dipsMax, pushUpsMax));
        break;
      case 'pyramids_push':
        methods.push(methodPush5_PyramidsPush6(dipsMax, pushUpsMax));
        break;
      case 'cluster_sets_push':
        methods.push(methodPush_ClusterSets6(dipsMax, pushUpsMax));
        break;
      case 'no_stop_sets':
        methods.push(methodPush6_NoStopSets6(dipsMax, pushUpsMax));
        break;
      default:
        methods.push(methodPush1_DensityCircuit6(dipsMax, pushUpsMax));
    }
  });
  return methods;
}

function methodPush1_DensityCircuit6(dipsMax, pushUpsMax) {
  const x = Math.min(calculateSmartReps(dipsMax, 0.35), calculateEmomReps(dipsMax, 'intermediate'));
  const pushReps = Math.min(calculateSmartReps(pushUpsMax, 0.35), calculateEmomReps(pushUpsMax, 'intermediate'));
  const barDips = Math.round(x * 0.8);
  return {
    name: 'Density Circuit (SET)',
    format: 'SET',
    duration: '5 rounds',
    sets: `${x} dips\n${pushReps} push-ups\n${barDips} bar dips\n× 5 rounds`,
    rest: REST_UNTIL_CLEAN,
    note: 'Complete each round without stopping.',
    exercise: 'dip, push-up, bar-dip'
  };
}

function methodPush2_EMOMBlocks6(dipsMax, pushUpsMax, week, level = 'intermediate', goals = []) {
  const durations = week <= 2 ? [6, 6] : week <= 4 ? [8, 8] : [6, 6];
  const rawDip = calculateEnduranceReps(dipsMax, week, level);
  const rawPush = calculateEnduranceReps(pushUpsMax, week, level);
  const dipReps1 = Math.min(rawDip, calculateEmomReps(dipsMax, level));
  const dipReps2 = Math.max(2, dipReps1 - 1);
  const pushReps1 = Math.min(rawPush, calculateEmomReps(pushUpsMax, level));
  const pushReps2 = Math.max(3, pushReps1 - 2);
  const sets = `EMOM ${durations[0]} min: ${dipReps1} dips\nEMOM ${durations[1]} min: ${dipReps2} dips\nEMOM ${durations[0]} min: ${pushReps1} push-ups\nEMOM ${durations[1]} min: ${pushReps2} push-ups`;
  return {
    name: 'EMOM Blocks',
    format: 'EMOM',
    duration: `${durations[0] + durations[1]} min total`,
    sets,
    rest: getRestForGoals(week, 'endurance', goals),
    note: 'Complete reps at start of each minute.',
    exercise: 'dip, push-up'
  };
}

function methodPush3_EMOMMUCombo6(muMax, dipsMax) {
  const barDips = Math.min(calculateEmomReps(dipsMax, 'intermediate'), 8);
  return {
    name: 'EMOM Muscle-Up Combo',
    format: 'EMOM',
    duration: '8 min',
    sets: `EMOM 8 min:\n1 muscle-up (skill – performed first each min)\n${barDips} bar dips`,
    rest: 'Rest for remainder of each minute. 2–4 min between blocks.',
    note: '1 MU + bar dips at start of each minute.',
    exercise: 'muscle-up, bar-dip'
  };
}

function methodPush4_SeparatedVolumePush6(dipsMax, pushUpsMax) {
  const dips80 = Math.min(calculateSmartReps(dipsMax, 0.75), Math.floor(dipsMax * 0.55));
  const push80 = Math.min(calculateSmartReps(pushUpsMax, 0.75), Math.floor(pushUpsMax * 0.55));
  const barDips80 = Math.min(calculateSmartReps(dipsMax, 0.70), Math.floor(dipsMax * 0.50));
  return {
    name: 'Separated Volume',
    format: 'Volume Sets',
    duration: '15 sets total',
    sets: `5 sets × ${dips80} dips\n5 sets × ${push80} push-ups\n5 sets × ${barDips80} bar dips`,
    rest: REST_HEAVY_SKILL,
    note: 'Complete all sets for each exercise before moving to next.',
    exercise: 'dip, push-up, bar-dip'
  };
}

function methodPush5_PyramidsPush6(dipsMax, pushUpsMax) {
  const topDips = Math.max(1, calculateSmartReps(dipsMax, 0.70));
  const topPush = Math.max(1, calculateSmartReps(pushUpsMax, 0.70));
  return {
    name: 'Pyramids (PROGRESSIVE)',
    format: 'PROGRESSIVE',
    duration: 'Variable',
    sets: `Dips: 1 → ${topDips} → 1 (increase by 3 per step)\nPush-ups: 1 → ${topPush} → 1 (increase by 3 per step)`,
    rest: '30s between sets',
    note: 'Work up to top, come back down to 1.',
    exercise: 'dip, push-up'
  };
}

function methodPush_ClusterSets6(dipsMax, pushUpsMax) {
  const miniDips = Math.min(calculateEmomReps(dipsMax, 'intermediate') + 1, Math.round(dipsMax * 0.30));
  const miniPush = Math.min(calculateEmomReps(pushUpsMax, 'intermediate') + 2, Math.round(pushUpsMax * 0.30));
  const totalDips = Math.max(miniDips * 4, Math.round(dipsMax * 1.0));
  const totalPush = Math.max(miniPush * 4, Math.round(pushUpsMax * 1.0));
  return {
    name: 'Cluster Sets Push',
    format: 'SET',
    duration: 'Multiple mini-sets',
    sets: `Dips: ${totalDips} total in mini-sets of ${miniDips} (10-15s rest)\nPush-ups: ${totalPush} total in mini-sets of ${miniPush} (10-15s rest)`,
    rest: '10-15s between mini-sets. Allow movement quality.',
    note: 'Build volume without lactic failure.',
    exercise: 'dip, push-up'
  };
}

function methodPush6_NoStopSets6(dipsMax, pushUpsMax) {
  const dipReps = Math.min(calculateSmartReps(dipsMax, 0.40), calculateEmomReps(dipsMax, 'intermediate') + 2);
  const pushReps = Math.min(calculateSmartReps(pushUpsMax, 0.40), calculateEmomReps(pushUpsMax, 'intermediate') + 3);
  return {
    name: 'No-Stop Sets (NO STOP)',
    format: 'NO STOP',
    duration: '4 rounds',
    sets: `${dipReps} dips + ${pushReps} push-ups (no rest between)\n× 4 rounds`,
    rest: REST_UNTIL_CLEAN,
    note: 'Dips then push-ups without stopping.',
    exercise: 'dip, push-up'
  };
}

function getDay2Finisher6(pushUpsMax) {
  const pushReps = Math.max(1, calculateSmartReps(pushUpsMax, 0.10));
  return {
    name: 'Finisher: Isometric Push Hold',
    sets: `EMOM 10 min:\n10s 90° push-up hold\n${pushReps} push-ups`,
    rest: 'Rest for remainder of each minute',
    note: 'Hold at 90° then push-ups. Repeat every minute.',
    exercise: 'isometric-hold, push-up'
  };
}

// ----- DAY 3: LEGS + CARDIO + CORE -----
function generateDay3_LegsCardioCore6(week, level, maxReps, settings, seed, goals = []) {
  const exercises = [];
  const squatsMax = maxReps.squats;
  const legRaisesMax = maxReps.legRaises;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  const volMult = settings.volume * levelMult;
  const loseWeight = goals.includes('lose_weight');
  const improveEndurance = goals.includes('improve_endurance');
  const cardioDensity = getCardioDensityForGoals(goals);
  const limits = getLimitsForGoals(goals);
  const moreCardio = loseWeight || improveEndurance || cardioDensity.addElement;
  const shorterRest = loseWeight;
  const capCardio = limits.limitCardioVolume;

  exercises.push({
    name: 'Warm-up (5-7 min)',
    sets: 'Jump rope or easy jogging 3-5 min\nLeg swings\nTempo squats x15-20\nHip circles',
    rest: 'No rest needed',
    type: 'warmup'
  });

  const baseCardioMins = level === 'beginner' ? [10, 12, 15, 18, 15, 10][week - 1] : week <= 2 ? 15 : week <= 4 ? 25 : 18;
  let cardioMins = capCardio ? Math.min(18, baseCardioMins) : (moreCardio ? Math.min(30, baseCardioMins + 5 + (cardioDensity.extraMins || 0)) : baseCardioMins);
  const favorJumpRope = loseWeight || improveEndurance || cardioDensity.favorJumpRope;
  const cardioIsJumpRope = favorJumpRope ? true : (week % 2 === 1);
  exercises.push({
    name: cardioIsJumpRope ? 'Cardio: Jump Rope' : 'Cardio: Running',
    sets: cardioIsJumpRope ? `Jump rope ${cardioMins} minutes` : `Run ${cardioMins} minutes steady`,
    rest: shorterRest ? '1-2 min' : '2-3 min',
    note: 'Steady pace.',
    exercise: cardioIsJumpRope ? 'jump-rope' : 'running'
  });
  if (cardioDensity.addElement && !capCardio) {
    exercises.push({
      name: 'Step-ups or Low-impact circuit',
      sets: '2–3 min continuous step-ups or light circuit (squats, step-ups, march in place)',
      rest: '1 min',
      note: 'Movement density. Low impact if needed.',
      exercise: 'step-up'
    });
  }

  const restSquat = shorterRest ? '45s between sets' : '60s between sets';
  const squatReps = Math.max(1, calculateSmartReps(squatsMax, volMult * 1.25));
  exercises.push({
    name: 'Squats',
    sets: `${squatReps} reps × 4 sets`,
    rest: restSquat,
    note: 'Full range. Control speed.',
    exercise: 'squat'
  });

  const jumpReps = Math.max(10, calculateSmartReps(squatsMax, 0.4));
  exercises.push({
    name: 'Jump Squats',
    sets: `${jumpReps} reps × ${week <= 2 ? 3 : 4} sets`,
    rest: shorterRest ? '45s between sets' : '60s between sets',
    note: 'Explosive. Land softly.',
    exercise: 'jump-squat'
  });

  const burpeesMax = maxReps.burpees ?? 15;
  const burpeesReps = Math.max(8, Math.round(calculateSmartReps(burpeesMax, volMult * 0.9)));
  const burpeesSets = week === 1 ? 4 : week <= 3 ? 5 : week === 4 ? 5 : 4;
  exercises.push({
    name: 'Burpees',
    sets: `${burpeesReps} reps × ${burpeesSets} sets`,
    rest: shorterRest ? '45-60s between sets' : '60-90s between sets',
    note: 'Full burpee.',
    exercise: 'burpee'
  });

  const legRaiseReps = Math.max(5, calculateSmartReps(legRaisesMax, volMult * 1.1));
  exercises.push({
    name: 'Leg Raises',
    sets: `${legRaiseReps} reps × ${week <= 2 ? 4 : 5} sets`,
    rest: shorterRest ? '45s between sets' : '60s between sets',
    note: 'Control descent.',
    exercise: 'leg-raise'
  });

  exercises.push({
    name: 'Plank Hold (ISOMETRIC HOLD)',
    sets: `${week <= 2 ? 60 : week <= 4 ? 90 : 60} seconds × ${week <= 2 ? 3 : 4} sets`,
    rest: shorterRest ? '45s between sets' : '60s between sets',
    note: 'Body straight. Hold position without movement.',
    exercise: 'plank'
  });

  /** AMRAP finisher: reps capped for sustainable output. */
  const amrapMin = getAmrapMinutes(week, loseWeight || improveEndurance);
  const amrapSquat = Math.min(calculateEnduranceReps(squatsMax, week, level), calculateEmomReps(squatsMax, level) + 3);
  const amrapBurpee = Math.min(calculateEnduranceReps(maxReps.burpees ?? 15, week, level), calculateEmomReps(maxReps.burpees ?? 15, level) + 2);
  const amrapLeg = Math.min(calculateEnduranceReps(legRaisesMax, week, level), calculateEmomReps(legRaisesMax, level) + 2);
  exercises.push({
    name: 'Finisher: AMRAP (SET)',
    format: 'AMRAP',
    duration: `${amrapMin} min`,
    sets: `AMRAP ${amrapMin} min:\n${amrapSquat} squats\n${amrapBurpee} burpees\n${amrapLeg} leg raises\n× as many rounds as possible`,
    rest: 'Rest between rounds to maintain movement quality.',
    note: 'Prioritize clean reps over speed. Each round UNBROKEN.',
    exercise: 'squat, burpee, leg-raise'
  });

  renumberExercises(exercises);
  return {
    day: 3,
    focus: 'Legs + Core + Cardio',
    methods: ['SET', 'PROGRESSIVE', 'ISOMETRIC HOLD', 'AMRAP'],
    exercises,
    coachingNote: 'Cardio day. Rest as needed to maintain movement quality.'
  };
}

// ----- DAY 4: ENDURANCE (with The Chipper) -----
function generateDay4_EnduranceSets6(week, level, maxReps, settings, seed, goals = []) {
  const exercises = [];
  const muMax = level === 'beginner' ? 0 : maxReps.muscleUp;
  const pullMax = maxReps.pullUps;
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  const squatsMax = maxReps.squats;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  const pullPercentage = level === 'beginner' ? 0.60 : 0.75;
  const improveEndurance = goals.includes('improve_endurance');
  const volumeCap = improveEndurance ? Math.min(0.98, settings.volume * 1.15) : Math.min(0.95, settings.volume * 1.1);

  exercises.push({
    name: 'Warm-up (5-7 min)',
    sets: 'Tempo pull-ups x10\nTempo dips x10\nArm circles\nShoulder warm-up' + (muMax > 0 ? '\nMuscle-up practice' : ''),
    rest: 'No rest needed',
    type: 'warmup'
  });

  /** Max 1 high-intensity method per session. Chipper/Timed/Degressive = ONE main set only. No AMRAP stacked. */
  const formats = ['the_chipper', 'degressive_ladder', 'timed_rounds', 'the_chipper', 'degressive_ladder', 'timed_rounds'];
  const selected = formats[week - 1] || 'the_chipper';
  const includeAmrapFinisher = false;

  if (selected === 'the_chipper') {
    const chipperMult = [2.0, 2.2, 2.4, 2.6, 2.2, 1.8][week - 1] * (improveEndurance ? 1.1 : 1);
    const pullTotal = Math.max(20, Math.round(pullMax * chipperMult));
    const dipTotal = Math.max(20, Math.round(dipsMax * chipperMult));
    const pushTotal = Math.max(30, Math.round(pushUpsMax * chipperMult));
    const squatTotal = Math.max(40, Math.round(squatsMax * chipperMult * 1.2));
    let setsDesc = `For Time: Complete all reps in any order/partitioning.\n${pullTotal} pull-ups\n${dipTotal} dips\n${pushTotal} push-ups\n${squatTotal} squats`;
    if (level === 'beginner') {
      const ausTotal = getAustralianPullUpReps(Math.round(pullTotal / 2), week) * 2;
      setsDesc = `For Time: Complete all reps in any order/partitioning.\n${pullTotal} pull-ups\n${ausTotal} Australian pull-ups\n${dipTotal} dips\n${pushTotal} push-ups\n${squatTotal} squats`;
    }
    exercises.push({
      name: 'Main Set: The Chipper (SET + NO STOP)',
      format: 'SET',
      duration: 'For time',
      sets: setsDesc,
      rest: REST_UNTIL_CLEAN + ' Partition as needed.',
      note: 'Complete all reps. Rest between movements if form breaks down.',
      exercise: 'pull-up, dip, push-up, squat',
      type: 'main_set'
    });
  } else if (selected === 'timed_rounds') {
    const rounds = week <= 2 ? 3 : week <= 4 ? 4 : 3;
    const pullReps = calculateEnduranceReps(pullMax, week, level);
    const pushReps = calculateEnduranceReps(pushUpsMax, week, level);
    const squatsReps = calculateEnduranceReps(squatsMax, week, level);
    let setsDesc = `${pullReps} pull-ups\n${pushReps} push-ups\n${squatsReps} squats\n× ${rounds} rounds (for time)`;
    if (level === 'beginner') {
      setsDesc = `${pullReps} pull-ups\n${getAustralianPullUpReps(pullReps, week)} Australian pull-ups\n${pushReps} push-ups\n${squatsReps} squats\n× 3-4 rounds (for time)`;
    }
    exercises.push({
      name: 'Main Set: Timed Rounds (NO STOP)',
      format: 'NO STOP',
      duration: `${rounds} rounds`,
      sets: setsDesc,
      rest: REST_UNTIL_CLEAN,
      note: 'Each round UNBROKEN. Rest between rounds until you can perform clean reps.',
      exercise: level === 'beginner' ? 'pull-up, australian-pull-up, push-up, squat' : 'pull-up, push-up, squat',
      type: 'main_set'
    });
  } else {
    const r1Pull = calculateEnduranceReps(pullMax, week, level);
    const r2Pull = Math.max(2, Math.round(r1Pull * 0.85));
    const r3Pull = Math.max(2, Math.round(r1Pull * 0.70));
    const r1Dips = calculateEnduranceReps(dipsMax, week, level);
    const r2Dips = Math.max(2, Math.round(r1Dips * 0.85));
    const r3Dips = Math.max(2, Math.round(r1Dips * 0.70));
    const r1Push = calculateEnduranceReps(pushUpsMax, week, level);
    const r2Push = Math.max(3, Math.round(r1Push * 0.85));
    const r3Push = Math.max(3, Math.round(r1Push * 0.70));
    let setsDesc = `Round 1: ${r1Pull} pull-ups, ${r1Dips} dips, ${r1Push} push-ups\nRound 2: ${r2Pull} pull-ups, ${r2Dips} dips, ${r2Push} push-ups\nRound 3: ${r3Pull} pull-ups, ${r3Dips} dips, ${r3Push} push-ups`;
    if (level === 'beginner') {
      setsDesc = `Round 1: ${r1Pull} pull-ups, ${getAustralianPullUpReps(r1Pull, week)} Australian, ${r1Dips} dips, ${r1Push} push-ups\nRound 2: ${r2Pull} pull-ups, ${getAustralianPullUpReps(r2Pull, week)} Australian, ${r2Dips} dips, ${r2Push} push-ups\nRound 3: ${r3Pull} pull-ups, ${getAustralianPullUpReps(r3Pull, week)} Australian, ${r3Dips} dips, ${r3Push} push-ups`;
    }
    exercises.push({
      name: 'Main Set: Degressive Ladder',
      format: 'DEGRESSIVE',
      duration: '3 rounds',
      sets: setsDesc,
      rest: REST_UNTIL_CLEAN,
      note: 'Decreasing reps each round. UNBROKEN within each round.',
      exercise: 'pull-up, dip, push-up',
      type: 'main_set'
    });
  }

  if (includeAmrapFinisher) {
    const amrapMin = getAmrapMinutes(week, improveEndurance);
    const amrapPull = Math.min(calculateEnduranceReps(pullMax, week, level), calculateEmomReps(pullMax, level));
    const amrapPush = Math.min(calculateEnduranceReps(pushUpsMax, week, level), calculateEmomReps(pushUpsMax, level));
    const amrapSquat = Math.min(calculateEnduranceReps(squatsMax, week, level), calculateEmomReps(squatsMax, level) + 2);
    let amrapDesc = `AMRAP ${amrapMin} min:\n${amrapPull} pull-ups\n${amrapPush} push-ups\n${amrapSquat} squats\nComplete as many rounds as possible.`;
    if (level === 'beginner') {
      amrapDesc = `AMRAP ${amrapMin} min:\n${amrapPull} pull-ups\n${getAustralianPullUpReps(amrapPull, week)} Australian pull-ups\n${amrapPush} push-ups\n${amrapSquat} squats\nComplete as many rounds as possible.`;
    }
    exercises.push({
      name: 'Finisher: AMRAP',
      format: 'AMRAP',
      duration: `${amrapMin} min`,
      sets: amrapDesc,
      rest: 'Rest as needed between rounds to maintain movement quality.',
      note: 'As many rounds as possible. Prioritize clean reps over speed.',
      exercise: 'pull-up, push-up, squat',
      type: 'finisher'
    });
  } else {
  exercises.push({
    name: 'Cool-down',
    sets: '3–5 min easy movement (walk, light stretch).',
    rest: 'None',
    note: 'Allow recovery. No additional fatigue.',
    type: 'cooldown'
  });
  }

  renumberExercises(exercises);
  return {
    day: 4,
    focus: 'Endurance Integration Day',
    methods: ['SET', 'NO STOP', 'DEGRESSIVE', 'UNBROKEN', 'AMRAP'],
    exercises,
    coachingNote: 'Endurance day. Prioritize movement quality over speed.'
  };
}

// ----- DAY 5: Strength / Weights (or Max Test in week 6) -----
function generateDay5_StrengthWeights6(week, level, maxReps, settings, seed, goals = []) {
  const exercises = [];
  const buildMuscle = goals.includes('build_muscle');
  const learnSkills = goals.includes('learn_skills');
  const skillSettings = getSkillDaySettings(goals, maxReps, 5);
  const addWeights = buildMuscle && week >= 2 && week <= 5;
  const weightKg = addWeights ? Math.min(20, (week >= 4 ? 12 : week >= 3 ? 8 : 5)) : 0;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  const vol = settings.volume * levelMult;

  exercises.push({
    name: 'Warm-up (5-7 min)',
    sets: 'General warm-up\nMobility\nLight sets of first exercise',
    rest: 'No rest needed',
    type: 'warmup'
  });
  if (skillSettings.includeSkillWork && skillSettings.unlockedSkills && skillSettings.unlockedSkills.length > 0) {
    const skillLabels = skillSettings.unlockedSkills.map((s) => s.replace(/_/g, ' ')).join(', ');
    exercises.push({
      name: 'Skill work (quality focus)',
      sets: `Short attempts: ${skillLabels}.\n3–4 attempts per skill, long rest (2–3 min). Focus on technique.`,
      rest: skillSettings.longRest ? '2–3 min between attempts' : '90s between attempts',
      note: 'Low fatigue. Stop when form drops. Placed at session start.',
      type: 'skill'
    });
  }

  const pullReps = calculateSmartReps(maxReps.pullUps, 0.6 * vol);
  const dipReps = calculateSmartReps(maxReps.dips, 0.6 * vol);
  const pushReps = calculateSmartReps(maxReps.pushUps, 0.5 * vol);
  const squatReps = calculateSmartReps(maxReps.squats, 0.5 * vol);

  exercises.push({
    name: addWeights ? `Weighted Pull-ups (${weightKg} kg)` : 'Pull-ups (strength focus)',
    sets: `4 sets × ${pullReps} reps`,
    rest: getRestForGoals(week, 'strength', goals),
    note: addWeights ? 'Use weight vest or dip belt.' : 'Controlled, full ROM.',
    exercise: 'pull-up'
  });
  exercises.push({
    name: addWeights ? `Weighted Dips (${weightKg} kg)` : 'Dips (strength focus)',
    sets: `4 sets × ${dipReps} reps`,
    rest: getRestForGoals(week, 'strength', goals),
    note: addWeights ? 'Use weight vest or dip belt.' : 'Full depth.',
    exercise: 'dip'
  });
  exercises.push({
    name: 'Push-ups (decline or weighted)',
    sets: `4 sets × ${pushReps} reps`,
    rest: getRestForGoals(week, 'strength', goals),
    note: 'Strict form.',
    exercise: 'push-up'
  });
  exercises.push({
    name: addWeights ? `Goblet Squats (${weightKg} kg)` : 'Pistol progressions or Jump Squats',
    sets: `4 sets × ${squatReps} reps`,
    rest: getRestForGoals(week, 'strength', goals),
    note: addWeights ? 'Kettlebell or dumbbell.' : 'Controlled.',
    exercise: 'squat'
  });

  renumberExercises(exercises);
  let coachingNote = 'SET sequence. PROGRESSIVE volume week-over-week. Quality over quantity.';
  if (learnSkills) coachingNote = 'Skill-focused day. Low fatigue, controlled tempo. Quality over quantity.';
  if (buildMuscle && addWeights) coachingNote = 'Weighted calisthenics (0–20 kg). Controlled tempo. Full ROM.';
  return {
    day: 5,
    focus: addWeights ? 'Strength + Weights' : 'Strength Day',
    methods: ['SET', 'PROGRESSIVE'],
    exercises,
    coachingNote
  };
}

function generateDay5_MaxTest6(maxReps, level) {
  const exercises = [];
  exercises.push({
    name: 'Warm-up (5-7 min)',
    sets: 'Light movement\nPractice each exercise with 2-3 reps',
    rest: 'No rest needed',
    type: 'warmup'
  });
  exercises.push({
    name: 'Max Test: Pull-ups',
    sets: '1 set – max reps (record number)',
    rest: '5 min before next exercise',
    note: 'Strict form. Record your result.',
    exercise: 'pull-up'
  });
  exercises.push({
    name: 'Max Test: Dips',
    sets: '1 set – max reps (record number)',
    rest: '5 min before next exercise',
    note: 'Full range. Record your result.',
    exercise: 'dip'
  });
  exercises.push({
    name: 'Max Test: Push-ups',
    sets: '1 set – max reps (record number)',
    rest: '5 min before next exercise',
    note: 'Chest to deck. Record your result.',
    exercise: 'push-up'
  });
  exercises.push({
    name: 'Max Test: Squats',
    sets: '1 set – max reps (record number)',
    rest: '5 min before next exercise',
    note: 'Full depth. Record your result.',
    exercise: 'squat'
  });
  if (level !== 'beginner' && (maxReps.muscleUp || 0) > 0) {
    exercises.push({
      name: 'Max Test: Muscle-ups',
      sets: '1 set – max reps (record number)',
      rest: '—',
      note: 'Record your result.',
      exercise: 'muscle-up'
    });
  }
  renumberExercises(exercises);
  return {
    day: 5,
    focus: 'Max Reps Test Day',
    methods: ['max_test'],
    exercises,
    coachingNote: 'Last day of the program. Record all numbers and compare to week 1.'
  };
}

function renumberExercises(exercises) {
  let num = 1;
  exercises.forEach(ex => {
    if (ex.type !== 'warmup' && ex.type !== 'cooldown' && !ex.name.includes('Finisher') && !ex.name.includes('PART')) {
      const clean = ex.name.replace(/^Exercise \d+:\s*/i, '').trim();
      ex.name = `Exercise ${num}: ${clean}`;
      num++;
    }
  });
}

/** Generate 12-week program: two 6-week blocks with renumbered weeks 7–12. Week 12 day 5 = max test. */
function generate12WeekProgram(level, maxReps, seed = Date.now(), options = {}) {
  const block1 = generate6WeekProgram(level, maxReps, seed, options);
  const block2 = generate6WeekProgram(level, maxReps, seed + 9999, options);
  const weeks1 = block1.program || [];
  const weeks2 = (block2.program || []).map((w) => ({
    ...w,
    week: w.week + 6
  }));
  const program = [...weeks1, ...weeks2];
  return { ...block1, program };
}

module.exports = {
  generate6WeekProgram,
  generate12WeekProgram,
  detectLevelFromReps,
  calculateNutrition,
  calculateSmartReps,
  getDynamicRest,
  getAustralianPullUpReps
};
