import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Grid,
  Group,
  Text,
  Button,
  Box,
  Stack,
  Badge,
  ActionIcon,
  Avatar,
  Menu,
  Notification,
} from '@mantine/core';
import {
  IconPlus,
  IconCurrencyDollar,
  IconFileText,
  IconUsers,
  IconTrendingUp,
  IconBell,
  IconLogout,
  IconSettings,
  IconUser,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import SplitText from '../animations/SplitText';
import StatCard from './StatCard';
import ModernTable from './ModernTable';
import Logo from '../Logo';

const ModernDashboardLayout = ({ 
  invoices = [], 
  onCreateInvoice, 
  onEditInvoice, 
  onViewInvoice,
  onDeleteInvoice,
  loading = false 
}) => {
  const { currentUser, logout } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New invoice #INV-001 created successfully', type: 'success', time: new Date() },
    { id: 2, message: 'Payment received for invoice #INV-002', type: 'success', time: new Date() },
  ]);

  // Calculate stats
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;

  // Table columns configuration
  const columns = [
    {
      key: 'invoiceNumber',
      title: 'Invoice #',
      sortable: true,
      render: (value) => (
        <Text fw={600} c="blue">
          #{value}
        </Text>
      ),
    },
    {
      key: 'customerName',
      title: 'Customer',
      sortable: true,
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'total',
      title: 'Amount',
      sortable: true,
      render: (value) => (
        <Text fw={600}>
          ${value?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <Badge
          color={
            value === 'paid' ? 'green' : 
            value === 'pending' ? 'yellow' : 'red'
          }
          variant="filled"
          size="sm"
        >
          {value?.toUpperCase()}
        </Badge>
      ),
    },
  ];

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        padding: '8px',
        boxSizing: 'border-box'
      }}
      className="modern-dashboard-container"
    >
      {/* Animated background elements */}
      <motion.div
        style={{
          position: 'fixed',
          top: '5%',
          right: '5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(60px)',
          zIndex: 0,
        }}
        className="bg-element-1"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        style={{
          position: 'fixed',
          bottom: '10%',
          left: '10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(232, 196, 72, 0.1)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
        className="bg-element-2"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />

      <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'sm', sm: 'xl' }} style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} align="center" wrap="wrap" gap={{ base: 'sm', sm: 'md' }}>
            <Group align="center" wrap="wrap" gap={{ base: 'xs', sm: 'md' }}>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Logo size={50} className="modern-dashboard-logo" />
              </motion.div>
              
              <Stack gap={0}>
                <SplitText
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 800, 
                    color: 'white',
                    margin: 0,
                  }}
                  className="modern-dashboard-title"
                  variant="fadeInLeft"
                  staggerChildren={0.05}
                >
                  Peak Brew Trading LLC
                </SplitText>
                <Text c="white" size="sm" style={{ opacity: 0.8, fontSize: '12px' }} className="modern-dashboard-subtitle">
                  Dashboard Overview
                </Text>
              </Stack>
            </Group>

            <Group gap="md">
              {/* Notifications */}
              <Menu shadow="lg" position="bottom-end">
                <Menu.Target>
                  <ActionIcon
                    size="lg"
                    variant="subtle"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                    }}
                  >
                    <IconBell size={20} />
                    {notifications.length > 0 && (
                      <Badge
                        size="xs"
                        color="red"
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          minWidth: 18,
                          height: 18,
                          padding: 0,
                        }}
                      >
                        {notifications.length}
                      </Badge>
                    )}
                  </ActionIcon>
                </Menu.Target>
                
                <Menu.Dropdown
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: 300,
                  }}
                >
                  <Menu.Label style={{ color: 'white' }}>Notifications</Menu.Label>
                  {notifications.map((notif) => (
                    <Menu.Item
                      key={notif.id}
                      style={{ color: 'white', padding: '12px' }}
                      rightSection={
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => dismissNotification(notif.id)}
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      }
                    >
                      <Stack gap={4}>
                        <Text size="sm">{notif.message}</Text>
                        <Text size="xs" c="dimmed">
                          {format(notif.time, 'MMM dd, HH:mm')}
                        </Text>
                      </Stack>
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              {/* User Menu */}
              <Menu shadow="lg" position="bottom-end">
                <Menu.Target>
                  <Group
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Avatar size="sm" color="blue">
                      {currentUser?.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text c="white" size="sm" fw={500}>
                      {currentUser?.email}
                    </Text>
                  </Group>
                </Menu.Target>
                
                <Menu.Dropdown
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Menu.Item 
                    leftSection={<IconUser size={14} />}
                    style={{ color: 'white' }}
                  >
                    Profile
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconSettings size={14} />}
                    style={{ color: 'white' }}
                  >
                    Settings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    color="red"
                    onClick={logout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </motion.div>

        {/* Stats Cards */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Total Invoices"
              value={totalInvoices}
              change="+12%"
              changeType="positive"
              icon={IconFileText}
              color="blue"
              delay={0.1}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Total Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              change="+8.2%"
              changeType="positive"
              icon={IconCurrencyDollar}
              color="green"
              delay={0.2}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Paid Invoices"
              value={paidInvoices}
              change="+5.4%"
              changeType="positive"
              icon={IconCheck}
              color="green"
              delay={0.3}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Pending"
              value={pendingInvoices}
              change="-2.1%"
              changeType="negative"
              icon={IconTrendingUp}
              color="orange"
              delay={0.4}
            />
          </Grid.Col>
        </Grid>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Group mb="xl">
            <Button
              leftSection={<IconPlus size={16} />}
              size="lg"
              style={{
                background: 'linear-gradient(135deg, #e8c848 0%, #f39c12 100%)',
                border: 'none',
                fontWeight: 600,
              }}
              onClick={onCreateInvoice}
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create New Invoice
            </Button>
          </Group>
        </motion.div>

        {/* Invoices Table */}
        <ModernTable
          title="Recent Invoices"
          data={invoices}
          columns={columns}
          searchable
          filterable
          onRowClick={onViewInvoice}
          onEdit={onEditInvoice}
          onDelete={onDeleteInvoice}
          onView={onViewInvoice}
          loading={loading}
        />
      </Container>

      {/* Floating Notifications */}
      <AnimatePresence>
        {notifications.slice(0, 3).map((notif, index) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              y: index * 80,
            }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
            }}
            style={{
              position: 'fixed',
              top: 100,
              right: 20,
              zIndex: 1000,
            }}
          >
            <Notification
              icon={<IconCheck size={16} />}
              color="green"
              title="Success"
              onClose={() => dismissNotification(notif.id)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
              }}
            >
              {notif.message}
            </Notification>
          </motion.div>
        ))}
      </AnimatePresence>
      <style>{`
        @media (max-width: 600px) {
          .modern-dashboard-container { padding: 4px !important; }
          .modern-dashboard-logo { width: 35px !important; height: 35px !important; }
          .modern-dashboard-title { font-size: 1.1rem !important; }
          .modern-dashboard-subtitle { font-size: 10px !important; }
          .bg-element-1 { width: 120px !important; height: 120px !important; }
          .bg-element-2 { width: 100px !important; height: 100px !important; }
          .mantine-Container-root { padding-left: 4px !important; padding-right: 4px !important; }
          .mantine-Button-root { padding: 6px 10px !important; font-size: 12px !important; }
        }
        @media (max-width: 768px) {
          .modern-dashboard-logo { width: 40px !important; height: 40px !important; }
          .modern-dashboard-title { font-size: 1.3rem !important; }
          .bg-element-1 { width: 150px !important; height: 150px !important; }
          .bg-element-2 { width: 120px !important; height: 120px !important; }
        }
      `}</style>
    </Box>
  );
};

export default ModernDashboardLayout;