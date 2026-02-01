import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FitnessCenter, Download, CheckCircle, Error } from '@mui/icons-material';
import API_CONFIG from '../config/api';
import jsPDF from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';
import AdSense from '../components/ads/AdSense';

export default function Programs() {
  const { t } = useLanguage();
  const [level, setLevel] = useState('intermediate');
  const [maxReps, setMaxReps] = useState({
    muscleUp: 0,
    pullUps: 10,
    dips: 15,
    pushUps: 25,
    squats: 40,
    legRaises: 15
  });
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRepChange = (exercise, value) => {
    const numValue = parseInt(value) || 0;
    setMaxReps(prev => ({
      ...prev,
      [exercise]: Math.max(0, numValue)
    }));
    setError(null);
  };

  /** Parse AI response: extract JSON from markdown code block if present */
  const parseAIProgramResponse = (text) => {
    let raw = (text || '').trim();
    const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) raw = codeMatch[1].trim();
    const parsed = JSON.parse(raw);
    const program = parsed.program ?? parsed;
    const weekList = Array.isArray(program) ? program : [program];
    return {
      program: weekList.map((w) => ({
        week: w.week ?? 1,
        days: (w.days ?? []).map((d) => ({
          day: d.day,
          focus: d.focus ?? '',
          exercises: (d.exercises ?? []).map((e) => ({
            name: e.name ?? '',
            sets: e.sets ?? '',
            rest: e.rest ?? ''
          }))
        }))
      }))
    };
  };

  const handleGenerate = async () => {
    if (maxReps.pullUps === 0 && maxReps.dips === 0 && maxReps.pushUps === 0) {
      setError('Please enter at least one exercise with reps > 0');
      return;
    }

    setLoading(true);
    setError(null);
    const payloadMaxReps = level === 'beginner' ? { ...maxReps, muscleUp: 0 } : maxReps;

    const saveProgramToBackend = (programData) => {
      const deviceId = (typeof window !== 'undefined' && localStorage.getItem('calorie_device_id')) || undefined;
      const userName = (typeof window !== 'undefined' && localStorage.getItem('calorie_user_name')) ? localStorage.getItem('calorie_user_name').trim() : 'None';
      const nameToSave = (userName && userName !== '') ? userName : 'None';
      const weeklyProgram = (programData.program || []).slice(0, 1);
      fetch(`${API_CONFIG.getBaseURL()}/programs/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: nameToSave,
          deviceId,
          level,
          maxReps: payloadMaxReps,
          program: weeklyProgram
        })
      }).catch((saveErr) => console.error('Error saving program:', saveErr));
    };

    try {
      const puter = typeof window !== 'undefined' && window.puter;
      if (puter?.ai?.chat) {
        const repsText = [
          level !== 'beginner' && payloadMaxReps.muscleUp > 0 ? `Muscle-ups: ${payloadMaxReps.muscleUp}` : null,
          `Pull-ups: ${payloadMaxReps.pullUps}`,
          `Dips: ${payloadMaxReps.dips}`,
          `Push-ups: ${payloadMaxReps.pushUps}`,
          `Squats: ${payloadMaxReps.squats}`,
          `Leg raises: ${payloadMaxReps.legRaises}`
        ].filter(Boolean).join(', ');

        const prompt = `You are a calisthenics coach. Generate a 1-WEEK program that follows this EXACT algorithm and structure (same as our backend generator). Use the user's max reps below to compute rep numbers.

ALGORITHM:
- Week 1 = volume base: use 60% of max for beginners, 70-75% for intermediate/advanced when prescribing reps per set.
- Beginners: NO muscle-ups; use Australian pull-ups at 1.5x to 2x the pull-up reps when pull exercises are combined.
- Intermediate/Advanced: may include muscle-ups at ~30-40% of max when relevant.

STRUCTURE (exactly 4 days per week):
- Day 1 – Pull Day: Warm-up (5-7 min) first exercise, then 2-3 main exercises. Methods: Degressive sets (reps decrease each round, e.g. "6 pull-ups\\n4 pull-ups\\n2 pull-ups\\n× 3 rounds"), EMOM (e.g. "EMOM 6 min: 4 pull-ups at start of each minute"), Separated volume (e.g. "4 sets × 6 reps\\n5 sets × 5 reps"), Pyramids, or Superset (pull-ups + chin-ups + Australian pull-ups × rounds). Rest: "2-3 min between rounds" or "90s between sets" or "Rest for the remainder of each minute" for EMOM.
- Day 2 – Push Day: Warm-up first, then 2-3 main exercises. Exercises: Dips, Push-ups, Bar dips; optional muscle-ups for non-beginners. Same rest style. Example sets: "6 dips\\n8 push-ups\\n× 4 rounds" or "EMOM 8 min: 4 dips at start of each minute".
- Day 3 – Legs + Core + Cardio: Warm-up, then Squats (volume or EMOM), Jump squats, Burpees, Leg raises, Plank. Rest: "60s between sets".
- Day 4 – Endurance Integration Day: Warm-up, then Activation (easy EMOM or light unbroken, 5-8 min), Main Set (combined pull+push in rounds, e.g. "Round 1: 4 pull-ups, 6 dips, 8 push-ups\\nRound 2: ...\\n× 3 rounds"), Finisher (short AMRAP or isometric holds). Rest: "2-3 min between rounds" for main set.

USER INPUTS:
- Level: ${level}
- Max reps: ${repsText}

For each exercise, "sets" must be the prescription only (e.g. "6 pull-ups\\n6 Australian pull-ups\\n× 4 rounds" or "4 sets × 6 reps") with no extra label. "rest" must be one short phrase (e.g. "2-3 min between rounds"). Return ONLY valid JSON in this exact shape, no other text:
{"program":[{"week":1,"days":[{"day":1,"focus":"Pull Day","exercises":[{"name":"Warm-up (5-7 min)","sets":"Tempo pull-ups x10, arm circles, hang holds","rest":"No rest needed"},{"name":"Exercise 2: ...","sets":"...","rest":"..."}]},{"day":2,"focus":"Push Day",...},{"day":3,"focus":"Legs + Core + Cardio",...},{"day":4,"focus":"Endurance Integration Day",...}]}]}
Output exactly 4 days (Pull Day, Push Day, Legs + Core + Cardio, Endurance Integration Day) with exercises and sets computed from the user max reps above.`;

        const response = await puter.ai.chat(prompt, { model: 'gemini-3-flash-preview' });
        const text = typeof response === 'string' ? response : (response?.text ?? String(response));
        const data = parseAIProgramResponse(text);
        setProgram(data);
        saveProgramToBackend(data);
      } else {
        const response = await fetch(`${API_CONFIG.getBaseURL()}/programs/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, maxReps: payloadMaxReps })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to generate program');
        setProgram(data.data);
        saveProgramToBackend(data.data);
      }

      setTimeout(() => {
        document.getElementById('program-display')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error generating program:', err);
      setError(err.message || 'Failed to generate program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!program) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('1-Week Calisthenics Endurance Program', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Program content (1 week only)
    const oneWeek = program.program.slice(0, 1);
    oneWeek.forEach((week, weekIndex) => {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      // Week header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Week ${week.week}`, 20, yPos);
      yPos += 10;

      // Days
      week.days.forEach((day, dayIndex) => {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
        }

        // Day header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Day ${day.day}: ${day.focus}`, 25, yPos);
        yPos += 8;

        // Exercises
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        day.exercises.forEach((exercise) => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          doc.text(`${exercise.name}`, 30, yPos);
          yPos += 6;
          
          if (exercise.sets) {
            const setsLines = exercise.sets.split('\n').filter(Boolean);
            if (setsLines.length > 0) {
              if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(`  ${setsLines[0]}`, 35, yPos);
              yPos += 6;
              for (let i = 1; i < setsLines.length; i++) {
                if (yPos > pageHeight - 30) {
                  doc.addPage();
                  yPos = 20;
                }
                doc.text(`  ${setsLines[i]}`, 35, yPos);
                yPos += 6;
              }
            }
          }
          
          if (exercise.rest) {
            doc.setFont('helvetica', 'italic');
            doc.text(`  Rest between sets: ${exercise.rest}`, 35, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += 6;
          }
        });

        yPos += 5;
      });

      yPos += 10;
    });

    // Footer - "Created by reps-dz" on every page
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Created by reps-dz', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Download
    doc.save(`calisthenics-program-1week-${level}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <FitnessCenter sx={{ fontSize: 40, color: '#F59E0B' }} className="text-yellow-600" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
            Generate Your <span className="text-yellow-500">1-Week</span> Calisthenics Endurance Program
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Enter your max reps for each exercise and get a personalized 1-week endurance program designed to push your limits.
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 mb-6 md:mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Current Max Reps</h2>

          {/* Level Selector */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Experience Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg md:rounded-xl border-2 font-medium transition-all text-sm sm:text-base ${
                    level === lvl
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
            {level !== 'beginner' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Muscle Ups
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxReps.muscleUp || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    handleRepChange('muscleUp', val === '' ? 0 : parseInt(val) || 0);
                  }}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 0 if you can&apos;t do muscle-ups yet
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Pull Ups <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxReps.pullUps || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  handleRepChange('pullUps', val === '' ? 0 : parseInt(val) || 0);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Dips <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxReps.dips || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  handleRepChange('dips', val === '' ? 0 : parseInt(val) || 0);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="15"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Push Ups <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxReps.pushUps || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  handleRepChange('pushUps', val === '' ? 0 : parseInt(val) || 0);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="25"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Squats <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxReps.squats || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  handleRepChange('squats', val === '' ? 0 : parseInt(val) || 0);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="40"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Leg Raises <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxReps.legRaises || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  handleRepChange('legRaises', val === '' ? 0 : parseInt(val) || 0);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="15"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
              <Error sx={{ color: '#DC2626', flexShrink: 0 }} />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg md:rounded-xl transition-all transform active:scale-95 shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Generating Program...
              </>
            ) : (
              <>
                <FitnessCenter />
                Generate Program
              </>
            )}
          </button>
        </motion.div>

        {/* Ad inside content – after first section (form), before program output */}
        <div className="m-2 flex justify-center">
          <AdSense slotName="programsInContent" format="auto" className="w-full max-w-[970px] min-h-[50px]" />
        </div>

        {/* Program Display */}
        {program && (
          <div id="program-display" className="space-y-8">
            {/* Download Button */}
            <div className="flex justify-center sm:justify-end mb-4 sm:mb-6">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-black text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-lg md:rounded-xl hover:bg-gray-800 transition-all shadow-lg text-sm sm:text-base"
              >
                <Download sx={{ fontSize: { xs: 18, sm: 20 } }} />
                <span className="hidden xs:inline">Download PDF</span>
                <span className="xs:hidden">PDF</span>
              </button>
            </div>

            {/* Program – 1 week only */}
            {program.program.slice(0, 1).map((week, weekIndex) => (
              <motion.div
                key={weekIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: weekIndex * 0.1 }}
                className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 md:mb-8"
              >
                {/* Week Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 p-4 sm:p-5 md:p-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-black">Week {week.week}</h3>
                  <p className="text-black/80 mt-1 text-sm sm:text-base">
                    {week.week === 1 && '60% of max'}
                  </p>
                </div>

                {/* Days */}
                <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                  {week.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="border-l-4 border-yellow-500 pl-3 sm:pl-4 md:pl-6">
                      <h4 className="text-lg sm:text-xl md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">
                        Day {day.day}: {day.focus}
                      </h4>

                      <div className="space-y-3 sm:space-y-4">
                        {day.exercises.map((exercise, exIndex) => (
                          <div key={exIndex} className="bg-gray-50 rounded-lg md:rounded-xl p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <CheckCircle sx={{ color: '#F59E0B', marginTop: '2px', flexShrink: 0, fontSize: { xs: 18, sm: 20 } }} />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base break-words">{exercise.name}</h5>
                                {exercise.sets && (
                                  <p className="text-gray-700 mb-1 text-sm sm:text-base whitespace-pre-line break-words">
                                    {exercise.sets}
                                  </p>
                                )}
                                {exercise.rest && (
                                  <p className="text-xs sm:text-sm text-gray-500 break-words">
                                    <span className="font-semibold">Rest between sets:</span> {exercise.rest}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
