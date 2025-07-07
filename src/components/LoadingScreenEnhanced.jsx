import { useState, useEffect } from 'react';
import { Stack } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import SplitText from './SplitText';
import { COMPANY_INFO } from '../constants/companyInfo';
import logoSvg from '../assets/Logo.svg';

const LoadingScreen = ({ onComplete, children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Animation sequence timing
    const timer1 = setTimeout(() => {
      setAnimationStep(1); // Show logo
    }, 200);

    const timer2 = setTimeout(() => {
      setAnimationStep(2); // Show welcome text
    }, 1200);

    const timer3 = setTimeout(() => {
      setAnimationStep(3); // Show company name
    }, 3000);

    const timer4 = setTimeout(() => {
      setAnimationStep(4); // Show tagline
    }, 4200);

    const timer5 = setTimeout(() => {
      setIsLoading(false);
      onComplete?.();
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  const handleWelcomeComplete = () => {
    if (!welcomeAnimationDone) {
      setWelcomeAnimationDone(true);
      console.log('Welcome animation completed!');
    }
  };

  const handleCompanyComplete = () => {
    console.log('Company name animation completed!');
  };

  if (!isLoading) {
    return children;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          background: 'radial-gradient(ellipse at center, #3a2817 0%, #1a0f0a 100%)', // Enhanced dark brown gradient
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Helvetica, Arial, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Animated background particles */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(212, 175, 55, 0.06) 0%, transparent 50%)
          `,
          animation: 'pulse 4s ease-in-out infinite',
        }} />

        <Stack align="center" gap="xl" style={{ position: 'relative', zIndex: 2 }}>
          {/* Enhanced Logo with SVG */}
          <AnimatePresence>
            {animationStep >= 1 && (
              <motion.div
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  duration: 1.5 
                }}
                style={{
                  position: 'relative',
                  marginBottom: '30px'
                }}
              >
                {/* Glowing background effect */}
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 50px rgba(212, 175, 55, 0.3)',
                      '0 0 80px rgba(212, 175, 55, 0.5)',
                      '0 0 50px rgba(212, 175, 55, 0.3)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: -20,
                    left: -20,
                    right: -20,
                    bottom: -20,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
                    zIndex: -1
                  }}
                />
                
                <img 
                  src={logoSvg} 
                  alt="Peak Brew Logo"
                  style={{ 
                    width: '140px',
                    height: '140px',
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome Admin Text - Only show once */}
          <AnimatePresence>
            {animationStep >= 2 && !welcomeAnimationDone && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ marginBottom: '20px' }}
              >
                <SplitText
                  text="Welcome Admin"
                  className="loading-welcome-text-enhanced"
                  delay={120}
                  duration={1.0}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 60, rotationX: -90, scale: 0.8 }}
                  to={{ opacity: 1, y: 0, rotationX: 0, scale: 1 }}
                  trigger="immediate"
                  textAlign="center"
                  onLetterAnimationComplete={handleWelcomeComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Company Name */}
          <AnimatePresence>
            {animationStep >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  type: "spring",
                  stiffness: 80,
                  damping: 12,
                  delay: 0.3 
                }}
              >
                <SplitText
                  text={COMPANY_INFO.name}
                  className="loading-company-text-enhanced"
                  delay={80}
                  duration={0.8}
                  ease="power2.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40, scale: 0.6, rotationY: 45 }}
                  to={{ opacity: 1, y: 0, scale: 1, rotationY: 0 }}
                  trigger="immediate"
                  textAlign="center"
                  onLetterAnimationComplete={handleCompanyComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Progress Bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '300px' }}
            transition={{ delay: 1.8, duration: 0.8 }}
            style={{ 
              marginTop: '40px',
              position: 'relative'
            }}
          >
            <div style={{
              width: '300px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
                  borderRadius: '2px',
                  boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
                }}
              />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              style={{
                textAlign: 'center',
                marginTop: '12px',
                color: '#d4af37',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '1px'
              }}
            >
              {progress < 100 ? 'LOADING...' : 'READY'}
            </motion.div>
          </motion.div>

          {/* Tagline */}
          <AnimatePresence>
            {animationStep >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1.2, 
                  delay: 0.5,
                  ease: "easeOut" 
                }}
                style={{
                  color: 'rgba(212, 175, 55, 0.8)',
                  fontSize: '14px',
                  fontWeight: '500',
                  letterSpacing: '1.5px',
                  textAlign: 'center',
                  marginTop: '20px',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                {COMPANY_INFO.tagline}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating particles effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, Math.random() * 400 - 200],
                  y: [0, Math.random() * 400 - 200]
                }}
                transition={{
                  duration: 4,
                  delay: i * 0.5 + 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                style={{
                  position: 'absolute',
                  width: '4px',
                  height: '4px',
                  background: '#d4af37',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.8)'
                }}
              />
            ))}
          </div>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen;
