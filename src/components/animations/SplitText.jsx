import { motion } from 'framer-motion';
import { useMemo } from 'react';

const SplitText = ({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 0.5,
  staggerChildren = 0.1,
  variant = 'fadeInUp',
  once = true 
}) => {
  const words = children.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        staggerChildren,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = useMemo(() => {
    const variants = {
      fadeInUp: {
        hidden: { 
          opacity: 0, 
          y: 50,
          rotateX: 90,
        },
        visible: { 
          opacity: 1, 
          y: 0,
          rotateX: 0,
          transition: {
            duration,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      },
      fadeInLeft: {
        hidden: { 
          opacity: 0, 
          x: -50,
        },
        visible: { 
          opacity: 1, 
          x: 0,
          transition: {
            duration,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      },
      scaleIn: {
        hidden: { 
          opacity: 0, 
          scale: 0.5,
        },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: {
            duration,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      },
      slideInRight: {
        hidden: { 
          opacity: 0, 
          x: 100,
        },
        visible: { 
          opacity: 1, 
          x: 0,
          transition: {
            duration,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      },
    };
    return variants[variant] || variants.fadeInUp;
  }, [variant, duration]);

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      viewport={{ once }}
      style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        perspective: '1000px',
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          style={{
            display: 'inline-block',
            marginRight: '0.25em',
            transformOrigin: 'center bottom',
          }}
          whileHover={{
            scale: 1.05,
            color: '#e8c848',
            transition: { duration: 0.2 },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default SplitText;