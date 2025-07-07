import { motion } from 'framer-motion';
import { Paper, Text, Group, ThemeIcon, Stack } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

const StatCard = ({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  color = 'blue',
  delay = 0,
}) => {
  const isPositive = changeType === 'positive';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
    >
      <Paper
        p="xl"
        radius="lg"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          cursor: 'pointer',
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="sm" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
              {title}
            </Text>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.5, type: 'spring' }}
            >
              <Text size="2xl" fw={900} style={{ lineHeight: 1 }}>
                {value}
              </Text>
            </motion.div>
            
            {change && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.4, duration: 0.3 }}
              >
                <Group gap="xs" align="center">
                  {isPositive ? (
                    <IconTrendingUp size={14} color="green" />
                  ) : (
                    <IconTrendingDown size={14} color="red" />
                  )}
                  <Text 
                    size="xs" 
                    c={isPositive ? 'green' : 'red'} 
                    fw={600}
                  >
                    {change}
                  </Text>
                </Group>
              </motion.div>
            )}
          </Stack>
          
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: delay + 0.1,
              duration: 0.6,
              type: 'spring',
              stiffness: 200,
            }}
            whileHover={{ rotate: 15, scale: 1.1 }}
          >
            <ThemeIcon
              size="xl"
              radius="md"
              variant="gradient"
              gradient={{
                from: color === 'blue' ? '#667eea' : color === 'green' ? '#48bb78' : '#ed8936',
                to: color === 'blue' ? '#764ba2' : color === 'green' ? '#38a169' : '#dd6b20',
                deg: 135,
              }}
            >
              <Icon size={24} />
            </ThemeIcon>
          </motion.div>
        </Group>
      </Paper>
    </motion.div>
  );
};

export default StatCard;