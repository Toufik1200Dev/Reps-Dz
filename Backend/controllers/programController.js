// Calisthenics Endurance Program Generator
// Competition-style training based on FIBO Cup, endurance battles, and elite athlete protocols
// Designed by: Senior Calisthenics Coach + MERN Engineer

/**
 * MAIN CONTROLLER
 * Generates realistic, competition-style 4-week calisthenics endurance programs
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

    // Realistic safety limits (competition-level athletes can exceed normal limits)
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
          message: `${exercise} max reps (${maxReps[exercise]}) exceeds realistic competition limit of ${limit}`
        });
      }
    }

    // Generate 4-week competition-style program
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
 * Week 1: Volume base (60-65%) - Build endurance foundation
 * Week 2: Density increase (shorter rest / EMOM focus)
 * Week 3: Unbroken & complex dominance (80-85%)
 * Week 4: Competition simulation (90-95% + high fatigue scenarios)
 */
const generate4WeekProgram = (level, maxReps) => {
  const weeks = [];
  const weekSettings = [
    { volume: 0.62, intensity: 0.60, rest: 'moderate', style: 'volume' },
    { volume: 0.70, intensity: 0.72, rest: 'reduced', style: 'density' },
    { volume: 0.82, intensity: 0.85, rest: 'minimal', style: 'unbroken' },
    { volume: 0.95, intensity: 0.93, rest: 'competition', style: 'battle' }
  ];

  for (let week = 1; week <= 4; week++) {
    const settings = weekSettings[week - 1];
    const days = generateWeekDays(week, level, maxReps, settings);
    weeks.push({
      week,
      volume: settings.volume,
      intensity: settings.intensity,
      days
    });
  }

  return weeks;
};

/**
 * WEEK STRUCTURE (FIXED)
 * Day 1: Pull + Muscle-Up Endurance
 * Day 2: Push Endurance
 * Day 3: Legs + Cardio + Core
 * Day 4: Bar Complex / Competition Sets
 */
const generateWeekDays = (week, level, maxReps, settings) => {
  const days = [];
  days.push(generateDay1_PullMuscleUp(week, level, maxReps, settings));
  days.push(generateDay2_Push(week, level, maxReps, settings));
  days.push(generateDay3_LegsCardioCore(week, level, maxReps, settings));
  days.push(generateDay4_BarComplex(week, level, maxReps, settings));
  return days;
};

// ============================================================================
// DAY 1: PULL + MUSCLE-UP ENDURANCE
// ============================================================================
/**
 * Competition-style pull and muscle-up endurance
 * Focus: Unbroken ladders, pyramids, isometric holds, muscle-up clusters
 */
const generateDay1_PullMuscleUp = (week, level, maxReps, settings) => {
  const exercises = [];
  const muMax = maxReps.muscleUp;
  const pullMax = maxReps.pullUps;
  
  // Level adjustments
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  // Pulling exercises are harder - use lower multipliers
  const pullVolumeMult = settings.volume * levelMult * (level === 'advanced' ? 0.75 : 0.65); // Lower reps for pull-ups
  const muVolumeMult = settings.volume * levelMult * (level === 'advanced' ? 0.70 : 0.60); // Lower reps for muscle-ups
  const volumeMult = settings.volume * levelMult;

  // WARM-UP GUIDANCE
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Tempo pull-ups x10-15\nArm circles, shoulder mobility\nHang holds: 3x15s\nMuscle-up practice (if you can do them)",
    rest: "No rest needed",
    type: "warmup"
  });

  // MUSCLE-UP WORK (if applicable) - Lower reps (harder exercise)
  if (muMax > 0) {
    if (muMax <= 3) {
      // Beginner MU: Clusters and singles
      exercises.push({
        name: "Muscle-Up Singles",
        sets: `3-5 reps × 4 rounds`,
        rest: "2-3 min between rounds",
        note: "Focus on good form. Take full rest between rounds."
      });
    } else if (muMax <= 8) {
      // Intermediate MU: Low-rep clusters
      const reps = Math.max(2, Math.round(muMax * muVolumeMult));
      exercises.push({
        name: "Muscle-Up Ladder",
        sets: `1 muscle-up + 2 pull-ups\n2 muscle-ups + 3 pull-ups\n${Math.min(reps, 3)} muscle-ups + 4 pull-ups\n× 3 rounds`,
        rest: "2-3 min between rounds",
        note: "Do each ladder without stopping. Rest between rounds."
      });
    } else {
      // Advanced MU: Complex integration
      const muReps = Math.max(2, Math.round(muMax * muVolumeMult));
      const pullReps1 = Math.round(pullMax * pullVolumeMult);
      const pullReps2 = Math.round(pullMax * pullVolumeMult * 0.6);
      exercises.push({
        name: "Muscle-Up Complex",
        sets: `${muReps} muscle-ups → ${pullReps1 + pullReps2} pull-ups → ${Math.round(maxReps.dips * volumeMult * 0.6)} dips\n× 4 rounds`,
        rest: "2-3 min between rounds",
        note: "Good form. Do each round without stopping."
      });
    }
  } else {
    // MU alternatives for non-MU athletes
    exercises.push({
      name: "Jump Muscle-Ups or Band Assisted",
      sets: "Jump muscle-ups: 5-8 reps × 4 sets\nOR\nBand muscle-ups: 3-5 reps × 4 sets",
      rest: "90s-2 min",
      note: "Practice the movement. Focus on pulling hard."
    });
    exercises.push({
      name: "Pull + Dip Combo",
      sets: `${Math.round(pullMax * pullVolumeMult)} pull-ups → ${Math.round(maxReps.dips * volumeMult * 0.6)} dips\n× 4 rounds`,
      rest: "90s between rounds",
      note: "Simulates muscle-up movement pattern"
    });
  }

  // PULL-UP PYRAMID - Lower reps
  const pyramidTop = Math.max(1, Math.round(pullMax * pullVolumeMult));
  exercises.push({
    name: "Pull-Up Pyramid",
    sets: `${pyramidTop} → 1 (go down by 1 each set)\nRest: 30s between sets`,
    rest: "30s between sets",
    note: "No swinging. Full range of motion. Try to finish the whole pyramid."
  });

  // UNBROKEN LADDERS (Week 2+) - Lower reps for pulling
  if (week >= 2) {
    const ladderRounds = week === 2 ? 6 : week === 3 ? 8 : 10;
    exercises.push({
      name: "Ladder (No Stopping)",
      sets: `1 pull-up + ${muMax > 0 ? '1 muscle-up' : '1 pull-up'} × ${ladderRounds} rounds`,
      rest: week === 4 ? "No rest - keep going!" : "15s between rounds",
      note: week === 4 ? "Competition mode: Do all rounds without stopping" : "Only rest if your form breaks"
    });
  }

  // ISOMETRIC COMPLEX
  exercises.push({
    name: "Hold + Pull Combo",
    sets: "Hold at top 10s → Hold in middle 10s → Hang 10s → Max pull-ups\n× 3 rounds",
    rest: "2-3 min between rounds",
    note: "Build grip strength and control"
  });

  // VOLUME SET (Week 3-4) - Lower reps for pull-ups
  if (week >= 3) {
    const volumeReps = Math.max(1, Math.round(pullMax * pullVolumeMult));
    exercises.push({
      name: "Pull-Up Volume",
      sets: `${volumeReps} reps × 3 sets`,
      rest: "90s between sets",
      note: "Stay consistent. Keep good form."
    });
  }

  return {
    day: 1,
    focus: "Pull + Muscle-Up Endurance",
    exercises,
    totalVolume: `~${Math.round(pullMax * volumeMult * 4 + (muMax * volumeMult * 2))} total reps`,
    coachingNote: week === 4 ? "Competition mode: Push through tiredness, keep good form" : "Focus on good technique. Rest fully between exercises."
  };
};

// ============================================================================
// DAY 2: PUSH ENDURANCE
// ============================================================================
/**
 * Competition-style push endurance
 * Focus: EMOM, degressive sets, pyramids, strict dips
 */
const generateDay2_Push = (week, level, maxReps, settings) => {
  const exercises = [];
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  // Push exercises are easier - use higher multipliers
  const dipsVolumeMult = settings.volume * levelMult * 1.15; // Higher reps for dips
  const dipsIntensityMult = settings.intensity * levelMult * 1.1;
  const pushUpsVolumeMult = settings.volume * levelMult * 1.2; // Higher reps for push-ups
  const pushUpsIntensityMult = settings.intensity * levelMult * 1.15;
  const volumeMult = settings.volume * levelMult;
  const intensityMult = settings.intensity * levelMult;

  // WARM-UP
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Tempo push-ups x15-20\nShoulder circles and stretches\nArm swings\nTempo dips x10-15",
    rest: "No rest needed",
    type: "warmup"
  });

  // DIPS WORK - Higher reps
  if (dipsMax <= 20) {
    // Low dip capacity: Volume focus
    const reps = Math.max(1, Math.round(dipsMax * dipsVolumeMult));
    exercises.push({
      name: "Dips",
      sets: `${reps} reps × 5 sets`,
      rest: "90s-2 min between sets",
      note: "Go all the way down. Control going up and down."
    });
  } else if (dipsMax <= 40) {
    // Moderate: EMOM protocol
    const emomReps = Math.max(1, Math.round(dipsMax * dipsIntensityMult * 0.35));
    const duration = week <= 2 ? 10 : week === 3 ? 12 : 15;
    exercises.push({
      name: "Dips Every Minute",
      sets: `${duration} minutes: ${emomReps} reps at start of each minute`,
      rest: "Rest for the rest of the minute",
      note: "Keep steady pace. Slow down if your form breaks."
    });
    exercises.push({
      name: "Dips Degressive",
      sets: `${Math.round(dipsMax * dipsVolumeMult)} / ${Math.round(dipsMax * dipsVolumeMult * 0.7)} / ${Math.round(dipsMax * dipsVolumeMult * 0.5)}`,
      rest: "90s between sets",
      note: "Push through fatigue"
    });
  } else {
    // High capacity: Advanced protocols
    const emomReps = Math.max(1, Math.round(dipsMax * dipsIntensityMult * 0.3));
    const duration = week <= 2 ? 12 : week === 3 ? 15 : 18;
    exercises.push({
      name: "Dips Every Minute (Hard)",
      sets: `${duration} minutes: ${emomReps} reps at start of each minute`,
      rest: "Rest for the rest of the minute",
      note: "Fast pace. Stay consistent."
    });
    exercises.push({
      name: "Dips Pyramid",
      sets: `1 → ${Math.round(dipsMax * dipsVolumeMult * 0.65)} → 1`,
      rest: "30s between sets",
      note: "Competition-style pyramid"
    });
  }

  // PUSH-UPS - Higher reps
  if (pushUpsMax <= 40) {
    // Low capacity: Volume sets
    const reps = Math.max(1, Math.round(pushUpsMax * pushUpsVolumeMult));
    exercises.push({
      name: "Push-Ups",
      sets: `${reps} reps × 4 sets`,
      rest: "60s between sets",
      note: "Touch chest to ground. Lock arms at top."
    });
  } else if (pushUpsMax <= 70) {
    // Moderate: Degressive + EMOM
    exercises.push({
      name: "Push-Ups Degressive",
      sets: `${Math.round(pushUpsMax * pushUpsVolumeMult)} / ${Math.round(pushUpsMax * pushUpsVolumeMult * 0.75)} / ${Math.round(pushUpsMax * pushUpsVolumeMult * 0.5)} / ${Math.round(pushUpsMax * pushUpsVolumeMult * 0.35)}`,
      rest: "60s between sets",
      note: "Maintain pace. Fight fatigue."
    });
    if (week >= 2) {
      exercises.push({
        name: "Push-Ups Every Minute",
        sets: `10 minutes: ${Math.round(pushUpsMax * pushUpsIntensityMult * 0.35)} reps at start of each minute`,
        rest: "Rest for the rest of the minute",
        note: "Build endurance"
      });
    }
  } else {
    // High capacity: Advanced protocols
    exercises.push({
      name: "Push-Ups Pyramid",
      sets: `1 → ${Math.round(pushUpsMax * pushUpsVolumeMult * 0.7)} → 1`,
      rest: "30s between sets",
      note: "Large pyramid. Mental toughness."
    });
    exercises.push({
      name: "Push-Ups Every Minute (Long)",
      sets: `${week <= 2 ? 12 : week === 3 ? 15 : 18} minutes: ${Math.round(pushUpsMax * pushUpsIntensityMult * 0.32)} reps at start of each minute`,
      rest: "Rest for the rest of the minute",
      note: "Long session. Keep steady pace."
    });
  }

  // HANDSTAND PUSH-UPS (Advanced only)
  if (level === 'advanced') {
    exercises.push({
      name: "Handstand Push-Ups",
      sets: week <= 2 ? "3-5 reps × 4 sets" : week === 3 ? "4-6 reps × 4 sets" : "5-8 reps × 4 sets",
      rest: "2-3 min between sets",
      note: "Upside down push-ups. Focus on form."
    });
  }

  // FINISHER (Week 3-4)
  if (week >= 3) {
    exercises.push({
      name: "Push Finisher",
      sets: `${Math.round(dipsMax * volumeMult * 0.6)} dips → ${Math.round(pushUpsMax * volumeMult * 0.5)} push-ups\n× 2 rounds`,
      rest: "90s between rounds",
      note: "Hard finish. Push through tiredness."
    });
  }

  return {
    day: 2,
    focus: "Push Endurance",
    exercises,
    totalVolume: `~${Math.round((dipsMax * volumeMult * 3) + (pushUpsMax * volumeMult * 2.5))} total reps`,
    coachingNote: "Keep good form. Push-ups: chest touches ground. Dips: go all the way down. Good form is more important than speed."
  };
};

// ============================================================================
// DAY 3: LEGS + CARDIO + CORE
// ============================================================================
/**
 * Legs, cardio, and core endurance
 * Focus: EMOM squats, running, burpees, core stability
 */
const generateDay3_LegsCardioCore = (week, level, maxReps, settings) => {
  const exercises = [];
  const squatsMax = maxReps.squats;
  const legRaisesMax = maxReps.legRaises;
  
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  // Squats are easier - use higher multipliers
  const squatsVolumeMult = settings.volume * levelMult * 1.25; // Higher reps for squats
  const squatsIntensityMult = settings.intensity * levelMult * 1.2;
  const volumeMult = settings.volume * levelMult;
  const intensityMult = settings.intensity * levelMult;

  // WARM-UP
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Easy jogging 3-5 min\nLeg swings forward and back\nTempo squats x15-20\nHip circles",
    rest: "No rest needed",
    type: "warmup"
  });

  // SQUATS - Higher reps (easier endurance)
  if (squatsMax <= 60) {
    // Low capacity: Volume sets
    const reps = Math.max(1, Math.round(squatsMax * squatsVolumeMult));
    exercises.push({
      name: "Squats",
      sets: `${reps} reps × 4 sets`,
      rest: "60s between sets",
      note: "Go all the way down. Control speed."
    });
  } else if (squatsMax <= 100) {
    // Moderate: EMOM protocol
    const emomReps = Math.max(1, Math.round(squatsMax * squatsIntensityMult * 0.3));
    const duration = week <= 2 ? 15 : week === 3 ? 18 : 20;
    exercises.push({
      name: "Squats Every Minute",
      sets: `${duration} minutes: ${emomReps} reps at start of each minute`,
      rest: "Rest for the rest of the minute",
      note: "Keep steady pace. Go all the way down each rep."
    });
  } else {
    // High capacity: Extended EMOM + Pyramid
    const emomReps = Math.max(1, Math.round(squatsMax * squatsIntensityMult * 0.28));
    exercises.push({
      name: "Squats Every Minute (Long)",
      sets: `${week <= 2 ? 18 : week === 3 ? 20 : 25} minutes: ${emomReps} reps at start of each minute`,
      rest: "Rest for the rest of the minute",
      note: "Long session. Stay consistent."
    });
    exercises.push({
      name: "Squats Pyramid",
      sets: `1 → ${Math.round(squatsMax * squatsVolumeMult * 0.55)} → 1`,
      rest: "30s between sets",
      note: "Large pyramid. Mental toughness."
    });
  }

  // CARDIO: BURPEES - Higher reps (cardio is easier)
  const burpeeCount = week <= 2 ? 15 : week === 3 ? 18 : 22;
    exercises.push({
      name: "Burpees",
      sets: `${burpeeCount} reps × ${week <= 2 ? 4 : week === 3 ? 5 : 6} sets`,
      rest: "60-90s between sets",
      note: "Full burpee: do a push-up then jump. Keep steady pace."
    });

  // CARDIO: RUNNING / JUMP ROPE
  exercises.push({
    name: week % 2 === 0 ? "Running" : "Jump Rope",
    sets: week === 1 ? "Run 1km at steady pace\nOR\nJump rope for 5 minutes without stopping" :
          week === 2 ? "Run 1.5km\nOR\nJump rope for 7 minutes without stopping" :
          week === 3 ? "Run 2km\nOR\nJump rope for 10 minutes without stopping" :
          "Run 2.5km\nOR\nJump rope for 12 minutes without stopping",
    rest: "2-3 min",
    note: "Cardio work. Keep steady pace."
  });

  // MOUNTAIN CLIMBERS
  exercises.push({
    name: "Mountain Climbers",
    sets: `${week <= 2 ? 30 : week === 3 ? 40 : 45}s × ${week <= 2 ? 4 : 5} sets`,
    rest: "45s between sets",
    note: "Fast pace. Core engaged."
  });

  // CORE: LEG RAISES - Higher reps
  const legRaisesVolumeMult = settings.volume * levelMult * 1.1;
  const legRaiseReps = Math.max(5, Math.round(legRaisesMax * legRaisesVolumeMult));
  exercises.push({
    name: "Leg Raises",
    sets: `${legRaiseReps} reps × ${week <= 2 ? 4 : 5} sets`,
    rest: "60s between sets",
    note: "Control going down. Don't swing."
  });

  // CORE: PLANK HOLDS
  exercises.push({
    name: "Plank Hold",
    sets: `${week <= 2 ? 60 : week === 3 ? 75 : 90} seconds × ${week <= 2 ? 3 : 4} sets`,
    rest: "60s between sets",
    note: "Keep body straight. Don't sag or lift hips."
  });

  // CORE: L-SIT / HANGING LEG RAISES (Advanced)
  if (level === 'advanced' && week >= 3) {
    exercises.push({
      name: "L-Sit Hold or Hanging Leg Raises",
      sets: "L-Sit: Hold 20-30 seconds × 3 sets\nOR\nHanging leg raises: 12-15 reps × 3 sets",
      rest: "90s between sets",
      note: "Hard core work. Focus on good form."
    });
  }

  return {
    day: 3,
    focus: "Legs + Cardio + Core",
    exercises,
    totalVolume: `~${Math.round(squatsMax * volumeMult * 3)}+ squats, ${burpeeCount * (week <= 2 ? 4 : week === 3 ? 5 : 6)} burpees, core work`,
    coachingNote: "Cardio day. Focus on keeping steady pace. Do full range of motion on all exercises."
  };
};

// ============================================================================
// DAY 4: BAR COMPLEX / COMPETITION SETS
// ============================================================================
/**
 * Competition-style bar complexes and battle sequences
 * Each exercise: 60-150% of its own max (progressive by week)
 */
const generateDay4_BarComplex = (week, level, maxReps, settings) => {
  const exercises = [];
  
  // Use FULL max reps (not reduced)
  const muMax = maxReps.muscleUp;
  const pullMax = maxReps.pullUps;
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  const squatsMax = maxReps.squats;
  
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  
  // Week-based multipliers for Day 4 (each exercise 60-150% of its own max)
  const weekMultipliers = [
    { min: 0.60, max: 1.00 },  // Week 1: 60-100%
    { min: 0.75, max: 1.25 },  // Week 2: 75-125%
    { min: 0.95, max: 1.40 },  // Week 3: 95-140%
    { min: 1.15, max: 1.50 }   // Week 4: 115-150%
  ];
  
  const mult = weekMultipliers[week - 1];
  const getReps = (exerciseMax, useHigh = false) => {
    const multiplier = useHigh ? mult.max : (mult.min + mult.max) / 2;
    const result = Math.max(1, Math.round(exerciseMax * multiplier * levelMult));
    return Math.min(result, Math.round(exerciseMax * 1.5)); // Cap at 150%
  };

  // WARM-UP
  exercises.push({
    name: "💡 Warm-up (5-7 min)",
    sets: "Tempo pull-ups x10\nTempo dips x10\nArm circles\nShoulder warm-up\nMuscle-up practice",
    rest: "No rest needed",
    type: "warmup"
  });

  // COMPETITION-STYLE SETS (based on week progression)
  if (week === 1) {
    // Week 1: Weighted to bodyweight progression
    const weight = level === 'advanced' ? '10 kg' : level === 'intermediate' ? '5 kg' : null;
    
    exercises.push({
      name: "Set 1: Weighted to Bodyweight",
      sets: weight 
        ? `${getReps(dipsMax, false, 'push')} weighted dips (${weight})\n${getReps(pullMax, false, 'pull')} weighted pull-ups (${weight})`
        : `${getReps(dipsMax, false, 'push')} dips\n${getReps(pullMax, false, 'pull')} pull-ups`,
      rest: level === 'advanced' ? "30s rest" : "45s rest",
      note: "Start with weight, then go bodyweight. Keep good form."
    });

    exercises.push({
      name: "Set 2: Push Then Pull",
      sets: `${getReps(pushUpsMax, false, 'push')} push-ups\n${muMax > 0 ? getReps(muMax, false, 'muscleup') : Math.max(3, Math.round(5 * levelMult))} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}`,
      rest: "45s rest",
      note: "Move smoothly from one exercise to the next."
    });

    exercises.push({
      name: "Set 3: Legs Then Arms",
      sets: `${getReps(squatsMax, false, 'cardio')} squats\n${Math.round(getReps(squatsMax, false, 'cardio') * 0.6)} jump squats`,
      rest: "60s rest",
      note: "Jump squats are fast, then control your upper body work."
    });

    exercises.push({
      name: "Set 4: Full Body Mix",
      sets: `${getReps(dipsMax, false, 'push')} dips\n${getReps(pullMax, false, 'pull')} pull-ups\n${getReps(pushUpsMax, false, 'push')} push-ups\n${muMax > 0 ? getReps(muMax, false, 'muscleup') : Math.max(2, Math.round(3 * levelMult))} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}`,
      rest: "2 min rest",
      note: "Do all exercises one after another. Rest fully between rounds."
    });

    exercises.push({
      name: "Set 5: Final Push",
      sets: `${getReps(dipsMax, false, 'push')} bar dips\n${level === 'advanced' ? 25 : level === 'intermediate' ? 20 : 15} burpees`,
      rest: "Try to do without stopping",
      note: "Push through tiredness. Keep good form."
    });

  } else if (week === 2) {
    // Week 2: Unbroken sequences with penalties
    const weight = level === 'advanced' ? '10 kg' : '5 kg';
    const unbroken = level === 'advanced';
    
    exercises.push({
      name: "Set 1: Pull + Muscle-Up (No Stopping)",
      sets: `${getReps(pullMax, false, 'pull')} pull-ups + ${muMax > 0 ? getReps(muMax, false, 'muscleup') : Math.max(2, Math.round(3 * levelMult))} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'}${unbroken ? ' (DON\'T STOP)' : ''}`,
      rest: unbroken ? "30s penalty if you rest" : "45s rest",
      note: unbroken ? "Competition rule: If you rest, add 30 seconds. Do it all without stopping." : "Try to do it without stopping."
    });

    if (level !== 'beginner') {
      exercises.push({
        name: "Set 2: Mix Then No Stopping",
        sets: `${getReps(pushUpsMax, false, 'push')} push-ups\n${getReps(pullMax, true, 'pull')} pull-ups + ${muMax > 0 ? getReps(muMax, false, 'muscleup') : Math.max(2, Math.round(3 * levelMult))} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'}${level === 'advanced' ? ' (DON\'T STOP)' : ''}`,
        rest: level === 'advanced' ? "30s penalty if you rest" : "45s rest",
        note: "Move smoothly between exercises. Push through tiredness."
      });
    }

    exercises.push({
      name: "Set 3: Weighted → Bodyweight",
      sets: level !== 'beginner'
        ? `${getReps(squatsMax, false, 'cardio')} weighted squats (${weight})\n${getReps(dipsMax, false, 'push')} dips`
        : `${getReps(squatsMax, false, 'cardio')} squats\n${getReps(dipsMax, false, 'push')} dips`,
      rest: "60s rest",
      note: "Maintain form under load."
    });

    if (level !== 'beginner') {
      exercises.push({
        name: "Set 4: Hard Challenge (No Stopping)",
        sets: `${getReps(pullMax, true, 'pull')} pull-ups + ${muMax > 0 ? getReps(muMax, true, 'muscleup') : Math.max(3, Math.round(4 * levelMult))} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'}${level === 'advanced' ? ' (DON\'T STOP)' : ''}`,
        rest: "90s rest",
        note: "High reps. Push your limits."
      });
    }

    exercises.push({
      name: "Set 5: Final Mix",
      sets: `${getReps(dipsMax, false, 'push')} bar dips\n${level === 'advanced' ? 30 : level === 'intermediate' ? 25 : 18} burpees\n${Math.round(getReps(squatsMax, false, 'cardio') * 0.8)} jump squats`,
      rest: "Do it all without stopping",
      note: "Final push. Give everything you have."
    });

  } else if (week === 3) {
    // Week 3: Round-based complexes (Semifinals style)
    const rounds1 = level === 'advanced' ? 12 : level === 'intermediate' ? 10 : 7;
    const rounds2 = Math.round(rounds1 * 0.85);
    const rounds3 = Math.round(rounds1 * 0.7);
    const weight = level === 'advanced' ? '10 kg' : '5 kg';
    
    exercises.push({
      name: "Set 1: Round by Round",
      sets: `1 pull-up + ${muMax > 0 ? '1' : '1'} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'} × ${rounds1} rounds`,
      rest: level === 'advanced' ? "No rest between rounds" : "15s between rounds",
      note: "Do each round without stopping if you can. Keep steady pace."
    });

    exercises.push({
      name: "Set 2: Push Then Legs",
      sets: level !== 'beginner'
        ? `${getReps(pushUpsMax, false, 'push')} push-ups\n${getReps(squatsMax, false, 'cardio')} weighted squats (${weight})`
        : `${getReps(pushUpsMax, false, 'push')} push-ups\n${getReps(squatsMax, false, 'cardio')} squats`,
      rest: "45s rest",
      note: "Move smoothly from push-ups to squats."
    });

    exercises.push({
      name: "Set 3: More Rounds (Fewer This Time)",
      sets: `1 pull-up + ${muMax > 0 ? '1' : '1'} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'} × ${rounds2} rounds`,
      rest: level === 'advanced' ? "No rest between rounds" : "15s between rounds",
      note: "You're getting tired. Stay strong and consistent."
    });

    exercises.push({
      name: "Set 4: Dips Then Jump Squats",
      sets: `${getReps(dipsMax, false, 'push')} dips\n${Math.round(getReps(squatsMax, false, 'cardio') * 0.8)} jump squats`,
      rest: "45s rest",
      note: "Fast explosive movements."
    });

    exercises.push({
      name: "Set 5: Last Rounds",
      sets: `1 pull-up + ${muMax > 0 ? '1' : '1'} ${muMax > 0 ? 'muscle-up' : 'jump muscle-up'} × ${rounds3} rounds`,
      rest: "60s rest",
      note: "Almost done. Push through."
    });

    exercises.push({
      name: "Set 6: Final Mix",
      sets: `${getReps(pullMax, true, 'pull')} pull-ups\n${getReps(pushUpsMax, true, 'push')} push-ups\n${level === 'advanced' ? 35 : level === 'intermediate' ? 30 : 22} burpees`,
      rest: "Do it all without stopping",
      note: "High reps to finish. Stay strong mentally."
    });

  } else {
    // Week 4: Finals style - Progressive/degressive complexes (CHALLENGE WEEK!)
    const weight = level === 'advanced' ? '10 kg' : '5 kg';
    
    exercises.push({
      name: "Set 1: Muscle-Ups Getting Easier",
      sets: level === 'advanced' && level !== 'beginner'
        ? `${getReps(squatsMax, false, 'cardio')} weighted squats (10 kg)\n${getReps(muMax, false, 'muscleup')} ${muMax > 0 ? 'weighted muscle-ups (10 kg)' : 'jump muscle-ups'}\n${getReps(pullMax, false, 'pull')} pull-ups\n${getReps(muMax, true, 'muscleup')} ${muMax > 0 ? 'weighted muscle-ups (5 kg)' : 'jump muscle-ups'}\n${getReps(dipsMax, false, 'push')} dips\n${getReps(muMax, true, 'muscleup')} ${muMax > 0 ? 'muscle-ups (no weight)' : 'jump muscle-ups'}`
        : level === 'intermediate'
        ? `${getReps(squatsMax, false, 'cardio')} weighted squats (5 kg)\n${getReps(muMax, true, 'muscleup')} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}\n${getReps(pullMax, false, 'pull')} pull-ups`
        : `${getReps(squatsMax, false, 'cardio')} squats\n${getReps(muMax, false, 'muscleup')} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}\n${getReps(pullMax, false, 'pull')} pull-ups`,
      rest: "45s rest",
      note: "Start with weight, then go to bodyweight. Add other exercises in between."
    });

    exercises.push({
      name: "Set 2: Dips Getting Easier",
      sets: level !== 'beginner'
        ? level === 'advanced'
          ? `${getReps(dipsMax, false, 'push')} weighted dips (10 kg)\n${getReps(pullMax, false, 'pull')} pull-ups\n${getReps(dipsMax, true, 'push')} weighted dips (5 kg)\n${getReps(pushUpsMax, false, 'push')} push-ups\n${getReps(dipsMax, true, 'push')} dips (no weight)`
          : `${getReps(dipsMax, false, 'push')} weighted dips (5 kg)\n${getReps(pullMax, false, 'pull')} pull-ups\n${getReps(dipsMax, true, 'push')} dips (no weight)`
        : `${getReps(dipsMax, false, 'push')} dips\n${getReps(pullMax, false, 'pull')} pull-ups`,
      rest: "45s rest",
      note: "Start heavy, finish with bodyweight. Add pull-ups or push-ups in between."
    });

    exercises.push({
      name: "Set 3: Pull-Ups Getting Easier",
      sets: level !== 'beginner'
        ? level === 'advanced'
          ? `${getReps(pullMax, false, 'pull')} weighted pull-ups (10 kg)\n${getReps(dipsMax, false, 'push')} dips\n${getReps(pullMax, true, 'pull')} weighted pull-ups (5 kg)\n${getReps(pushUpsMax, false, 'push')} push-ups\n${getReps(pullMax, true, 'pull')} pull-ups (no weight)`
          : `${getReps(pullMax, false, 'pull')} weighted pull-ups (5 kg)\n${getReps(dipsMax, false, 'push')} dips\n${getReps(pullMax, true, 'pull')} pull-ups (no weight)`
        : `${getReps(pullMax, false, 'pull')} pull-ups\n${getReps(dipsMax, false, 'push')} dips`,
      rest: "45s rest",
      note: "Start with weight, finish with bodyweight. Add dips or push-ups in between."
    });

    exercises.push({
      name: "Set 4: High Rep Push",
      sets: `${getReps(pushUpsMax, true, 'push')} push-ups\n${muMax > 0 ? getReps(muMax, true, 'muscleup') : Math.max(5, Math.round(7 * levelMult))} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}`,
      rest: "2 min rest",
      note: "High reps. Get ready for the final push."
    });

    exercises.push({
      name: "Set 5: FINAL CHALLENGE (Competition Mode)",
      sets: `${getReps(dipsMax, true, 'push')} bar dips\n${getReps(pullMax, true, 'pull')} pull-ups\n${getReps(pushUpsMax, true, 'push')} push-ups\n${getReps(squatsMax, true, 'cardio')} squats\n${level === 'advanced' ? 40 : level === 'intermediate' ? 32 : 25} burpees\n${muMax > 0 ? getReps(muMax, true, 'muscleup') : Math.max(4, Math.round(6 * levelMult))} ${muMax > 0 ? 'muscle-ups' : 'jump muscle-ups'}`,
      rest: "Do it ALL without stopping - Competition finish!",
      note: "🏆 FINALS MODE: Give everything. This is like competition day. Don't stop. Do it all without resting."
    });
  }

  return {
    day: 4,
    focus: "Endurance Sets",
    exercises,
    totalVolume: `~${Math.round((pullMax + dipsMax + pushUpsMax) * mult.max * levelMult + (muMax * mult.max * levelMult * 2) + (squatsMax * mult.max * levelMult))} total reps`,
    coachingNote: week === 4 
      ? "🏆 COMPETITION MODE: Push through extreme tiredness. Keep good form. This is what competition feels like."
      : "Competition-style sets. Focus on doing each set well. Rest fully between exercises."
  };
};

module.exports = {
  generateProgram
};
