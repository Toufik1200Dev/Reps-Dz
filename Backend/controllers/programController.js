// Calisthenics Endurance Program Generator
// Competition-style training based on real endurance methods
// Professional Calisthenics Coach + MERN Engineer

const ProgramSave = require('../models/ProgramSave');
const SixWeekRequest = require('../models/SixWeekRequest');
const PendingPayPalOrder = require('../models/PendingPayPalOrder');
const FreeProgramLimit = require('../models/FreeProgramLimit');
const { generate6WeekProgram, generate12WeekProgram, calculateNutrition } = require('../services/programGenerator6Week');
const { sendProgramEmail, send1WeekProgramEmail, sendCustomizedRequestEmail } = require('../services/emailService');
const { createOrder: createPayPalOrder, captureOrder: capturePayPalOrder } = require('../services/paypalService');
const { addCoachReviewsToProgram } = require('../services/coachReviewService');

/** Parse AI JSON response (strip markdown code block if present) */
function parseAIProgramResponse(text) {
  let raw = (text || '').trim();
  const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) raw = codeMatch[1].trim();
  const parsed = JSON.parse(raw);
  const program = parsed.program ?? parsed;
  const weekList = Array.isArray(program) ? program : [program];
  return weekList.map((w) => ({
    week: w.week ?? 1,
    days: (w.days ?? []).map((d) => ({
      day: d.day,
      focus: d.focus ?? '',
      exercises: (d.exercises ?? []).map((e) => ({
        name: e.name ?? '',
        sets: e.sets ?? '',
        rest: e.rest ?? '',
        note: e.note ?? '',
        type: e.type ?? null
      }))
    }))
  }));
}

/** Build the calisthenics program prompt for OpenRouter. Elite coach polish, sport-specific logic. */
function buildProgramPrompt(level, maxReps, options = {}) {
  const pull = maxReps.pullUps || 0;
  const dips = maxReps.dips || 0;
  const push = maxReps.pushUps || 0;
  const squats = maxReps.squats || 0;
  const legs = maxReps.legRaises || 0;
  const burpeesVal = maxReps.burpees || 0;
  const muscleUp = level === 'beginner' ? 0 : (maxReps.muscleUp || 0);

  const pct = level === 'beginner' ? 0.6 : 0.7;
  const rep = (n) => Math.max(1, Math.round(n * pct));
  const rPull = rep(pull);
  const rDips = rep(dips);
  const rPush = rep(push);
  const rSquats = rep(squats);
  const rLegs = rep(legs);
  const rBurpees = rep(burpeesVal);

  const sportRaw = (options.otherSport || '').toString().trim().toLowerCase();
  const sportSpec = getSportSpecificBlock(sportRaw);

  const needsRegression = (n) => n < 15 && n >= 1;
  const regressions = [];
  if (needsRegression(pull)) regressions.push(`Pull-ups (${pull}) → Australian, chin-ups, or hammer pull-ups`);
  if (needsRegression(dips)) regressions.push(`Dips (${dips}) → bench dips or band-assisted dips`);
  if (needsRegression(push)) regressions.push(`Push-ups (${push}) → knee, incline, or wall-assisted HSPU`);
  if (needsRegression(squats)) regressions.push(`Squats (${squats}) → assisted or box squats`);
  if (needsRegression(legs)) regressions.push(`Leg raises (${legs}) → knee raises or lying leg raises`);
  if (needsRegression(burpeesVal)) regressions.push(`Burpees (${burpeesVal}) → step-back or tempo burpees`);
  const regressionBlock = regressions.length > 0
    ? `\nREGRESSIONS (max <15, prioritize quality reps):\n${regressions.map(r => `- ${r}`).join('\n')}`
    : '';

  const materials = 'Pull-up bar, parallel bars, rings, resistance bands, dumbbells, plates (0–20 kg), floor.';

  return `You are an elite calisthenics coach refining and finalizing an algorithm-generated program. Your role: POLISH, EXPLAIN, ADD SPORT-SPECIFIC LOGIC. Do NOT invent exercises or volumes outside the algorithm. Tone: professional, calm, authoritative. Concise, token-efficient.

ATHLETE: Level ${level}. Max: Pull ${pull}, Dips ${dips}, Push ${push}, Squats ${squats}, Leg raises ${legs}, Burpees ${burpeesVal}${muscleUp ? `, MU ${muscleUp}` : ''}. Prescription ~${pct * 100}%: pull ~${rPull}, dips ~${rDips}, push ~${rPush}, squats ~${rSquats}, legs ~${rLegs}, burpees ~${rBurpees}.
${sportSpec}
${regressionBlock}

ALGORITHM RULES (do not alter):
- Level detection per exercise (Pull, Push, Legs, Core)
- Regressions automatic for max <15. Quality reps over quantity.
- Structure: Day 1 Pull, Day 2 Push, Day 3 Legs+Cardio, Day 4 Endurance, Day 5 Weighted (0–20 kg, low reps, slow tempo)
- Warm-ups: 8–12 min, progression general→joint prep→movement-specific, low fatigue, joint-safe, sport-specific
- Materials for every exercise: ${materials}

COACH NOTES (1–2 lines, examples):
- "Hammer pull-ups strengthen grip for wrestling."
- "Incline push-ups allow safe shoulder progression for boxing."
- "Weighted dips kept light to respect level and avoid early fatigue."

OUTPUT: Exactly one valid JSON. No markdown. Output ONLY the JSON. Include weekly overview in week 1 first day note or last day closing note. Closing note: reassure program is safe, progressive, sport-specific; emphasize correct progression and joint health.

{"program":[{"week":1,"days":[
  {"day":1,"focus":"Pull Day","exercises":[{"name":"Warm-up (8–12 min)","sets":"[goal, exercises, sets/reps, materials]","rest":"","note":"Sport-specific. Low fatigue, joint-safe.","type":"warmup"},{"name":"...","sets":"...","rest":"...","note":"..."}]},
  {"day":2,"focus":"Push Day","exercises":[{"name":"Warm-up (8–12 min)","sets":"...","rest":"","note":"...","type":"warmup"},{"name":"...","sets":"...","rest":"...","note":"..."}]},
  {"day":3,"focus":"Legs + Core + Cardio","exercises":[{"name":"Warm-up (8–12 min)","sets":"...","rest":"","note":"...","type":"warmup"},{"name":"...","sets":"...","rest":"...","note":"..."}]},
  {"day":4,"focus":"Endurance Integration Day","exercises":[{"name":"Warm-up (8–12 min)","sets":"...","rest":"","note":"...","type":"warmup"},{"name":"...","sets":"...","rest":"...","note":"..."}]},
  {"day":5,"focus":"Weighted Calisthenics","exercises":[{"name":"Warm-up (8–12 min)","sets":"[account for load, movement rehearsal]","rest":"","note":"...","type":"warmup"},{"name":"...","sets":"...","rest":"...","note":"0–20 kg, low reps. Closing: safe, progressive, sport-specific, joint health."}]}
]}]}

Output ONLY the JSON.`;
}

/** Sport-specific emphasis for program design */
function getSportSpecificBlock(sportRaw) {
  if (!sportRaw) return 'SPORT: Calisthenics (default). Balanced push/pull/core, all regressions as needed.';
  if (sportRaw.includes('judo') || sportRaw.includes('wrestling')) {
    return 'SPORT: Judo/Wrestling. PULL DOMINANT. Pull-ups, chin-ups, hammer pull-ups, Australian pull-ups (<15 reps). Focus: grip, back strength, core stability. Warm-ups: shoulders, grip.';
  }
  if (sportRaw.includes('boxing') || sportRaw.includes('striking') || sportRaw.includes('muay thai') || sportRaw.includes('kickboxing')) {
    return 'SPORT: Boxing/Striking. PUSH DOMINANT. Dips, push-ups, incline push-ups, handstand push-ups (<15 reps). Focus: shoulders, arms, pushing strength. Warm-ups: shoulders, wrists.';
  }
  if (sportRaw.includes('swim')) {
    return 'SPORT: Swimming. PULL + ENDURANCE. Pull-ups, chin-ups, Australian pull-ups (<15 reps), high-rep sets. Focus: lat activation, upper back, endurance. Warm-ups: shoulders, thoracic mobility.';
  }
  if (sportRaw.includes('bodybuild') || sportRaw.includes('gym') || sportRaw.includes('weight')) {
    return 'SPORT: Bodybuilding. HYPERTROPHY FOCUS ON EVERYTHING. Full-body approach: push, pull, legs, core. Weighted calisthenics (0–20 kg), moderate reps (8–15), controlled tempo. MINIMIZE CARDIO: keep cardio sessions short, low volume, or replace with active recovery/walking. Focus: muscle growth, not endurance. Warm-ups general.';
  }
  return `SPORT: ${sportRaw}. Apply regressions for max <15. Warm-ups match sport emphasis.`;
}

/** Request timeout for OpenRouter (ms). Prevents hanging on slow/unresponsive API. */
const OPENROUTER_TIMEOUT_MS = 90000;

/** Call OpenRouter API – used for 1-week generation and 6-week enhancement. Retries on 429/503 with backoff; request timeout to avoid hanging. */
async function callOpenRouter(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
  const model = (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim();
  const rateLimitRetries = options._rateLimitRetries ?? 0;
  const maxRateLimitRetries = 3;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://reps-dz.web.app'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.max_tokens ?? 4096
      })
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    const isRateLimit = response.status === 429 || response.status === 503;
    if (isRateLimit && rateLimitRetries < maxRateLimitRetries) {
      let delayMs = [4000, 8000, 12000][rateLimitRetries];
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter != null) {
        const sec = parseInt(retryAfter, 10);
        if (!Number.isNaN(sec)) delayMs = Math.min(sec * 1000, 15000);
      }
      console.warn(`[Program] OpenRouter ${response.status} (rate limit), retrying in ${delayMs / 1000}s... (${rateLimitRetries + 1}/${maxRateLimitRetries})`);
      await new Promise((r) => setTimeout(r, delayMs));
      return callOpenRouter(messages, { ...options, _rateLimitRetries: rateLimitRetries + 1 });
    }
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    if ((options._retryCount ?? 0) < 2) {
      const retry = (options._retryCount || 0) + 1;
      console.warn('[Program] OpenRouter returned no content, retrying...', retry);
      await new Promise((r) => setTimeout(r, 2000));
      return callOpenRouter(messages, { ...options, _retryCount: retry });
    }
    throw new Error('OpenRouter returned no content');
  }
  return content;
}

/** Generate 1-week program using OpenRouter. Set OPENROUTER_API_KEY in .env. */
async function generateProgramWithOpenRouter(level, maxReps, options = {}) {
  const model = (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim();
  console.log('[Program] 1-week: Calling OpenRouter | model:', model, '| level:', level);
  const prompt = buildProgramPrompt(level, maxReps, options);
  const content = await callOpenRouter([{ role: 'user', content: prompt }]);
  return parseAIProgramResponse(content);
}

/** Enhance 6-week or 12-week program with AI coach note. Called when OPENROUTER_API_KEY is set. */
async function enhancePaidProgramWithAI(result, options = {}) {
  const level = result.level || 'intermediate';
  const weeksCount = options.weeksCount || 6;
  const weeksLabel = weeksCount === 12 ? '12-week' : '6-week';
  const goals = Array.isArray(options.goals) && options.goals.length > 0
    ? options.goals.join(', ')
    : 'general fitness';
  const prompt = `You are an elite calisthenics coach. In 2-3 concise sentences, write a personalized coach note for a ${level} athlete starting a ${weeksLabel} program. Goals: ${goals}. Emphasize movement quality, consistency, and recovery. No bullet points. Output ONLY the coach note text.`;
  const model = (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim();
  console.log('[Program]', weeksLabel, ': Calling OpenRouter for coach note | model:', model, '| level:', level);
  const coachNote = (await callOpenRouter([{ role: 'user', content: prompt }], { max_tokens: 200 })).trim();
  return { ...result, aiCoachNote: coachNote };
}

/**
 * MAIN CONTROLLER
 * Uses OpenRouter (GPT) when OPENROUTER_API_KEY is set, else algorithm.
 */
const generateProgram = async (req, res) => {
  try {
    const { level, maxReps, programId, heightCm, weightKg } = req.body;

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
    const requiredExercises = ['muscleUp', 'pullUps', 'dips', 'pushUps', 'squats', 'legRaises', 'burpees'];
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
      muscleUp: 50,
      pullUps: 100,
      dips: 150,
      pushUps: 200,
      squats: 400,
      legRaises: 80,
      burpees: 80
    };

    for (const [exercise, limit] of Object.entries(safetyLimits)) {
      if (maxReps[exercise] > limit) {
        return res.status(400).json({
          success: false,
          message: `${exercise} max reps (${maxReps[exercise]}) exceeds realistic limit of ${limit}`
        });
      }
    }

    // Enforce beginner constraints
    const payloadMaxReps = { ...maxReps };
    if (level === 'beginner') {
      payloadMaxReps.muscleUp = 0;
    }

    let program;
    const seed = programId || Date.now();
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('[Program] Using AI model:', model, '| level:', level);
        program = await generateProgramWithOpenRouter(level, payloadMaxReps);
        console.log('[Program] AI generation succeeded');
      } catch (openRouterErr) {
        console.error('[Program] AI failed, falling back to algorithm:', openRouterErr.message);
        program = generate4WeekProgram(level, payloadMaxReps, seed);
        console.log('[Program] Using algorithm (fallback)');
      }
    } else {
      console.log('[Program] Using algorithm (no OPENROUTER_API_KEY) | level:', level);
      program = generate4WeekProgram(level, payloadMaxReps, seed);
    }

    const nutrition = (heightCm != null && weightKg != null && heightCm >= 100 && weightKg >= 30)
      ? calculateNutrition(Number(heightCm), Number(weightKg))
      : { bmr: null, tdee: null, proteinG: null, note: 'Add height and weight for calorie estimates.', sampleMeals: null };

    res.status(200).json({
      success: true,
      data: {
        level,
        maxReps: payloadMaxReps,
        program,
        nutrition,
        heightCm: heightCm != null ? Number(heightCm) : undefined,
        weightKg: weightKg != null ? Number(weightKg) : undefined
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
 * Send free 1-week program to user's email.
 * Body: email (required), userName, level, maxReps, heightCm, weightKg
 */
const FREE_PROGRAMS_PER_MONTH = 3;

const sendFreeProgramEmail = async (req, res) => {
  try {
    const { email, userName, userAge, level, maxReps, heightCm, weightKg, calisthenicsMainSport, otherSport, goals } = req.body;

    const emailTrimmed = (email && String(email).trim().toLowerCase()) || '';
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return res.status(400).json({ success: false, message: 'Valid email is required to receive your program.' });
    }

    const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let limitDoc = await FreeProgramLimit.findOne({ email: emailTrimmed, yearMonth });
    if (!limitDoc) {
      limitDoc = await FreeProgramLimit.create({ email: emailTrimmed, yearMonth, count: 0 });
    }
    if (limitDoc.count >= FREE_PROGRAMS_PER_MONTH) {
      return res.status(429).json({
        success: false,
        message: `Free plan: ${FREE_PROGRAMS_PER_MONTH} free generations limit reached. Try the 6-week plan for more.`
      });
    }

    if (!level || !['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({ success: false, message: 'Invalid level. Must be: beginner, intermediate, or advanced' });
    }

    if (!maxReps || typeof maxReps !== 'object') {
      return res.status(400).json({ success: false, message: 'maxReps must be an object with exercise values' });
    }

    const requiredExercises = ['muscleUp', 'pullUps', 'dips', 'pushUps', 'squats', 'legRaises', 'burpees'];
    for (const exercise of requiredExercises) {
      if (typeof maxReps[exercise] !== 'number' || maxReps[exercise] < 0) {
        return res.status(400).json({ success: false, message: `${exercise} must be a non-negative number` });
      }
    }

    const payloadMaxReps = { ...maxReps };
    if (level === 'beginner') payloadMaxReps.muscleUp = 0;

    const seed = Date.now();
    const options = {
      calisthenicsMainSport: calisthenicsMainSport !== false,
      otherSport: !calisthenicsMainSport && otherSport ? otherSport : undefined,
      goals: Array.isArray(goals) && goals.length > 0 ? goals : undefined
    };
    let program;
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('[Program] send-free-email: Using AI model:', model, '| level:', level, '| email:', emailTrimmed);
        program = await generateProgramWithOpenRouter(level, payloadMaxReps, options);
        console.log('[Program] AI generation succeeded for free email');
      } catch (openRouterErr) {
        console.error('[Program] AI failed, falling back to algorithm:', openRouterErr.message);
        program = generate4WeekProgram(level, payloadMaxReps, seed);
        console.log('[Program] Using algorithm (fallback) for free email');
      }
    } else {
      console.log('[Program] send-free-email: Using algorithm (no OPENROUTER_API_KEY) | level:', level);
      program = generate4WeekProgram(level, payloadMaxReps, seed);
    }

    const oneWeek = Array.isArray(program) ? program.slice(0, 1) : [{ week: 1, days: [] }];
    const h = heightCm != null && heightCm >= 100 && heightCm <= 250 ? Number(heightCm) : undefined;
    const w = weightKg != null && weightKg >= 30 && weightKg <= 300 ? Number(weightKg) : undefined;
    const nutrition = (h && w) ? calculateNutrition(h, w, options.goals) : { bmr: null, tdee: null, proteinG: null, note: 'Add height and weight for calorie estimates.', sampleMeals: null };

    const programData = {
      level,
      maxReps: payloadMaxReps,
      program: oneWeek,
      nutrition
    };

    const nameToUse = (userName && String(userName).trim() !== '') ? String(userName).trim() : 'user';
    const ageNum = userAge != null && typeof userAge === 'number' && userAge >= 13 && userAge <= 120 ? userAge : undefined;
    await send1WeekProgramEmail(emailTrimmed, nameToUse, programData, { userAge: ageNum, goals: options.goals });

    limitDoc.count += 1;
    await limitDoc.save();

    res.status(200).json({
      success: true,
      data: { email: emailTrimmed }
    });
  } catch (error) {
    console.error('Error sending free program email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send program to your email. Please try again.'
    });
  }
};

/**
 * GET free program limit for an email this month.
 * Query: email
 */
const getFreeLimitStatus = async (req, res) => {
  try {
    const emailTrimmed = (req.query.email && String(req.query.email).trim().toLowerCase()) || '';
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return res.status(200).json({ used: 0, max: FREE_PROGRAMS_PER_MONTH, remaining: FREE_PROGRAMS_PER_MONTH });
    }
    const yearMonth = new Date().toISOString().slice(0, 7);
    const limitDoc = await FreeProgramLimit.findOne({ email: emailTrimmed, yearMonth });
    const used = limitDoc ? limitDoc.count : 0;
    const remaining = Math.max(0, FREE_PROGRAMS_PER_MONTH - used);
    res.status(200).json({ used, max: FREE_PROGRAMS_PER_MONTH, remaining });
  } catch (err) {
    console.error('getFreeLimitStatus:', err);
    res.status(500).json({ used: 0, max: FREE_PROGRAMS_PER_MONTH, remaining: FREE_PROGRAMS_PER_MONTH });
  }
};

/**
 * BATCH GENERATOR
 * Generates 50 unique programs for a given level
 */
const generateBatchPrograms = async (req, res) => {
  try {
    const { level, maxReps } = req.body;

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

    const programs = [];
    for (let i = 0; i < 50; i++) {
      const seed = Date.now() + i * 1000;
      const program = generate4WeekProgram(level, maxReps, seed);
      programs.push({
        programId: i + 1,
        level,
        program
      });
    }

    res.status(200).json({
      success: true,
      data: {
        level,
        count: programs.length,
        programs
      }
    });

  } catch (error) {
    console.error('Error generating batch programs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate batch programs',
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
const generate4WeekProgram = (level, maxReps, seed = Date.now()) => {
  const weeks = [];
  const weekSettings = [
    { volume: 0.62, intensity: 0.60, style: 'volume' },
    { volume: 0.72, intensity: 0.70, style: 'density' },
    { volume: 0.82, intensity: 0.80, style: 'unbroken' },
    { volume: 0.93, intensity: 0.90, style: 'competition' }
  ];

  // Track used methods per week to avoid repetition
  const usedMethods = { week1: [], week2: [], week3: [], week4: [] };

  for (let week = 1; week <= 4; week++) {
    const settings = weekSettings[week - 1];
    const days = generateWeekDays(week, level, maxReps, settings, seed, usedMethods);
    weeks.push({
      week,
      days
    });
  }

  return weeks;
};

/**
 * WEEK STRUCTURE (FIXED)
 * Day 1: Pull Day (Pull-ups, Chin-ups, Australian rows, Isometric holds)
 * Day 2: Push Day (Dips, Bar dips, Push-ups, Muscle-ups for Intermediate/Advanced)
 * Day 3: Legs + Core + Cardio
 * Day 4: Endurance Sets Day (2-4 sets based on level)
 */
const generateWeekDays = (week, level, maxReps, settings, seed, usedMethods) => {
  const days = [];
  days.push(generateDay1_Pull(week, level, maxReps, settings, seed, usedMethods[`week${week}`]));
  days.push(generateDay2_Push(week, level, maxReps, settings, seed, usedMethods[`week${week}`]));
  days.push(generateDay3_LegsCardioCore(week, level, maxReps, settings, seed));
  days.push(generateDay4_EnduranceSets(week, level, maxReps, settings, seed));
  return days;
};

// Helper: Australian pull-up reps for beginners (1.5x week 1-2, 2x week 3-4 of pull-up reps)
const getAustralianPullUpReps = (pullReps, week) => Math.max(1, Math.round(pullReps * (week <= 2 ? 1.5 : 2)));

// ============================================================================
// DAY 1: PULL DAY
// Pull-ups, Chin-ups, Australian rows, Isometric holds
// Muscle-ups: ❌ Beginner: NOT allowed (use Australian pull-ups at 1.5x–2x pull-up reps instead), ✔ Intermediate/Advanced: controlled/endurance volume
// ============================================================================
const generateDay1_Pull = (week, level, maxReps, settings, seed, usedMethods) => {
  const exercises = [];
  const muMax = level === 'beginner' ? 0 : maxReps.muscleUp; // NO muscle-ups for beginners
  const pullMax = maxReps.pullUps;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  
  // Beginner constraint: pull-ups ≤ 60% max
  const pullPercentage = level === 'beginner' ? 0.60 : 0.75;
  
  // WARM-UP
  exercises.push({
    name: "Warm-up (5-7 min)",
    sets: level === 'beginner' ? "Tempo pull-ups x10-15\nArm circles, shoulder mobility\nHang holds: 3x15s\nAustralian pull-up practice (horizontal rows)" : "Tempo pull-ups x10-15\nArm circles, shoulder mobility\nHang holds: 3x15s\nMuscle-up practice (if applicable)",
    rest: "No rest needed",
    type: "warmup"
  });

  // Select 2 methods (randomized, avoiding repetition)
  const methods = selectDay1Methods(week, level, muMax, pullMax, pullPercentage, settings, levelMult, seed, usedMethods);
  exercises.push(...methods);

  // Always add 1 finisher (Australian rows mandatory for beginners)
  const finisher = getDay1Finisher(week, level, muMax, pullMax, pullPercentage, settings, levelMult);
  exercises.push(finisher);
  
  // Renumber exercises (skip warm-up, finisher, and special labels)
  let exerciseNum = 1;
  exercises.forEach(ex => {
    if (ex.type !== 'warmup' && !ex.name.includes('Finisher') && !ex.name.includes('PART')) {
      // Extract the format/method name without "Method X:" prefix
      const nameWithoutPrefix = ex.name.replace(/^Method \d+:\s*/, '');
      ex.name = `Exercise ${exerciseNum}: ${nameWithoutPrefix}`;
      exerciseNum++;
    }
  });

  // Extract methods for output format
  const methodNames = methods.map(m => {
    const methodLower = m.name.toLowerCase();
    if (methodLower.includes('emom')) return 'emom';
    if (methodLower.includes('pyramid')) return 'pyramid';
    if (methodLower.includes('degressive')) return 'degressive';
    if (methodLower.includes('separated')) return 'volume_sets';
    if (methodLower.includes('superset')) return 'superset';
    if (methodLower.includes('timer')) return 'timed_challenge';
    return 'volume_sets';
  });

  return {
    day: 1,
    focus: "Pull Day",
    methods: methodNames,
    exercises,
    coachingNote: week === 4 ? "Competition mode: Push through tiredness, keep good form" : "Focus on good technique. Rest fully between exercises."
  };
};

// Select 2 methods for Day 1 with randomization and constraints
const selectDay1Methods = (week, level, muMax, pullMax, pullPercentage, settings, levelMult, seed, usedMethods) => {
  const methods = [];
  
  // Available methods pool
  const availableMethods = [];
  
  // Method 1: Degressive Pull + Muscle-Up (if applicable) OR Degressive Pull + Australian Pull-Ups (beginner)
  if (level !== 'beginner') {
    availableMethods.push('degressive_pull_mu');
  } else {
    availableMethods.push('degressive_pull_australian');
  }
  
  // Method 2: EMOM Block
  availableMethods.push('emom_block');
  
  // Method 3: Separated Volume (% of max)
  availableMethods.push('separated_volume');
  
  // Method 4: Pyramids
  availableMethods.push('pyramids');
  
  // Method 5: Superset (Pull-ups + Chin-ups + Australian rows)
  availableMethods.push('superset_pull');
  
  // Method 6: Timed Challenge
  if (week >= 3) {
    availableMethods.push('timed_challenge');
  }
  
  // Method 7: Isometric Ladder
  availableMethods.push('isometric_ladder');
  
  // Randomize selection (using seed for consistency)
  const rng = seededRandom(seed + week * 1000);
  const selectedMethods = [];
  const pool = [...availableMethods];
  
  // Filter out already used methods for this week
  const filteredPool = pool.filter(m => !usedMethods.includes(m));
  const finalPool = filteredPool.length >= 2 ? filteredPool : pool;
  
  // Select 2 unique methods
  while (selectedMethods.length < 2 && finalPool.length > 0) {
    const index = Math.floor(rng() * finalPool.length);
    const selected = finalPool.splice(index, 1)[0];
    selectedMethods.push(selected);
    usedMethods.push(selected);
  }
  
  // Generate selected methods
  const pullVolume = pullMax * settings.volume * levelMult * pullPercentage;
  const muVolume = muMax > 0 ? muMax * settings.volume * levelMult * (level === 'advanced' ? 0.70 : 0.60) : 0;
  
  selectedMethods.forEach(methodType => {
    switch(methodType) {
      case 'degressive_pull_mu':
        methods.push(method1_DegressivePullMU(muMax, pullMax, pullPercentage));
        break;
      case 'degressive_pull_australian':
        methods.push(method1_BeginnerDegressivePullAustralian(week, pullMax, pullPercentage));
        break;
      case 'emom_block':
        methods.push(method2_EMOMBlock(week, level, pullMax, muMax, pullPercentage, settings, levelMult));
        break;
      case 'separated_volume':
        methods.push(method3_SeparatedVolume(week, level, muMax, pullMax, pullPercentage));
        break;
      case 'pyramids':
        methods.push(method4_Pyramids(week, level, pullMax, muMax, pullPercentage));
        break;
      case 'superset_pull':
        methods.push(method5_SupersetPull(week, pullMax, muMax, level));
        break;
      case 'timed_challenge':
        methods.push(method6_TimerChallenge(week, level, pullMax, muMax, pullPercentage));
        break;
      case 'isometric_ladder':
        methods.push(method7_IsometricLadder(pullMax, level));
        break;
    }
  });
  
  return methods;
};

// METHOD 1: Degressive Pull + Muscle-Up
const method1_DegressivePullMU = (muMax, pullMax, pullPercentage) => {
  const startReps = Math.max(1, Math.round(pullMax * pullPercentage));
  const rounds = Math.min(8, Math.ceil(startReps / 2));
  
  let setsDesc = '';
  for (let i = 0; i < rounds; i++) {
    const reps = Math.max(0, startReps - (i * 2));
    if (reps > 0) {
      setsDesc += `${reps} pull-ups${muMax > 0 && i < 3 ? ' + 1 muscle-up' : ''}\n`;
    }
  }
  
  return {
    name: "Degressive Pull + Muscle-Up",
    format: "Degressive Sets",
    duration: `${Math.min(3, rounds)} rounds`,
    sets: setsDesc.trim(),
    rest: "2-3 min between rounds",
    note: "Start with pull-ups, decrease by 2 each round. Add 1 MU per round if applicable.",
    exercise: "pull-up, muscle-up"
  };
};

// METHOD 1 (Beginner): Degressive Pull + Australian Pull-Ups (reps 1.5x–2x pull-ups by week)
const method1_BeginnerDegressivePullAustralian = (week, pullMax, pullPercentage) => {
  const startReps = Math.max(1, Math.round(pullMax * pullPercentage));
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
    name: "Degressive Pull + Australian Pull-Ups",
    format: "Degressive Sets",
    duration: `${Math.min(3, rounds)} rounds`,
    sets: setsDesc.trim(),
    rest: "2-3 min between rounds",
    note: "Start with pull-ups, decrease by 2 each round. Australian pull-ups at 1.5x–2x pull-up reps (by week).",
    exercise: "pull-up, australian-pull-up"
  };
};

// METHOD 2: EMOM Block
const method2_EMOMBlock = (week, level, pullMax, muMax, pullPercentage, settings, levelMult) => {
  const durations = week === 1 ? [5, 6] : week === 2 ? [6, 8] : week === 3 ? [8, 10] : [10, 12];
  const percentages = level === 'beginner' ? [0.35, 0.30] : [0.40, 0.35];
  
  let setsDesc = '';
  durations.forEach((duration, idx) => {
    const pullReps = Math.max(1, Math.round(pullMax * percentages[idx] * pullPercentage));
    setsDesc += `EMOM ${duration} min: ${pullReps} pull-ups`;
    if (level === 'beginner') {
      const ausReps = getAustralianPullUpReps(pullReps, week);
      setsDesc += ` + ${ausReps} Australian pull-ups`;
    } else if (muMax > 0 && idx === 0) {
      const muReps = Math.max(1, Math.round(muMax * 0.30));
      setsDesc += ` + ${muReps} muscle-ups`;
    }
    setsDesc += '\n';
  });
  
  return {
    name: "EMOM Block",
    format: "EMOM",
    duration: `${durations[0] + durations[1]} min total`,
    sets: setsDesc.trim(),
    rest: "Rest for the remainder of each minute",
    note: "Complete reps at start of each minute, rest for remaining time.",
    exercise: level === 'beginner' ? "pull-up, australian-pull-up" : (muMax > 0 ? "pull-up, muscle-up" : "pull-up")
  };
};

// METHOD 3: Separated Volume (% of max)
const method3_SeparatedVolume = (week, level, muMax, pullMax, pullPercentage) => {
  let setsDesc = '';
  
  if (level === 'beginner') {
    const pull80 = Math.max(1, Math.round(pullMax * 0.80 * pullPercentage));
    const pull60 = Math.max(1, Math.round(pullMax * 0.60 * pullPercentage));
    const pull50 = Math.max(1, Math.round(pullMax * 0.50 * pullPercentage));
    const aus80 = getAustralianPullUpReps(pull80, week);
    const aus60 = getAustralianPullUpReps(pull60, week);
    const aus50 = getAustralianPullUpReps(pull50, week);
    setsDesc += `Pull-ups:\n4 sets × ${pull80} reps\n5 sets × ${pull60} reps\n6 sets × ${pull50} reps\n\n`;
    setsDesc += `Australian pull-ups:\n4 sets × ${aus80} reps\n5 sets × ${aus60} reps\n6 sets × ${aus50} reps`;
  } else {
    if (muMax > 0) {
      const mu80 = Math.max(1, Math.round(muMax * 0.80));
      const mu60 = Math.max(1, Math.round(muMax * 0.60));
      const mu50 = Math.max(1, Math.round(muMax * 0.50));
      setsDesc += `Muscle-ups:\n4 sets × ${mu80} reps\n5 sets × ${mu60} reps\n6 sets × ${mu50} reps\n\n`;
    }
    const pull80 = Math.max(1, Math.round(pullMax * 0.80 * pullPercentage));
    const pull60 = Math.max(1, Math.round(pullMax * 0.60 * pullPercentage));
    const pull50 = Math.max(1, Math.round(pullMax * 0.50 * pullPercentage));
    setsDesc += `Pull-ups:\n4 sets × ${pull80} reps\n5 sets × ${pull60} reps\n6 sets × ${pull50} reps`;
  }
  
  return {
    name: "Separated Volume",
    format: "Volume Sets",
    duration: "15 sets total",
    sets: setsDesc,
    rest: "90s-2 min between sets",
    note: "Complete all sets before moving to next.",
    exercise: level === 'beginner' ? "pull-up, australian-pull-up" : ("pull-up" + (muMax > 0 ? ", muscle-up" : ""))
  };
};

// METHOD 4: Pyramids
const method4_Pyramids = (week, level, pullMax, muMax, pullPercentage) => {
  const topPull = Math.max(1, Math.round(pullMax * 0.70 * pullPercentage));
  let setsDesc = `Pull-ups: 1 → ${topPull} → 1\nIncrease by 2-3 reps per step\n`;
  
  if (level === 'beginner') {
    const topAus = getAustralianPullUpReps(topPull, week);
    setsDesc += `\nAustralian pull-ups: 1 → ${topAus} → 1\nIncrease by 2-3 reps per step (1.5x–2x pull-up reps by week)`;
  } else if (muMax > 0) {
    const topMU = Math.max(1, Math.round(muMax * 0.60));
    setsDesc += `\nMuscle-ups: 1 → ${topMU} → 1\nIncrease by 1 rep per step`;
  }
  
  return {
    name: "Pyramids",
    format: "Pyramid",
    duration: "Variable",
    sets: setsDesc,
    rest: "30s between sets",
    note: "Start at 1, work up to top, come back down to 1.",
    exercise: level === 'beginner' ? "pull-up, australian-pull-up" : ("pull-up" + (muMax > 0 ? ", muscle-up" : ""))
  };
};

// METHOD 5: Superset Pull (Pull-ups + Chin-ups + Australian rows)
const method5_SupersetPull = (week, pullMax, muMax, level) => {
  const pullReps = Math.max(8, Math.round(pullMax * 0.5));
  const chinReps = Math.max(8, Math.round(pullMax * 0.6));
  const ausReps = level === 'beginner' ? getAustralianPullUpReps(pullReps, week) : Math.max(15, Math.round(pullMax * 1.2));
  
  let setsDesc = `${pullReps} pull-ups\n${chinReps} chin-ups\n${ausReps} Australian pull-ups`;
  if (muMax > 0 && level !== 'beginner') {
    const muReps = Math.min(5, Math.max(2, Math.round(muMax * 0.5)));
    setsDesc += `\n${muReps} muscle-ups`;
  }
  setsDesc += `\n× 4 rounds`;
  
  return {
    name: "Superset Pull",
    format: "Superset",
    duration: "4 rounds",
    sets: setsDesc,
    rest: "2-3 min between rounds",
    note: "Complete all exercises in order without stopping. Rest fully between rounds. " + (level === 'beginner' ? "Australian pull-ups at 1.5x–2x pull-up reps by week." : ""),
    exercise: "pull-up, chin-up, australian-pull-up" + (muMax > 0 && level !== 'beginner' ? ", muscle-up" : "")
  };
};

// METHOD 6: Timer Challenge
const method6_TimerChallenge = (week, level, pullMax, muMax, pullPercentage) => {
  const targetPull = Math.min(100, Math.round(pullMax * 1.5 * pullPercentage));
  const targetMU = muMax > 0 && level !== 'beginner' ? Math.min(50, Math.round(muMax * 1.2)) : 0;
  const targetAus = level === 'beginner' ? getAustralianPullUpReps(targetPull, week) : 0;
  
  let setsDesc = `${targetPull} pull-ups`;
  if (level === 'beginner') {
    setsDesc += `\n${targetAus} Australian pull-ups`;
  } else if (targetMU > 0) {
    setsDesc += `\n${targetMU} muscle-ups`;
  }
  setsDesc += `\nAs fast as possible`;
  
  return {
    name: "Timed Challenge",
    format: "Timed Challenge",
    duration: "For time",
    sets: setsDesc,
    rest: "Record your time. Rest fully after completion.",
    note: "Challenge yourself to complete all reps as quickly as possible with good form.",
    exercise: level === 'beginner' ? "pull-up, australian-pull-up" : ("pull-up" + (targetMU > 0 ? ", muscle-up" : ""))
  };
};

// METHOD 7: Isometric Ladder
const method7_IsometricLadder = (pullMax, level) => {
  const holdTimes = level === 'beginner' ? [5, 7, 10] : level === 'intermediate' ? [7, 10, 12] : [10, 12, 15];
  const pullReps = Math.max(5, Math.round(pullMax * 0.3));
  
  const setsDesc = `Hold at top ${holdTimes[0]}s → Hold in middle ${holdTimes[1]}s → Dead hang ${holdTimes[2]}s → ${pullReps} pull-ups\n× 3-4 rounds`;
  
  return {
    name: "Isometric Ladder",
    format: "Isometric + Reps",
    duration: "3-4 rounds",
    sets: setsDesc,
    rest: "3-5 min between rounds",
    note: "Do not let go of the bar until all reps are complete.",
    exercise: "isometric-hold, pull-up"
  };
};

// DAY 1 FINISHER
const getDay1Finisher = (week, level, muMax, pullMax, pullPercentage, settings, levelMult) => {
  const basePullReps = Math.max(12, Math.min(25, Math.round(pullMax * 0.8 * pullPercentage)));
  const ausReps = level === 'beginner' ? getAustralianPullUpReps(basePullReps, week) : basePullReps;
  const finishers = [
    // Finisher 1: Australian Pull-Up (MANDATORY for beginners; reps 1.5x–2x by week)
    {
      name: "Finisher: Australian Pull-Up",
      sets: `10 sets × ${level === 'beginner' ? ausReps : basePullReps} reps` + (level === 'beginner' ? ` (1.5x–2x pull-up reps by week)` : ''),
      rest: "30s between sets",
      note: "Horizontal pull-ups. Keep body straight.",
      exercise: "australian-pull-up"
    },
    // Finisher 2: Isometric Hold + Max Pull
    {
      name: "Finisher: Isometric Hold + Max Pull",
      sets: "Hold at top 10s → Hold in middle 10s → Dead hang 10s → Max pull-ups\n× 3 rounds",
      rest: "5 min between rounds",
      note: "Do not let go of the bar until max pull-ups are complete.",
      exercise: "isometric-hold, pull-up"
    }
  ];
  
  // Beginners always get Australian rows finisher
  if (level === 'beginner') {
    return finishers[0];
  }
  
  return finishers[week % 2]; // Alternate between the two for others
};

// ============================================================================
// DAY 2: PUSH DAY
// Dips, Bar dips, Push-ups, Muscle-ups (low reps between sets for Intermediate/Advanced)
// ============================================================================
const generateDay2_Push = (week, level, maxReps, settings, seed, usedMethods) => {
  const exercises = [];
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  const muMax = level === 'beginner' ? 0 : maxReps.muscleUp; // NO muscle-ups for beginners
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  
  // WARM-UP
  exercises.push({
    name: "Warm-up (5-7 min)",
    sets: "Tempo push-ups x15-20\nShoulder circles and stretches\nArm swings\nTempo dips x10-15",
    rest: "No rest needed",
    type: "warmup"
  });

  // Select 2 methods
  const methods = selectDay2Methods(week, level, dipsMax, pushUpsMax, muMax, settings, levelMult, seed, usedMethods);
  exercises.push(...methods);

  // Always add 1 finisher
  const finisher = getDay2Finisher(week, level, dipsMax, pushUpsMax, settings, levelMult);
  exercises.push(finisher);
  
  // Renumber exercises (skip warm-up, finisher, and special labels)
  let exerciseNum = 1;
  exercises.forEach(ex => {
    if (ex.type !== 'warmup' && !ex.name.includes('Finisher') && !ex.name.includes('PART')) {
      // Extract the format/method name without "Method X:" prefix
      const nameWithoutPrefix = ex.name.replace(/^Method \d+:\s*/, '');
      ex.name = `Exercise ${exerciseNum}: ${nameWithoutPrefix}`;
      exerciseNum++;
    }
  });

  // Extract methods for output
  const methodNames = methods.map(m => {
    const methodLower = m.name.toLowerCase();
    if (methodLower.includes('emom')) return 'emom';
    if (methodLower.includes('pyramid')) return 'pyramid';
    if (methodLower.includes('density')) return 'density';
    if (methodLower.includes('separated') || methodLower.includes('volume')) return 'volume_sets';
    if (methodLower.includes('no-stop')) return 'no-stop';
    return 'volume_sets';
  });

  return {
    day: 2,
    focus: "Push Day",
    methods: methodNames,
    exercises,
    coachingNote: "Keep good form. Push-ups: chest touches ground. Dips: go all the way down."
  };
};

// Select 2 methods for Day 2 with randomization
const selectDay2Methods = (week, level, dipsMax, pushUpsMax, muMax, settings, levelMult, seed, usedMethods) => {
  const methods = [];
  const availableMethods = [];
  
  availableMethods.push('density_circuit');
  availableMethods.push('emom_blocks');
  availableMethods.push('separated_volume_push');
  availableMethods.push('pyramids_push');
  
  if (muMax > 0 && level !== 'beginner') {
    availableMethods.push('emom_mu_combo');
  }
  
  if (week >= 3) {
    availableMethods.push('no_stop_sets');
  }
  
  // Randomize selection
  const rng = seededRandom(seed + week * 2000);
  const selectedMethods = [];
  const pool = [...availableMethods];
  const filteredPool = pool.filter(m => !usedMethods.includes(m));
  const finalPool = filteredPool.length >= 2 ? filteredPool : pool;
  
  while (selectedMethods.length < 2 && finalPool.length > 0) {
    const index = Math.floor(rng() * finalPool.length);
    const selected = finalPool.splice(index, 1)[0];
    selectedMethods.push(selected);
    usedMethods.push(selected);
  }
  
  // Generate selected methods
  selectedMethods.forEach(methodType => {
    switch(methodType) {
      case 'density_circuit':
        methods.push(methodPush1_DensityCircuit(dipsMax, pushUpsMax));
        break;
      case 'emom_blocks':
        methods.push(methodPush2_EMOMBlocks(dipsMax, pushUpsMax, settings, levelMult, week));
        break;
      case 'emom_mu_combo':
        methods.push(methodPush3_EMOMMUCombo(muMax, dipsMax));
        break;
      case 'separated_volume_push':
        methods.push(methodPush4_SeparatedVolumePush(dipsMax, pushUpsMax));
        break;
      case 'pyramids_push':
        methods.push(methodPush5_PyramidsPush(dipsMax, pushUpsMax));
        break;
      case 'no_stop_sets':
        methods.push(methodPush6_NoStopSets(dipsMax, pushUpsMax));
        break;
    }
  });
  
  return methods;
};

// Push Method 1: Density Circuit
const methodPush1_DensityCircuit = (dipsMax, pushUpsMax) => {
  const x = Math.max(1, Math.round(dipsMax * 0.35));
  const pushReps = Math.max(1, Math.round(pushUpsMax * 0.35));
  const barDips = Math.round(x * 0.8);
  
  return {
    name: "Density Circuit",
    format: "Density",
    duration: "5 rounds",
    sets: `${x} dips\n${pushReps} push-ups\n${barDips} bar dips\n× 5 rounds`,
    rest: "90s between rounds",
    note: "Complete each round without stopping. Rest fully between rounds.",
    exercise: "dip, push-up, bar-dip"
  };
};

// Push Method 2: EMOM Blocks
const methodPush2_EMOMBlocks = (dipsMax, pushUpsMax, settings, levelMult, week) => {
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
    name: "EMOM Blocks",
    format: "EMOM",
    duration: `${durations[0] + durations[1]} min total`,
    sets: setsDesc.trim(),
    rest: "Rest for the remainder of each minute",
    note: "2 EMOMs for dips, 2 EMOMs for push-ups. Complete reps at start of each minute.",
    exercise: "dip, push-up"
  };
};

// Push Method 3: EMOM Muscle-Up Combo
const methodPush3_EMOMMUCombo = (muMax, dipsMax) => {
  const barDips = Math.max(1, Math.round(dipsMax * 0.20));
  
  return {
    name: "EMOM Muscle-Up Combo",
    format: "EMOM",
    duration: "8 min",
    sets: `EMOM 8 min:\n1 muscle-up\n${barDips} bar dips`,
    rest: "Rest for the remainder of each minute",
    note: "Complete 1 MU + bar dips at start of each minute for 8 minutes.",
    exercise: "muscle-up, bar-dip"
  };
};

// Push Method 4: Separated Volume Push
const methodPush4_SeparatedVolumePush = (dipsMax, pushUpsMax) => {
  const dips80 = Math.max(1, Math.round(dipsMax * 0.80));
  const push80 = Math.max(1, Math.round(pushUpsMax * 0.80));
  const barDips80 = Math.max(1, Math.round(dipsMax * 0.75));
  
  return {
    name: "Separated Volume",
    format: "Volume Sets",
    duration: "15 sets total",
    sets: `5 sets × ${dips80} dips\n5 sets × ${push80} push-ups\n5 sets × ${barDips80} bar dips`,
    rest: "90s between sets",
    note: "Complete all sets for each exercise before moving to next.",
    exercise: "dip, push-up, bar-dip"
  };
};

// Push Method 5: Pyramids Push
const methodPush5_PyramidsPush = (dipsMax, pushUpsMax) => {
  const topDips = Math.max(1, Math.round(dipsMax * 0.70));
  const topPush = Math.max(1, Math.round(pushUpsMax * 0.70));
  
  return {
    name: "Pyramids",
    format: "Pyramid",
    duration: "Variable",
    sets: `Dips: 1 → ${topDips} → 1 (increase by 3 per step)\nPush-ups: 1 → ${topPush} → 1 (increase by 3 per step)`,
    rest: "30s between sets",
    note: "Work up to top, come back down to 1. Increase by 3 reps per step.",
    exercise: "dip, push-up"
  };
};

// Push Method 6: No-Stop Sets
const methodPush6_NoStopSets = (dipsMax, pushUpsMax) => {
  const dipReps = Math.max(1, Math.round(dipsMax * 0.40));
  const pushReps = Math.max(1, Math.round(pushUpsMax * 0.40));
  
  return {
    name: "No-Stop Sets",
    format: "No-stop",
    duration: "4 rounds",
    sets: `${dipReps} dips + ${pushReps} push-ups (no rest between)\n× 4 rounds`,
    rest: "2-3 min between rounds",
    note: "Complete dips then immediately push-ups without stopping. Rest fully between rounds.",
    exercise: "dip, push-up"
  };
};

// DAY 2 FINISHER
const getDay2Finisher = (week, level, dipsMax, pushUpsMax, settings, levelMult) => {
  const pushReps = Math.max(1, Math.round(pushUpsMax * 0.10));
  
  return {
    name: "Finisher: Isometric Push Hold",
    sets: `EMOM 10 min:\n10s 90° push-up hold\n${pushReps} push-ups`,
    rest: "Rest for the remainder of each minute",
    note: "Hold at 90° for 10 seconds, then complete push-ups. Repeat every minute for 10 minutes.",
    exercise: "isometric-hold, push-up"
  };
};

// ============================================================================
// DAY 3: LEGS + CARDIO + CORE
// ============================================================================
const generateDay3_LegsCardioCore = (week, level, maxReps, settings, seed) => {
  const exercises = [];
  const squatsMax = maxReps.squats;
  const legRaisesMax = maxReps.legRaises;
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  const squatsVolumeMult = settings.volume * levelMult * 1.25;
  const squatsIntensityMult = settings.intensity * levelMult * 1.2;
  const legRaisesVolumeMult = settings.volume * levelMult * 1.1;

  // WARM-UP
  exercises.push({
    name: "Warm-up (5-7 min)",
    sets: "Easy jogging 3-5 min\nLeg swings forward and back\nTempo squats x15-20\nHip circles",
    rest: "No rest needed",
    type: "warmup"
  });

  // CARDIO (Running or Jump Rope) - Emphasized for beginners
  const cardioDuration = level === 'beginner' 
    ? [10, 12, 15, 18][week - 1]
    : week === 1 ? 10 : week === 2 ? 15 : week === 3 ? 20 : 25;
  exercises.push({
    name: week % 2 === 0 ? "Cardio: Running" : "Cardio: Jump Rope",
    sets: week % 2 === 0 
      ? `Run ${cardioDuration} minutes at steady pace`
      : `Jump rope for ${cardioDuration} minutes without stopping`,
    rest: "2-3 min",
    note: "Keep steady pace. Don't sprint.",
    exercise: week % 2 === 0 ? "running" : "jump-rope"
  });

  // SQUATS
  if (squatsMax <= 60) {
    const reps = Math.max(1, Math.round(squatsMax * squatsVolumeMult));
    exercises.push({
      name: "Squats",
      sets: `${reps} reps × 4 sets`,
      rest: "60s between sets",
      note: "Go all the way down. Control speed.",
      exercise: "squat"
    });
  } else {
    const emomReps = Math.max(1, Math.round(squatsMax * squatsIntensityMult * 0.30));
    const duration = week <= 2 ? 15 : week === 3 ? 18 : 20;
    exercises.push({
      name: "Squats Every Minute",
      format: "EMOM",
      duration: `${duration} min`,
      sets: `${duration} minutes: ${emomReps} reps at start of each minute`,
      rest: "Rest for the rest of the minute",
      note: "Keep steady pace. Go all the way down each rep.",
      exercise: "squat"
    });
  }

  // JUMP SQUATS
  const jumpSquatReps = Math.max(10, Math.round(squatsMax * 0.4));
  exercises.push({
    name: "Jump Squats",
    sets: `${jumpSquatReps} reps × ${week <= 2 ? 3 : 4} sets`,
    rest: "60s between sets",
    note: "Explosive jumps. Land softly.",
    exercise: "jump-squat"
  });

  // BURPEES
  const burpeeCount = week <= 2 ? 15 : week === 3 ? 18 : 22;
  exercises.push({
    name: "Burpees",
    sets: `${burpeeCount} reps × ${week <= 2 ? 4 : week === 3 ? 5 : 6} sets`,
    rest: "60-90s between sets",
    note: "Full burpee: push-up then jump. Keep steady pace.",
    exercise: "burpee"
  });

  // LEG RAISES
  const legRaiseReps = Math.max(5, Math.round(legRaisesMax * legRaisesVolumeMult));
  exercises.push({
    name: "Leg Raises",
    sets: `${legRaiseReps} reps × ${week <= 2 ? 4 : 5} sets`,
    rest: "60s between sets",
    note: "Control going down. Don't swing.",
    exercise: "leg-raise"
  });

  // PLANK HOLD
  exercises.push({
    name: "Plank Hold",
    sets: `${week <= 2 ? 60 : week === 3 ? 75 : 90} seconds × ${week <= 2 ? 3 : 4} sets`,
    rest: "60s between sets",
    note: "Keep body straight. Don't sag or lift hips.",
    exercise: "plank"
  });

  return {
    day: 3,
    focus: "Legs + Core + Cardio",
    methods: ["emom", "amrap", "timed_circuits", "volume_blocks"],
    exercises,
    coachingNote: "Cardio day. Focus on keeping steady pace. Do full range of motion on all exercises."
  };
};

// ============================================================================
// DAY 4: ENDURANCE INTEGRATION DAY (CRITICAL - FIXED STRUCTURE)
// 
// 🎯 Purpose: Fatigue management, movement efficiency, mental tolerance, competition simulation
// ❌ NOT for building new strength
// 
// Structure (MANDATORY):
// PART 1 - Activation (LOW FATIGUE) - 5-8 min
// PART 2 - MAIN ENDURANCE SET (CORE) - 15-25 min (ONLY ONE format)
// PART 3 - FINISHER (MENTAL, SHORT) - 5-8 min
// ============================================================================
const generateDay4_EnduranceSets = (week, level, maxReps, settings, seed) => {
  const exercises = [];
  
  const muMax = level === 'beginner' ? 0 : maxReps.muscleUp; // NO muscle-ups for beginners
  const pullMax = maxReps.pullUps;
  const dipsMax = maxReps.dips;
  const pushUpsMax = maxReps.pushUps;
  const squatsMax = maxReps.squats;
  
  const levelMult = { beginner: 0.85, intermediate: 1.0, advanced: 1.15 }[level];
  
  // Beginner constraint: pull-ups ≤ 60% max
  const pullPercentage = level === 'beginner' ? 0.60 : 0.75;
  
  // Volume caps by week (NOT 100% - CONTROLLED FATIGUE)
  const volumeCaps = {
    week1: 0.70,
    week2: 0.80,
    week3: 0.90,
    week4: 0.95  // NOT 100% - stops before failure
  };
  const volumeCap = volumeCaps[`week${week}`];
  
  // Movement repetition limits (prevent excessive volume)
  const repLimits = {
    pullUps: 120,
    dips: 150,
    pushUps: 200,
    muscleUps: level === 'beginner' ? 0 : level === 'intermediate' ? 25 : 60
  };
  
  // Transition limits (muscle-ups, transitions between exercises)
  const transitionLimits = {
    beginner: { min: 0, max: 1 },
    intermediate: { min: 2, max: 3 },
    advanced: { min: 3, max: 5 }
  };
  const transitions = transitionLimits[level];
  
  // WARM-UP
  exercises.push({
    name: "Warm-up (5-7 min)",
    sets: "Tempo pull-ups x10\nTempo dips x10\nArm circles\nShoulder warm-up" + (muMax > 0 ? "\nMuscle-up practice" : ""),
    rest: "No rest needed",
    type: "warmup"
  });

  // PART 1: ACTIVATION (LOW FATIGUE) - 5-8 min
  const activation = generateDay4_Activation(week, level, muMax, pullMax, pullPercentage, dipsMax, pushUpsMax, volumeCap, levelMult, repLimits, seed);
  exercises.push(activation);

  // PART 2: MAIN ENDURANCE SET (CORE) - 15-25 min - ONLY ONE format
  const mainSet = generateDay4_MainSet(week, level, muMax, pullMax, pullPercentage, dipsMax, pushUpsMax, squatsMax, volumeCap, levelMult, transitions, repLimits, seed);
  exercises.push(mainSet);

  // PART 3: FINISHER (MENTAL, SHORT) - 5-8 min
  const finisher = generateDay4_Finisher(week, level, muMax, pullMax, pullPercentage, dipsMax, pushUpsMax, volumeCap, levelMult, repLimits, seed);
  exercises.push(finisher);
  
  // Renumber exercises (skip warm-up, remove PART labels, number sequentially)
  let exerciseNum = 1;
  exercises.forEach(ex => {
    if (ex.type !== 'warmup') {
      // Remove PART labels and any remaining emojis, keep the description
      const cleanName = ex.name
        .replace(/🧩\s*/g, '')
        .replace(/🔥\s*/g, '')
        .replace(/⚡\s*/g, '')
        .replace(/PART\s*1:\s*/i, '')
        .replace(/PART\s*2:\s*/i, '')
        .replace(/PART\s*3:\s*/i, '')
        .replace(/Main Set - /i, '')
        .replace(/Finisher - /i, '')
        .replace(/Activation - /i, '')
        .trim();
      ex.name = `Exercise ${exerciseNum}: ${cleanName}`;
      exerciseNum++;
    }
  });

  // Extract methods for output
  const methodNames = [];
  if (activation.format) methodNames.push(activation.format.toLowerCase().replace(/\s+/g, '_'));
  if (mainSet.format) methodNames.push(mainSet.format.toLowerCase().replace(/\s+/g, '_'));
  if (finisher.format) methodNames.push(finisher.format.toLowerCase().replace(/\s+/g, '_'));

  return {
    day: 4,
    focus: "Endurance Integration Day",
    structure: "3-part: Activation → Main Set → Finisher",
    methods: methodNames,
    exercises,
    coachingNote: week === 4 
      ? "Competition mode: Controlled fatigue management. Keep good form - stop before failure."
      : "Endurance integration: Focus on movement efficiency and breathing. This is NOT max strength day."
  };
};

// ============================================================================
// PART 1: ACTIVATION (LOW FATIGUE) - 5-8 min max
// Purpose: Prime nervous system without killing volume
// ============================================================================
const generateDay4_Activation = (week, level, muMax, pullMax, pullPercentage, dipsMax, pushUpsMax, volumeCap, levelMult, repLimits, seed) => {
  const rng = seededRandom(seed + 1000);
  const duration = level === 'beginner' ? 5 : level === 'intermediate' ? 6 : 8;
  
  const activationTypes = ['easy_emom', 'light_unbroken', 'submaximal_sets'];
  const selectedType = activationTypes[Math.floor(rng() * activationTypes.length)];
  
  // Use 40-50% max for activation (LOW FATIGUE)
  const activationPercentage = 0.45;
  
  if (selectedType === 'easy_emom') {
    const pullReps = Math.max(1, Math.min(repLimits.pullUps, Math.round(pullMax * pullPercentage * activationPercentage)));
    const pushReps = Math.max(1, Math.min(repLimits.pushUps, Math.round(pushUpsMax * activationPercentage)));
    
    return {
      name: "Activation - Easy EMOM",
      format: "EMOM",
      duration: `${duration} min`,
      sets: `EMOM ${duration} min:\nMin 1: ${pullReps} pull-ups\nMin 2: ${pushReps} push-ups\nAlternate each minute`,
      rest: "Rest for remainder of each minute",
      note: "Light activation - NOT max effort. Prime your nervous system.",
      exercise: "pull-up, push-up",
      type: "activation"
    };
  } else if (selectedType === 'light_unbroken') {
    const pullReps = Math.max(1, Math.min(repLimits.pullUps, Math.round(pullMax * pullPercentage * activationPercentage)));
    const dipReps = Math.max(1, Math.min(repLimits.dips, Math.round(dipsMax * activationPercentage)));
    
    return {
      name: "Activation - Light Unbroken Bar Flow",
      format: "Unbroken Flow",
      duration: `${duration} min`,
      sets: `${pullReps} pull-ups\n${dipReps} dips\n× 2-3 rounds (smooth transitions)`,
      rest: "90s between rounds",
      note: "Smooth, controlled flow. Focus on transitions - NOT speed.",
      exercise: "pull-up, dip",
      type: "activation"
    };
  } else {
    // Submaximal sets
    const pullReps = Math.max(1, Math.min(repLimits.pullUps, Math.round(pullMax * pullPercentage * activationPercentage)));
    const pushReps = Math.max(1, Math.min(repLimits.pushUps, Math.round(pushUpsMax * activationPercentage)));
    const dipReps = Math.max(1, Math.min(repLimits.dips, Math.round(dipsMax * activationPercentage)));
    
    return {
      name: "Activation - Submaximal Sets",
      format: "Volume Sets",
      duration: `${duration} min`,
      sets: `${pullReps} pull-ups\n${dipReps} dips\n${pushReps} push-ups\n× 2 sets`,
      rest: "90s between sets",
      note: "Submaximal activation - stop well before failure.",
      exercise: "pull-up, dip, push-up",
      type: "activation"
    };
  }
};

// ============================================================================
// PART 2: MAIN ENDURANCE SET (CORE) - 15-25 min
// Purpose: Density, fatigue control, breathing - ONLY ONE format
// IMPORTANT: Only ONE "chaos" element (Unbroken, Timed, Degressive, or FIBO)
// ============================================================================
const generateDay4_MainSet = (week, level, muMax, pullMax, pullPercentage, dipsMax, pushUpsMax, squatsMax, volumeCap, levelMult, transitions, repLimits, seed) => {
  const rng = seededRandom(seed + 2000);
  
  // Helper function with volume cap and rep limits
  const getReps = (exerciseMax, percentageOverride = null, useHigh = false) => {
    const basePercentage = percentageOverride || volumeCap;
    const adjustedPercentage = useHigh ? basePercentage * 1.1 : basePercentage * 0.9;
    const result = Math.max(1, Math.round(exerciseMax * adjustedPercentage * levelMult));
    
    // Apply rep limits based on exercise
    if (exerciseMax <= 60) { // Pull-ups
      return Math.min(result, repLimits.pullUps);
    } else if (exerciseMax <= 80) { // Dips
      return Math.min(result, repLimits.dips);
    } else if (exerciseMax <= 120) { // Push-ups
      return Math.min(result, repLimits.pushUps);
    }
    return result;
  };
  
  // Determine MU reps within limits
  const getMUReps = () => {
    if (level === 'beginner') return 0;
    const muReps = Math.max(1, Math.min(repLimits.muscleUps, Math.round(muMax * volumeCap * levelMult)));
    const maxMU = level === 'intermediate' ? 25 : 60;
    return Math.min(muReps, maxMU);
  };
  
  // Available formats (ONLY ONE will be selected)
  const formats = [];
  
  if (level === 'beginner') {
    formats.push('bodyweight_ladder');
    formats.push('timed_rounds');
  } else if (level === 'intermediate') {
    formats.push('mixed_endurance');
    formats.push('fibo_round_16');
    formats.push('degressive_ladder');
  } else {
    formats.push('fibo_quarterfinal');
    formats.push('barbarian_80');
    formats.push('unbroken_complex');
  }
  
  const selectedFormat = formats[Math.floor(rng() * formats.length)];
  const muReps = getMUReps();
  const transitionCount = Math.floor(rng() * (transitions.max - transitions.min + 1)) + transitions.min;
  
  // Duration based on week and format
  const durations = {
    week1: 15,
    week2: 18,
    week3: 22,
    week4: 25
  };
  const duration = durations[`week${week}`];
  
  if (selectedFormat === 'bodyweight_ladder' || selectedFormat === 'degressive_ladder') {
    // Degressive Ladder format
    const round1Pull = getReps(pullMax, null, false);
    const round2Pull = Math.round(round1Pull * 0.85);
    const round3Pull = Math.round(round1Pull * 0.7);
    const round1Dips = getReps(dipsMax, null, false);
    const round2Dips = Math.round(round1Dips * 0.85);
    const round3Dips = Math.round(round1Dips * 0.7);
    const round1Push = getReps(pushUpsMax, null, false);
    const round2Push = Math.round(round1Push * 0.85);
    const round3Push = Math.round(round1Push * 0.7);

    if (level === 'beginner') {
      const aus1 = getAustralianPullUpReps(round1Pull, week);
      const aus2 = getAustralianPullUpReps(round2Pull, week);
      const aus3 = getAustralianPullUpReps(round3Pull, week);
      const sets = `Round 1: ${round1Pull} pull-ups, ${aus1} Australian pull-ups, ${round1Dips} dips, ${round1Push} push-ups\nRound 2: ${round2Pull} pull-ups, ${aus2} Australian pull-ups, ${round2Dips} dips, ${round2Push} push-ups\nRound 3: ${round3Pull} pull-ups, ${aus3} Australian pull-ups, ${round3Dips} dips, ${round3Push} push-ups\nRest only if needed`;
      return {
        name: "PART 2: Main Set - Degressive Ladder",
        format: "Degressive Ladder",
        duration: `${duration} min`,
        sets,
        rest: "2 min between rounds",
        note: "Controlled fatigue management. Each round slightly easier. Stop before failure.",
        exercise: "pull-up, australian-pull-up, dip, push-up",
        type: "main_set"
      };
    }

    return {
      name: "PART 2: Main Set - Degressive Ladder",
      format: "Degressive Ladder",
      duration: `${duration} min`,
      sets: `Round 1: ${round1Pull} pull-ups, ${round1Dips} dips, ${round1Push} push-ups\nRound 2: ${round2Pull} pull-ups, ${round2Dips} dips, ${round2Push} push-ups\nRound 3: ${round3Pull} pull-ups, ${round3Dips} dips, ${round3Push} push-ups\nRest only if needed`,
      rest: "2 min between rounds",
      note: "Controlled fatigue management. Each round slightly easier. Stop before failure.",
      exercise: "pull-up, dip, push-up",
      type: "main_set"
    };
    
  } else if (selectedFormat === 'timed_rounds') {
    // Timed Rounds format
    const pullReps = getReps(pullMax, null, false);
    const pushReps = getReps(pushUpsMax, null, false);
    const squatsReps = getReps(squatsMax, null, false);

    if (level === 'beginner') {
      const ausReps = getAustralianPullUpReps(pullReps, week);
      return {
        name: "PART 2: Main Set - Timed Rounds",
        format: "Timed Rounds",
        duration: `${duration} min`,
        sets: `${pullReps} pull-ups\n${ausReps} Australian pull-ups\n${pushReps} push-ups\n${squatsReps} squats\n× 3-4 rounds (complete as fast as possible, record time)`,
        rest: "2 min between rounds",
        note: "Controlled pace - NOT max speed. Focus on breathing and efficiency.",
        exercise: "pull-up, australian-pull-up, push-up, squat",
        type: "main_set"
      };
    }
    
    return {
      name: "PART 2: Main Set - Timed Rounds",
      format: "Timed Rounds",
      duration: `${duration} min`,
      sets: `${pullReps} pull-ups\n${pushReps} push-ups\n${squatsReps} squats\n× 3-4 rounds (complete as fast as possible, record time)`,
      rest: "2 min between rounds",
      note: "Controlled pace - NOT max speed. Focus on breathing and efficiency.",
      exercise: "pull-up, push-up, squat",
      type: "main_set"
    };
    
  } else if (selectedFormat === 'mixed_endurance') {
    // Mixed Endurance (Intermediate)
    const pullReps = getReps(pullMax, null, false);
    const dipReps = getReps(dipsMax, null, false);
    const pushReps = getReps(pushUpsMax, null, false);
    const muCount = muReps;
    
    return {
      name: "PART 2: Main Set - Mixed Endurance",
      format: "Mixed Endurance",
      duration: `${duration} min`,
      sets: `${muCount > 0 ? muCount + ' muscle-ups\n' : ''}${pullReps} pull-ups\n${dipReps} dips\n${pushReps} push-ups\n× 3 rounds`,
      rest: "90s between rounds (rest if needed)",
      note: `Controlled transitions (max ${transitions.max}). Focus on breathing between exercises.`,
      exercise: muCount > 0 ? "muscle-up, pull-up, dip, push-up" : "pull-up, dip, push-up",
      type: "main_set"
    };
    
  } else if (selectedFormat === 'fibo_round_16') {
    // FIBO Round of 16 Style (Intermediate)
    const pullReps = getReps(pullMax, null, true);
    const dipReps = getReps(dipsMax, null, true);
    const pushReps = getReps(pushUpsMax, null, true);
    const muCount = muReps;
    
    return {
      name: "PART 2: Main Set - FIBO Round of 16 Style",
      format: "FIBO Competition Style",
      duration: `${duration} min`,
      sets: `${dipReps} dips\n${pullReps} pull-ups\n${pushReps} push-ups\n${muCount} muscle-ups\n× 3 rounds (competition pace)`,
      rest: "60s between rounds",
      note: "Competition-style sequence. Move smoothly between exercises. Controlled fatigue.",
      exercise: "dip, pull-up, push-up, muscle-up",
      type: "main_set"
    };
    
  } else if (selectedFormat === 'fibo_quarterfinal') {
    // FIBO Quarterfinal (Advanced)
    const pullReps = getReps(pullMax, null, true);
    const dipReps = getReps(dipsMax, null, true);
    const pushReps = getReps(pushUpsMax, null, true);
    const rounds = week === 4 ? 8 : 6;
    
    return {
      name: "PART 2: Main Set - FIBO Quarterfinal Routine",
      format: "FIBO Competition Style",
      duration: `${duration} min`,
      sets: `1 pull-up + 1 muscle-up × ${rounds} rounds (UNBROKEN)\n${pushReps} push-ups\n${dipReps} dips\n1 pull-up + 1 muscle-up × ${rounds} rounds`,
      rest: "2 min rest (30s penalty if rest during unbroken sequence)",
      note: "Competition rule: Controlled unbroken sequences. If you MUST rest, add 30 seconds.",
      exercise: "pull-up, muscle-up, push-up, dip",
      type: "main_set"
    };
    
  } else if (selectedFormat === 'barbarian_80') {
    // Barbarian-style (Advanced)
    const pullReps = getReps(pullMax, null, false);
    const dipReps = getReps(dipsMax, null, false);
    const pushReps = getReps(pushUpsMax, null, true);
    const muCount = muReps;
    const squatsReps = getReps(squatsMax, null, false);
    const weight = week === 4 ? 10 : 5;
    
    return {
      name: "PART 2: Main Set - Barbarian Requirement",
      format: "Unbroken Complex",
      duration: `${duration} min`,
      sets: `${dipReps} weighted dips (${weight} kg)\n${pullReps} weighted pull-ups (${weight} kg)\n${pushReps} push-ups\n${muCount} ${muMax > 0 ? `weighted muscle-ups (${weight} kg)` : 'jump muscle-ups'}\n${squatsReps} weighted squats (${weight} kg)\n× 2 rounds`,
      rest: "90s between rounds",
      note: "Controlled form under load. Maintain technique - this is endurance, not max strength.",
      exercise: "dip, pull-up, push-up, muscle-up, squat",
      type: "main_set"
    };
    
  } else {
    // Unbroken Complex (Advanced fallback)
    const pullReps = getReps(pullMax, null, true);
    const dipReps = getReps(dipsMax, null, true);
    const pushReps = getReps(pushUpsMax, null, true);
    const muCount = muReps;
    
    return {
      name: "PART 2: Main Set - Unbroken Complex",
      format: "Unbroken Complex",
      duration: `${duration} min`,
      sets: `${pullReps} pull-ups\n${dipReps} dips\n${pushReps} push-ups\n${muCount > 0 ? muCount + ' muscle-ups\n' : ''}(Complete unbroken, rest if absolutely needed)`,
      rest: "2-3 min after completion",
      note: "Controlled unbroken flow. If you MUST rest, take it. This is NOT max effort.",
      exercise: muCount > 0 ? "pull-up, dip, push-up, muscle-up" : "pull-up, dip, push-up",
      type: "main_set"
    };
  }
};

// ============================================================================
// PART 3: FINISHER (MENTAL, SHORT) - 5-8 min
// Purpose: Mental burn under fatigue
// ============================================================================
const generateDay4_Finisher = (week, level, muMax, pullMax, pullPercentage, dipsMax, pushUpsMax, volumeCap, levelMult, repLimits, seed) => {
  const rng = seededRandom(seed + 3000);
  const duration = level === 'beginner' ? 5 : level === 'intermediate' ? 6 : 8;
  
  const finisherTypes = ['isometric_holds', 'amrap', 'short_emom', 'max_reps_tension'];
  const selectedType = finisherTypes[Math.floor(rng() * finisherTypes.length)];
  
  if (selectedType === 'isometric_holds') {
    const holdTimes = level === 'beginner' ? [10, 10, 10] : level === 'intermediate' ? [15, 15, 15] : [15, 15, 20];
    const pullReps = Math.max(1, Math.min(repLimits.pullUps, Math.round(pullMax * pullPercentage * 0.3)));
    
    return {
      name: "PART 3: Finisher - Isometric Holds",
      format: "Isometric + Reps",
      duration: `${duration} min`,
      sets: `Hold at top ${holdTimes[0]}s → Hold in middle ${holdTimes[1]}s → Dead hang ${holdTimes[2]}s → ${pullReps} pull-ups\n× 2 rounds`,
      rest: "3 min between rounds",
      note: "Mental challenge under fatigue. Do not let go until reps complete.",
      exercise: "isometric-hold, pull-up",
      type: "finisher"
    };
    
  } else if (selectedType === 'amrap') {
    const pullReps = Math.max(1, Math.min(repLimits.pullUps, Math.round(pullMax * pullPercentage * 0.4)));
    const pushReps = Math.max(1, Math.min(repLimits.pushUps, Math.round(pushUpsMax * 0.4)));
    
    return {
      name: "PART 3: Finisher - AMRAP",
      format: "AMRAP",
      duration: `${duration} min`,
      sets: `As many rounds as possible in ${duration} min:\n${pullReps} pull-ups\n${pushReps} push-ups\n(Rest only if needed)`,
      rest: "No rest between rounds",
      note: "Controlled pace - NOT max effort. Focus on consistent breathing.",
      exercise: "pull-up, push-up",
      type: "finisher"
    };
    
  } else if (selectedType === 'short_emom') {
    const pullReps = Math.max(1, Math.min(repLimits.pullUps, Math.round(pullMax * pullPercentage * 0.25)));
    const pushReps = Math.max(1, Math.min(repLimits.pushUps, Math.round(pushUpsMax * 0.25)));
    
    return {
      name: "PART 3: Finisher - Short EMOM",
      format: "EMOM",
      duration: `${duration} min`,
      sets: `EMOM ${duration} min:\n${pullReps} pull-ups + ${pushReps} push-ups`,
      rest: "Rest for remainder of each minute",
      note: "Short, sharp stimulus. Complete reps quickly, use rest time wisely.",
      exercise: "pull-up, push-up",
      type: "finisher"
    };
    
  } else {
    // Max Reps Under Tension
    const pullReps = Math.max(1, Math.min(repLimits.pullUps, Math.round(pullMax * pullPercentage * 0.35)));
    
    return {
      name: "PART 3: Finisher - Max Reps Under Tension",
      format: "Max Reps",
      duration: `${duration} min`,
      sets: `10s hold at top → ${pullReps} pull-ups → 10s hold at bottom → ${pullReps} pull-ups\n× 2 rounds`,
      rest: "3 min between rounds",
      note: "Mental burn under tension. Control your breathing throughout.",
      exercise: "isometric-hold, pull-up",
      type: "finisher"
    };
  }
};

// Seeded random number generator for consistent randomization
const seededRandom = (seed) => {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

/**
 * Save generated program with userName and deviceId for admin visibility
 * Expects: userName (optional), deviceId (optional), level, maxReps (optional), program (array of weeks)
 */
const saveProgram = async (req, res) => {
  try {
    const { userName, deviceId, level, maxReps, program, heightCm, weightKg, nutrition } = req.body;

    if (!level || !['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level. Must be: beginner, intermediate, or advanced'
      });
    }

    const programData = Array.isArray(program) ? program : (program && typeof program === 'object' ? [program] : []);
    if (programData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Program must be a non-empty array of weeks (e.g. [{ week: 1, days: [...] }])'
      });
    }

    const name = (userName && String(userName).trim()) ? String(userName).trim() : 'None';
    const doc = await ProgramSave.create({
      userName: name,
      deviceId: deviceId || undefined,
      level,
      heightCm: heightCm != null && heightCm >= 100 && heightCm <= 250 ? Number(heightCm) : undefined,
      weightKg: weightKg != null && weightKg >= 30 && weightKg <= 300 ? Number(weightKg) : undefined,
      maxReps: maxReps && typeof maxReps === 'object' ? maxReps : {},
      program: programData,
      nutrition: nutrition && typeof nutrition === 'object' ? { bmr: nutrition.bmr, tdee: nutrition.tdee, proteinG: nutrition.proteinG, note: nutrition.note, sampleMeals: nutrition.sampleMeals || undefined } : undefined
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Error saving program:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to save program',
      error: error.message
    });
  }
};

/**
 * Paid 6-week program: auto level, height/weight for nutrition, 5 days/week, week 6 day 5 = max test.
 * Body: maxReps, level (optional), heightCm (optional), weightKg (optional), programId (optional).
 */
const generateProgram6Week = async (req, res) => {
  try {
    const { level, maxReps, heightCm, weightKg, programId } = req.body;

    if (!maxReps || typeof maxReps !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'maxReps must be an object with exercise values'
      });
    }

    const requiredExercises = ['muscleUp', 'pullUps', 'dips', 'pushUps', 'squats', 'legRaises', 'burpees'];
    for (const exercise of requiredExercises) {
      if (typeof maxReps[exercise] !== 'number' || maxReps[exercise] < 0) {
        return res.status(400).json({
          success: false,
          message: `${exercise} must be a non-negative number`
        });
      }
    }

    const safetyLimits = {
      muscleUp: 50,
      pullUps: 100,
      dips: 150,
      pushUps: 200,
      squats: 400,
      legRaises: 80,
      burpees: 80
    };
    for (const [exercise, limit] of Object.entries(safetyLimits)) {
      if (maxReps[exercise] > limit) {
        return res.status(400).json({
          success: false,
          message: `${exercise} max reps (${maxReps[exercise]}) exceeds limit of ${limit}`
        });
      }
    }

    const seed = programId || Date.now();
    const options = {};
    if (heightCm != null && weightKg != null) {
      options.heightCm = Number(heightCm);
      options.weightKg = Number(weightKg);
    }
    const result = generate6WeekProgram(level || null, maxReps, seed, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating 6-week program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate 6-week program',
      error: error.message
    });
  }
};

/**
 * Generate 6-week program and send it to the user's email (paid flow).
 * Body: email (required), userName (optional), level, maxReps, heightCm, weightKg, programId.
 */
const generateAndSend6WeekEmail = async (req, res) => {
  try {
    const { email, userName, level, maxReps, heightCm, weightKg, programId, goals } = req.body;

    const emailTrimmed = (email && String(email).trim()) || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required to receive your 6-week program.'
      });
    }

    if (!maxReps || typeof maxReps !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'maxReps must be an object with exercise values'
      });
    }

    const requiredExercises = ['muscleUp', 'pullUps', 'dips', 'pushUps', 'squats', 'legRaises', 'burpees'];
    for (const exercise of requiredExercises) {
      if (typeof maxReps[exercise] !== 'number' || maxReps[exercise] < 0) {
        return res.status(400).json({
          success: false,
          message: `${exercise} must be a non-negative number`
        });
      }
    }

    const safetyLimits = {
      muscleUp: 50,
      pullUps: 100,
      dips: 150,
      pushUps: 200,
      squats: 400,
      legRaises: 80,
      burpees: 80
    };
    for (const [exercise, limit] of Object.entries(safetyLimits)) {
      if (maxReps[exercise] > limit) {
        return res.status(400).json({
          success: false,
          message: `${exercise} max reps (${maxReps[exercise]}) exceeds limit of ${limit}`
        });
      }
    }

    const seed = programId || Date.now();
    const options = {};
    if (heightCm != null && weightKg != null) {
      options.heightCm = Number(heightCm);
      options.weightKg = Number(weightKg);
    }
    if (Array.isArray(goals) && goals.length > 0) options.goals = goals;
    console.log('[Program] 6-week send-email: level:', level, '| email:', emailTrimmed);
    let result = generate6WeekProgram(level || null, maxReps, seed, options);
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const [withReviews, withCover] = await Promise.all([
          addCoachReviewsToProgram(result, { level, goals: options.goals }, callOpenRouter),
          enhancePaidProgramWithAI(result, { goals: options.goals, weeksCount: 6 })
        ]);
        result = { ...withReviews, aiCoachNote: withCover.aiCoachNote };
        console.log('[Program] 6-week: AI validation & coach note added');
      } catch (aiErr) {
        console.error('[Program] AI enhancement failed:', aiErr.message);
      }
    }
    const nameToUse = (userName && String(userName).trim()) ? String(userName).trim() : null;

    await sendProgramEmail(emailTrimmed, nameToUse, result);

    await SixWeekRequest.create({
      email: emailTrimmed,
      userName: nameToUse || undefined,
      level: level || undefined
    }).catch((err) => console.error('Error saving SixWeekRequest:', err));

    res.status(200).json({
      success: true,
      message: 'Your 6-week program has been sent to your email.',
      data: { email: emailTrimmed }
    });
  } catch (error) {
    console.error('Error sending 6-week program email:', error);
    const isConfig = error.message && error.message.includes('not configured');
    res.status(isConfig ? 503 : 500).json({
      success: false,
      message: isConfig ? 'Email service is not configured. Please try again later.' : (error.message || 'Failed to send program to your email.'),
      error: isConfig ? undefined : error.message
    });
  }
};

/**
 * Create PayPal order for paid program (6-week or 12-week).
 * Body: email (required), userName, level, maxReps, heightCm, weightKg, plan ('6week'|'12week').
 * Returns: { orderId } - use with PayPal JS SDK to approve payment.
 */
const createPayPalOrderHandler = async (req, res) => {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({
        success: false,
        message: 'Payment is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.'
      });
    }

    const { email, userName, userAge, level, maxReps, heightCm, weightKg, plan: planParam, calisthenicsMainSport, otherSport, goals } = req.body;
    const plan = planParam === '12week' ? '12week' : '6week';

    const emailTrimmed = (email && String(email).trim()) || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required for the 6-week program.'
      });
    }

    if (!maxReps || typeof maxReps !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'maxReps must be an object with exercise values'
      });
    }

    const requiredExercises = ['muscleUp', 'pullUps', 'dips', 'pushUps', 'squats', 'legRaises', 'burpees'];
    for (const exercise of requiredExercises) {
      if (typeof maxReps[exercise] !== 'number' || maxReps[exercise] < 0) {
        return res.status(400).json({
          success: false,
          message: `${exercise} must be a non-negative number`
        });
      }
    }

    const safetyLimits = { muscleUp: 50, pullUps: 100, dips: 150, pushUps: 200, squats: 400, legRaises: 80, burpees: 80 };
    for (const [ex, limit] of Object.entries(safetyLimits)) {
      if (maxReps[ex] > limit) {
        return res.status(400).json({
          success: false,
          message: `${ex} max reps (${maxReps[ex]}) exceeds limit of ${limit}`
        });
      }
    }

    const amountCents = plan === '12week' ? 5499 : 3999; // 54.99 or 39.99 USD
    const { id: orderId } = await createPayPalOrder(amountCents, 'USD');

    const ageNum = userAge != null && typeof userAge === 'number' && userAge >= 13 && userAge <= 120 ? userAge : undefined;
    await PendingPayPalOrder.create({
      orderId,
      email: emailTrimmed,
      userName: (userName && String(userName).trim()) || undefined,
      userAge: ageNum,
      level: level || 'intermediate',
      maxReps,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      plan,
      calisthenicsMainSport: calisthenicsMainSport !== false,
      otherSport: otherSport || undefined,
      goals: Array.isArray(goals) && goals.length > 0 ? goals : []
    });

    res.status(200).json({ success: true, orderId });
  } catch (error) {
    console.error('PayPal create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Could not create payment order.'
    });
  }
};

/**
 * Capture PayPal order and fulfill paid program.
 * Called after user approves payment in PayPal popup.
 * POST body: { order_id }
 */
const fulfillPaidProgram = async (req, res) => {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({
        success: false,
        message: 'Payment is not configured.'
      });
    }

    const orderId = req.body.order_id || req.body.orderId;
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'order_id is required.'
      });
    }

    // Look up pending order data
    const pending = await PendingPayPalOrder.findOne({ orderId }).lean();
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or expired. Please try again.'
      });
    }

    // Capture payment with PayPal
    const captureResult = await capturePayPalOrder(orderId);
    const status = captureResult.status;
    if (status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Payment was not completed.'
      });
    }

    // Generate and send program
    const { email, program, plan } = await fulfillProgramFromPayPalData(pending);
    const weeksLabel = plan === '12week' ? '12-week' : '6-week';

    // Remove pending (one-time use)
    await PendingPayPalOrder.deleteOne({ orderId }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Your ${weeksLabel} program has been sent to your email.`,
      data: { email, program }
    });
  } catch (error) {
    console.error('Fulfill paid program error:', error?.message || error);
    if (error?.stack) console.error('Stack:', error.stack);
    const msg = error?.message || 'Failed to send your program.';
    // PayPal validation/compliance errors → 422 (not server bug)
    const isPayPalValidation = /capture|compliance|order may already be captured|expired|invalid/i.test(msg);
    res.status(isPayPalValidation ? 422 : 500).json({
      success: false,
      message: msg
    });
  }
};

/**
 * Fulfill program from PayPal pending order data.
 */
async function fulfillProgramFromPayPalData(pending) {
  const { email, userName, userAge, level, maxReps, heightCm, weightKg, orderId, plan, calisthenicsMainSport, otherSport } = pending;
  const goals = Array.isArray(pending.goals) ? pending.goals : [];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('No valid email for this order.');
  }

  const seed = Date.now();
  const options = {};
  if (heightCm != null && weightKg != null) {
    options.heightCm = heightCm;
    options.weightKg = weightKg;
  }
  if (calisthenicsMainSport === false && otherSport) options.otherSport = otherSport;
  if (goals.length > 0) options.goals = goals;
  const is12Week = plan === '12week';
  console.log('[Program] Paid program:', is12Week ? '12-week' : '6-week', '| level:', level, '| email:', email);
  let result = is12Week
    ? generate12WeekProgram(level || 'intermediate', maxReps, seed, options)
    : generate6WeekProgram(level || 'intermediate', maxReps, seed, options);
  const weeksCount = is12Week ? 12 : 6;
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const [withReviews, withCover] = await Promise.all([
        addCoachReviewsToProgram(result, { level, otherSport, goals }, callOpenRouter),
        enhancePaidProgramWithAI(result, { goals, weeksCount })
      ]);
      result = { ...withReviews, aiCoachNote: withCover.aiCoachNote };
      console.log('[Program]', is12Week ? '12-week' : '6-week', ': AI validation & coach note added');
    } catch (aiErr) {
      console.error('[Program] AI enhancement failed:', aiErr.message);
    }
  }
  const weeksLabel = is12Week ? '12-week' : '6-week';
  if (!result.aiCoachNote || !String(result.aiCoachNote).trim()) {
    result = { ...result, aiCoachNote: `Focus on movement quality and consistency. Rest and recover between sessions. This ${weeksLabel} plan is built to progress safely—stick to the structure and adjust only if needed.` };
  }
  const nameToUse = (userName && String(userName).trim()) ? String(userName).trim() : null;
  const ageNum = userAge != null && typeof userAge === 'number' && userAge >= 13 && userAge <= 120 ? userAge : undefined;

  await sendProgramEmail(email, nameToUse, result, { weeksCount, userAge: ageNum, goals });

  await SixWeekRequest.create({
    email,
    userName: nameToUse || undefined,
    level: level || undefined,
    maxReps,
    heightCm: heightCm || undefined,
    weightKg: weightKg || undefined,
    stripeSessionId: orderId,
    amountPaid: is12Week ? 5499 : 3999,
    currency: 'usd',
    paymentStatus: 'paid'
  }).catch((err) => console.error('Error saving SixWeekRequest:', err));

  return { email, program: result, plan: is12Week ? '12week' : '6week' };
}

/**
 * Submit customized program request. Sends form data to admin email.
 * Body: name, email, pullExercises, pushExercises, cardioLegs, other, description
 */
const submitCustomizedRequest = async (req, res) => {
  try {
    const { name, email, pullExercises, pushExercises, cardioLegs, other, description, heightCm, weightKg, calisthenicsMainSport, otherSport } = req.body;
    const emailTrimmed = (email && String(email).trim()) || '';
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }
    await sendCustomizedRequestEmail({
      name: name || '',
      email: emailTrimmed,
      pullExercises: pullExercises || '',
      pushExercises: pushExercises || '',
      cardioLegs: cardioLegs || '',
      other: other || '',
      description: description || '',
      heightCm: heightCm || '',
      weightKg: weightKg || '',
      calisthenicsMainSport: calisthenicsMainSport !== false,
      otherSport: otherSport || ''
    });
    res.status(200).json({
      success: true,
      message: 'Your customized program request has been sent. We will contact you at your email with a quote.',
      data: { email: emailTrimmed }
    });
  } catch (error) {
    console.error('Customized request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send your request.'
    });
  }
};

module.exports = {
  generateProgram,
  generateProgram6Week,
  generateAndSend6WeekEmail,
  sendFreeProgramEmail,
  getFreeLimitStatus,
  generateBatchPrograms,
  saveProgram,
  createPayPalOrderHandler,
  fulfillPaidProgram,
  submitCustomizedRequest
};


