import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FitnessCenter, Download, CheckCircle, Error } from '@mui/icons-material';
import API_CONFIG from '../config/api';
import jsPDF from 'jspdf';

export default function Programs() {
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

  const handleGenerate = async () => {
    // Validation
    if (maxReps.pullUps === 0 && maxReps.dips === 0 && maxReps.pushUps === 0) {
      setError('Please enter at least one exercise with reps > 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.getBaseURL()}/programs/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ level, maxReps })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate program');
      }

      setProgram(data.data);
      
      // Scroll to program
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
    doc.text('4-Week Calisthenics Endurance Program', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Program content
    program.program.forEach((week, weekIndex) => {
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
            // Split sets by newlines for better formatting
            const setsLines = exercise.sets.split('\n');
            setsLines.forEach((line, idx) => {
              if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(`  ${line}`, 35, yPos);
              yPos += 6;
            });
          }
          
          if (exercise.rest) {
            doc.setFont('helvetica', 'italic');
            doc.text(`  Rest: ${exercise.rest}`, 35, yPos);
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
    doc.save(`calisthenics-program-${level}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Generate Your <span className="text-yellow-500">4-Week</span> Calisthenics Endurance Program
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter your max reps for each exercise and get a personalized 4-week endurance program designed to push your limits.
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Current Max Reps</h2>

          {/* Level Selector */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Experience Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Enter 0 if you can't do muscle-ups yet</p>
            </div>

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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-3"
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

        {/* Program Display */}
        {program && (
          <div id="program-display" className="space-y-8">
            {/* Download Button */}
            <div className="flex justify-end">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition-all shadow-lg"
              >
                <Download />
                Download PDF
              </button>
            </div>

            {/* Program Weeks */}
            {program.program.map((week, weekIndex) => (
              <motion.div
                key={weekIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: weekIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Week Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 p-6">
                  <h3 className="text-3xl font-black text-black">Week {week.week}</h3>
                  <p className="text-black/80 mt-1">
                    {week.week === 1 && '60% of max'}
                    {week.week === 2 && '70% of max'}
                    {week.week === 3 && '80% of max'}
                    {week.week === 4 && '90% of max - Challenge Week!'}
                  </p>
                </div>

                {/* Days */}
                <div className="p-6 space-y-6">
                  {week.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="border-l-4 border-yellow-500 pl-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">
                        Day {day.day}: {day.focus}
                      </h4>

                      <div className="space-y-4">
                        {day.exercises.map((exercise, exIndex) => (
                          <div key={exIndex} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle sx={{ color: '#F59E0B', marginTop: '4px', flexShrink: 0, fontSize: 20 }} />
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-2">{exercise.name}</h5>
                                {exercise.sets && (
                                  <p className="text-gray-700 mb-1">
                                    <span className="font-semibold">Sets:</span> {exercise.sets}
                                  </p>
                                )}
                                {exercise.rest && (
                                  <p className="text-sm text-gray-500">
                                    <span className="font-semibold">Rest:</span> {exercise.rest}
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
