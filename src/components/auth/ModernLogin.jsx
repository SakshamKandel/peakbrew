import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  LoadingOverlay,
  Alert,
  Box,
} from '@mantine/core';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../Logo';

const ModernLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes gradientText {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes gradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
      
      <Box
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 100%)', // Same brown gradient as LoadingScreen
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Helvetica, Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        {/* Crazy animated background elements */}
        <motion.div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #ff0040, #00ffff)',
            filter: 'blur(30px)',
            opacity: 0.3,
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.5, 0.5, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #ffff00, #ff00ff)',
            filter: 'blur(25px)',
            opacity: 0.4,
          }}
          animate={{
            x: [0, -80, 60, 0],
            y: [0, 80, -40, 0],
            rotate: [0, 360, -180, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Floating geometric shapes */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              background: `hsl(${i * 72}, 70%, 50%)`,
              left: `${20 + i * 15}%`,
              top: `${30 + i * 8}%`,
              clipPath: i % 2 === 0 ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
            }}
            animate={{
              y: [-10, -50, -10],
              rotate: [0, 180, 360],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Main login container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {/* Crazy animated logo section */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            <motion.div
              whileHover={{
                scale: 1.1,
                rotate: [0, -10, 10, 0],
                filter: [
                  'hue-rotate(0deg)',
                  'hue-rotate(180deg)',
                  'hue-rotate(360deg)',
                ],
              }}
              animate={{
                filter: [
                  'hue-rotate(0deg)',
                  'hue-rotate(360deg)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                display: 'inline-block',
                marginBottom: '20px',
              }}
            >
              <Logo size={200} forDashboard={true} />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                margin: '0 0 10px 0',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '3px',
              }}
            >
              PEAK BREW
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                color: '#888',
                fontSize: '14px',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              ACCESS PORTAL
            </motion.p>
          </motion.div>

          {/* Ultra minimalist form */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{
              backgroundColor: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '30px',
              position: 'relative',
            }}
          >
            <LoadingOverlay visible={loading} />
            

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ marginBottom: '20px' }}
                >
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    variant="filled"
                    style={{
                      backgroundColor: '#dc2626',
                      borderRadius: '10px',
                      border: 'none',
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {/* Email Field - Ultra minimal */}
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  style={{ position: 'relative' }}
                >
                  <TextInput
                    placeholder="EMAIL"
                    leftSection={<IconMail size={16} style={{ color: '#666' }} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    size="lg"
                    styles={{
                      input: {
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid #333',
                        borderRadius: '0',
                        color: '#000',
                        fontSize: '16px',
                        padding: '15px 50px 15px 40px',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.3s ease',
                        '&::placeholder': {
                          color: '#666',
                          fontSize: '12px',
                          letterSpacing: '2px',
                          fontWeight: 500,
                        },
                        '&:focus': {
                          borderBottom: '2px solid #000',
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        },
                      },
                    }}
                  />
                </motion.div>

                {/* Password Field - Ultra minimal */}
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  style={{ position: 'relative' }}
                >
                  <PasswordInput
                    placeholder="PASSWORD"
                    leftSection={<IconLock size={16} style={{ color: '#666' }} />}
                    visibilityToggleIcon={({ reveal }) =>
                      reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    size="lg"
                    styles={{
                      input: {
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid #333',
                        borderRadius: '0',
                        color: '#000',
                        fontSize: '16px',
                        padding: '15px 50px 15px 40px',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.3s ease',
                        '&::placeholder': {
                          color: '#666',
                          fontSize: '12px',
                          letterSpacing: '2px',
                          fontWeight: 500,
                        },
                        '&:focus': {
                          borderBottom: '2px solid #000',
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        },
                      },
                      innerInput: { color: '#000', fontWeight: 500 },
                      visibilityToggle: { color: '#666' },
                    }}
                  />
                </motion.div>

                {/* Crazy Submit Button */}
                <motion.div style={{ marginTop: '30px' }}>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    style={{
                      backgroundColor: '#000',
                      border: 'none',
                      borderRadius: '50px',
                      fontWeight: 900,
                      fontSize: '14px',
                      height: '50px',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '3px',
                      color: '#fff',
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          backgroundColor: '#333',
                        },
                      },
                    }}
                    component={motion.button}
                    whileHover={{
                      scale: 1.05,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      ENTER
                    </motion.span>
                  </Button>
                </motion.div>
              </Stack>
            </form>
          </motion.div>
        </motion.div>
      </Box>
    </>
  );
};

export default ModernLogin;