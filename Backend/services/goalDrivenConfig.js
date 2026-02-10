/**
 * Clean Goal-Driven Program Architecture
 * Same base week structure; goals change emphasis (volume, rest, cardio density, skills).
 * Multi-select: 1–3 goals with priority weighting. Conflict rules enforced.
 */

const VALID_GOALS = ['lose_weight', 'improve_endurance', 'build_muscle', 'learn_skills'];

const GOAL_LABELS = {
  lose_weight: 'Lose Weight',
  improve_endurance: 'Improve Endurance',
  build_muscle: 'Build Muscle',
  learn_skills: 'Learn New Skills'
};

/** Priority weighting: primary 60%, secondary 30%, third 10%. */
function getGoalWeights(goals = []) {
  const list = Array.isArray(goals) ? goals.filter((g) => VALID_GOALS.includes(g)) : [];
  const uniq = [...new Set(list)];
  const weights = { lose_weight: 0, improve_endurance: 0, build_muscle: 0, learn_skills: 0 };
  if (uniq.length === 0) return weights;
  const w = uniq.length === 1 ? [1] : uniq.length === 2 ? [0.6, 0.4] : [0.6, 0.3, 0.1];
  uniq.forEach((g, i) => { weights[g] = w[i] || 0; });
  return weights;
}

/** Rep range by goal: Lose Weight 40–55%, Endurance 40–60%, Build Muscle 60–80%, Skills = quality/low volume. */
function getRepRangeForGoals(goals, defaultPct = 0.65) {
  const w = getGoalWeights(goals);
  let low = 0.4, high = 0.65;
  if (w.build_muscle > 0.3) { low = 0.55; high = 0.8; }
  else if (w.improve_endurance > 0.3) { low = 0.4; high = 0.6; }
  else if (w.lose_weight > 0.3) { low = 0.4; high = 0.55; }
  return { low, high };
}

/** Rest: Build Muscle = longer; Lose Weight = shorter (but never after near-max). */
function getRestBiasForGoals(goals) {
  const w = getGoalWeights(goals);
  if (w.build_muscle > 0.4) return 'longer';
  if (w.lose_weight > 0.4) return 'shorter';
  return 'default';
}

/** Cardio density: Lose Weight = +1 cardio element, more jump rope/burpees/squats. */
function getCardioDensityForGoals(goals) {
  const w = getGoalWeights(goals);
  return {
    addElement: w.lose_weight > 0.3,
    favorJumpRope: w.lose_weight > 0.2 || w.improve_endurance > 0.2,
    extraMins: (w.lose_weight + w.improve_endurance) > 0.5 ? 5 : 0
  };
}

/** Build Muscle: limit cardio volume and random conditioning. Endurance: limit max strength / weighted. */
function getLimitsForGoals(goals) {
  const w = getGoalWeights(goals);
  return {
    limitCardioVolume: w.build_muscle > 0.5,
    limitEmomIntensity: w.lose_weight > 0.4,
    limitWeightedCalisthenics: w.improve_endurance > 0.5,
    limitConditioningOnSkillDays: w.learn_skills > 0.3,
    limitFatigueStackingWithSkills: w.learn_skills > 0.3
  };
}

/** Conflict: Lose Weight + Build Muscle — never overload same day; alternate emphasis by day. */
function hasGoalConflict(goals) {
  const list = Array.isArray(goals) ? goals : [];
  return list.includes('lose_weight') && list.includes('build_muscle');
}

/** Which goal should dominate a given day (for conflict days). Day 1–5. */
function getDominantGoalForDay(goals, dayIndex) {
  const w = getGoalWeights(goals);
  if (!hasGoalConflict(goals)) return null;
  const order = ['improve_endurance', 'build_muscle', 'lose_weight', 'learn_skills'];
  const byWeight = order.filter((g) => w[g] > 0).sort((a, b) => w[b] - w[a]);
  if (dayIndex === 3) return byWeight.find((g) => g === 'lose_weight' || g === 'improve_endurance') || byWeight[0];
  if (dayIndex === 4) return byWeight.find((g) => g === 'improve_endurance') || byWeight[0];
  if (dayIndex === 5) return byWeight.find((g) => g === 'build_muscle' || g === 'learn_skills') || byWeight[0];
  return null;
}

// ----- Skill gates (prerequisites for skills) -----
const SKILL_GATES = {
  l_sit: { pullUps: 15, legRaises: 15 },
  handstand: { pushUps: 10, pikePushUps: 10 },
  muscle_up: { pullUps: 10, dips: 10 },
  front_lever: { pullUps: 15 },
  back_lever: { pullUps: 12 },
  planche: { pushUps: 25, dips: 15 }
};

const GATE_TO_MAXREPS_KEY = { pullUps: 'pullUps', dips: 'dips', pushUps: 'pushUps', pikePushUps: 'pushUps', legRaises: 'legRaises' };

function canUnlockSkill(skillKey, maxReps = {}) {
  const gate = SKILL_GATES[skillKey];
  if (!gate) return false;
  return Object.entries(gate).every(([exercise, min]) => {
    const key = GATE_TO_MAXREPS_KEY[exercise] || exercise;
    const val = maxReps[key] ?? 0;
    return val >= min;
  });
}

function getUnlockedSkills(maxReps = {}) {
  return Object.keys(SKILL_GATES).filter((k) => canUnlockSkill(k, maxReps));
}

/** Learn Skills: skills at session start or low-fatigue days; short attempts, long rest; no EMOM + skills. */
function getSkillDaySettings(goals, maxReps, dayIndex) {
  const w = getGoalWeights(goals);
  if (w.learn_skills < 0.2) return { includeSkillWork: false };
  const unlocked = getUnlockedSkills(maxReps);
  const lowFatigueDays = [1, 5];
  const includeSkillWork = unlocked.length > 0 && (dayIndex === 1 || dayIndex === 5);
  return {
    includeSkillWork,
    unlockedSkills: unlocked,
    placeAtStart: true,
    longRest: true,
    avoidConditioningOnSameDay: w.learn_skills > 0.4
  };
}

/** Week structure: 1 friendly, 2–3 progressive, 4 intense, 5 controlled peak, 6 deload. */
const WEEK_INTENSITY_TAG = {
  1: 'friendly',
  2: 'progressive',
  3: 'progressive',
  4: 'intense',
  5: 'controlled_peak',
  6: 'deload'
};

function getWeekIntensityTag(week) {
  return WEEK_INTENSITY_TAG[week] || 'progressive';
}

module.exports = {
  VALID_GOALS,
  GOAL_LABELS,
  getGoalWeights,
  getRepRangeForGoals,
  getRestBiasForGoals,
  getCardioDensityForGoals,
  getLimitsForGoals,
  hasGoalConflict,
  getDominantGoalForDay,
  SKILL_GATES,
  canUnlockSkill,
  getUnlockedSkills,
  getSkillDaySettings,
  getWeekIntensityTag,
  WEEK_INTENSITY_TAG
};
