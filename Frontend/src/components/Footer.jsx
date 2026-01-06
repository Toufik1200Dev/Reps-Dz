import React from 'react';
import {
  Container,
  Typography,
  Grid,
} from '@mui/material';
import {
  Facebook,
  Instagram,
  YouTube,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import logo from '../assets/logo/logo.png';

const footerLinks = {
  products: [
    { label: 'Pull-Up Bars', href: '/shop?category=calisthenics' },
    { label: 'Parallel Bars', href: '/shop?category=calisthenics' },
    { label: 'Gymnastic Rings', href: '/shop?category=calisthenics' },
    { label: 'Resistance Bands', href: '/shop?category=calisthenics' },
  ],
  support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
  ],
};

const socialLinks = [
  { icon: <Facebook />, href: '#', label: 'Facebook' },
  { icon: <Instagram />, href: 'https://www.instagram.com/toufik_titouu/', label: 'Instagram' },
  { icon: <YouTube />, href: '#', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-white pt-16 pb-8 border-t border-white/5">
      <Container maxWidth="lg">
        <Grid container spacing={8}>
          {/* Brand Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="REPS-DZ" className="w-12 h-12 object-contain" />
                <Typography variant="h4" className="font-display font-black tracking-tighter text-white">
                  REPS<span className="text-secondary">-DZ</span>
                </Typography>
              </div>
              <Typography variant="body2" className="text-gray-400 leading-relaxed mb-6">
                Premium calisthenics equipment designed for athletes who demand the best.
                Built to last, built for performance.
              </Typography>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-secondary hover:text-black transition-all duration-300"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </Grid>

          {/* Links */}
          <Grid size={{ xs: 6, md: 4 }}>
            <Typography variant="h6" className="font-bold mb-6 text-white uppercase tracking-wider text-sm">
              Products
            </Typography>
            <ul className="space-y-4">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </Grid>

          <Grid size={{ xs: 6, md: 4 }}>
            <Typography variant="h6" className="font-bold mb-6 text-white uppercase tracking-wider text-sm">
              Support
            </Typography>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </Grid>
        </Grid>

        {/* Contact Strip */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
            <div className="flex items-center gap-2">
              <LocationOn className="text-secondary text-lg" />
              <span>Algiers, Bab Ezzouar Douzi</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="text-secondary text-lg" />
              <span>+213 782 442 033</span>
            </div>
          </div>
          <div>
            &copy; {new Date().getFullYear()} REPS-DZ. All rights reserved.
          </div>
        </div>
      </Container>
    </footer>
  );
}
