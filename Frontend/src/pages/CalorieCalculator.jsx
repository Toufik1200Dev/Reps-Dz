import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  DirectionsRun,
  Restaurant,
  TrendingUp,
  LocalDrink,
  Bedtime,
  FitnessCenter,
  Spa,
  Calculate,
  Info
} from '@mui/icons-material';
import API_CONFIG from '../config/api';

export default function CalorieCalculator() {
  const [formData, setFormData] = useState({
    gender: '',
    height: '',
    weight: '',
    age: '',
    activityLevel: ''
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fitnessTips, setFitnessTips] = useState([]);

  // Fitness tips pool
  const tipsPool = [
    {
      title: "Protein Timing",
      tip: "Aim to consume 20-30g of protein within 30 minutes after your workout for optimal muscle recovery and growth.",
      icon: <FitnessCenter className="text-3xl text-blue-500" />
    },
    {
      title: "Stay Hydrated",
      tip: "Drink at least 2-3 liters of water daily. Your muscles need proper hydration to perform and recover effectively.",
      icon: <LocalDrink sx={{ fontSize: '3rem', color: '#60A5FA' }} />
    },
    {
      title: "Recovery & Sleep",
      tip: "Prioritize 7-9 hours of quality sleep. Growth hormone production peaks during deep sleep, essential for muscle recovery.",
      icon: <Bedtime sx={{ fontSize: '3rem', color: '#6366F1' }} />
    },
    {
      title: "Strength Nutrition",
      tip: "For strength training, ensure adequate carbs pre-workout for energy and protein post-workout for repair.",
      icon: <TrendingUp className="text-3xl text-green-500" />
    },
    {
      title: "Fiber Benefits",
      tip: "Adequate fiber intake supports digestion, keeps you full longer, and helps maintain steady energy levels throughout the day.",
      icon: <Spa sx={{ fontSize: '3rem', color: '#10B981' }} />
    },
    {
      title: "Meal Timing",
      tip: "Space your protein intake evenly throughout the day (every 3-4 hours) to maximize muscle protein synthesis.",
      icon: <DirectionsRun sx={{ fontSize: '3rem', color: '#F97316' }} />
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateInputs = () => {
    if (!formData.gender) {
      setError('Please select your gender');
      return false;
    }
    if (!formData.height || formData.height <= 0 || formData.height > 250) {
      setError('Please enter a valid height (1-250 cm)');
      return false;
    }
    if (!formData.weight || formData.weight <= 0 || formData.weight > 300) {
      setError('Please enter a valid weight (1-300 kg)');
      return false;
    }
    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      setError('Please enter a valid age (1-120 years)');
      return false;
    }
    return true;
  };

  const calculateBMR = (gender, weight, height, age) => {
    const ageValue = age || 25; // Default to 25 if not provided
    if (gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * ageValue) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * ageValue) - 161;
    }
  };

  const calculateCalories = (bmr, activityLevel) => {
    if (!activityLevel) {
      return bmr * 1.4; // Default maintenance estimate
    }
    
    const multipliers = {
      low: 1.2,
      moderate: 1.55,
      high: 1.75
    };
    
    return bmr * multipliers[activityLevel];
  };

  const calculateMacros = (weight, calories) => {
    // Protein: 2g per kg bodyweight
    const protein = Math.round(weight * 2);
    const proteinCalories = protein * 4;
    
    // Fat: 0.8g per kg bodyweight
    const fat = Math.round(weight * 0.8);
    const fatCalories = fat * 9;
    
    // Remaining calories for carbs
    const remainingCalories = calories - proteinCalories - fatCalories;
    const carbs = Math.max(0, Math.round(remainingCalories / 4));
    
    // Fiber: 14g per 1000 kcal
    const fiber = Math.round((calories / 1000) * 14);
    
    return {
      protein,
      carbs,
      fat,
      fiber
    };
  };

  const handleCalculate = async () => {
    setError(null);
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      // Calculate locally first (instant feedback)
      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height);
      const age = formData.age ? parseFloat(formData.age) : null;

      const bmr = calculateBMR(formData.gender, weight, height, age);
      const calories = Math.round(calculateCalories(bmr, formData.activityLevel));
      const macros = calculateMacros(weight, calories);

      // Optionally send to backend for logging/storage
      try {
        await fetch(`${API_CONFIG.getBaseURL()}/calories/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gender: formData.gender,
            height,
            weight,
            age: age || 25,
            activityLevel: formData.activityLevel || 'none',
            bmr,
            calories,
            macros
          })
        });
      } catch (apiError) {
        // Silently fail - calculation works client-side
      }

      setResults({
        calories,
        ...macros,
        bmr: Math.round(bmr)
      });

      // Show 2 random fitness tips
      const shuffled = [...tipsPool].sort(() => 0.5 - Math.random());
      setFitnessTips(shuffled.slice(0, 2));

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      setError('Error calculating. Please check your inputs and try again.');
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const macroCards = [
    {
      label: 'Calories',
      value: results?.calories,
      unit: 'kcal',
      icon: <DirectionsRun sx={{ fontSize: '2.5rem' }} />,
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      label: 'Protein',
      value: results?.protein,
      unit: 'g',
      icon: <FitnessCenter sx={{ fontSize: '2.5rem' }} />,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Carbs',
      value: results?.carbs,
      unit: 'g',
      icon: <Restaurant sx={{ fontSize: '2.5rem' }} />,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      label: 'Fat',
      value: results?.fat,
      unit: 'g',
      icon: <Scale sx={{ fontSize: '2.5rem' }} />,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Fiber',
      value: results?.fiber,
      unit: 'g',
      icon: <Spa sx={{ fontSize: '2.5rem' }} />,
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Calculate sx={{ fontSize: '2rem', color: 'white' }} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Calorie & Macro <span className="text-orange-500">Calculator</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Calculate your daily caloric needs and macronutrient targets based on your body metrics and activity level
          </p>
          {!formData.age && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
              <Info className="text-lg" />
              <span>Age is optional. Default age of 25 years will be used if not provided.</span>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>
              
              <div className="space-y-6">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: 'gender', value: 'male' } })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.gender === 'male'
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-bold">Male</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: 'gender', value: 'female' } })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.gender === 'female'
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-bold">Female</div>
                    </button>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Height (cm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="175"
                    min="1"
                    max="250"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="70"
                    min="1"
                    max="300"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Age (Optional) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Age (years)
                    <span className="text-gray-500 text-xs font-normal ml-2">(Optional - defaults to 25)</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="25"
                    min="1"
                    max="120"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Activity Level (Optional) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Activity Level
                    <span className="text-gray-500 text-xs font-normal ml-2">(Optional - defaults to moderate)</span>
                  </label>
                  <select
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select activity level</option>
                    <option value="low">Low (sedentary, minimal exercise)</option>
                    <option value="moderate">Moderate (3-5 days/week exercise)</option>
                    <option value="high">High (6-7 days/week, intense training)</option>
                  </select>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Calculate Button */}
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculate sx={{ fontSize: '1.5rem' }} />
                      Calculate
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <div className="font-bold text-gray-900 mb-1">BMR Calculation</div>
                  <p>Uses the Mifflin-St Jeor equation to estimate your Basal Metabolic Rate (calories burned at rest).</p>
                </div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">Activity Multipliers</div>
                  <p>Low: Ã—1.2 | Moderate: Ã—1.55 | High: Ã—1.75</p>
                  <p className="text-xs mt-1">If not specified, uses Ã—1.4 (maintenance estimate)</p>
                </div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">Macronutrients</div>
                  <p>Protein: 2g/kg | Fat: 0.8g/kg | Carbs: Remaining calories</p>
                </div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">Fiber</div>
                  <p>14g per 1000 kcal (recommended daily intake)</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <motion.div
            id="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Daily Targets</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
              {macroCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${card.bgColor} ${card.borderColor} border-2 rounded-2xl p-6 text-center`}
                >
                  <div className="flex justify-center mb-3 text-gray-600">
                    {card.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {card.value || 'â€”'}
                  </div>
                  <div className="text-sm font-medium text-gray-600">{card.unit}</div>
                  <div className="text-xs font-bold text-gray-700 mt-2">{card.label}</div>
                </motion.div>
              ))}
            </div>

            {/* BMR Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 max-w-2xl mx-auto text-center">
              <p className="text-sm text-blue-800">
                <span className="font-bold">BMR (Basal Metabolic Rate):</span> {results.bmr} kcal/day
                <span className="text-blue-600 ml-2">(Calories burned at complete rest)</span>
              </p>
            </div>

            {/* Fitness Tips */}
            {fitnessTips.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">ðŸ’ª Fitness Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fitnessTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {tip.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 mb-2">{tip.title}</h4>
                          <p className="text-gray-600">{tip.tip}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
