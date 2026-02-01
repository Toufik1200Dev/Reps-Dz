import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ArrowForward } from "@mui/icons-material"
import { IconButton } from "@mui/material"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "../contexts/LanguageContext"
import pic1 from "../assets/imgs/pic1.jpg"
import pic2 from "../assets/imgs/pic2.jpg"
import pic3 from "../assets/imgs/pic3.jpg"

const slides = [
  {
    id: 1,
    title: "Master Your Body Weight",
    subtitle: "Professional Calisthenics Equipment",
    description:
      "Transform your fitness journey with our premium pull-up bars, parallel bars, and training accessories designed for serious athletes.",
    image: pic1,
    buttonText: "Shop Now",
    badge: "Best Seller",
  },
  {
    id: 2,
    title: "Build Strength Naturally",
    subtitle: "No Weights, No Limits",
    description: "Discover the power of bodyweight training with our expertly designed calisthenics gear for ultimate strength building.",
    image: pic3,
    buttonText: "Explore Products",
    badge: "New Arrival",
  },
  {
    id: 3,
    title: "Train Like a Pro",
    subtitle: "Premium Quality Equipment",
    description: "Join thousands of athletes who trust our equipment for their calisthenics training and achieve your fitness goals.",
    image: pic2,
    buttonText: "Get Started",
    badge: "Premium",
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { t } = useLanguage();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 8000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {slides.map((slide, index) => {
          if (index !== currentSlide) return null;

          return (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 100%), url(${slide.image})`
              }}
            >
              <div className="h-full w-full max-w-[1200px] mx-auto px-5 sm:px-8 md:px-10 flex items-center">
                <div className="w-full max-w-xl text-white z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.6 }}
                    className="space-y-4"
                  >
                    <div className="inline-flex items-center gap-2 bg-[#FFD700] text-black text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                      {slide.badge}
                    </div>
                    
                    <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.15] tracking-tight text-white">
                      {slide.title}
                    </h1>
                    
                    {slide.subtitle && (
                      <p className="text-[#FFD700] text-sm sm:text-base md:text-lg font-semibold tracking-tight">
                        {slide.subtitle}
                      </p>
                    )}
                    
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-md">
                      {slide.description}
                    </p>
                    
                    <div className="pt-1">
                      <button
                        onClick={() => window.location.href = '/shop'}
                        className="group inline-flex items-center gap-2 bg-[#FFD700] text-black text-sm font-bold px-6 py-3 rounded-full shadow-lg hover:bg-white transition-all duration-200"
                      >
                        {t('home.shopNow')}
                        <ArrowForward className="text-base group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Modern Controls */}
      <div className="absolute bottom-10 left-6 md:left-12 flex items-center gap-6 z-30">
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-10 bg-secondary' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
            />
          ))}
        </div>
        <div className="h-10 w-[1px] bg-white/20" />
        <div className="flex gap-4">
          <IconButton onClick={prevSlide} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'white/10', borderColor: 'secondary.main' } }}>
            <ChevronLeft />
          </IconButton>
          <IconButton onClick={nextSlide} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'white/10', borderColor: 'secondary.main' } }}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>
    </div>
  )
}