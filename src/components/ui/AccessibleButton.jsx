import { useRef } from 'react';
import { useButton } from 'react-aria';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const AccessibleButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  ...props
}, ref) => {
  const buttonRef = useRef(ref);
  const { buttonProps, isPressed } = useButton(
    {
      onPress: onClick,
      isDisabled: isDisabled || isLoading,
      ...props,
    },
    buttonRef
  );

  const variants = {
    primary: {
      base: {
        background: 'linear-gradient(135deg, #e8c848 0%, #f39c12 100%)',
        color: 'white',
        border: 'none',
      },
      hover: {
        background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        scale: 1.02,
      },
      pressed: {
        scale: 0.98,
      },
    },
    secondary: {
      base: {
        background: 'transparent',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
      },
      hover: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.5)',
        scale: 1.02,
      },
      pressed: {
        scale: 0.98,
      },
    },
    ghost: {
      base: {
        background: 'transparent',
        color: 'white',
        border: 'none',
      },
      hover: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        scale: 1.02,
      },
      pressed: {
        scale: 0.98,
      },
    },
  };

  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: '14px',
      height: '36px',
    },
    md: {
      padding: '12px 24px',
      fontSize: '16px',
      height: '44px',
    },
    lg: {
      padding: '16px 32px',
      fontSize: '18px',
      height: '52px',
    },
  };

  const currentVariant = variants[variant];
  const currentSize = sizes[size];

  return (
    <motion.button
      {...buttonProps}
      ref={buttonRef}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '12px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden',
        ...currentVariant.base,
        ...currentSize,
      }}
      initial={currentVariant.base}
      whileHover={!isDisabled ? currentVariant.hover : {}}
      whileTap={!isDisabled ? currentVariant.pressed : {}}
      whileFocus={{
        boxShadow: '0 0 0 3px rgba(232, 196, 72, 0.3)',
      }}
      transition={{
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Loading spinner */}
      {isLoading && (
        <motion.div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      
      {/* Left icon */}
      {leftIcon && !isLoading && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {leftIcon}
        </motion.span>
      )}
      
      {/* Button text */}
      {!isLoading && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {children}
        </motion.span>
      )}
      
      {/* Right icon */}
      {rightIcon && !isLoading && (
        <motion.span
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {rightIcon}
        </motion.span>
      )}
      
      {/* Ripple effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          opacity: 0,
          pointerEvents: 'none',
        }}
        animate={isPressed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;