import React, { useState } from 'react';
import {
  Phone,
  Email,
  LocationOn,
  Facebook,
  Instagram,
  Send,
  ContactSupport,
  WhatsApp,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { contactAPI } from '../services/api';

export default function ContactUs() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      await contactAPI.submit(formData);
      setSubmitMessage(t('contact.thankYou') || 'Thank you for your message! We will get back to you soon.');
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setSubmitMessage(err.response?.data?.message || err.message || 'Failed to send. Please try again.');
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWhatsApp = () => {
    const phoneNumber = '+213782442033';
    const message = encodeURIComponent(t('contact.whatsappMessage') || 'Hello REPS-DZ! I would like to know more about your products.');
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const contactInfo = [
    {
      icon: <Phone sx={{ fontSize: '2rem' }} />,
      title: 'Phone',
      details: ['+213 782 442 033'],
      bgColor: 'bg-yellow-50',
      color: 'text-yellow-600',
    },
    {
      icon: <Email sx={{ fontSize: '2rem' }} />,
      title: 'Email',
      details: ['rahmanitoufik1200@gmail.com'],
      bgColor: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      icon: <LocationOn sx={{ fontSize: '2rem' }} />,
      title: 'Address',
      details: ['Algiers, Bab Ezzouar'],
      bgColor: 'bg-green-50',
      color: 'text-green-600',
    },
  ];

  const socialLinks = [
    {
      icon: <Facebook />,
      name: 'Facebook',
      url: '#',
      color: 'text-blue-600 hover:bg-blue-600'
    },
    {
      icon: <Instagram />,
      name: 'Instagram',
      url: 'https://www.instagram.com/toufik_titouu/',
      color: 'text-pink-600 hover:bg-pink-600'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
      name: 'TikTok',
      url: 'https://www.tiktok.com/@toufiktitou911',
      color: 'text-black hover:bg-black hover:text-white'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20">
      {/* Hero Section - responsive */}
      <div className="bg-gradient-to-br from-black to-gray-900 py-10 sm:py-14 md:py-20 lg:py-24 text-white text-center px-3 sm:px-4 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <ContactSupport className="w-14 h-14 sm:w-16 sm:h-16 md:text-7xl md:mb-6 mb-4 opacity-90 text-secondary" style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)' }} />
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-3 md:mb-4 px-1">
            {t('contact.title').toUpperCase()}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-1">
            {t('contact.subtitle')}
          </p>
        </div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600')] bg-cover bg-center" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12">

          {/* Contact Info Sidebar - responsive */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8 order-2 lg:order-1">
            <div className="space-y-4 md:space-y-6">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="bg-white p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`${info.bgColor} ${info.color} p-3 sm:p-4 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                      {info.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{t(`contact.${info.title.toLowerCase()}`) || info.title}</h3>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-gray-500 font-medium text-sm sm:text-base break-all">{detail}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-sm sm:text-base"
            >
              <WhatsApp className="text-xl sm:text-2xl" />
              Chat on WhatsApp
            </button>

            <div>
              <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4">{t('contact.followUs')}</h3>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-white p-3 sm:p-4 rounded-lg md:rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-white ${social.color}`}
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form - responsive */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="bg-white p-4 sm:p-6 md:p-10 lg:p-16 rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-secondary/10 rounded-bl-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />

              <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-1 md:mb-2">{t('contact.sendMessage')}</h2>
              <p className="text-gray-500 mb-6 md:mb-10 font-medium text-sm sm:text-base">{t('contact.formDesc') || "We'll get back to you within 24 hours."}</p>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm sm:text-base">
                  {submitMessage}
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm sm:text-base">
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{t('contact.name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-xl md:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:outline-none focus:border-secondary focus:bg-white transition-all font-medium text-sm sm:text-base"
                      placeholder="e.g. Ahmed Ali"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{t('contact.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-xl md:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:outline-none focus:border-secondary focus:bg-white transition-all font-medium text-sm sm:text-base"
                      placeholder="ahmed@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{t('contact.subject')}</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-xl md:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:outline-none focus:border-secondary focus:bg-white transition-all font-medium text-sm sm:text-base"
                    placeholder={t('contact.subjectPlaceholder') || "How can we help?"}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">{t('contact.message')}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-xl md:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:outline-none focus:border-secondary focus:bg-white transition-all font-medium resize-none text-sm sm:text-base"
                    placeholder={t('contact.messagePlaceholder') || "Your message here..."}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group bg-black text-secondary hover:bg-secondary hover:text-black font-black text-base sm:text-lg py-4 sm:py-5 px-8 sm:px-12 rounded-xl md:rounded-2xl shadow-xl hover:shadow-yellow-500/20 transition-all duration-500 w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <>
                      <span>{t('contact.send')}</span>
                      <Send className="text-lg sm:text-xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}