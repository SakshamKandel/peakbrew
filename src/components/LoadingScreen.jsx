import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoSvg from '../assets/Logo.svg';
import { COMPANY_INFO } from '../constants/companyInfo';

const LoadingScreen = ({ onComplete, children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const steps = [
      { delay: 0, duration: 1000 },      // Logo fade in
      { delay: 1500, duration: 1000 },  // Welcome text
      { delay: 3000, duration: 1000 },  // Company name
      { delay: 4500, duration: 500 },   // Final pause
    ];

    const timers = steps.map((step, index) => 
      setTimeout(() => setCurrentStep(index + 1), step.delay)
    );

    const finalTimer = setTimeout(() => {
      setIsLoading(false);
      onComplete?.();
    }, 5500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finalTimer);
    };
  }, [onComplete]);

  if (!isLoading) {
    return children;
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 50%),
                       radial-gradient(circle at 70% 80%, rgba(255,255,255,0.02) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Main content container */}
      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '0 20px' }}>
        
        {/* Logo */}
        <AnimatePresence>
          {currentStep >= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.2 
              }}
              style={{ marginBottom: '60px' }}
            >
              <motion.img
                src={logoSvg}
                alt="Logo"
                style={{
                  width: '120px',
                  height: '120px',
                  filter: 'drop-shadow(0 15px 40px rgba(0,0,0,0.4)) drop-shadow(0 0 60px rgba(212, 175, 55, 0.2))',
                }}
                animate={{ 
                  filter: [
                    'drop-shadow(0 15px 40px rgba(0,0,0,0.4)) drop-shadow(0 0 60px rgba(212, 175, 55, 0.2))',
                    'drop-shadow(0 20px 50px rgba(0,0,0,0.5)) drop-shadow(0 0 80px rgba(212, 175, 55, 0.4))',
                    'drop-shadow(0 15px 40px rgba(0,0,0,0.4)) drop-shadow(0 0 60px rgba(212, 175, 55, 0.2))'
                  ],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Text */}
        <AnimatePresence>
          {currentStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 1.0, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.1
              }}
              style={{ marginBottom: '30px' }}
            >
              <h1 style={{
                fontSize: '3.5rem',
                fontWeight: '700',
                margin: '0',
                lineHeight: '1.1',
                letterSpacing: '-1px',
                color: '#ffffff',
                textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Welcome
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Company Name */}
        <AnimatePresence>
          {currentStep >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 1.0, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.2
              }}
              style={{ marginBottom: '40px' }}
            >
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                margin: '0',
                lineHeight: '1.2',
                letterSpacing: '2px',
                color: '#d4af37',
                textShadow: '0 4px 15px rgba(212, 175, 55, 0.6), 0 2px 8px rgba(0,0,0,0.4)',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.3))',
              }}>
                {COMPANY_INFO.name}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tagline */}
        <AnimatePresence>
          {currentStep >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                ease: "easeOut",
                delay: 0.8
              }}
            >
              <p style={{
                fontSize: '1.1rem',
                fontWeight: '400',
                margin: '0 0 60px 0',
                lineHeight: '1.4',
                color: '#ffffff',
                letterSpacing: '0.5px',
                textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                opacity: 0.9,
              }}>
                {COMPANY_INFO.tagline}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apple-style loading indicator */}
        <AnimatePresence>
          {currentStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ position: 'relative' }}>
                {/* Outer ring */}
                <motion.div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    position: 'absolute',
                  }}
                />
                {/* Progress ring */}
                <motion.div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid transparent',
                    borderTopColor: '#d4af37',
                    borderRightColor: '#d4af37',
                    borderRadius: '50%',
                    filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: currentStep >= 2 ? 0.5 : 0 }}
        transition={{ duration: 1.0 }}
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.5px',
        }}
      >
        Preparing your Peak Brew experience...
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;