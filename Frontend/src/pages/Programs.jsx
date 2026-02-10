import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { FitnessCenter, Download, CheckCircle, Error as ErrorIcon, CalendarViewMonth, WorkspacePremium, CalendarMonth, Restaurant, Description, Bolt, MenuBook, Payment, Star, Create, ArrowForward } from '@mui/icons-material';
import API_CONFIG from '../config/api';
import { useLanguage } from '../hooks/useLanguage';
import { trackProgramPlanSelect, trackProgramGenerate } from '../utils/analytics';

const PROGRAM_FORM_LEVEL_KEY = 'program_form_level';
const PROGRAM_FORM_MAXREPS_KEY = 'program_form_maxReps';
const PROGRAM_FORM_NAME_KEY = 'program_form_name';
const PROGRAM_FORM_AGE_KEY = 'program_form_age';
const PROGRAM_FORM_PLAN_KEY = 'program_form_plan';
const PROGRAM_FORM_HEIGHT_KEY = 'program_form_heightCm';
const PROGRAM_FORM_WEIGHT_KEY = 'program_form_weightKg';
const PROGRAM_FORM_EMAIL_KEY = 'program_form_email';
const PROGRAM_FORM_CALISTHENICS_MAIN_KEY = 'program_form_calisthenicsMain';
const PROGRAM_FORM_OTHER_SPORT_KEY = 'program_form_otherSport';
const PROGRAM_FORM_GOALS_KEY = 'program_form_goals';
const OTHER_SPORTS = ['bodybuilding', 'judo', 'boxing', 'wrestling', 'swimming'];
const GOAL_OPTIONS = [
  { id: 'lose_weight', label: 'Lose Weight' },
  { id: 'improve_endurance', label: 'Improve Endurance' },
  { id: 'build_muscle', label: 'Build Muscle' },
  { id: 'learn_skills', label: 'Learn New Skills' }
];
const defaultMaxReps = { muscleUp: 0, pullUps: 10, dips: 15, pushUps: 25, squats: 40, legRaises: 15, burpees: 15 };

const inputBase = 'w-full px-3 py-2 bg-gray-50/80 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 focus:bg-white text-gray-900 text-sm sm:text-base placeholder:text-gray-500 transition-all duration-200 shadow-sm';
const labelBase = 'block text-sm font-bold text-gray-700 mb-1';

const validGoalIds = ['lose_weight', 'improve_endurance', 'build_muscle', 'learn_skills'];

function loadSavedForm() {
  if (typeof window === 'undefined') return { level: 'intermediate', maxReps: defaultMaxReps, name: '', age: '', email: '', plan: 'free', heightCm: '', weightKg: '', calisthenicsMainSport: true, otherSport: '', goals: [] };
  try {
    const level = localStorage.getItem(PROGRAM_FORM_LEVEL_KEY);
    const raw = localStorage.getItem(PROGRAM_FORM_MAXREPS_KEY);
    const name = localStorage.getItem(PROGRAM_FORM_NAME_KEY) || '';
    const age = localStorage.getItem(PROGRAM_FORM_AGE_KEY) || '';
    const email = localStorage.getItem(PROGRAM_FORM_EMAIL_KEY) || '';
    const plan = localStorage.getItem(PROGRAM_FORM_PLAN_KEY) || 'free';
    const heightCm = localStorage.getItem(PROGRAM_FORM_HEIGHT_KEY) || '';
    const weightKg = localStorage.getItem(PROGRAM_FORM_WEIGHT_KEY) || '';
    const calisthenicsMain = localStorage.getItem(PROGRAM_FORM_CALISTHENICS_MAIN_KEY);
    const otherSport = localStorage.getItem(PROGRAM_FORM_OTHER_SPORT_KEY) || '';
    const goalsRaw = localStorage.getItem(PROGRAM_FORM_GOALS_KEY);
    const maxReps = raw ? { ...defaultMaxReps, ...JSON.parse(raw) } : defaultMaxReps;
    const validLevel = ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'intermediate';
    const validPlan = ['paid', 'paid12', 'customized'].includes(plan) ? plan : 'free';
    const calisthenicsMainSport = calisthenicsMain === 'false' ? false : true;
    const validOtherSport = OTHER_SPORTS.includes(otherSport) ? otherSport : '';
    let goals = [];
    try {
      const parsed = goalsRaw ? JSON.parse(goalsRaw) : [];
      goals = Array.isArray(parsed) ? parsed.filter((g) => validGoalIds.includes(g)) : [];
    } catch { goals = []; }
    return { level: validLevel, maxReps, name: typeof name === 'string' ? name : '', age: typeof age === 'string' ? age : '', email: typeof email === 'string' ? email : '', plan: validPlan, heightCm: String(heightCm), weightKg: String(weightKg), calisthenicsMainSport, otherSport: validOtherSport, goals };
  } catch {
    return { level: 'intermediate', maxReps: defaultMaxReps, name: '', age: '', email: '', plan: 'free', heightCm: '', weightKg: '', calisthenicsMainSport: true, otherSport: '', goals: [] };
  }
}

export default function Programs() {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  const [, setSearchParams] = useSearchParams();
  const [level, setLevel] = useState(() => loadSavedForm().level);
  const [maxReps, setMaxReps] = useState(() => loadSavedForm().maxReps);
  const [name, setName] = useState(() => loadSavedForm().name);
  const [age, setAge] = useState(() => loadSavedForm().age);
  const [email, setEmail] = useState(() => loadSavedForm().email);
  const [plan, setPlan] = useState(() => loadSavedForm().plan);
  const [heightCm, setHeightCm] = useState(() => loadSavedForm().heightCm);
  const [weightKg, setWeightKg] = useState(() => loadSavedForm().weightKg);
  const [calisthenicsMainSport, setCalisthenicsMainSport] = useState(() => loadSavedForm().calisthenicsMainSport);
  const [otherSport, setOtherSport] = useState(() => loadSavedForm().otherSport);
  const [goals, setGoals] = useState(() => loadSavedForm().goals);
  const [sentToEmail, setSentToEmail] = useState(null);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fulfillingFromPayPal, setFulfillingFromPayPal] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [freeLimitStatus, setFreeLimitStatus] = useState(null); // { used, max, remaining }
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [customPull, setCustomPull] = useState('');
  const [customPush, setCustomPush] = useState('');
  const [customCardioLegs, setCustomCardioLegs] = useState('');
  const [customOther, setCustomOther] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customizedRequestSent, setCustomizedRequestSent] = useState(false);
  const progressIntervalRef = useRef(null);
  const statusIntervalRef = useRef(null);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const fulfilledSessionRef = useRef(null);
  const formRef = useRef(null);
  const personalInfoRef = useRef(null);
  const contactRef = useRef(null);
  const repsRef = useRef(null);
  const progressBlockRef = useRef(null);

  const MIN_LOADING_MS = 4800;
  const statusKeys = [
    'programs.statusAnalyzing',
    'programs.statusBuilding',
    'programs.statusOptimizing',
    'programs.statusProgression',
    'programs.statusIntensity',
    'programs.statusFinalizing'
  ];

  useEffect(() => {
    if (!loading) return;
    setLoadingElapsed(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 1.5, 88));
    }, 80);
    statusIntervalRef.current = setInterval(() => {
      setStatusIndex((i) => (i + 1) % statusKeys.length);
    }, 800);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [loading, statusKeys.length]);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLoadingElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (!loading && progress === 100) {
      const t = setTimeout(() => setProgress(0), 600);
      return () => clearTimeout(t);
    }
  }, [loading, progress]);


  useEffect(() => {
    const prev = document.title;
    document.title = 'Personalized Calisthenics Programs | Toufik Calisthenics';
    return () => { document.title = prev; };
  }, []);

  // Scroll to loading animation when generating (payment or free)
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      progressBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => clearTimeout(t);
  }, [loading]);

  const isPaidPlan = plan === 'paid' || plan === 'paid12';
  const isCustomized = plan === 'customized';

  // Fetch free limit status when email changes (valid email only)
  useEffect(() => {
    if (plan !== 'free') return;
    const emailTrimmed = (email && String(email).trim()) || '';
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setFreeLimitStatus(null);
      return;
    }
    fetch(`${API_CONFIG.getBaseURL()}/programs/free-limit?email=${encodeURIComponent(emailTrimmed)}`)
      .then((r) => r.json())
      .then((data) => setFreeLimitStatus({ used: data.used ?? 0, max: data.max ?? 3, remaining: data.remaining ?? 3 }))
      .catch(() => setFreeLimitStatus(null));
  }, [plan, email]);

  // Fulfill paid program after PayPal approval (called from PayPalButtons onApprove)
  const handlePayPalApprove = (orderId) => {
    if (fulfilledSessionRef.current === orderId) return;
    fulfilledSessionRef.current = orderId;
    setLoading(true);
    setFulfillingFromPayPal(true);
    setError(null);
    setProgress(60);
    fetch(`${API_CONFIG.getBaseURL()}/programs/fulfill-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId })
    })
      .then(async (r) => {
        const text = await r.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(r.ok ? 'Invalid response' : `Server error (${r.status})`);
        }
        if (!r.ok) {
          throw new Error(data.message || `Request failed (${r.status})`);
        }
        return data;
      })
      .then((data) => {
        if (data.success) {
          setProgress(100);
          setSentToEmail(data.data?.email || '');
          setShowThanksModal(true);
          trackProgramGenerate('paid', true);
          setSearchParams({}, { replace: true });
        } else {
          setError(data.message || 'Failed to send your program.');
        }
      })
      .catch((err) => {
        setError(err.message || t('programs.errorGeneric'));
      })
      .finally(() => {
        setLoading(false);
        setFulfillingFromPayPal(false);
      });
  };

  // Persist form to localStorage (temporary save when user changes page)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PROGRAM_FORM_LEVEL_KEY, level);
      localStorage.setItem(PROGRAM_FORM_MAXREPS_KEY, JSON.stringify(maxReps));
      localStorage.setItem(PROGRAM_FORM_NAME_KEY, name);
      localStorage.setItem(PROGRAM_FORM_AGE_KEY, age);
      localStorage.setItem(PROGRAM_FORM_PLAN_KEY, plan);
      localStorage.setItem(PROGRAM_FORM_HEIGHT_KEY, heightCm);
      localStorage.setItem(PROGRAM_FORM_WEIGHT_KEY, weightKg);
      localStorage.setItem(PROGRAM_FORM_EMAIL_KEY, email);
      localStorage.setItem(PROGRAM_FORM_CALISTHENICS_MAIN_KEY, String(calisthenicsMainSport));
      localStorage.setItem(PROGRAM_FORM_OTHER_SPORT_KEY, otherSport);
      localStorage.setItem(PROGRAM_FORM_GOALS_KEY, JSON.stringify(goals));
    } catch {
      // ignore quota / private mode
    }
  }, [level, maxReps, name, age, email, plan, heightCm, weightKg, calisthenicsMainSport, otherSport, goals]);

  /** Validate required stats and scroll to first invalid field. Returns true if valid. */
  const validateAndScroll = () => {
    const nameTrimmed = (name && String(name).trim()) || '';
    const emailTrimmed = (email && String(email).trim()) || '';
    const ageNum = age ? parseInt(age, 10) : NaN;
    const h = heightCm ? Number(heightCm) : NaN;
    const w = weightKg ? Number(weightKg) : NaN;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    const validAge = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 120;
    const validHeight = !isNaN(h) && h >= 100 && h <= 250;
    const validWeight = !isNaN(w) && w >= 30 && w <= 300;

    if (!nameTrimmed) {
      setError(t('programs.errorNameRequired') || 'Please enter your name.');
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!validAge) {
      setError(t('programs.errorAgeRequired') || 'Please enter your age (13–120).');
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!validHeight) {
      setError(t('programs.errorHeightRequired') || 'Please enter your height (100–250 cm).');
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!validWeight) {
      setError(t('programs.errorWeightRequired') || 'Please enter your weight (30–300 kg).');
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!validEmail) {
      setError(t('programs.errorEmailRequired') || 'Please enter a valid email.');
      contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!isCustomized && maxReps.pullUps === 0 && maxReps.dips === 0 && maxReps.pushUps === 0) {
      setError(t('programs.errorReps') || 'Please enter at least one exercise with reps > 0');
      repsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    setError(null);
    return true;
  };

  const handleRepChange = (exercise, value) => {
    const numValue = parseInt(value) || 0;
    setMaxReps(prev => ({
      ...prev,
      [exercise]: Math.max(0, numValue)
    }));
    setError(null);
  };

  const handleGenerate = async () => {
    if (!validateAndScroll()) return;
    const emailTrimmed = (email && String(email).trim()) || '';

    const isPaid = plan === 'paid' || plan === 'paid12';

    setLoading(true);
    setError(null);
    setProgress(0);
    setStatusIndex(0);
    setShowThanksModal(false);
    setSentToEmail(null);
    const payloadMaxReps = level === 'beginner' ? { ...maxReps, muscleUp: 0 } : maxReps;
    const minDelay = new Promise((r) => setTimeout(r, MIN_LOADING_MS));

    try {
      if (isPaid) return; // Paid flow handled by PayPal button

      const h = heightCm ? Number(heightCm) : undefined;
      const w = weightKg ? Number(weightKg) : undefined;
      const ageNum = age ? parseInt(age, 10) : NaN;
      const validAge = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 120;
      const [, response] = await Promise.all([
        minDelay,
        fetch(`${API_CONFIG.getBaseURL()}/programs/send-free-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailTrimmed,
            userName: (name && String(name).trim()) || undefined,
            userAge: validAge ? ageNum : undefined,
            level,
            maxReps: payloadMaxReps,
            heightCm: h >= 100 && h <= 250 ? h : undefined,
            weightKg: w >= 30 && w <= 300 ? w : undefined,
            calisthenicsMainSport,
            otherSport: !calisthenicsMainSport && otherSport ? otherSport : undefined,
            goals: calisthenicsMainSport && Array.isArray(goals) && goals.length > 0 ? goals : undefined
          })
        })
      ]);
      const text = await response.text();
      let resData;
      try {
        resData = text ? JSON.parse(text) : {};
      } catch {
        if (text.trimStart().startsWith('<')) {
          throw new Error('Server returned a page instead of data. Is the backend running? Check the API URL.');
        }
        throw new Error('Invalid server response.');
      }
      if (!response.ok) throw new Error(resData.message || 'Failed to send program to your email');
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      setSentToEmail(resData.data?.email || emailTrimmed);
      setShowThanksModal(true);
      setFreeLimitStatus((prev) => prev ? { ...prev, used: prev.used + 1, remaining: Math.max(0, prev.remaining - 1) } : null);
      trackProgramGenerate('free', true);
    } catch (err) {
      trackProgramGenerate(plan, false);
      console.error('Error sending free program:', err);
      setError(err.message || t('programs.errorGeneric'));
      // Refetch limit status on error (e.g. 429 limit reached)
      const emailTrimmed = (email && String(email).trim()) || '';
      if (emailTrimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        fetch(`${API_CONFIG.getBaseURL()}/programs/free-limit?email=${encodeURIComponent(emailTrimmed)}`)
          .then((r) => r.json())
          .then((data) => setFreeLimitStatus({ used: data.used ?? 0, max: data.max ?? 3, remaining: data.remaining ?? 3 }))
          .catch(() => {});
      }
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
      setLoading(false);
    }
  };


  return (
    <div className="programs-page min-h-screen bg-gray-50 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Thanks / Verify Email Modal Popup */}
        <AnimatePresence>
          {showThanksModal && sentToEmail && !loading && (
            <motion.div
              key={customizedRequestSent ? 'custom' : 'program'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowThanksModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-sm w-full p-6 sm:p-8 bg-white rounded-2xl shadow-xl text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle sx={{ color: 'white', fontSize: 36 }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('programs.thanksTitle') || 'Thanks!'}</h3>
                <p className="text-gray-600 mb-2">
                  {customizedRequestSent
                    ? "Your customized program request has been sent. We'll contact you at your email with a quote."
                    : (t('programs.verifyEmailHint') || 'Please verify your email to receive your program.')}
                </p>
                <p className="text-sm font-medium text-amber-700 truncate">{sentToEmail}</p>
                <p className="text-xs text-gray-500 mt-3">{t('programs.checkSpamHint') || 'Check your inbox and spam folder.'}</p>
                <button
                  type="button"
                  onClick={() => { setShowThanksModal(false); setCustomizedRequestSent(false); }}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
                >
                  {t('programs.ok') || 'OK'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <ErrorIcon sx={{ color: '#DC2626', flexShrink: 0 }} />
              <div>
                <p className="text-red-900 font-bold">{t('programs.paymentErrorTitle')}</p>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

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
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 px-2">
            {t('programs.heroTitle')}
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-amber-600 mb-3 md:mb-4 px-2">
            {t('programs.heroSlogan') || 'Calisthenics for everybody'}
          </p>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            {t('programs.heroDesc')}
          </p>
          <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto px-2">
            {t('programs.heroNutrition')}
          </p>
          {/* How it works */}
          <div className="mt-10 sm:mt-12">
            <h3 className="text-center text-lg font-bold text-gray-700 mb-6">{t('programs.howItWorks') || 'How it works'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-4 sm:gap-2 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white/80 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-shadow min-h-[140px]"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-base shadow-sm"
                >
                  1
                </motion.span>
                <div className="text-center">
                  <p className="font-bold text-gray-800">{t('programs.step1')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('programs.step1Desc')}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="hidden sm:flex items-center justify-center px-2"
              >
                <motion.div
                  animate={{ x: isRtl ? [-4, 0, -4] : [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="text-amber-500"
                >
                  <ArrowForward sx={{ fontSize: 28, transform: isRtl ? 'scaleX(-1)' : 'none' }} />
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white/80 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-shadow min-h-[140px]"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.35 }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-base shadow-sm"
                >
                  2
                </motion.span>
                <div className="text-center">
                  <p className="font-bold text-gray-800">{t('programs.step2')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('programs.step2Desc')}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="hidden sm:flex items-center justify-center px-2"
              >
                <motion.div
                  animate={{ x: isRtl ? [-4, 0, -4] : [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
                  className="text-amber-500"
                >
                  <ArrowForward sx={{ fontSize: 28, transform: isRtl ? 'scaleX(-1)' : 'none' }} />
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white/80 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-shadow min-h-[140px]"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.5 }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-base shadow-sm"
                >
                  3
                </motion.span>
                <div className="text-center">
                  <p className="font-bold text-gray-800">{t('programs.step3')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('programs.step3Desc')}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.65 }}
                className="hidden sm:flex items-center justify-center px-2"
              >
                <motion.div
                  animate={{ x: isRtl ? [-4, 0, -4] : [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
                  className="text-amber-500"
                >
                  <ArrowForward sx={{ fontSize: 28, transform: isRtl ? 'scaleX(-1)' : 'none' }} />
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.55 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white/80 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-shadow min-h-[140px]"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.65 }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-base shadow-sm"
                >
                  4
                </motion.span>
                <div className="text-center">
                  <p className="font-bold text-gray-800">{t('programs.step4') || 'Check your email'}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('programs.step4Desc') || 'Check your inbox—your program lands there.'}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Plan choice – full details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 md:mb-10"
        >
          <h2 className="text-center text-lg sm:text-xl font-bold text-gray-700 mb-4 md:mb-6">
            {t('programs.choosePlan') || 'Choose your plan'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
            {/* Free plan */}
            <button
              type="button"
              onClick={() => { setPlan('free'); setError(null); setShowPaymentStep(false); trackProgramPlanSelect('free'); }}
              className={`text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 flex flex-col min-h-[260px] ${
                plan === 'free'
                  ? 'border-yellow-500 bg-yellow-50 shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-500/30'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-center mb-3">
                <span className={`p-2 rounded-xl ${plan === 'free' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  <CalendarMonth sx={{ fontSize: 28 }} />
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black mb-4 text-center ${plan === 'free' ? 'text-yellow-900' : 'text-gray-800'}`}>
                {t('programs.planFreeName') || '1 Week'}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                <li className="flex items-center gap-2 font-medium">
                  <CalendarMonth sx={{ fontSize: 18, color: plan === 'free' ? '#B45309' : '#6b7280' }} />
                  4 sessions (Pull, Push, Legs+Cardio, Endurance)
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Restaurant sx={{ fontSize: 18, color: plan === 'free' ? '#B45309' : '#6b7280' }} />
                  Daily calorie & protein targets
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Download sx={{ fontSize: 18, color: plan === 'free' ? '#B45309' : '#6b7280' }} />
                  Delivered by email
                </li>
              </ul>
              <p className={`text-base font-bold pt-3 border-t border-gray-200 mt-auto flex items-center justify-center gap-2 ${plan === 'free' ? 'text-yellow-800' : 'text-gray-600'}`}>
                <CheckCircle sx={{ fontSize: 20 }} />
                {t('programs.planFreePrice') || 'Free'}
              </p>
            </button>
            {/* 6-week paid plan */}
            <button
              type="button"
              onClick={() => { setPlan('paid'); setError(null); setShowPaymentStep(false); trackProgramPlanSelect('paid'); }}
              className={`text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 flex flex-col min-h-[260px] ${
                plan === 'paid'
                  ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30'
                  : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/50'
              }`}
            >
              <div className="flex justify-center mb-3">
                <span className={`p-2 rounded-xl ${plan === 'paid' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  <WorkspacePremium sx={{ fontSize: 28 }} />
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black mb-4 text-center ${plan === 'paid' ? 'text-amber-900' : 'text-gray-800'}`}>
                {t('programs.planPaidName') || '6 Weeks'}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                <li className="flex items-center gap-2 font-medium">
                  <CalendarViewMonth sx={{ fontSize: 18, color: plan === 'paid' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBullet1') || '5 sessions/week'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Bolt sx={{ fontSize: 18, color: plan === 'paid' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBulletAutoLevel') || 'Auto level detection from your rep maxes'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Restaurant sx={{ fontSize: 18, color: plan === 'paid' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBullet2') || 'Nutrition targets + sample meal plan'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <FitnessCenter sx={{ fontSize: 18, color: plan === 'paid' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBullet3') || 'Warm-ups, progression, and deload week'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <MenuBook sx={{ fontSize: 18, color: plan === 'paid' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBullet4') || 'Coach-designed methods'}
                </li>
              </ul>
              <p className={`text-base font-bold pt-3 border-t border-gray-200 mt-auto flex items-center justify-center gap-2 ${plan === 'paid' ? 'text-amber-800' : 'text-gray-600'}`}>
                <Payment sx={{ fontSize: 20 }} />
                {t('programs.planPaidPrice') || '$39.99'}
              </p>
            </button>

            {/* 12-week plan - Best deal */}
            <button
              type="button"
              onClick={() => { setPlan('paid12'); setError(null); setShowPaymentStep(false); trackProgramPlanSelect('paid12'); }}
              className={`text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 flex flex-col min-h-[260px] relative overflow-hidden ${
                plan === 'paid12'
                  ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30'
                  : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/50'
              }`}
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center gap-1">
                <Star sx={{ fontSize: 14 }} /> Best Value
              </div>
              <div className="flex justify-center mb-3">
                <span className={`p-2 rounded-xl ${plan === 'paid12' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  <CalendarViewMonth sx={{ fontSize: 28 }} />
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black mb-4 text-center ${plan === 'paid12' ? 'text-amber-900' : 'text-gray-800'}`}>
                12 Weeks
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                <li className="flex items-center gap-2 font-medium">
                  <CalendarViewMonth sx={{ fontSize: 18, color: plan === 'paid12' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaid12Bullet1') || 'Full structured program for long-term progression'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Bolt sx={{ fontSize: 18, color: plan === 'paid12' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaid12Bullet2') || 'Auto level detection and sport-specific adaptations'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Restaurant sx={{ fontSize: 18, color: plan === 'paid12' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBullet2') || 'Nutrition targets + sample meal plan'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <FitnessCenter sx={{ fontSize: 18, color: plan === 'paid12' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBullet3') || 'Warm-ups, progressive overload, deload week'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <MenuBook sx={{ fontSize: 18, color: plan === 'paid12' ? '#B45309' : '#6b7280' }} />
                  {t('programs.planPaidBullet4') || 'Coach-designed methods'}
                </li>
              </ul>
              <p className={`text-base font-bold pt-3 border-t border-gray-200 mt-auto flex items-center justify-center gap-2 ${plan === 'paid12' ? 'text-amber-800' : 'text-gray-600'}`}>
                <Payment sx={{ fontSize: 20 }} />
                $54.99 – Best Value
              </p>
            </button>

            {/* Customized plan */}
            <button
              type="button"
              onClick={() => { setPlan('customized'); setError(null); setShowPaymentStep(false); trackProgramPlanSelect('customized'); }}
              className={`text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 flex flex-col min-h-[260px] ${
                plan === 'customized'
                  ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/30'
                  : 'border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/50'
              }`}
            >
              <div className="flex justify-center mb-3">
                <span className={`p-2 rounded-xl ${plan === 'customized' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                  <Create sx={{ fontSize: 28 }} />
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black mb-4 text-center ${plan === 'customized' ? 'text-violet-900' : 'text-gray-800'}`}>
                Customized
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                <li className="flex items-center gap-2 font-medium">
                  <FitnessCenter sx={{ fontSize: 16, color: plan === 'customized' ? '#7c3aed' : '#6b7280' }} />
                  {t('programs.planCustomBullet1') || 'Fully personalized'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Description sx={{ fontSize: 16, color: plan === 'customized' ? '#7c3aed' : '#6b7280' }} />
                  {t('programs.planCustomBullet2') || 'Detailed inputs from you'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Download sx={{ fontSize: 16, color: plan === 'customized' ? '#7c3aed' : '#6b7280' }} />
                  {t('programs.planCustomBullet3') || 'Tailored for your sport, level, and goals'}
                </li>
              </ul>
              <p className={`text-base font-bold pt-3 border-t border-gray-200 mt-auto flex items-center justify-center gap-2 ${plan === 'customized' ? 'text-violet-800' : 'text-gray-600'}`}>
                Price on request
              </p>
            </button>
          </div>
        </motion.div>

        {/* Input Form */}
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 mb-5 overflow-hidden"
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{t('programs.formTitle')}</h2>

          {/* Personal info */}
          <div ref={personalInfoRef} className="mb-4 p-3 sm:p-4 rounded-lg border border-gray-100 bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-800 mb-3">{t('programs.sectionPersonalInfo') || 'Personal info'}</h3>
            {/* Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3 mb-3">
              <div>
                <label className={labelBase}>{t('programs.name')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('programs.namePlaceholder')}
                  className={inputBase}
                  maxLength={80}
                />
              </div>
              <div>
                <label className={labelBase}>{t('programs.age')} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder={t('programs.agePlaceholder') || '25'}
                  min={13}
                  max={120}
                  className={inputBase}
                />
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelBase}>{t('programs.heightCm') || 'Height (cm)'} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
                  placeholder="175"
                  min={100}
                  max={250}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>{t('programs.weightKg') || 'Weight (kg)'} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
                  placeholder="75"
                  min={30}
                  max={300}
                  className={inputBase}
                />
              </div>
              <p className="text-xs text-gray-500 sm:col-span-2 mt-0.5">{t('programs.heightWeightHint') || 'Optional. Used to estimate daily calories and protein in your program.'}</p>
            </div>
          </div>

          {/* Contact */}
          <div ref={contactRef} className="mb-4 p-3 sm:p-4 rounded-lg border border-gray-100 bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-800 mb-3">{t('programs.sectionContact') || 'Contact'}</h3>
            <div>
              <label className={labelBase}>
                {t('programs.email') || 'Email'} <span className="text-amber-600">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder={t('programs.emailPlaceholder') || 'you@example.com'}
                className={inputBase}
              />
              <p className="text-xs text-gray-500 mt-0.5">
                {plan === 'paid' ? (t('programs.emailHintPaid') || 'Your 6-week program will be sent to this email.') : plan === 'paid12' ? 'Your 12-week program will be sent to this email.' : plan === 'customized' ? 'We will contact you at this email with a quote.' : (t('programs.emailHintFree') || 'Your 1-week program will be sent to this email.')}
              </p>
            </div>
          </div>

          {/* Level Selector (free plan only; paid/paid12 auto-detect from reps) */}
          {!isPaidPlan && !isCustomized && (
            <div className="mb-4">
              <label className={labelBase}>
                {t('programs.experienceLevel')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                      level === lvl
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {t(`programs.${lvl}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customized plan form: categories */}
          {isCustomized && (
            <div className="mb-4 space-y-3">
              <div>
                <label className={labelBase}>Pull exercises (pull-ups, muscle-ups)</label>
                <textarea value={customPull} onChange={(e) => setCustomPull(e.target.value)} rows={2} placeholder="Describe your current level, goals, preferences for pull exercises..."
                  className={`${inputBase} resize-none`}
                />
              </div>
              <div>
                <label className={labelBase}>Push exercises (dips, push-ups)</label>
                <textarea value={customPush} onChange={(e) => setCustomPush(e.target.value)} rows={2} placeholder="Describe your push exercise goals and preferences..."
                  className={`${inputBase} resize-none`}
                />
              </div>
              <div>
                <label className={labelBase}>Cardio & legs (squat, leg raises, burpees)</label>
                <textarea value={customCardioLegs} onChange={(e) => setCustomCardioLegs(e.target.value)} rows={2} placeholder="Describe your cardio and legs goals..."
                  className={`${inputBase} resize-none`}
                />
              </div>
              <div>
                <label className={labelBase}>Other</label>
                <textarea value={customOther} onChange={(e) => setCustomOther(e.target.value)} rows={2} placeholder="Any other exercises, equipment, or preferences..."
                  className={`${inputBase} resize-none`}
                />
              </div>
              <div>
                <label className={labelBase}>Description (long)</label>
                <textarea value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} rows={4} placeholder="Detailed description of what you want: goals, schedule, experience, injuries, equipment available..."
                  className={`${inputBase} resize-none`}
                />
              </div>
            </div>
          )}

          {/* Exercise Inputs (reps) - hidden for customized */}
          {!isCustomized && (
          <div ref={repsRef} className="space-y-4 mb-4">
            {/* Pull: pull-ups, muscle-ups */}
            <div className="p-3 sm:p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Pull (pull-ups, muscle-ups)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(isPaidPlan || level !== 'beginner') && (
                  <div>
                    <label className={labelBase}>{t('programs.muscleUps')}</label>
                    <input type="text" inputMode="numeric" value={maxReps.muscleUp || ''}
                      onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleRepChange('muscleUp', val === '' ? 0 : parseInt(val) || 0); }}
                      className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      placeholder="0" />
                    <p className="text-xs text-gray-500 mt-0.5">{t('programs.muscleUpHint')}</p>
                  </div>
                )}
                <div>
                  <label className={labelBase}>{t('programs.pullUps')} <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" value={maxReps.pullUps || ''}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleRepChange('pullUps', val === '' ? 0 : parseInt(val) || 0); }}
                    className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="10" required />
                </div>
              </div>
            </div>

            {/* Push: dips, push-ups */}
            <div className="p-3 sm:p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Push (dips, push-ups)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelBase}>{t('programs.dips')} <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" value={maxReps.dips || ''}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleRepChange('dips', val === '' ? 0 : parseInt(val) || 0); }}
                    className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="15" required />
                </div>
                <div>
                  <label className={labelBase}>{t('programs.pushUps')} <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" value={maxReps.pushUps || ''}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleRepChange('pushUps', val === '' ? 0 : parseInt(val) || 0); }}
                    className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="25" required />
                </div>
              </div>
            </div>

            {/* Cardio & legs: squats, leg raises, burpees */}
            <div className="p-3 sm:p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Cardio & legs (squats, leg raises, burpees)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelBase}>{t('programs.squats')} <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" value={maxReps.squats || ''}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleRepChange('squats', val === '' ? 0 : parseInt(val) || 0); }}
                    className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="40" required />
                </div>
                <div>
                  <label className={labelBase}>{t('programs.legRaises')} <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" value={maxReps.legRaises || ''}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleRepChange('legRaises', val === '' ? 0 : parseInt(val) || 0); }}
                    className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="15" required />
                </div>
                <div>
                  <label className={labelBase}>{t('programs.burpees')} <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" value={maxReps.burpees || ''}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleRepChange('burpees', val === '' ? 0 : parseInt(val) || 0); }}
                    className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="15" required />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Is calisthenics your main sport? – last input before generate */}
          <div className="mb-4 p-3 sm:p-4 rounded-lg border border-gray-100 bg-gray-50/50">
            <p className="text-sm font-bold text-gray-800 mb-2">{t('programs.calisthenicsMainSport') || 'Is calisthenics your main sport?'}</p>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setCalisthenicsMainSport(true); setOtherSport(''); }}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                  calisthenicsMainSport ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {t('programs.calisthenicsMainSportYes') || 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setCalisthenicsMainSport(false)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                  !calisthenicsMainSport ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {t('programs.calisthenicsMainSportNo') || 'No'}
              </button>
            </div>
            {calisthenicsMainSport && (
              <div className="mt-2">
                <label className={labelBase}>{t('programs.goal') || 'Your goal(s)'}</label>
                <p className="text-xs text-gray-500 mb-2">{t('programs.goalHint') || 'Select one or more. Program will adapt to your goals.'}</p>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((opt) => {
                    const isSelected = goals.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setGoals((prev) =>
                            isSelected ? prev.filter((g) => g !== opt.id) : [...prev, opt.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg border-2 font-medium text-sm transition-all ${
                          isSelected ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {t(`programs.goal_${opt.id}`) || opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {!calisthenicsMainSport && (
              <div className="mt-2">
                <label className={labelBase}>{t('programs.whatIsMainSport') || 'What is your main sport?'}</label>
                <select
                  value={otherSport}
                  onChange={(e) => setOtherSport(e.target.value)}
                  className={inputBase}
                >
                  <option value="">Choose one...</option>
                  {OTHER_SPORTS.map((sport) => (
                    <option key={sport} value={sport}>{sport.charAt(0).toUpperCase() + sport.slice(1)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-0.5">{t('programs.mainSportHint') || 'Your program will be tailored to your lifestyle and main sport.'}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <ErrorIcon sx={{ color: '#DC2626', flexShrink: 0 }} />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Free plan: remaining generations */}
          {plan === 'free' && (
            <div className="mb-4 p-3 sm:p-4 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/80 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Bolt sx={{ fontSize: 22, color: '#B45309' }} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">{t('programs.freeGenerationsLabel')}</p>
                    <p className="text-sm text-gray-600">{t('programs.freeGenerationsHint')}</p>
                  </div>
                </div>
                {freeLimitStatus != null && (
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            i < freeLimitStatus.used ? 'bg-amber-500' : 'bg-amber-200'
                          }`}
                          aria-hidden
                        />
                      ))}
                    </span>
                    <span className="text-sm font-bold text-amber-800">
                      {freeLimitStatus.remaining} {t('programs.freeGenerationsLeft')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proceed to payment page button / Submit customized */}
          {isCustomized ? (
            <div className="w-full flex justify-center mt-6">
              <button
                type="button"
                onClick={async () => {
                  if (!validateAndScroll()) return;
                  setLoading(true);
                  setError(null);
                  try {
                    const ageNum = age ? parseInt(age, 10) : NaN;
                    const validAge = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 120;
                    const r = await fetch(`${API_CONFIG.getBaseURL()}/programs/submit-customized`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: (name && String(name).trim()) || '',
                        userAge: validAge ? ageNum : undefined,
                        email: emailTrimmed,
                        pullExercises: customPull,
                        pushExercises: customPush,
                        cardioLegs: customCardioLegs,
                        other: customOther,
                        description: customDescription,
                        heightCm: heightCm || undefined,
                        weightKg: weightKg || undefined,
                        calisthenicsMainSport,
                        otherSport: !calisthenicsMainSport && otherSport ? otherSport : undefined,
                        goals: calisthenicsMainSport && Array.isArray(goals) && goals.length > 0 ? goals : undefined
                      })
                    });
                    const data = await r.json().catch(() => ({}));
                    if (!r.ok) throw new Error(data.message || 'Failed to send request');
                    setSentToEmail(emailTrimmed);
                    setCustomizedRequestSent(true);
                    setShowThanksModal(true);
                    trackProgramGenerate('customized', true);
                    setSearchParams({}, { replace: true });
                  } catch (err) {
                    setError(err.message || 'Failed to send your request.');
                    trackProgramGenerate('customized', false);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="touch-manipulation w-full max-w-md bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Submit request'}
              </button>
            </div>
          ) : !showPaymentStep ? (
            <div className="w-full flex justify-center mt-6">
              <button
                type="button"
                onClick={() => {
                  if (!validateAndScroll()) return;
                  setShowPaymentStep(true);
                }}
                className="touch-manipulation w-full max-w-md bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Payment sx={{ fontSize: 22 }} />
                {t('programs.proceedToPayment') || 'Proceed to payment page'}
              </button>
            </div>
          ) : (plan === 'paid' || plan === 'paid12') ? (
            API_CONFIG.PAYPAL_CLIENT_ID ? (
              <div className="w-full flex justify-center">
                <div className="w-full max-w-md rounded-xl p-4">
                  <p className="text-gray-900 font-semibold text-sm mb-2">Pay {plan === 'paid12' ? '$54.99' : '$39.99'} with</p>
                  <PayPalScriptProvider options={{ clientId: API_CONFIG.PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
                    <PayPalButtons
                      style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 40 }}
                      disabled={loading}
                    createOrder={async () => {
                      const emailTrimmed = (email && String(email).trim()) || '';
                      if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
                        throw new Error(t('programs.errorEmail') || 'Please enter a valid email.');
                      }
                      const payloadMaxReps = level === 'beginner' ? { ...maxReps, muscleUp: 0 } : maxReps;
                      const ageNum = age ? parseInt(age, 10) : NaN;
                      const validAge = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 120;
                      const r = await fetch(`${API_CONFIG.getBaseURL()}/programs/create-paypal-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: emailTrimmed,
                          userName: (name && String(name).trim()) || undefined,
                          userAge: validAge ? ageNum : undefined,
                          maxReps: payloadMaxReps,
                          level: level || undefined,
                          heightCm: heightCm ? Number(heightCm) : undefined,
                          weightKg: weightKg ? Number(weightKg) : undefined,
                          plan: plan === 'paid12' ? '12week' : '6week',
                          calisthenicsMainSport,
                          otherSport: !calisthenicsMainSport && otherSport ? otherSport : undefined,
                          goals: calisthenicsMainSport && Array.isArray(goals) && goals.length > 0 ? goals : undefined
                        })
                      });
                      const data = await r.json();
                      if (!r.ok) throw new Error(data.message || 'Could not create order.');
                      if (!data.orderId) throw new Error('No order ID received.');
                      return data.orderId;
                    }}
                    onApprove={async (data) => {
                      if (data.orderID) handlePayPalApprove(data.orderID);
                    }}
                    onCancel={() => {
                      setError(t('programs.paymentCancelled') || 'Payment was cancelled.');
                    }}
                    onError={(err) => {
                      setError(err.message || t('programs.errorGeneric'));
                    }}
                  />
                </PayPalScriptProvider>
                </div>
              </div>
            ) : (
              <p className="text-amber-700 text-sm py-4">PayPal is not configured. Add VITE_PAYPAL_CLIENT_ID to your .env</p>
            )
          ) : (
            <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="touch-manipulation w-full max-w-md bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black py-4 sm:py-4 px-6 sm:px-8 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-yellow-500/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden min-h-[52px]"
            >
              {loading ? (
                <>
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/15">
                    <FitnessCenter className="animate-bounce" sx={{ fontSize: 26 }} />
                  </span>
                  <span>{t('programs.waitForProgram')}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-program-shimmer" aria-hidden />
                </>
              ) : (
                <>
                  <FitnessCenter sx={{ fontSize: 24 }} />
                  {t('programs.generate')}
                </>
              )}
            </button>
            </div>
          )}
        </motion.div>

        {/* Closing note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mt-8 mb-6 px-4"
        >
          {t('programs.closingNote')}
        </motion.p>

        {/* Progress + status while loading – smooth flow */}
        <AnimatePresence>
          {loading && (
            <motion.div
              ref={progressBlockRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 mb-4 overflow-hidden"
            >
              <div className="p-6 sm:p-10 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-200 rounded-2xl shadow-xl shadow-amber-200/50 relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/40 to-transparent -translate-x-full" animate={{ x: '200%' }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }} />
                <div className="flex items-center gap-5 mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="flex-shrink-0 w-20 h-20 rounded-full border-4 border-amber-200 border-t-amber-500 flex items-center justify-center bg-white/60 shadow-inner"
                  >
                    <FitnessCenter sx={{ color: '#D97706', fontSize: 36 }} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-900 font-black text-lg sm:text-xl">
                      {fulfillingFromPayPal ? t('programs.statusSendingEmail') : t(statusKeys[statusIndex])}
                    </p>
                    <p className="text-amber-700 text-sm mt-0.5">
                      {fulfillingFromPayPal ? t('programs.statusSendingHint') : t('programs.statusCrafting')}
                    </p>
                    {loadingElapsed >= 15 && (
                      <p className="text-amber-600 text-xs mt-2 font-medium">
                        {t('programs.statusHangTight') || 'Hang tight — this may take 1–2 minutes. Almost there!'}
                      </p>
                    )}
                  </div>
                  <span className="text-3xl font-black text-amber-800 tabular-nums flex-shrink-0">{Math.round(progress)}%</span>
                </div>
                <div className="h-4 bg-amber-100 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }} style={{ width: '40%' }} />
                </div>
                <div className="flex gap-2 mt-5 justify-center">
                  {statusKeys.map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: statusIndex === i ? 1 : 0.35, scale: statusIndex === i ? 1.2 : 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-amber-500"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

{/* Skeleton – shown while loading */}
        {loading && (
          <div className="mt-6 space-y-4">
            <div className="h-3 bg-amber-100 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-amber-100 rounded w-full animate-pulse" />
            <div className="h-3 bg-amber-100 rounded w-1/2 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
