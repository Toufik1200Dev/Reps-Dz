import React, { useState, useMemo, useRef } from 'react';
import ReloadLink from '../components/ReloadLink';
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
  Calculate
} from '@mui/icons-material';
import API_CONFIG from '../config/api';
import { useLanguage } from '../hooks/useLanguage';

const getOrCreateDeviceId = () => {
  const key = 'calorie_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'd_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
};

const USER_NAME_KEY = 'calorie_user_name';

export default function CalorieCalculator() {
  const { t } = useLanguage();
  const deviceId = useMemo(getOrCreateDeviceId, []);
  const [formData, setFormData] = useState({
    userName: typeof window !== 'undefined' ? (localStorage.getItem(USER_NAME_KEY) || '') : '',
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
  const resultsRef = useRef(null);

  // Fitness tips pool – titles/tips translated via t(); icons fixed
  const tipsPool = [
    { titleKey: 'calorie.tip1Title', tipKey: 'calorie.tip1Text', icon: <FitnessCenter className="text-3xl text-blue-500" /> },
    { titleKey: 'calorie.tip2Title', tipKey: 'calorie.tip2Text', icon: <LocalDrink sx={{ fontSize: '3rem', color: '#60A5FA' }} /> },
    { titleKey: 'calorie.tip3Title', tipKey: 'calorie.tip3Text', icon: <Bedtime sx={{ fontSize: '3rem', color: '#6366F1' }} /> },
    { titleKey: 'calorie.tip4Title', tipKey: 'calorie.tip4Text', icon: <TrendingUp className="text-3xl text-green-500" /> },
    { titleKey: 'calorie.tip5Title', tipKey: 'calorie.tip5Text', icon: <Spa sx={{ fontSize: '3rem', color: '#10B981' }} /> },
    { titleKey: 'calorie.tip6Title', tipKey: 'calorie.tip6Text', icon: <DirectionsRun sx={{ fontSize: '3rem', color: '#F97316' }} /> }
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
      setError(t('calorie.errorSelectGender'));
      return false;
    }
    if (!formData.height || formData.height <= 0 || formData.height > 250) {
      setError(t('calorie.errorHeight'));
      return false;
    }
    if (!formData.weight || formData.weight <= 0 || formData.weight > 300) {
      setError(t('calorie.errorWeight'));
      return false;
    }
    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      setError(t('calorie.errorAge'));
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

      const userName = (formData.userName && formData.userName.trim()) ? formData.userName.trim() : 'None';
      if (userName !== 'None') localStorage.setItem(USER_NAME_KEY, userName);

      try {
        const saveRes = await fetch(`${API_CONFIG.getBaseURL()}/calories/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName,
            deviceId,
            gender: formData.gender,
            height,
            weight,
            age: age || 25,
            activityLevel: formData.activityLevel || 'none',
            bmr: Math.round(bmr),
            calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            fiber: macros.fiber
          })
        });
        if (!saveRes.ok) {
          console.warn('Calorie save failed (backend may need redeploy):', saveRes.status);
        }
      } catch (apiError) {
        console.warn('Calorie save request failed:', apiError.message);
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
      setError(t('calorie.errorGeneric'));
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const macroCards = [
    { labelKey: 'calorie.macroCalories', value: results?.calories, unit: 'kcal', icon: <DirectionsRun sx={{ fontSize: '2.5rem' }} />, color: 'from-orange-400 to-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { labelKey: 'calorie.macroProtein', value: results?.protein, unit: 'g', icon: <FitnessCenter sx={{ fontSize: '2.5rem' }} />, color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { labelKey: 'calorie.macroCarbs', value: results?.carbs, unit: 'g', icon: <Restaurant sx={{ fontSize: '2.5rem' }} />, color: 'from-green-400 to-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { labelKey: 'calorie.macroFat', value: results?.fat, unit: 'g', icon: <Scale sx={{ fontSize: '2.5rem' }} />, color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { labelKey: 'calorie.macroFiber', value: results?.fiber, unit: 'g', icon: <Spa sx={{ fontSize: '2.5rem' }} />, color: 'from-emerald-400 to-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' }
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
            {t('calorie.title')} <span className="text-orange-500">{t('calorie.calculator')}</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('calorie.subtitle')}
          </p>
          <p className="mt-4 text-sm text-gray-500 max-w-xl mx-auto">
            {t('calorie.wantFullGuide') || 'Want to understand calories to lose fat?'} <ReloadLink to="/guides/calories-needed-to-lose-fat-full-guide" className="text-orange-600 font-semibold hover:underline">{t('calorie.readCaloriesGuide') || 'Read our full Calories guide'}</ReloadLink>
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
          >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('calorie.yourInfo')}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('calorie.yourName')}
                  </label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    placeholder={t('calorie.yourNamePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    {t('calorie.gender')} <span className="text-red-500">*</span>
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
                      <div className="font-bold">{t('calorie.male')}</div>
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
                      <div className="font-bold">{t('calorie.female')}</div>
                    </button>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('calorie.height')} <span className="text-red-500">*</span>
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
                    {t('calorie.weight')} <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('calorie.age')}
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('calorie.activityLevel')}
                  </label>
                  <select
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">{t('calorie.selectActivity')}</option>
                    <option value="low">{t('calorie.activityLow')}</option>
                    <option value="moderate">{t('calorie.activityModerate')}</option>
                    <option value="high">{t('calorie.activityHigh')}</option>
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
                      {t('calorie.calculating')}
                    </>
                  ) : (
                    <>
                      <Calculate sx={{ fontSize: '1.5rem' }} />
                      {t('calorie.calculate')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
        </div>

        {/* Results Section – on-click ad shows only when results are visible (contentRef) */}
        {results && (
          <motion.div
            ref={resultsRef}
            id="results"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-14 max-w-4xl mx-auto"
          >
            {/* Summary card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-5 sm:px-8 sm:py-6">
                <p className="text-orange-100 text-sm font-semibold uppercase tracking-widest mb-1">{t('calorie.dailyTarget')}</p>
                <p className="text-white text-4xl sm:text-5xl font-black tracking-tight">{results.calories.toLocaleString()} <span className="text-orange-200 font-bold text-2xl sm:text-3xl">kcal</span></p>
                <p className="text-orange-100 text-sm mt-2">{t('calorie.basedOnProfile')}</p>
              </div>
              <div className="px-6 py-4 sm:px-8 sm:py-5 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{t('calorie.bmrAtRest')}</p>
                    <p className="text-gray-900 text-xl font-bold">{results.bmr.toLocaleString()} kcal{t('calorie.perDay')}</p>
                  </div>
                  <p className="text-gray-500 text-sm max-w-xs">{t('calorie.bmrDesc')}</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">{t('calorie.macroTargets')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {macroCards.filter(c => c.labelKey !== 'calorie.macroCalories').map((card, index) => (
                <motion.div
                  key={card.labelKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.06 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className={`px-5 py-4 ${card.bgColor} border-b border-gray-100`}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{card.icon}</span>
                      <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t(card.labelKey)}</span>
                    </div>
                  </div>
                  <div className="px-5 py-5 text-center">
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">{card.value ?? '\u2014'}</p>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{card.unit}{t('calorie.perDay')}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 mb-10 border border-gray-100">
              <Spa sx={{ fontSize: 20, color: '#059669' }} />
              <span><strong className="text-gray-800">{t('calorie.fiberNote')}</strong> {results.fiber} {t('calorie.fiberRecommended')}</span>
            </div>

            {/* Fitness Tips */}
            {fitnessTips.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">{t('calorie.fitnessTips')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fitnessTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.08 }}
                      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          {tip.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{t(tip.titleKey)}</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">{t(tip.tipKey)}</p>
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
