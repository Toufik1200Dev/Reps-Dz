import React, { useEffect } from 'react';
import {
  Phone,
  Email,
  LocationOn,
  Instagram,
  EmojiEvents,
  WhatsApp,
} from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'framer-motion';
import ReloadLink from '../components/ReloadLink';
import toufikPhoto from '../assets/imgs/toufikPNG.png';

const SITE_NAME = 'Toufik | calisthenics';

export default function AboutMe() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t('aboutMe.title') || 'About Me'} | ${SITE_NAME}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('aboutMe.metaDesc') || 'Toufik Rahmani – Algerian professional competitive calisthenics athlete. 2× National Champion, 3rd place WSWCF World Championship Sofia.');
    return () => {
      document.title = 'Your Best Calisthenics Guide';
    };
  }, [t]);


  return (
    <div className="min-h-screen bg-white pt-16 md:pt-20 pb-16">
      {/* CV-style layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row gap-10 lg:gap-16 pt-8 pb-12"
        >
          {/* Left column – Photo & Contact */}
          <aside className="lg:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              {/* Photo */}
              <div className="mb-8">
                <img
                  src={toufikPhoto}
                  alt="Toufik Rahmani – Professional calisthenics athlete"
                  className="w-full max-w-[280px] mx-auto lg:mx-0 aspect-[3/4] object-cover object-top"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                />
              </div>
              {/* Contact – compact, secondary */}
              <div className="space-y-3 text-sm">
                <a href="tel:+213782442033" className="flex items-center gap-3 text-gray-700 hover:text-black">
                  <Phone sx={{ fontSize: 18 }} />
                  +213 782 442 033
                </a>
                <a href="mailto:rahmanitoufik1200@gmail.com" className="flex items-center gap-3 text-gray-700 hover:text-black break-all">
                  <Email sx={{ fontSize: 18 }} />
                  rahmanitoufik1200@gmail.com
                </a>
                <a href="https://maps.google.com/?q=Bab+Ezzouar+Algiers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-black">
                  <LocationOn sx={{ fontSize: 18 }} />
                  Algiers, Bab Ezzouar
                </a>
              </div>
              <div className="mt-6 space-y-3">
                <a
                  href="https://wa.me/213782442033?text=Hello%20Toufik!%20I%20would%20like%20to%20know%20more."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                  <WhatsApp sx={{ fontSize: 20 }} />
                  WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/toufik_titouu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-opacity"
                >
                  <Instagram sx={{ fontSize: 20 }} />
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@toufiktitou911"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  TikTok
                </a>
              </div>
            </div>
          </aside>

          {/* Right column – CV content */}
          <main className="flex-1 min-w-0">
            {/* Name & Title */}
            <div className="mb-10">
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-gray-900 tracking-tight mb-2">
                Toufik Rahmani
              </h1>
              <p className="text-gray-600 text-lg md:text-xl font-medium">
                {t('aboutMe.subtitle') || 'Professional Competitive Calisthenics Athlete'}
              </p>
            </div>

            {/* Who am I */}
            <section className="mb-10">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-gray-500 mb-4">
                {t('aboutMe.whoAmI') || 'Who am I'}
              </h2>
              <p className="text-gray-800 text-base md:text-lg leading-relaxed">
                {t('aboutMe.intro') || 'Algerian professional competitive calisthenics athlete with over five years of experience and multiple national and international titles.'}
              </p>
            </section>

            {/* Experience */}
            <section className="mb-10">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-gray-500 mb-4">
                {t('aboutMe.experience') || 'Experience & Background'}
              </h2>
              <p className="text-gray-800 text-base md:text-lg leading-relaxed">
                {t('aboutMe.experienceDesc') || 'More than five years of dedicated training and competition in calisthenics. Professional athlete representing Algeria on national and world stages.'}
              </p>
            </section>

            {/* Achievements */}
            <section className="mb-10">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <EmojiEvents sx={{ color: '#EAB308', fontSize: 20 }} />
                {t('aboutMe.achievements') || 'Achievements'}
              </h2>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#EAB308] font-bold text-sm">1</span>
                  <div>
                    <strong className="text-gray-900">{t('aboutMe.nationalChampion') || 'National Champion'}</strong>
                    <p className="text-gray-700 text-sm mt-0.5">{t('aboutMe.nationalChampionDesc') || '2× First Place — National Champion in Endurance.'}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#EAB308] font-bold text-sm">2</span>
                  <div>
                    <strong className="text-gray-900">{t('aboutMe.wswcf') || 'WSWCF World Championship'}</strong>
                    <p className="text-gray-700 text-sm mt-0.5">{t('aboutMe.wswcfDesc') || '3rd Place — WSWCF World Championship, Sofia (Strength).'}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#EAB308] font-bold text-sm">3</span>
                  <div>
                    <strong className="text-gray-900">{t('aboutMe.fiboArabia') || 'Fibo Arabia Cup'}</strong>
                    <p className="text-gray-700 text-sm mt-0.5">{t('aboutMe.fiboArabiaDesc') || '4th Place — Fibo Arabia Endurance Calisthenics Cup.'}</p>
                  </div>
                </li>
              </ul>
            </section>

            <div className="pt-6 border-t border-gray-200">
              <ReloadLink to="/" className="text-[#EAB308] font-semibold hover:underline text-sm">
                ← {t('header.home')}
              </ReloadLink>
            </div>
          </main>
        </motion.div>
      </div>
    </div>
  );
}
