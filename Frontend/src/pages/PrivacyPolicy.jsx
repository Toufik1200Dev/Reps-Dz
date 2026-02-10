import React from 'react';
import ReloadLink from '../components/ReloadLink';
import { motion } from 'framer-motion';
import { PrivacyTip } from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  const lastUpdated = 'February 2025';

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-12 md:pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-600 mb-6">
            <PrivacyTip className="text-3xl" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-2 tracking-tight">
            {t('privacy.title') || 'Privacy Policy'}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('privacy.lastUpdated') || 'Last updated'}: {lastUpdated}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="prose-custom space-y-8 text-gray-700 leading-relaxed"
        >
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. {t('privacy.whoWeAre') || 'Who we are'}</h2>
            <p>
              REPS-DZ (“we”, “our”, or “us”) operates the website at reps-dz.web.app (and related domains). We sell calisthenics and fitness equipment and provide tools such as a workout program generator and a calorie calculator. This privacy policy explains how we collect, use, and protect your information when you use our site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. {t('privacy.dataWeCollect') || 'Information we collect'}</h2>
            <p className="mb-3">We may collect:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>Contact and order data:</strong> name, email, phone, address, and wilaya when you contact us or place an order.</li>
              <li><strong>Optional usage data:</strong> if you use our program generator or calorie calculator, you may optionally enter a name or other inputs; these may be stored locally on your device or sent to our servers to save your program.</li>
              <li><strong>Technical data:</strong> device type, browser, IP address, and similar data that browsers and servers normally exchange.</li>
            </ul>
            <p>We do not sell your personal information to third parties for their marketing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. {t('privacy.howWeUse') || 'How we use your information'}</h2>
            <p>
              We use the information we collect to process orders, respond to inquiries, improve our website and services, and comply with legal obligations. If you have consented to marketing, we may use your contact details to send you updates; you can opt out at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. {t('privacy.cookies') || 'Cookies and similar technologies'}</h2>
            <p className="mb-3">
              We use cookies and similar technologies to remember your preferences, keep you logged in where applicable, and analyze how the site is used. Some cookies are essential for the site to function; others help us improve the experience.
            </p>
            <p>
              For more detail on how third-party advertising uses cookies on this site, see the “Advertising” section below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. {t('privacy.advertising') || 'Advertising and Google AdSense'}</h2>
            <p className="mb-3">
              We may show advertisements on our website. These ads are provided by third-party ad networks, including <strong>Google AdSense</strong>.
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>
                <strong>Third-party vendors, including Google, use cookies</strong> to serve ads based on a user’s prior visits to this website and/or other sites on the Internet.
              </li>
              <li>
                <strong>Google’s use of advertising cookies</strong> enables it and its partners to serve ads to users based on their visit to this site and/or other sites on the Internet.
              </li>
              <li>
                Users may opt out of personalized advertising by visiting <strong>Google’s Ads Settings</strong>:{' '}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-700 underline font-medium">
                  https://www.google.com/settings/ads
                </a>.
              </li>
              <li>
                You can also opt out of third-party vendor use of cookies for personalized ads by visiting{' '}
                <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-700 underline font-medium">
                  www.aboutads.info
                </a>.
              </li>
            </ul>
            <p>
              We do not control the data collected by these third-party ad providers. Their use of data is governed by their own privacy policies (e.g. Google’s Privacy Policy:{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-700 underline font-medium">
                https://policies.google.com/privacy
              </a>).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. {t('privacy.dataRetention') || 'Data retention and security'}</h2>
            <p>
              We retain your data only as long as necessary to fulfill the purposes described in this policy or as required by law. We take reasonable technical and organizational measures to protect your data against unauthorized access, loss, or misuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. {t('privacy.yourRights') || 'Your rights'}</h2>
            <p>
              Depending on where you live, you may have the right to access, correct, or delete your personal data, or to object to or restrict certain processing. To exercise these rights or ask questions about your data, please contact us using the details in the “Contact” section below. If you are in the European Economic Area, UK, or Switzerland, you may also have the right to lodge a complaint with a supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. {t('privacy.changes') || 'Changes to this policy'}</h2>
            <p>
              We may update this privacy policy from time to time. The “Last updated” date at the top will be revised when we make changes. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. {t('privacy.contact') || 'Contact us'}</h2>
            <p>
              For any privacy-related questions or requests, contact us at our <ReloadLink to="/about-me" className="text-yellow-600 hover:text-yellow-700 font-medium underline">About Me</ReloadLink> page, or by phone: +213 782 442 033.
            </p>
          </section>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <ReloadLink to="/" className="text-yellow-600 font-semibold hover:text-yellow-700 transition-colors">
            ← {t('privacy.backToHome') || 'Back to Home'}
          </ReloadLink>
        </div>
      </div>
    </div>
  );
}
