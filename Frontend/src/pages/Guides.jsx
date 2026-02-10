import React, { useEffect } from 'react';
import ReloadLink from '../components/ReloadLink';
import { motion } from 'framer-motion';
import { ArrowForward } from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';
import { guides } from '../data/guides';

const SITE_NAME = 'Toufik Calisthenics – Smart Training Platform';

export default function Guides() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t('guides.title') || 'Guides & Tips'} | ${SITE_NAME}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('guides.subtitle') || 'Expert advice on pull-ups, calisthenics, calories, and home training. Toufik Calisthenics – Smart Training Platform.');
    return () => {
      document.title = 'Your Best Calisthenics Guide';
      const d = document.querySelector('meta[name="description"]');
      if (d) d.setAttribute('content', 'Your best calisthenics guide. Premium equipment, workout programs, calorie calculator, and expert guides.');
    };
  }, [t]);

  return (
    <div className="min-h-screen bg-gray-50 pt-14 md:pt-16 pb-12 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Page intro */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-10"
        >
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-2 tracking-tight">
            {t('guides.title') || 'Guides & Tips'}
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl">
            {t('guides.subtitle') || 'Expert advice on pull-ups, calisthenics, calories, and home training.'}
          </p>
        </motion.header>

        {/* Guide list */}
        <div className="space-y-4 md:space-y-5">
          {guides.map((guide, idx) => (
            <motion.article
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <ReloadLink to={`/guides/${guide.slug}`} className="block p-6 sm:p-8 md:p-10 group">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                      {guide.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {guide.excerpt}
                    </p>
                    <span className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                      {t('guides.readMore') || 'Read full guide'}
                      <ArrowForward className="text-lg group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 flex-shrink-0">{guide.readTime}</span>
                </div>
              </ReloadLink>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
