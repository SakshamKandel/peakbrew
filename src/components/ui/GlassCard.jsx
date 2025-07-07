import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const GlassCard = forwardRef(({ 
  children, 
  className = '', 
  blur = 'md',
  opacity = 0.1,
  border = true,
  ...props 
}, ref) => {
  const blurValues = {
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(12px)',
    xl: 'blur(16px)',
  };

  const glassStyles = {
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: blurValues[blur],
    WebkitBackdropFilter: blurValues[blur],
    border: border ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
    borderRadius: '16px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={glassStyles}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
        transition: { duration: 0.3 },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;