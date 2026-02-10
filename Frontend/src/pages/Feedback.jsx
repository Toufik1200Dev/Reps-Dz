import React, { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { feedbackAPI } from '../services/api';
import { motion } from 'framer-motion';
import RateReview from '@mui/icons-material/RateReview';
import Send from '@mui/icons-material/Send';
import CalendarMonth from '@mui/icons-material/CalendarMonth';

const SITE_NAME = 'Toufik Calisthenics';

export default function Feedback() {
  const { t } = useLanguage();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', message: '', planUsed: '' });

  useEffect(() => {
    document.title = `${t('feedback.pageTitle') || 'Program Generator Feedback'} | ${SITE_NAME}`;
    let cancelled = false;
    feedbackAPI.getList()
      .then((res) => {
        if (!cancelled && res.data?.data) setList(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const name = (form.name || '').trim();
    const message = (form.message || '').trim();
    if (!name || !message) {
      setError(t('feedback.errorRequired') || 'Name and message are required.');
      return;
    }
    if (message.length > 800) {
      setError(t('feedback.errorTooLong') || 'Message cannot exceed 800 characters.');
      return;
    }
    const planUsed = form.planUsed || '';
    setSubmitLoading(true);
    try {
      await feedbackAPI.submit({
        name,
        message,
        planUsed
      });
      setSuccess(true);
      setForm({ name: '', message: '', planUsed: '' });
      setList((prev) => [
        {
          name,
          message,
          planUsed,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (err) {
      setError(err.response?.data?.message || t('feedback.errorSubmit') || 'Failed to submit. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-12 md:pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-4">
            <RateReview sx={{ fontSize: 32, color: '#B45309' }} />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-2">
            {t('feedback.title') || 'Program Generator Feedback'}
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            {t('feedback.subtitle') || 'Used the 1-week or 6/12-week program generator? Share your experience for others.'}
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-10"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {t('feedback.addComment') || 'Add your comment'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('feedback.yourName') || 'Your name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('feedback.namePlaceholder') || 'e.g. Ahmed'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('feedback.planUsed') || 'I used'}
              </label>
              <select
                value={form.planUsed}
                onChange={(e) => setForm((f) => ({ ...f, planUsed: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              >
                <option value="">{t('feedback.planOptional') || 'Optional'}</option>
                <option value="1-week">1-week (free)</option>
                <option value="6-week">6-week</option>
                <option value="12-week">12-week</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('feedback.yourMessage') || 'Your message'} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={t('feedback.messagePlaceholder') || 'How was your experience with the program generator?'}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y min-h-[100px]"
                maxLength={800}
              />
              <p className="text-xs text-gray-500 mt-1">{form.message.length}/800</p>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 font-medium">
                {t('feedback.thankYou') || 'Thank you! Your feedback has been added.'}
              </p>
            )}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitLoading ? (
                t('contact.sending') || 'Sending...'
              ) : (
                <>
                  <Send sx={{ fontSize: 20 }} />
                  {t('feedback.submit') || 'Submit feedback'}
                </>
              )}
            </button>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {t('feedback.othersComments') || "Others' comments"}
          </h2>
          {loading ? (
            <p className="text-gray-500 py-8">{t('feedback.loading') || 'Loading...'}</p>
          ) : list.length === 0 ? (
            <p className="text-gray-500 py-8 bg-white rounded-xl border border-gray-100 p-6">
              {t('feedback.noComments') || 'No feedback yet. Be the first to share your experience!'}
            </p>
          ) : (
            <ul className="space-y-4">
              {list.map((item, index) => (
                <motion.li
                  key={item._id || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900">{item.name}</span>
                    {item.planUsed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                        {item.planUsed}
                      </span>
                    )}
                    {item.createdAt && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                        <CalendarMonth sx={{ fontSize: 14 }} />
                        {formatDate(item.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}
