import { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Title,
  Alert,
  Progress,
  Badge,
  ActionIcon,
  Divider,
  SimpleGrid,
  NumberInput,
  Switch,
  Modal,
  Loader
} from '@mantine/core';
import {
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconDatabase,
  IconCleanings
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';
import databaseCleanup from '../utils/databaseCleanup';

const DatabaseCleanup = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [cleanupOptions, setCleanupOptions] = useState({
    deleteAll: false,
    deleteOld: false,
    deleteUnpaid: true,
    daysOld: 30,
    unpaidDaysOld: 90
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCleanup, setPendingCleanup] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const cleanupStats = await databaseCleanup.getCleanupStats(currentUser.uid);
      setStats(cleanupStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load cleanup statistics',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async (options) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const results = await databaseCleanup.performCleanup(currentUser.uid, options);
      
      notifications.show({
        title: 'Cleanup Complete',
        message: `Successfully deleted ${results.deleted} invoices out of ${results.total} total invoices`,
        color: 'green',
        icon: <IconCheck />
      });
      
      // Refresh stats
      await fetchStats();
      setShowConfirmModal(false);
      setPendingCleanup(null);
    } catch (error) {
      console.error('Error during cleanup:', error);
      notifications.show({
        title: 'Cleanup Failed',
        message: 'An error occurred during cleanup. Please try again.',
        color: 'red',
        icon: <IconX />
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmCleanup = (options) => {
    setPendingCleanup(options);
    setShowConfirmModal(true);
  };

  const getCleanupDescription = (options) => {
    if (options.deleteAll) {
      return 'This will delete ALL invoices in your database. This action cannot be undone.';
    } else if (options.deleteOld) {
      return `This will delete all invoices older than ${options.daysOld} days. This action cannot be undone.`;
    } else if (options.deleteUnpaid) {
      return `This will delete all unpaid invoices older than ${options.unpaidDaysOld} days. This action cannot be undone.`;
    }
    return '';
  };

  const getEstimatedDeletions = (options) => {
    if (!stats) return 0;
    
    if (options.deleteAll) {
      return stats.totalInvoices;
    } else if (options.deleteOld) {
      return stats.oldInvoices;
    } else if (options.deleteUnpaid) {
      return stats.unpaidOldInvoices;
    }
    return 0;
  };

  if (loading && !stats) {
    return (
      <Container size="lg" py="xl">
        <Card shadow="xl" padding="xl" style={{ textAlign: 'center' }}>
          <Loader size="xl" />
          <Text mt="md">Loading cleanup statistics...</Text>
        </Card>
      </Container>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      padding: '20px'
    }}>
      <Container size="lg">
        {/* Header */}
        <Card shadow="xl" padding="xl" radius="xl" mb="xl" style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(74, 55, 40, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          color: '#ffffff'
        }}>
          <Group justify="space-between" align="center">
            <Group>
              <ActionIcon
                size="lg"
                variant="light"
                onClick={onClose}
                style={{
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  color: '#9ca3af',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <div>
                <Title order={1} style={{ color: '#d4af37' }}>
                  Database Cleanup
                </Title>
                <Text size="lg" style={{ color: '#a1a1aa' }}>
                  Clean up unused invoices from your database
                </Text>
              </div>
            </Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={fetchStats}
              loading={loading}
              variant="light"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              Refresh
            </Button>
          </Group>
        </Card>

        {/* Statistics */}
        {stats && (
          <Card shadow="xl" padding="xl" radius="xl" mb="xl" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff'
          }}>
            <Title order={3} mb="md" style={{ color: '#d4af37' }}>
              Database Statistics
            </Title>
            
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              <Card padding="md" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Text size="sm" style={{ color: '#a1a1aa' }}>Total Invoices</Text>
                <Text size="xl" fw={700} style={{ color: '#3b82f6' }}>
                  {stats.totalInvoices}
                </Text>
              </Card>

              <Card padding="md" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Text size="sm" style={{ color: '#a1a1aa' }}>Paid Invoices</Text>
                <Text size="xl" fw={700} style={{ color: '#10b981' }}>
                  {stats.paidInvoices}
                </Text>
              </Card>

              <Card padding="md" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <Text size="sm" style={{ color: '#a1a1aa' }}>Pending Invoices</Text>
                <Text size="xl" fw={700} style={{ color: '#f59e0b' }}>
                  {stats.pendingInvoices}
                </Text>
              </Card>

              <Card padding="md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Text size="sm" style={{ color: '#a1a1aa' }}>Old Invoices (30+ days)</Text>
                <Text size="xl" fw={700} style={{ color: '#ef4444' }}>
                  {stats.oldInvoices}
                </Text>
              </Card>

              <Card padding="md" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <Text size="sm" style={{ color: '#a1a1aa' }}>Very Old Invoices (90+ days)</Text>
                <Text size="xl" fw={700} style={{ color: '#a855f7' }}>
                  {stats.veryOldInvoices}
                </Text>
              </Card>

              <Card padding="md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Text size="sm" style={{ color: '#a1a1aa' }}>Unpaid Old Invoices</Text>
                <Text size="xl" fw={700} style={{ color: '#ef4444' }}>
                  {stats.unpaidOldInvoices}
                </Text>
              </Card>
            </SimpleGrid>
          </Card>
        )}

        {/* Cleanup Options */}
        <Card shadow="xl" padding="xl" radius="xl" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff'
        }}>
          <Title order={3} mb="md" style={{ color: '#d4af37' }}>
            Cleanup Options
          </Title>

          <Stack gap="lg">
            {/* Delete Unpaid Old Invoices */}
            <Card padding="md" style={{ background: 'rgba(74, 55, 40, 0.2)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text fw={600} style={{ color: '#d4af37' }}>
                    Delete Old Unpaid Invoices (Recommended)
                  </Text>
                  <Text size="sm" style={{ color: '#a1a1aa', marginTop: 4 }}>
                    Delete unpaid invoices older than 90 days. This is the safest option.
                  </Text>
                  <Badge color="green" variant="light" size="sm" mt="xs">
                    Recommended
                  </Badge>
                </div>
                <Button
                  onClick={() => confirmCleanup({
                    deleteUnpaid: true,
                    unpaidDaysOld: 90
                  })}
                  size="sm"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                    color: '#1a1a1a',
                    border: 'none'
                  }}
                  disabled={!stats || stats.unpaidOldInvoices === 0}
                >
                  Delete {stats?.unpaidOldInvoices || 0} Invoices
                </Button>
              </Group>
            </Card>

            {/* Delete All Invoices */}
            <Card padding="md" style={{ background: 'rgba(74, 55, 40, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text fw={600} style={{ color: '#ef4444' }}>
                    Delete All Invoices
                  </Text>
                  <Text size="sm" style={{ color: '#a1a1aa', marginTop: 4 }}>
                    Delete all invoices in your database. This cannot be undone!
                  </Text>
                  <Badge color="red" variant="light" size="sm" mt="xs">
                    Dangerous
                  </Badge>
                </div>
                <Button
                  onClick={() => confirmCleanup({
                    deleteAll: true
                  })}
                  size="sm"
                  color="red"
                  disabled={!stats || stats.totalInvoices === 0}
                >
                  Delete All {stats?.totalInvoices || 0} Invoices
                </Button>
              </Group>
            </Card>

            <Alert
              icon={<IconAlertTriangle />}
              title="Important Warning"
              color="yellow"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#ffffff'
              }}
            >
              <Text style={{ color: '#f59e0b' }}>
                Database cleanup is irreversible. Make sure you have backed up any important data before proceeding.
                We recommend starting with the "Delete Old Unpaid Invoices" option.
              </Text>
            </Alert>
          </Stack>
        </Card>

        {/* Confirmation Modal */}
        <Modal
          opened={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Cleanup"
          centered
          size="md"
        >
          <Stack gap="md">
            <Alert
              icon={<IconAlertTriangle />}
              title="Are you sure?"
              color="red"
            >
              {getCleanupDescription(pendingCleanup)}
            </Alert>
            
            <Text>
              This action will delete approximately <strong>{getEstimatedDeletions(pendingCleanup)}</strong> invoices.
            </Text>
            
            <Group justify="flex-end" gap="md">
              <Button
                variant="light"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={() => handleCleanup(pendingCleanup)}
                loading={loading}
                leftSection={<IconTrash size={16} />}
              >
                Confirm Delete
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </div>
  );
};

export default DatabaseCleanup;