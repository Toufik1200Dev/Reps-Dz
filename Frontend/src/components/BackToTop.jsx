import React, { useState, useEffect } from 'react';
import { KeyboardArrowUp } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-2 rounded-full bg-black text-[#FFD700] shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:ring-offset-2 transition-all touch-manipulation"
          aria-label="Back to top"
        >
          <KeyboardArrowUp sx={{ fontSize: 28 }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
