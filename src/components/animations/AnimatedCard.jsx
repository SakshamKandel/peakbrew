import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const AnimatedCard = forwardRef(({ 
  children, 
  className = '', 
  delay = 0,
  duration = 0.6,
  variant = 'slideUp',
  hover = true,
  ...props 
}, ref) => {
  const variants = {
    slideUp: {
      hidden: { 
        opacity: 0, 
        y: 60,
        scale: 0.95,
      },
      visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    },
    slideLeft: {
      hidden: { 
        opacity: 0, 
        x: -60,
      },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    },
    slideRight: {
      hidden: { 
        opacity: 0, 
        x: 60,
      },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    },
    fadeIn: {
      hidden: { 
        opacity: 0,
      },
      visible: { 
        opacity: 1,
        transition: {
          duration,
          delay,
        },
      },
    },
    scaleIn: {
      hidden: { 
        opacity: 0, 
        scale: 0.8,
      },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    },
  };

  const hoverVariants = hover ? {
    scale: 1.02,
    y: -5,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  } : {};

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants[variant]}
      initial="hidden"
      animate="visible"
      whileHover={hoverVariants}
      viewport={{ once: true }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;