import React, { useEffect } from 'react';
import {
  Phone,
  Email,
  LocationOn,
  Facebook,
  Instagram,
  FitnessCenter,
  EmojiEvents,
  WhatsApp,
} from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'framer-motion';
import ReloadLink from '../components/ReloadLink';

const SITE_NAME = 'Toufik Calisthenics – Smart Training Platform';

const contactInfo = [
  {
    icon: <Phone sx={{ fontSize: '1.5rem' }} />,
    title: 'Phone',
    details: ['+213 782 442 033'],
    href: 'tel:+213782442033',
  },
  {
    icon: <Email sx={{ fontSize: '1.5rem' }} />,
    title: 'Email',
    details: ['rahmanitoufik1200@gmail.com'],
    href: 'mailto:rahmanitoufik1200@gmail.com',
  },
  {
    icon: <LocationOn sx={{ fontSize: '1.5rem' }} />,
    title: 'Location',
    details: ['Algiers, Bab Ezzouar'],
    href: 'https://maps.google.com/?q=Bab+Ezzouar+Algiers',
  },
];

const socialLinks = [
  { icon: <Instagram />, name: 'Instagram', url: 'https://www.instagram.com/toufik_titouu/' },
  { icon: <Facebook />, name: 'Facebook', url: '#' },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    name: 'TikTok',
    url: 'https://www.tiktok.com/@toufiktitou911',
  },
];

export default function ContactUs() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t('aboutMe.title') || 'About Me'} | ${SITE_NAME}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('aboutMe.metaDesc') || 'Toufik Rahmani – Algerian professional competitive calisthenics athlete. 2× National Champion, 3rd place WSWCF World Championship Sofia.');
    return () => {
      document.title = 'Your Best Calisthenics Guide';
    };
  }, [t]);

  const handleWhatsApp = () => {
    const phoneNumber = '+213782442033';
    const message = encodeURIComponent(t('aboutMe.whatsappMessage') || 'Hello Toufik! I would like to know more.');
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-12 md:pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-black to-gray-900 py-12 sm:py-16 md:py-20 text-white text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600')] bg-cover bg-center" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFD700]/20 mb-6">
            <FitnessCenter sx={{ fontSize: 36, color: '#FFD700' }} />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl mb-3 tracking-tight">
            {t('aboutMe.title') || 'About Me'}
          </h1>
          <p className="text-gray-300 text-base md:text-lg">
            {t('aboutMe.subtitle') || 'Professional calisthenics athlete & founder of Toufik Calisthenics'}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* Who am I */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16"
        >
          <h2 className="font-display font-black text-xl sm:text-2xl text-gray-900 mb-4 tracking-tight uppercase tracking-wider">
            {t('aboutMe.whoAmI') || 'Who am I'}
          </h2>
          <div className="border-l-4 border-[#FFD700] pl-6">
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              {t('aboutMe.intro') || 'Toufik Rahmani — Algerian professional competitive calisthenics athlete with over five years of experience and multiple national and international titles.'}
            </p>
          </div>
        </motion.section>

        {/* Experience & Background */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16"
        >
          <h2 className="font-display font-black text-xl sm:text-2xl text-gray-900 mb-4 tracking-tight uppercase tracking-wider">
            {t('aboutMe.experience') || 'Experience & Background'}
          </h2>
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              {t('aboutMe.experienceDesc') || 'More than five years of dedicated training and competition in calisthenics. Professional athlete representing Algeria on national and world stages.'}
            </p>
          </div>
        </motion.section>

        {/* Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-16"
        >
          <h2 className="font-display font-black text-xl sm:text-2xl text-gray-900 mb-6 tracking-tight uppercase tracking-wider flex items-center gap-2">
            <EmojiEvents sx={{ color: '#FFD700', fontSize: 28 }} />
            {t('aboutMe.achievements') || 'Achievements'}
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                {t('aboutMe.nationalChampion') || 'National Champion'}
              </h3>
              <p className="text-gray-700 text-base leading-relaxed">
                {t('aboutMe.nationalChampionDesc') || '2× First Place — National Champion in Endurance.'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                {t('aboutMe.wswcf') || 'WSWCF World Championship'}
              </h3>
              <p className="text-gray-700 text-base leading-relaxed">
                {t('aboutMe.wswcfDesc') || '3rd Place — WSWCF World Championship, Sofia (Strength).'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
                {t('aboutMe.fiboArabia') || 'Fibo Arabia Cup'}
              </h3>
              <p className="text-gray-700 text-base leading-relaxed">
                {t('aboutMe.fiboArabiaDesc') || '4th Place — Fibo Arabia Endurance Calisthenics Cup.'}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Get in Touch */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 pt-10 md:pt-12"
        >
          <h2 className="font-display font-black text-xl sm:text-2xl text-gray-900 mb-6 tracking-tight uppercase tracking-wider">
            {t('aboutMe.getInTouch') || 'Get in Touch'}
          </h2>
          <div className="space-y-4 mb-8">
            {contactInfo.map((info) => (
              <a
                key={info.title}
                href={info.href}
                target={info.href.startsWith('http') ? '_blank' : undefined}
                rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-[#FFD700]/30 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center text-[#EAB308]">
                  {info.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{info.title}</p>
                  <p className="text-gray-600 text-sm sm:text-base">{info.details[0]}</p>
                </div>
              </a>
            ))}
          </div>
          <button
            onClick={handleWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-3 px-6 rounded-xl transition-all"
          >
            <WhatsApp sx={{ fontSize: 24 }} />
            {t('aboutMe.chatWhatsApp') || 'Chat on WhatsApp'}
          </button>
          <div className="flex gap-4 mt-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </motion.section>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <ReloadLink to="/" className="text-[#EAB308] font-semibold hover:underline">
            ← {t('header.home')}
          </ReloadLink>
        </div>
      </div>
    </div>
  );
}
