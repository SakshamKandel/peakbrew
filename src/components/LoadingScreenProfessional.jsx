import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Progress, Text, Group, Stack, Box } from '@mantine/core';
import { IconBolt, IconCoffee, IconTrendingUp } from '@tabler/icons-react';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';

const LoadingScreenProfessional = ({ onComplete, children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { text: 'Initializing application...', icon: IconBolt },
    { text: 'Loading your data...', icon: IconCoffee },
    { text: 'Preparing analytics...', icon: IconTrendingUp },
    { text: 'Almost ready...', icon: IconBolt }
  ];

  useEffect(() => {
    // Only show welcome screen on first load, not on page reload
    const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
    
    if (hasShownWelcome) {
      // Skip welcome screen, load quickly
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        onComplete?.();
      }, 500);
      return;
    }

    // Show full loading sequence on first visit
    sessionStorage.setItem('hasShownWelcome', 'true');

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    // Step transitions
    const stepTimers = steps.map((_, index) => 
      setTimeout(() => setCurrentStep(index), index * 1000)
    );

    // Complete loading
    const completeTimer = setTimeout(() => {
      setIsLoading(false);
      onComplete?.();
    }, 4500);

    return () => {
      clearInterval(progressInterval);
      stepTimers.forEach(timer => clearTimeout(timer));
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isLoading) {
    return children;
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
        `,
        animation: 'pulse 6s ease-in-out infinite'
      }} />

      {/* Main content */}
      <Stack align="center" gap="xl" style={{ position: 'relative', zIndex: 2, width: '400px' }}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ position: 'relative', marginBottom: '20px' }}
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(212, 175, 55, 0.3)',
                '0 0 40px rgba(212, 175, 55, 0.5)',
                '0 0 20px rgba(212, 175, 55, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              top: -10,
              left: -10,
              right: -10,
              bottom: -10,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
              zIndex: -1
            }}
          />
          <Logo size={100} />
        </motion.div>

        {/* Company name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ textAlign: 'center', marginBottom: '20px' }}
        >
          <Text
            size="xl"
            fw={700}
            style={{
              color: '#ffffff',
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              letterSpacing: '1px'
            }}
          >
            {COMPANY_INFO.name}
          </Text>
          <Text
            size="sm"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: '8px',
              letterSpacing: '0.5px'
            }}
          >
            {COMPANY_INFO.tagline}
          </Text>
        </motion.div>

        {/* Progress section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ width: '100%', textAlign: 'center' }}
        >
          {/* Progress bar */}
          <Box mb="md">
            <Progress
              value={progress}
              size="sm"
              radius="xl"
              style={{
                '& .mantine-Progress-bar': {
                  background: 'linear-gradient(90deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
                  boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
                }
              }}
            />
          </Box>

          {/* Current step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Group justify="center" gap="sm">
                {steps[currentStep] && (
                  <>
                    {(() => {
                      const CurrentIcon = steps[currentStep].icon;
                      return <CurrentIcon size={16} style={{ color: '#d4af37' }} />;
                    })()}
                    <Text
                      size="sm"
                      style={{
                        color: '#ffffff',
                        fontWeight: 500,
                        letterSpacing: '0.5px'
                      }}
                    >
                      {steps[currentStep].text}
                    </Text>
                  </>
                )}
              </Group>
            </motion.div>
          </AnimatePresence>

          {/* Progress percentage */}
          <Text
            size="xs"
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '16px',
              fontWeight: 600,
              letterSpacing: '1px'
            }}
          >
            {Math.round(progress)}%
          </Text>
        </motion.div>

        {/* Loading dots animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '20px'
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#d4af37'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </Stack>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </motion.div>
  );
};

export default LoadingScreenProfessional;