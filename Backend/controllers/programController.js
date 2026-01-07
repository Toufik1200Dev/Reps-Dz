// Calisthenics Endurance Program Generator
// Competition-style training based on real endurance methods
// Professional Calisthenics Coach + MERN Engineer

/**
 * MAIN CONTROLLER
 * Generates realistic 4-week calisthenics endurance programs using predefined methods
 */
const generateProgram = async (req, res) => {
  try {
    const { level, maxReps } = req.body;

    // Validation
    if (!level || !['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level. Must be: beginner, intermediate, or advanced'
      });
    }

    if (!maxReps || typeof maxReps !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'maxReps must be an object with exercise values'
      });
    }

    // Validate all maxReps values
    const requiredExercises = ['muscleUp', 'pullUps', 'dips', 'pushUps', 'squats', 'legRaises'];
    for (const exercise of requiredExercises) {
      if (typeof maxReps[exercise] !== 'number' || maxReps[exercise] < 0) {
        return res.status(400).json({
          success: false,
          message: `${exercise} must be a non-negative number`
        });
      }
    }

    // Safety limits
    const safetyLimits = {
      muscleUp: 25,
      pullUps: 60,
      dips: 80,
      pushUps: 120,
      squats: 200,
      legRaises: 60
    };

    for (const [exercise, limit] of Object.entries(safetyLimits)) {
      if (maxReps[exercise] > limit) {
        return res.status(400).json({
          success: false,
          message: `${exercise} max reps (${maxReps[exercise]}) exceeds realistic limit of ${limit}`
        });
      }
    }

    // Generate 4-week program
    const program = generate4WeekProgram(level, maxReps);

    res.status(200).json({
      success: true,
      data: {
        level,
        maxReps,
        program
      }
    });

  } catch (error) {
    console.error('Error generating program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate program',
      error: error.message
    });
  }
};

/**
 * PROGRESSION MODEL
 * Week 1: Volume base (60-65%)
 * Week 2: Density increase (70-75%)
 * Week 3: Unbroken work (80-85%)
 * Week 4: Competition simulation (90-95%)
 */
const generate4WeekProgram = (level, maxReps) => {
  const weeks = [];
  const weekSettings = [
    { volume: 0.62, intensity: 0.60, style: 'volume' },
    { volume: 0.72, intensity: 0.70, style: 'density' },
    { volume: 0.82, intensity: 0.80, style: 'unbroken' },
    { volume: 0.93, intensity: 0.90, style: 'competition' }
  ];

  for (let week = 1; week <= 4; week++) {
    const settings = weekSettings[week - 1];
    const days = generateWeekDays(week, level, maxReps, settings);
    weeks.push({
      week,
      volume: `${Math.round(settings.volume * 100)}% of max`,
      days
    });
  }

  return weeks;
};

/**
 * WEEK STRUCTURE (FIXED)
 * Day 1: Pull / Muscle-Up Endurance
 * Day 2: Push Endurance
 * Day 3: Legs + Cardio + Core
 * Day 4: Endurance Sets (level-based)
 */
const generateWeekDays = (week, level, maxReps, settings) => {
  const days = [];
  days.push(generateDay1_PullMuscleUp(week, level, maxReps, settings));
  days.push(generateDay2_Push(week, level, maxReps, settings));
  days.push(generateDay3_LegsCardioCore(week, level, maxReps, settings));
  days.push(generateDay4_EnduranceSets(week, level, maxReps, settings));
  return days;
};

// ============================================================================
// DAY 1: PULL / MUSCLE-UP ENDURANCE
// Uses 2 methods + 1 finisher
// ============================================================================
const generateDay1_PullMuscleUp = (week, level, maxReps, settings) => {
  const exercises = [];
  const muMax = maxReps.muscleUp;
  const pullMax = maxReps.pullUps;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  
  // WARM-UP
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Tempo pull-ups x10-15\nArm circles, shoulder mobility\nHang holds: 3x15s\nMuscle-up practice (if applicable)",
    rest: "No rest needed",
    type: "warmup"
  });

  // Select 2 methods based on week and level
  const methods = selectDay1Methods(week, level, muMax, pullMax, settings, levelMult);
  exercises.push(...methods);

  // Always add 1 finisher
  const finisher = getDay1Finisher(week, level, muMax, pullMax, settings, levelMult);
  exercises.push(finisher);

  return {
    day: 1,
    focus: "Pull / Muscle-Up Endurance",
    exercises,
    coachingNote: week === 4 ? "Competition mode: Push through tiredness, keep good form" : "Focus on good technique. Rest fully between exercises."
  };
};

// Select 2 methods for Day 1
const selectDay1Methods = (week, level, muMax, pullMax, settings, levelMult) => {
  const methods = [];
  const pullVolume = pullMax * settings.volume * levelMult * (level === 'advanced' ? 0.75 : 0.65);
  const muVolume = muMax > 0 ? muMax * settings.volume * levelMult * (level === 'advanced' ? 0.70 : 0.60) : 0;

  // Method selection based on week
  if (week === 1) {
    // Week 1: Degressive Pull + EMOM
    methods.push(method1_DegressivePullMU(muMax, pullMax, pullVolume));
    methods.push(method2_EMOMBlock(week, level, pullMax, muMax, settings, levelMult, 'pull'));
  } else if (week === 2) {
    // Week 2: Separated Volume + Pyramids
    methods.push(method3_SeparatedVolume(muMax, pullMax, pullVolume, muVolume));
    methods.push(method6_Pyramids(pullMax, muMax, pullVolume, muVolume));
  } else if (week === 3) {
    // Week 3: EMOM Block + Superset
    methods.push(method2_EMOMBlock(week, level, pullMax, muMax, settings, levelMult, 'pull'));
    const superset = muMax > 0 && pullMax >= 10 ? method7_SupersetA(muMax, pullMax) : method8_SupersetB(pullMax, muMax);
    methods.push(superset);
  } else {
    // Week 4: Timer Challenge + Degressive
    if (muMax > 0) {
      methods.push(method9_TimerChallenge(pullMax, muMax));
    }
    methods.push(method1_DegressivePullMU(muMax, pullMax, pullVolume));
  }

  return methods;
};

// METHOD 1: Degressive Pull + Muscle-Up
const method1_DegressivePullMU = (muMax, pullMax, pullVolume) => {
  const startReps = Math.max(1, Math.round(pullMax * 0.60));
  const rounds = Math.min(8, Math.ceil(startReps / 2));
  
  let setsDesc = '';
  for (let i = 0; i < rounds; i++) {
    const reps = Math.max(0, startReps - (i * 2));
    if (reps > 0) {
      setsDesc += `${reps} pull-ups${muMax > 0 && i < 3 ? ' + 1 muscle-up' : ''}\n`;
    }
  }
  
  return {
    name: "Method 1: Degressive Pull + Muscle-Up",
    sets: setsDesc.trim() + `\n× ${Math.min(3, rounds)} rounds`,
    rest: "2-3 min between rounds",
    note: "Start with 60% max pull-ups, decrease by 2 each round until 0. Add 1 MU per round if applicable."
  };
};

// METHOD 2: EMOM Block
const method2_EMOMBlock = (week, level, pullMax, muMax, settings, levelMult, type) => {
  const pullVolume = pullMax * settings.volume * levelMult * (level === 'advanced' ? 0.75 : 0.65);
  const muVolume = muMax > 0 ? muMax * settings.volume * levelMult * (level === 'advanced' ? 0.70 : 0.60) : 0;
  
  const durations = week === 1 ? [5, 6] : week === 2 ? [6, 8] : week === 3 ? [8, 10] : [10, 12];
  const percentages = [0.40, 0.35];
  
  let setsDesc = '';
  durations.forEach((duration, idx) => {
    const pullReps = Math.max(1, Math.round(pullMax * percentages[idx]));
    setsDesc += `EMOM ${duration} min: ${pullReps} pull-ups`;
    if (muMax > 0 && idx === 0) {
      const muReps = Math.max(1, Math.round(muMax * 0.30));
      setsDesc += ` + ${muReps} muscle-ups`;
    }
    setsDesc += '\n';
  });
  
  return {
    name: "Method 2: EMOM Block",
    sets: setsDesc.trim(),
    rest: "Rest for the remainder of each minute",
    note: "Complete reps at start of each minute, rest for remaining time."
  };
};

// METHOD 3: Separated Volume
const method3_SeparatedVolume = (muMax, pullMax, pullVolume, muVolume) => {
  let setsDesc = '';
  
  if (muMax > 0) {
    const mu80 = Math.max(1, Math.round(muMax * 0.80));
    const mu60 = Math.max(1, Math.round(muMax * 0.60));
    const mu50 = Math.max(1, Math.round(muMax * 0.50));
    setsDesc += `Muscle-ups:\n4 sets × ${mu80} reps (80% max)\n5 sets × ${mu60} reps (60% max)\n6 sets × ${mu50} reps (50% max)\n\n`;
  }
  
  const pull80 = Math.max(1, Math.round(pullMax * 0.80));
  const pull60 = Math.max(1, Math.round(pullMax * 0.60));
  const pull50 = Math.max(1, Math.round(pullMax * 0.50));
  setsDesc += `Pull-ups:\n4 sets × ${pull80} reps (80% max)\n5 sets × ${pull60} reps (60% max)\n6 sets × ${pull50} reps (50% max)`;
  
  return {
    name: "Method 3: Separated Volume",
    sets: setsDesc,
    rest: "90s-2 min between sets",
    note: "Complete all sets at each percentage before moving to next."
  };
};

// METHOD 6: Pyramids
const method6_Pyramids = (pullMax, muMax, pullVolume, muVolume) => {
  const topPull = Math.max(1, Math.round(pullMax * 0.70));
  let setsDesc = `Pull-ups: 1 → ${topPull} → 1\nIncrease by 2-3 reps per step\n`;
  
  if (muMax > 0) {
    const topMU = Math.max(1, Math.round(muMax * 0.60));
    setsDesc += `\nMuscle-ups: 1 → ${topMU} → 1\nIncrease by 1 rep per step`;
  }
  
  return {
    name: "Method 6: Pyramids",
    sets: setsDesc,
    rest: "30s between sets",
    note: "Start at 1, work up to top, come back down to 1."
  };
};

// METHOD 7: Superset A
const method7_SupersetA = (muMax, pullMax) => {
  const muReps = Math.min(5, Math.max(2, Math.round(muMax * 0.5)));
  const chinUps = Math.max(8, Math.round(pullMax * 0.6));
  const ausPull = Math.max(15, Math.round(pullMax * 1.2));
  const pullReps = Math.max(8, Math.round(pullMax * 0.5));
  
  return {
    name: "Method 7: Superset A",
    sets: `${muReps} muscle-ups\n${chinUps} chin-ups\n${ausPull} australian pull-ups\n${pullReps} pull-ups\n× 4 rounds`,
    rest: "2-3 min between rounds",
    note: "Complete all exercises in order without stopping. Rest fully between rounds."
  };
};

// METHOD 8: Superset B (Auto-scaled)
const method8_SupersetB = (pullMax, muMax) => {
  let x;
  if (pullMax < 10) x = 5;
  else if (pullMax < 20) x = 8;
  else x = 10;
  
  const muReps = muMax > 0 ? Math.min(x, Math.max(2, Math.round(muMax * 0.4))) : 0;
  const dipReps = Math.round(x * 1.2);
  
  let setsDesc = `${x} pull-ups`;
  if (muMax > 0) setsDesc += `\n${muReps} muscle-ups`;
  setsDesc += `\n${dipReps} bar dips`;
  setsDesc += `\n× 4 rounds`;
  
  return {
    name: "Method 8: Superset B (Auto-scaled)",
    sets: setsDesc,
    rest: "2 min between rounds",
    note: `Auto-scaled based on your max pull-ups (x=${x}). Complete each round without stopping.`
  };
};

// METHOD 9: Timer Challenge
const method9_TimerChallenge = (pullMax, muMax) => {
  const targetPull = Math.min(100, Math.round(pullMax * 1.5));
  const targetMU = muMax > 0 ? Math.min(50, Math.round(muMax * 1.2)) : 0;
  
  return {
    name: "Method 9: Timer Challenge",
    sets: `${targetPull} pull-ups\n${targetMU > 0 ? targetMU + ' muscle-ups\n' : ''}As fast as possible`,
    rest: "Record your time. Rest fully after completion.",
    note: "Challenge yourself to complete all reps as quickly as possible with good form."
  };
};

// DAY 1 FINISHER
const getDay1Finisher = (week, level, muMax, pullMax, settings, levelMult) => {
  const finishers = [
    // Finisher 4: Australian Pull-Up
    {
      name: "Finisher: Australian Pull-Up",
      sets: `10 sets × ${Math.max(12, Math.min(25, Math.round(pullMax * 0.8)))} reps`,
      rest: "30s between sets",
      note: "Horizontal pull-ups. Keep body straight."
    },
    // Finisher 5: Isometric
    {
      name: "Finisher: Isometric Hold + Max Pull",
      sets: "Hold at top 10s → Hold in middle 10s → Dead hang 10s → Max pull-ups\n× 3 rounds",
      rest: "5 min between rounds",
      note: "Do not let go of the bar until max pull-ups are complete."
    }
  ];
  
  return finishers[week % 2]; // Alternate between the two
};

// ============================================================================
// DAY 2: PUSH ENDURANCE
// Uses 2 methods + 1 finisher
// ============================================================================
const generateDay2_Push = (week, level, maxReps, settings) => {
  const exercises = [];
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  
  // WARM-UP
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Tempo push-ups x15-20\nShoulder circles and stretches\nArm swings\nTempo dips x10-15",
    rest: "No rest needed",
    type: "warmup"
  });

  // Select 2 methods
  const methods = selectDay2Methods(week, level, dipsMax, pushUpsMax, settings, levelMult);
  exercises.push(...methods);

  // Always add 1 finisher
  const finisher = getDay2Finisher(week, level, dipsMax, pushUpsMax, settings, levelMult);
  exercises.push(finisher);

  return {
    day: 2,
    focus: "Push Endurance",
    exercises,
    coachingNote: "Keep good form. Push-ups: chest touches ground. Dips: go all the way down."
  };
};

// Select 2 methods for Day 2
const selectDay2Methods = (week, level, dipsMax, pushUpsMax, settings, levelMult) => {
  const methods = [];
  
  if (week === 1) {
    methods.push(method1_DensityCircuit(dipsMax, pushUpsMax));
    methods.push(method2_EMOMBlocks(dipsMax, pushUpsMax, settings, levelMult, week));
  } else if (week === 2) {
    methods.push(method2_EMOMBlocks(dipsMax, pushUpsMax, settings, levelMult, week));
    methods.push(method4_SeparatedVolumePush(dipsMax, pushUpsMax));
  } else if (week === 3) {
    const muMax = 0; // Check if we have MU data
    if (muMax > 0) {
      methods.push(method3_EMOMMUCombo(muMax, dipsMax));
    }
    methods.push(method6_PyramidsPush(dipsMax, pushUpsMax));
  } else {
    methods.push(method2_EMOMBlocks(dipsMax, pushUpsMax, settings, levelMult, week));
    methods.push(method6_PyramidsPush(dipsMax, pushUpsMax));
  }

  return methods;
};

// METHOD 1: Density Circuit
const method1_DensityCircuit = (dipsMax, pushUpsMax) => {
  const x = Math.max(1, Math.round(dipsMax * 0.35));
  const pushReps = Math.max(1, Math.round(pushUpsMax * 0.35));
  const barDips = Math.round(x * 0.8);
  
  return {
    name: "Method 1: Density Circuit",
    sets: `${x} dips\n${pushReps} push-ups\n${barDips} bar dips\n× 5 rounds`,
    rest: "90s between rounds",
    note: "Complete each round without stopping. Rest fully between rounds."
  };
};

// METHOD 2: EMOM Blocks
const method2_EMOMBlocks = (dipsMax, pushUpsMax, settings, levelMult, week) => {
  const dipsVolumeMult = settings.volume * levelMult * 1.15;
  const pushUpsVolumeMult = settings.volume * levelMult * 1.2;
  
  const durations = week <= 2 ? [8, 10] : [10, 12];
  const dipPercentages = [0.35, 0.30];
  const pushPercentages = [0.35, 0.30];
  
  let setsDesc = '';
  durations.forEach((duration, idx) => {
    const dipReps = Math.max(1, Math.round(dipsMax * dipPercentages[idx]));
    const pushReps = Math.max(1, Math.round(pushUpsMax * pushPercentages[idx]));
    setsDesc += `EMOM ${duration} min: ${dipReps} dips\nEMOM ${duration} min: ${pushReps} push-ups\n`;
  });
  
  return {
    name: "Method 2: EMOM Blocks",
    sets: setsDesc.trim(),
    rest: "Rest for the remainder of each minute",
    note: "2 EMOMs for dips, 2 EMOMs for push-ups. Complete reps at start of each minute."
  };
};

// METHOD 3: EMOM Muscle-Up Combo
const method3_EMOMMUCombo = (muMax, dipsMax) => {
  const barDips = Math.max(1, Math.round(dipsMax * 0.20));
  
  return {
    name: "Method 3: EMOM Muscle-Up Combo",
    sets: `EMOM 8 min:\n1 muscle-up\n${barDips} bar dips`,
    rest: "Rest for the remainder of each minute",
    note: "Complete 1 MU + bar dips at start of each minute for 8 minutes."
  };
};

// METHOD 4: Separated Volume Push
const method4_SeparatedVolumePush = (dipsMax, pushUpsMax) => {
  const dips80 = Math.max(1, Math.round(dipsMax * 0.80));
  const push80 = Math.max(1, Math.round(pushUpsMax * 0.80));
  const barDips80 = Math.max(1, Math.round(dipsMax * 0.75));
  
  return {
    name: "Method 4: Separated Volume",
    sets: `5 sets × ${dips80} dips (80% max)\n5 sets × ${push80} push-ups (80% max)\n5 sets × ${barDips80} bar dips (75% max)`,
    rest: "90s between sets",
    note: "Complete all sets for each exercise before moving to next."
  };
};

// METHOD 6: Pyramids Push
const method6_PyramidsPush = (dipsMax, pushUpsMax) => {
  const topDips = Math.max(1, Math.round(dipsMax * 0.70));
  const topPush = Math.max(1, Math.round(pushUpsMax * 0.70));
  
  return {
    name: "Method 6: Pyramids",
    sets: `Dips: 1 → ${topDips} → 1 (increase by 3 per step)\nPush-ups: 1 → ${topPush} → 1 (increase by 3 per step)`,
    rest: "30s between sets",
    note: "Work up to top, come back down to 1. Increase by 3 reps per step."
  };
};

// DAY 2 FINISHER
const getDay2Finisher = (week, level, dipsMax, pushUpsMax, settings, levelMult) => {
  const pushReps = Math.max(1, Math.round(pushUpsMax * 0.10));
  
  return {
    name: "Finisher: Isometric Push Hold",
    sets: `EMOM 10 min:\n10s 90° push-up hold\n${pushReps} push-ups (10% max)`,
    rest: "Rest for the remainder of each minute",
    note: "Hold at 90° for 10 seconds, then complete push-ups. Repeat every minute for 10 minutes."
  };
};

// ============================================================================
// DAY 3: LEGS + CARDIO + CORE
// ============================================================================
const generateDay3_LegsCardioCore = (week, level, maxReps, settings) => {
  const exercises = [];
  const squatsMax = maxReps.squats;
  const legRaisesMax = maxReps.legRaises;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  const squatsVolumeMult = settings.volume * levelMult * 1.25;
  const squatsIntensityMult = settings.intensity * levelMult * 1.2;
  const legRaisesVolumeMult = settings.volume * levelMult * 1.1;

  // WARM-UP
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Easy jogging 3-5 min\nLeg swings forward and back\nTempo squats x15-20\nHip circles",
    rest: "No rest needed",
    type: "warmup"
  });

  // CARDIO (Running or Jump Rope)
  const cardioDuration = week === 1 ? 10 : week === 2 ? 15 : week === 3 ? 20 : 25;
  exercises.push({
    name: week % 2 === 0 ? "Cardio: Running" : "Cardio: Jump Rope",
    sets: week % 2 === 0 
      ? `Run ${cardioDuration} minutes at steady pace`
      : `Jump rope for ${cardioDuration} minutes without stopping`,
    rest: "2-3 min",
    note: "Keep steady pace. Don't sprint."
  });

  // SQUATS
  if (squatsMax <= 60) {
    const reps = Math.max(1, Math.round(squatsMax * squatsVolumeMult));
    exercises.push({
      name: "Squats",
      sets: `${reps} reps × 4 sets`,
      rest: "60s between sets",
      note: "Go all the way down. Control speed."
    });
  } else {
    const emomReps = Math.max(1, Math.round(squatsMax * squatsIntensityMult * 0.30));
    const duration = week <= 2 ? 15 : week === 3 ? 18 : 20;
    exercises.push({
      name: "Squats Every Minute",
      sets: `${duration} minutes: ${emomReps} reps at start of each minute`,
      rest: "Rest for the rest of the minute",
      note: "Keep steady pace. Go all the way down each rep."
    });
  }

  // JUMP SQUATS
  const jumpSquatReps = Math.max(10, Math.round(squatsMax * 0.4));
  exercises.push({
    name: "Jump Squats",
    sets: `${jumpSquatReps} reps × ${week <= 2 ? 3 : 4} sets`,
    rest: "60s between sets",
    note: "Explosive jumps. Land softly."
  });

  // BURPEES
  const burpeeCount = week <= 2 ? 15 : week === 3 ? 18 : 22;
  exercises.push({
    name: "Burpees",
    sets: `${burpeeCount} reps × ${week <= 2 ? 4 : week === 3 ? 5 : 6} sets`,
    rest: "60-90s between sets",
    note: "Full burpee: push-up then jump. Keep steady pace."
  });

  // LEG RAISES
  const legRaiseReps = Math.max(5, Math.round(legRaisesMax * legRaisesVolumeMult));
  exercises.push({
    name: "Leg Raises",
    sets: `${legRaiseReps} reps × ${week <= 2 ? 4 : 5} sets`,
    rest: "60s between sets",
    note: "Control going down. Don't swing."
  });

  // PLANK HOLD
  exercises.push({
    name: "Plank Hold",
    sets: `${week <= 2 ? 60 : week === 3 ? 75 : 90} seconds × ${week <= 2 ? 3 : 4} sets`,
    rest: "60s between sets",
    note: "Keep body straight. Don't sag or lift hips."
  });

  return {
    day: 3,
    focus: "Legs + Cardio + Core",
    exercises,
    coachingNote: "Cardio day. Focus on keeping steady pace. Do full range of motion on all exercises."
  };
};

// ============================================================================
// DAY 4: ENDURANCE SETS (LEVEL-BASED)
// 2-4 sets based on level
// ============================================================================
const generateDay4_EnduranceSets = (week, level, maxReps, settings) => {
  const exercises = [];
  
  const muMax = maxReps.muscleUp;
  const pullMax = maxReps.pullUps;
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  const squatsMax = maxReps.squats;
  
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  
  // Week multipliers for Day 4
  const weekMultipliers = [
    { min: 0.60, max: 1.00 },
    { min: 0.75, max: 1.25 },
    { min: 0.95, max: 1.40 },
    { min: 1.15, max: 1.50 }
  ];
  
  const mult = weekMultipliers[week - 1];
  
  // WARM-UP
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Tempo pull-ups x10\nTempo dips x10\nArm circles\nShoulder warm-up\nMuscle-up practice",
    rest: "No rest needed",
    type: "warmup"
  });

  // Get endurance sets based on level
  const sets = getEnduranceSets(level, week, muMax, pullMax, dipsMax, pushUpsMax, squatsMax, mult, levelMult);
  exercises.push(...sets);

  return {
    day: 4,
    focus: "Endurance Sets",
    exercises,
    coachingNote: week === 4 
      ? "Competition mode: Push through extreme tiredness. Keep good form."
      : "Competition-style sets. Focus on doing each set well. Rest fully between exercises."
  };
};

// Get endurance sets based on level
const getEnduranceSets = (level, week, muMax, pullMax, dipsMax, pushUpsMax, squatsMax, mult, levelMult) => {
  const sets = [];
  const getReps = (exerciseMax, useHigh = false) => {
    const multiplier = useHigh ? mult.max : (mult.min + mult.max) / 2;
    const result = Math.max(1, Math.round(exerciseMax * multiplier * levelMult));
    return Math.min(result, Math.round(exerciseMax * 1.5));
  };

  if (level === 'beginner') {
    // Beginner: 2-3 sets
    sets.push({
      name: "Set 1: Unbroken Combo",
      sets: `${getReps(pullMax, false)} pull-ups\n${getReps(dipsMax, false)} dips\n${getReps(pushUpsMax, false)} push-ups`,
      rest: "2 min rest",
      note: "Complete all exercises without stopping. Rest fully after."
    });

    sets.push({
      name: "Set 2: Degressive Ladder",
      sets: `${getReps(squatsMax, false)} squats\n${Math.round(getReps(pullMax, false) * 0.8)} pull-ups\n${Math.round(getReps(dipsMax, false) * 0.8)} dips`,
      rest: "90s rest",
      note: "Each set slightly easier than previous."
    });

    if (week >= 3) {
      sets.push({
        name: "Set 3: Mixed Endurance",
        sets: `${Math.round(getReps(pushUpsMax, false) * 0.9)} push-ups\n${getReps(squatsMax, false)} squats\n${Math.round(getReps(pullMax, false) * 0.7)} pull-ups`,
        rest: "2 min rest",
        note: "Moderate volume endurance set."
      });
    }

  } else if (level === 'intermediate') {
    // Intermediate: 3-4 sets (includes Half Barbarian + FIBO Round of 16 style)
    sets.push({
      name: "Set 1: Half Barbarian",
      sets: `${getReps(dipsMax, false)} weighted dips (5 kg)\n${getReps(pullMax, false)} weighted pull-ups (5 kg)\n${getReps(pushUpsMax, false)} push-ups\n${muMax > 0 ? getReps(muMax, false) : 3} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}\n${getReps(squatsMax, false)} squats`,
      rest: "90s rest",
      note: "Half weight version. Keep good form under load."
    });

    sets.push({
      name: "Set 2: FIBO Round of 16 Style",
      sets: `${getReps(dipsMax, true)} dips\n${getReps(pullMax, true)} pull-ups\n${getReps(pushUpsMax, true)} push-ups\n${muMax > 0 ? getReps(muMax, false) : 3} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}\n${getReps(squatsMax, false)} squats`,
      rest: "60s rest",
      note: "Competition-style sequence. Move smoothly between exercises."
    });

    sets.push({
      name: "Set 3: Unbroken Sequence",
      sets: `${getReps(pullMax, false)} pull-ups + ${muMax > 0 ? getReps(muMax, false) : 2} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'} (UNBROKEN)\n${getReps(dipsMax, false)} dips\n${getReps(pushUpsMax, false)} push-ups`,
      rest: "2 min rest",
      note: "Pull + MU must be done without stopping. Rest penalty if you break."
    });

    if (week >= 3) {
      sets.push({
        name: "Set 4: Weighted to Bodyweight",
        sets: `${Math.round(getReps(dipsMax, false) * 0.8)} weighted dips (5 kg)\n${Math.round(getReps(dipsMax, false) * 0.9)} dips (bodyweight)\n${Math.round(getReps(pullMax, false) * 0.8)} weighted pull-ups (5 kg)\n${Math.round(getReps(pullMax, false) * 0.9)} pull-ups (bodyweight)`,
        rest: "90s rest",
        note: "Start with weight, finish with bodyweight. Gets easier as you go."
      });
    }

  } else {
    // Advanced: 4 sets (includes 80% Barbarian + FIBO Quarterfinal)
    sets.push({
      name: "Set 1: 80% Barbarian Requirement",
      sets: `${getReps(dipsMax, false)} weighted dips (10 kg)\n${getReps(pullMax, false)} weighted pull-ups (10 kg)\n${getReps(pushUpsMax, true)} push-ups\n${muMax > 0 ? getReps(muMax, false) : 4} ${muMax > 0 ? 'weighted muscle-ups (10 kg)' : 'jump muscle-ups'}\n${getReps(squatsMax, false)} weighted squats (10 kg)`,
      rest: "60s rest",
      note: "High weight version. Maintain form under load."
    });

    sets.push({
      name: "Set 2: FIBO Quarterfinal Routine",
      sets: `${getReps(squatsMax, false)} squats (10 kg vest)\n1 pull-up + ${muMax > 0 ? '1' : '1'} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'} × ${week === 4 ? 10 : 8} rounds (UNBROKEN)\n${getReps(pushUpsMax, true)} push-ups\n1 pull-up + ${muMax > 0 ? '1' : '1'} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'} × ${week === 4 ? 8 : 6} rounds`,
      rest: "2 min rest (30s penalty if rest during unbroken sequence)",
      note: "Competition rule: If you rest during unbroken sequence, add 30 seconds."
    });

    sets.push({
      name: "Set 3: Progressive Complex",
      sets: `${getReps(dipsMax, false)} weighted dips (10 kg)\n${Math.round(getReps(dipsMax, false) * 0.85)} weighted dips (5 kg)\n${Math.round(getReps(dipsMax, false) * 0.9)} dips (bodyweight)\n${getReps(pullMax, false)} weighted pull-ups (10 kg)\n${Math.round(getReps(pullMax, false) * 0.85)} weighted pull-ups (5 kg)\n${Math.round(getReps(pullMax, false) * 0.9)} pull-ups (bodyweight)`,
      rest: "45s rest",
      note: "Weight decreases each round. Push through fatigue."
    });

    sets.push({
      name: "Set 4: FINAL CHALLENGE",
      sets: `${getReps(dipsMax, true)} bar dips\n${getReps(pullMax, true)} pull-ups\n${getReps(pushUpsMax, true)} push-ups\n${getReps(squatsMax, true)} squats\n${week === 4 ? 35 : 28} burpees\n${muMax > 0 ? getReps(muMax, true) : 5} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}`,
      rest: "Complete unbroken - Competition finish!",
      note: "Competition mode: Do it ALL without stopping. Give everything."
    });
  }

  return sets;
};

module.exports = {
  generateProgram
};
