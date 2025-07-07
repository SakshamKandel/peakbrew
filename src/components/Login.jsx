import { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Container,
  Stack,
  Box,
} from '@mantine/core';
import { IconMail, IconLock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';

export default function Login() {
  const [email, setEmail] = useState('peakbrewtrading@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    try {
      await login(email, password);
      notifications.show({
        title: 'Success',
        message: 'Logged in successfully!',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to log in. Please check your credentials.',
        color: 'red',
      });
      console.error('Login error:', error);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      padding: '12px',
      boxSizing: 'border-box',
    }}>
      <Container size={480} style={{ width: '100%', maxWidth: '480px' }}>
        <Paper 
          withBorder 
          shadow="xl" 
          p={{ base: 20, sm: 40 }}
          radius="xl"
          style={{ 
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(232, 200, 72, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(232, 200, 72, 0.1)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Stack align="center" mb={{ base: 'md', sm: 'xl' }} spacing={{ base: 'sm', sm: 'lg' }}>
            <Logo size={80} className="login-logo" />
            <div style={{ textAlign: 'center' }}>
              <Title 
                order={1} 
                style={{ 
                  color: COMPANY_INFO.colors.primary,
                  fontSize: '22px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
                className="login-title"
              >
                {COMPANY_INFO.name}
              </Title>
              <Text 
                c="dimmed" 
                size="md"
                style={{ 
                  color: '#6c757d',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                className="login-subtitle"
              >
                Premium Beer Distribution Portal
              </Text>
            </div>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing="lg">
              <TextInput
                required
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                leftSection={<IconMail size={18} style={{ color: COMPANY_INFO.colors.primary }} />}
                size="lg"
                radius="md"
                styles={{
                  label: {
                    color: '#343a40',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  },
                  input: {
                    height: '48px',
                    fontSize: '15px',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    '&:focus': {
                      borderColor: COMPANY_INFO.colors.primary,
                      boxShadow: `0 0 0 3px rgba(232, 200, 72, 0.1)`,
                    },
                  },
                }}
              />

              <PasswordInput
                required
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                leftSection={<IconLock size={18} style={{ color: COMPANY_INFO.colors.primary }} />}
                size="lg"
                radius="md"
                styles={{
                  label: {
                    color: '#343a40',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  },
                  input: {
                    height: '48px',
                    fontSize: '15px',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    '&:focus': {
                      borderColor: COMPANY_INFO.colors.primary,
                      boxShadow: `0 0 0 3px rgba(232, 200, 72, 0.1)`,
                    },
                  },
                }}
              />

              <Button 
                type="submit" 
                loading={loading}
                size="lg"
                fullWidth
                radius="md"
                style={{
                  height: '52px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${COMPANY_INFO.colors.primary} 0%, #d4af37 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(232, 200, 72, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(232, 200, 72, 0.4)',
                  },
                }}
              >
                Sign In to Dashboard
              </Button>
            </Stack>
          </form>

        </Paper>
      </Container>
      <style>{`
        @media (max-width: 600px) {
          .login-logo { width: 60px !important; height: 60px !important; }
          .login-title { font-size: 18px !important; }
          .login-subtitle { font-size: 12px !important; }
          .mantine-Container-root { padding-left: 8px !important; padding-right: 8px !important; }
          .mantine-TextInput-input, .mantine-PasswordInput-input { 
            font-size: 14px !important; 
            padding: 8px 12px !important; 
          }
          .mantine-Button-root { padding: 10px 16px !important; font-size: 14px !important; }
        }
        @media (max-width: 768px) {
          .login-logo { width: 70px !important; height: 70px !important; }
          .login-title { font-size: 20px !important; }
          .login-subtitle { font-size: 13px !important; }
        }
      `}</style>
    </div>
  );
}