import React from 'react';
import ReloadLink from '../components/ReloadLink';
import { motion } from 'framer-motion';
import { FitnessCenter, LocalShipping, Star, Support, ArrowForward } from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';

const SITE_NAME = 'Toufik Calisthenics – Smart Training Platform';

export default function AboutUs() {
  const { t } = useLanguage();

  React.useEffect(() => {
    document.title = `${t('about.title') || 'About Us'} | ${SITE_NAME}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = t('about.metaDescription') || 'REPS-DZ offers premium calisthenics equipment in Algeria. Learn about our mission, quality standards, and local support.';
    if (metaDesc) metaDesc.setAttribute('content', desc);
    return () => {
      document.title = 'Your Best Calisthenics Guide';
    };
  }, [t]);

  const values = [
    { icon: FitnessCenter, titleKey: 'about.builtForAthletes', descKey: 'about.builtDesc' },
    { icon: LocalShipping, titleKey: 'about.fastDelivery', descKey: 'about.fastDesc' },
    { icon: Star, titleKey: 'about.quality', descKey: 'about.qualityDesc' },
    { icon: Support, titleKey: 'about.localSupport', descKey: 'about.supportDesc' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-12 md:pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-100 text-yellow-600 mb-6">
            <FitnessCenter className="text-4xl" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">
            {t('about.title') || 'About Us'}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('about.subtitle') || 'Premium calisthenics equipment for Algeria. Built for athletes, delivered with care.'}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-8 text-gray-700 leading-relaxed"
        >
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('about.whoWeAre') || 'Who we are'}</h2>
            <p>
              {t('about.whoWeAreText') || 'REPS-DZ is an Algerian brand focused on bringing premium calisthenics and fitness equipment to athletes and home trainers. We stock pull-up bars, parallettes, resistance bands, and accessories designed for real training—no flimsy hardware, just gear that holds up to daily use.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('about.mission') || 'Our mission'}</h2>
            <p>
              {t('about.missionText') || 'We believe everyone deserves access to quality equipment. Our mission is to help you train safely at home with durable, well-designed products and clear advice. We offer guides, a free workout program generator, and a calorie calculator so you can focus on training—not guessing.'}
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
            {values.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <item.icon className="text-yellow-600 mb-3" sx={{ fontSize: 28 }} />
                <h3 className="font-bold text-gray-900 mb-2">{t(item.titleKey) || item.titleKey}</h3>
                <p className="text-sm text-gray-600">{t(item.descKey) || item.descKey}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('about.contact') || 'Get in touch'}</h2>
            <p>
              {t('about.contactText') || 'Have a question or need help choosing equipment? We\'re here to help. Reach out via our About Me page or by phone. We ship across Algeria and stand behind our products.'}
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <ReloadLink
                to="/about-me"
                className="inline-flex items-center gap-2 bg-black text-yellow-400 font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                {t('about.contactUs') || 'About Me'} <ArrowForward className="text-lg" />
              </ReloadLink>
              <ReloadLink
                to="/shop"
                className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-xl hover:border-yellow-500 hover:text-yellow-600 transition-colors"
              >
                {t('about.shop') || 'Shop'}
              </ReloadLink>
            </div>
          </section>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <ReloadLink to="/" className="text-yellow-600 font-semibold hover:text-yellow-700 transition-colors">
            ← {t('header.home') || 'Home'}
          </ReloadLink>
        </div>
      </div>
    </div>
  );
}
