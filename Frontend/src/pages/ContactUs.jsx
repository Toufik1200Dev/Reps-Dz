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

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWhatsApp = () => {
    const phoneNumber = '+213782442033';
    const message = encodeURIComponent('Hello REPS-DZ! I would like to know more about your products.');
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const contactInfo = [
    {
      icon: <Phone className="text-3xl" />,
      title: 'Phone',
      details: ['+213 782 442 033'],
      bgColor: 'bg-secondary',
      color: 'text-black',
    },
    {
      icon: <Email className="text-3xl" />,
      title: 'Email',
      details: ['rahmanitoufik1200@gmail.com'],
      bgColor: 'bg-secondary',
      color: 'text-black',
    },
    {
      icon: <LocationOn className="text-3xl" />,
      title: 'Address',
      details: ['Algiers, Bab Ezzouar'],
      bgColor: 'bg-secondary',
      color: 'text-black',
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-black to-dark-900 py-16 md:py-24 text-white text-center px-4 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <ContactSupport className="text-7xl mb-6 opacity-90 text-secondary" />
          <h1 className="font-display font-black text-4xl md:text-6xl mb-4">
            GET IN <span className="text-secondary">TOUCH</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Have questions about our equipment? We're here to help! Reach out to us and we'll get back to you as soon as possible.
          </p>
        </div>
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600')] bg-cover bg-center" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Contact Info Sidebar */}
          <div className="md:col-span-4 space-y-8">
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${info.bgColor} ${info.color} p-4 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{info.title}</h3>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-gray-500 font-medium">{detail}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Button */}
            <button
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <WhatsApp className="text-2xl" />
              Chat on WhatsApp
            </button>

            {/* Social Links */}
            <div>
              <h3 className="font-bold text-xl mb-4">Follow Us</h3>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:text-white ${social.color}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-8">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-display font-black text-3xl md:text-4xl mb-8">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                    placeholder="How can we help you?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="bg-black text-secondary hover:bg-secondary hover:text-black font-bold text-lg py-4 px-10 rounded-xl shadow-lg hover:shadow-gold transition-all duration-300 w-full md:w-auto flex items-center justify-center gap-2"
                >
                  <Send className="text-xl" />
                  Send Message
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}