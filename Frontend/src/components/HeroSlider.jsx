import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative h-[75vh] md:h-[85vh] w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {slides.map((slide, index) => {
          if (index !== currentSlide) return null;

          return (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%), url(${slide.image})`
              }}
            >
              <div className="h-full w-full max-w-[1400px] mx-auto px-4 md:px-8 flex items-center">
                <div className="w-full md:w-[65%] lg:w-[55%] text-white z-10 pl-6 md:pl-12">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <div className="inline-block bg-secondary text-black text-xs font-bold px-3 py-1.5 rounded mb-6 uppercase tracking-wider">
                      {slide.badge}
                    </div>
                    <p className="text-secondary font-semibold tracking-[0.2em] uppercase mb-4 text-sm md:text-base">
                      {slide.subtitle}
                    </p>
                    <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8 tracking-tight">
                      {slide.title}
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                      {slide.description}
                    </p>
                    <button
                      onClick={() => window.location.href = '/shop'}
                      className="bg-secondary hover:bg-accent text-black text-lg font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-gold transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {slide.buttonText}
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm p-3 md:p-4 rounded-full border border-white/20 transition-all hover:border-secondary group"
      >
        <ChevronLeft className="text-3xl md:text-4xl group-hover:text-secondary transition-colors" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm p-3 md:p-4 rounded-full border border-white/20 transition-all hover:border-secondary group"
      >
        <ChevronRight className="text-3xl md:text-4xl group-hover:text-secondary transition-colors" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-12 bg-secondary' : 'w-3 bg-white/40 hover:bg-white/60'
              }`}
          />
        ))}
      </div>
    </div>
  )
}