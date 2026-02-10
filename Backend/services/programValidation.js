/**
 * Layer 1 — Algorithm validation & beginner regressions
 * Rules: NEVER output negative reps, impossible sets, fatigue stacking
 * Max reps per set ≤ 50% of max | EMOM ≤ 35% | No high-intensity methods for beginners
 * Week 1 = friendly
 */

/** Sanitize rep count: never negative, minimum 1 for working sets. */
function sanitizeReps(n, allowZero = false) {
  const v = Math.round(Number(n));
  if (allowZero) return Math.max(0, v);
  return Math.max(1, v);
}

/** Cap reps per set at 50% of athlete max (coach rule). */
function capRepsPerSet(reps, maxReps) {
  if (!maxReps || maxReps < 1) return sanitizeReps(reps);
  const cap = Math.max(1, Math.floor(maxReps * 0.5));
  return Math.min(sanitizeReps(reps), cap);
}

/** Cap EMOM reps at 35% of max (movement quality, sustainable pacing). */
function capEmomReps(reps, maxReps) {
  if (!maxReps || maxReps < 1) return sanitizeReps(reps);
  const cap = Math.max(1, Math.floor(maxReps * 0.35));
  return Math.min(sanitizeReps(reps), cap);
}

/** Beginner/obese: movement patterns > exercises. Regressions for 0–8 reps. */
const BEGINNER_REGRESSIONS = {
  pullUps: {
    low: { name: 'Assisted pull-up or negative pull-ups', materials: 'Resistance band, pull-up bar' },
    mid: { name: 'Australian pull-ups', materials: 'Low bar, floor' }
  },
  dips: {
    low: { name: 'Assisted dips or bench dips', materials: 'Resistance band, parallel bars or bench' },
    mid: { name: 'Bench dips', materials: 'Bench, floor' }
  },
  pushUps: {
    low: { name: 'Knee push-ups', materials: 'Floor' },
    mid: { name: 'Incline push-ups', materials: 'Bench, wall, parallettes' }
  },
  squats: {
    low: { name: 'Box squat', materials: 'Box, chair' },
    mid: { name: 'Bodyweight squat', materials: 'Floor' }
  },
  burpees: {
    low: { name: 'Step-back burpees', materials: 'Floor' },
    mid: { name: 'Burpees (tempo)', materials: 'Floor' }
  },
  legRaises: {
    low: { name: 'Knee raises or lying leg raises', materials: 'Floor, optional bar' },
    mid: { name: 'Leg raises', materials: 'Pull-up bar or floor' }
  }
};

/** Map max reps (0–8) to regression exercise name. Returns { name, useRegression } */
function getRegressionForExercise(exerciseKey, maxReps, level) {
  if (level !== 'beginner') return { name: null, useRegression: false };
  const r = BEGINNER_REGRESSIONS[exerciseKey];
  if (!r) return { name: null, useRegression: false };
  const m = maxReps == null ? 0 : Number(maxReps);
  if (m <= 3) return { name: r.low.name, useRegression: true };
  if (m <= 8) return { name: r.mid.name, useRegression: true };
  return { name: null, useRegression: false };
}

/** Materials used across the program (Page 2). */
const MATERIALS_LIST = [
  { name: 'Jump rope', use: 'Cardio, warm-up, conditioning, light skipping' },
  { name: 'Pull-up bar', use: 'Pull-ups, chin-ups, leg raises, dead hangs, negative pull-ups' },
  { name: 'Parallel bars', use: 'Dips, L-sit, support holds, assisted dips' },
  { name: 'Parallettes', use: 'Push-ups, incline push-ups, L-sit, handstand, planche progressions' },
  { name: 'Resistance bands', use: 'Assisted pull-ups/dips, band dislocates, activation' },
  { name: 'Dips belt / Weight vest', use: 'Weighted pull-ups, weighted dips (0–20 kg)' },
  { name: 'Weights (0–20 kg)', use: 'Weighted calisthenics, goblet squats' },
  { name: 'Floor / Mat', use: 'Push-ups, knee push-ups, planks, core work, step-back burpees' }
];

function getMaterialsList() {
  return MATERIALS_LIST;
}

/** High-intensity methods – no stacking, especially for beginners. */
const HIGH_INTENSITY_METHODS = ['EMOM', 'AMRAP', 'FOR TIME', 'CHIPPER', 'NO STOP', 'UNBROKEN'];

/** Check if method is high-intensity (fatigue stacking risk). */
function isHighIntensityMethod(format) {
  if (!format || typeof format !== 'string') return false;
  const upper = format.toUpperCase();
  return HIGH_INTENSITY_METHODS.some((m) => upper.includes(m));
}

/** Max high-intensity methods per session – prevent fatigue stacking. */
const MAX_HIGH_INTENSITY_PER_SESSION = 1;

module.exports = {
  sanitizeReps,
  capRepsPerSet,
  capEmomReps,
  getRegressionForExercise,
  getMaterialsList,
  isHighIntensityMethod,
  MAX_HIGH_INTENSITY_PER_SESSION,
  BEGINNER_REGRESSIONS
};
