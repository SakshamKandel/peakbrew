import { useRef } from 'react';
import { useTextField } from 'react-aria';
import { motion } from 'framer-motion';
import { Stack, Text, Box } from '@mantine/core';

const AccessibleTextField = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  isRequired = false,
  isDisabled = false,
  errorMessage,
  description,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const ref = useRef();
  const { labelProps, inputProps, descriptionProps, errorMessageProps } = useTextField(
    {
      label,
      placeholder,
      value,
      onChange,
      type,
      isRequired,
      isDisabled,
      errorMessage,
      description,
      ...props,
    },
    ref
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Stack gap="xs">
        {/* Label */}
        <Text
          {...labelProps}
          component="label"
          size="sm"
          fw={500}
          c="white"
          style={{ cursor: 'pointer' }}
        >
          {label}
          {isRequired && (
            <span style={{ color: '#ff6b6b', marginLeft: '4px' }}>*</span>
          )}
        </Text>

        {/* Input wrapper */}
        <Box style={{ position: 'relative' }}>
          {/* Left icon */}
          {leftIcon && (
            <motion.div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                color: 'rgba(255,255,255,0.6)',
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {leftIcon}
            </motion.div>
          )}

          {/* Input field */}
          <motion.input
            {...inputProps}
            ref={ref}
            style={{
              width: '100%',
              padding: leftIcon ? '12px 16px 12px 44px' : '12px 16px',
              paddingRight: rightIcon ? '44px' : '16px',
              borderRadius: '12px',
              border: errorMessage 
                ? '1px solid #ff6b6b' 
                : '1px solid rgba(255,255,255,0.2)',
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#e8c848';
              e.target.style.backgroundColor = 'rgba(255,255,255,0.15)';
              e.target.style.boxShadow = '0 0 0 3px rgba(232, 196, 72, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errorMessage 
                ? '#ff6b6b' 
                : 'rgba(255,255,255,0.2)';
              e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.target.style.boxShadow = 'none';
            }}
            whileFocus={{
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          />

          {/* Right icon */}
          {rightIcon && (
            <motion.div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
              }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {rightIcon}
            </motion.div>
          )}
        </Box>

        {/* Description */}
        {description && (
          <Text
            {...descriptionProps}
            size="xs"
            c="rgba(255,255,255,0.7)"
          >
            {description}
          </Text>
        )}

        {/* Error message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Text
              {...errorMessageProps}
              size="xs"
              c="#ff6b6b"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ⚠️ {errorMessage}
            </Text>
          </motion.div>
        )}
      </Stack>
    </motion.div>
  );
};

const AccessibleForm = ({ 
  children, 
  onSubmit, 
  title, 
  description,
  className = '',
  ...props 
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.form
      className={className}
      onSubmit={onSubmit}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {title && (
        <motion.div variants={itemVariants}>
          <Text size="xl" fw={700} c="white" mb="xs">
            {title}
          </Text>
        </motion.div>
      )}
      
      {description && (
        <motion.div variants={itemVariants}>
          <Text c="rgba(255,255,255,0.8)" mb="xl">
            {description}
          </Text>
        </motion.div>
      )}
      
      <Stack gap="lg">
        {children}
      </Stack>
    </motion.form>
  );
};

export { AccessibleForm, AccessibleTextField };