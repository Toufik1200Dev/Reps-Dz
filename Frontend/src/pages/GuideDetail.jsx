import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReloadLink from '../components/ReloadLink';
import { motion } from 'framer-motion';
import { ArrowBack, MenuBook } from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';
import { getGuideBySlug, guides } from '../data/guides';
import { renderGuideContent } from '../utils/guideContent';
import { trackBlogView } from '../utils/analytics';

const SITE_NAME = 'Toufik Calisthenics – Smart Training Platform';

export default function GuideDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const guide = getGuideBySlug(slug);

  useEffect(() => {
    if (guide) {
      document.title = `${guide.title} | ${SITE_NAME}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', guide.excerpt);
      trackBlogView(guide.slug, guide.title);
    }
    return () => {
      document.title = 'Your Best Calisthenics Guide';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', 'Your best calisthenics guide. Premium equipment, workout programs, calorie calculator, and expert guides.');
    };
  }, [guide]);

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-12 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-gray-900 mb-4">Guide not found</h1>
          <ReloadLink to="/guides" className="text-yellow-600 font-medium hover:underline">
            ← Back to Guides
          </ReloadLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-12 md:pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <article>
        {/* Breadcrumb */}
        <nav className="flex text-sm text-gray-500 mb-6 md:mb-8">
          <ReloadLink to="/" className="hover:text-yellow-600 transition-colors">{t('header.home')}</ReloadLink>
          <span className="mx-2">/</span>
          <ReloadLink to="/guides" className="hover:text-yellow-600 transition-colors">{t('guides.title') || 'Guides'}</ReloadLink>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium truncate">{guide.title}</span>
        </nav>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 mb-6">
            <MenuBook className="text-2xl" />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-4 tracking-tight leading-tight">
            {guide.title}
          </h1>
          <p className="text-gray-500 text-sm">{guide.readTime}</p>
        </motion.header>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose-custom bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 md:p-10 lg:p-12 mb-10"
        >
          {renderGuideContent(guide.content)}
        </motion.div>

        {/* Internal links: related guides + shop */}
        <div className="mt-10 pt-8 border-t border-gray-200 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{t('guides.relatedGuides') || 'Related guides'}</h3>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {guides.filter((g) => g.slug !== guide.slug).slice(0, 3).map((g, i) => (
                <li key={g.slug} className="flex items-center gap-x-3">
                  {i > 0 && <span className="text-gray-300">•</span>}
                  <ReloadLink to={`/guides/${g.slug}`} className="text-yellow-600 hover:text-yellow-700 font-medium text-sm underline">
                    {g.title}
                  </ReloadLink>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-gray-600 text-sm">
            {t('guides.shopCta') || 'Need equipment?'} <ReloadLink to="/shop" className="text-yellow-600 font-semibold hover:underline">{t('guides.shopLink') || 'Shop pull-up bars and more'}</ReloadLink>
          </p>
        </div>

        {/* Back link */}
        <div className="flex justify-center mt-8">
          <ReloadLink
            to="/guides"
            className="inline-flex items-center gap-2 text-yellow-600 font-medium hover:text-yellow-700 transition-colors"
          >
            <ArrowBack className="text-lg" />
            {t('guides.backToGuides') || 'Back to all guides'}
          </ReloadLink>
        </div>
        </article>
      </div>
    </div>
  );
}
