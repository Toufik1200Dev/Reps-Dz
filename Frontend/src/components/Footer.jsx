import React from 'react';
import { Container, Typography, Grid } from '@mui/material';
import { Facebook, Instagram, YouTube, Phone, LocationOn } from '@mui/icons-material';
import logo from '../assets/logo/toufikcalisthenicsLogo.png';
import ReloadLink from './ReloadLink';

const footerLinks = {
  products: [
    { label: 'Pull-Up Bars', href: '/shop?category=pull up bar' },
    { label: 'Parallettes', href: '/shop?category=paralelle' },
    { label: 'Accessories', href: '/shop?category=Accessories' },
  ],
  support: [
    { label: 'Guides & Tips', href: '/guides' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'About Me', href: '/about-me' },
  ],
};

const socialLinks = [
  { icon: <Facebook />, href: '#', label: 'Facebook' },
  { icon: <Instagram />, href: 'https://www.instagram.com/toufik_titouu/', label: 'Instagram' },
  { icon: <YouTube />, href: '#', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f0f0f] text-white pt-16 pb-8 border-t border-white/5">
      <Container maxWidth="lg">
        <Grid container spacing={8}>
          {/* Brand Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Toufik | calisthenics" className="w-12 h-12 object-contain" />
                <Typography variant="h4" className="font-display font-black tracking-tighter text-white">
                  Toufik<span className="text-secondary"> | calisthenics</span>
                </Typography>
              </div>
              <Typography variant="body2" className="text-gray-400 leading-relaxed mb-6">
                Premium calisthenics equipment designed for athletes who demand the best.
                Built to last, built for performance.
              </Typography>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:ring-offset-2 focus:ring-offset-[#0f0f0f]"
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
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <ReloadLink
                    to={link.href}
                    className="text-gray-400 hover:text-[#FFD700] transition-colors inline-block py-0.5 focus:outline-none focus:text-[#FFD700]"
                  >
                    {link.label}
                  </ReloadLink>
                </li>
              ))}
            </ul>
          </Grid>

          <Grid size={{ xs: 6, md: 4 }}>
            <Typography variant="h6" className="font-bold mb-6 text-white uppercase tracking-wider text-sm">
              Support
            </Typography>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <ReloadLink
                    to={link.href}
                    className="text-gray-400 hover:text-[#FFD700] transition-colors inline-block py-0.5 focus:outline-none focus:text-[#FFD700]"
                  >
                    {link.label}
                  </ReloadLink>
                </li>
              ))}
            </ul>
          </Grid>
        </Grid>

        {/* Contact Strip */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
            <a href="https://maps.google.com/?q=Bab+Ezzouar+Algiers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#FFD700] transition-colors">
              <LocationOn className="text-[#FFD700] text-lg flex-shrink-0" />
              <span>Algiers, Bab Ezzouar Douzi</span>
            </a>
            <a href="tel:+213782442033" className="flex items-center gap-2 hover:text-[#FFD700] transition-colors">
              <Phone className="text-[#FFD700] text-lg flex-shrink-0" />
              <span>+213 782 442 033</span>
            </a>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Toufik | calisthenics. All rights reserved.
          </div>
        </div>
      </Container>
    </footer>
  );
}
