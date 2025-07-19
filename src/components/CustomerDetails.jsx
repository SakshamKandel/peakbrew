import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Title,
  ActionIcon,
  LoadingOverlay,
  Flex,
  Badge,
  Avatar,
  Divider,
  SimpleGrid,
  ThemeIcon,
  Timeline,
  Progress,
  Tabs,
  Table,
  ScrollArea,
  Alert,
  Box,
  Grid,
  UnstyledButton,
  Tooltip,
  Modal,
  RingProgress,
  Center
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBuilding,
  IconCurrencyDollar,
  IconFileText,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
  IconUser,
  IconStar,
  IconStarFilled,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconNotes,
  IconWorld,
  IconId,
  IconCreditCard,
  IconHistory,
  IconChartBar,
  IconTarget,
  IconActivity,
  IconEye,
  IconDownload,
  IconShare,
  IconPrinter,
  IconRefresh,
  IconPlus,
  IconMinus,
  IconDots,
  IconChevronRight,
  IconUsers,
  IconGraph,
  IconReportMoney
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

const CustomerDetails = ({ customer, onClose, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (customer && currentUser) {
      fetchCustomerInvoices();
    }
  }, [customer, currentUser]);

  useEffect(() => {
    if (customerInvoices.length >= 0) {
      calculateCustomerStats();
    }
  }, [customerInvoices]);

  const fetchCustomerInvoices = async () => {
    if (!currentUser || !customer) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', currentUser.uid),
        where('customerName', '==', customer.name),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCustomerInvoices(invoices);
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch customer invoices',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCustomerStats = () => {
    // Calculate stats from real invoice data
    const totalInvoices = customerInvoices.length;
    const paidInvoices = customerInvoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = customerInvoices.filter(inv => inv.status === 'pending');
    
    // Calculate paid amount (only from paid invoices)
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    // Calculate pending amount (only from pending invoices)
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    // Total revenue should be paid amount only
    const totalRevenue = paidAmount;
    
    const avgInvoiceValue = totalInvoices > 0 ? (paidAmount + pendingAmount) / totalInvoices : 0;
    
    const paymentHistory = customerInvoices.map(inv => ({
      invoiceId: inv.id,
      amount: inv.total || 0,
      date: inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt || Date.now()),
      status: inv.status || 'pending'
    }));
    const onTimePayments = paymentHistory.filter(p => p.status === 'paid').length;
    const paymentScore = paymentHistory.length > 0 ? (onTimePayments / paymentHistory.length) * 100 : 100;

    setCustomerStats({
      totalRevenue,
      totalInvoices,
      avgInvoiceValue,
      paymentScore,
      pendingAmount,
      paidAmount,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      lastPaymentDate: customer.lastInvoiceDate,
      customerSince: customer.createdAt
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'MMM dd, yyyy');
  };

  const formatRelativeDate = (date) => {
    if (!date) return 'Never';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'vip':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'overdue':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getCustomerInitials = (name) => {
    if (!name) return 'N/A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPaymentScoreColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const handleDeleteCustomer = async () => {
    // Implementation would be passed from parent
    setShowDeleteConfirm(false);
    // onDelete(customer.id);
    onClose();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <LoadingOverlay visible={loading} />
      
      <Container size="xl" px={0}>
        {/* Header */}
        <Card
          shadow="xl"
          padding="xl"
          radius="xl"
          mb="xl"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(74, 55, 40, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            color: '#ffffff'
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Group gap="md">
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
              
              <Group gap="xl">
                <Avatar
                  size="xl"
                  radius="xl"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                    color: '#1a1a1a',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getCustomerInitials(customer.name)}
                </Avatar>
                
                <div>
                  <Title order={1} style={{ color: '#d4af37', marginBottom: '8px' }}>
                    {customer.name}
                  </Title>
                  {customer.businessName && (
                    <Text size="lg" fw={500} style={{ color: '#ffffff', marginBottom: '8px' }}>
                      {customer.businessName}
                    </Text>
                  )}
                  {customer.permitNumber && (
                    <Text size="md" style={{ color: '#a1a1aa', marginBottom: '8px' }}>
                      Permit: {customer.permitNumber}
                    </Text>
                  )}
                  <Group gap="sm" mb="sm">
                    <Badge
                      color="green"
                      variant="light"
                      size="lg"
                      radius="lg"
                    >
                      Active Customer
                    </Badge>
                  </Group>
                  <Text size="sm" style={{ color: '#a1a1aa' }}>
                    Customer since {formatDate(customer.createdAt)}
                  </Text>
                </div>
              </Group>
            </Group>
            
            <Group gap="md">
              <Button
                leftSection={<IconEdit size={16} />}
                onClick={onEdit}
                variant="light"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}
              >
                Edit Customer
              </Button>
              
              <Button
                leftSection={<IconTrash size={16} />}
                onClick={() => setShowDeleteConfirm(true)}
                variant="light"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                Delete
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl" mb="xl">
          <Card
            shadow="xl"
            padding="xl"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#ffffff'
            }}
          >
            <Group justify="space-between" mb="md">
              <ThemeIcon size={50} color="green" variant="light">
                <IconCurrencyDollar size={24} />
              </ThemeIcon>
              <Text size="xs" style={{ color: '#10b981' }}>
                TOTAL REVENUE
              </Text>
            </Group>
            <Text size="2rem" fw={900} style={{ color: '#10b981' }}>
              {formatCurrency(customerStats?.totalRevenue)}
            </Text>
          </Card>

          <Card
            shadow="xl"
            padding="xl"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: '#ffffff'
            }}
          >
            <Group justify="space-between" mb="md">
              <ThemeIcon size={50} color="blue" variant="light">
                <IconFileText size={24} />
              </ThemeIcon>
              <Text size="xs" style={{ color: '#6366f1' }}>
                TOTAL INVOICES
              </Text>
            </Group>
            <Text size="2rem" fw={900} style={{ color: '#6366f1' }}>
              {customerStats?.totalInvoices || 0}
            </Text>
          </Card>

          <Card
            shadow="xl"
            padding="xl"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: '#ffffff'
            }}
          >
            <Group justify="space-between" mb="md">
              <ThemeIcon size={50} color="yellow" variant="light">
                <IconTarget size={24} />
              </ThemeIcon>
              <Text size="xs" style={{ color: '#f59e0b' }}>
                AVG INVOICE
              </Text>
            </Group>
            <Text size="2rem" fw={900} style={{ color: '#f59e0b' }}>
              {formatCurrency(customerStats?.avgInvoiceValue)}
            </Text>
          </Card>

          <Card
            shadow="xl"
            padding="xl"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              color: '#ffffff'
            }}
          >
            <Group justify="space-between" mb="md">
              <ThemeIcon size={50} color="violet" variant="light">
                <IconActivity size={24} />
              </ThemeIcon>
              <Text size="xs" style={{ color: '#8b5cf6' }}>
                PAYMENT SCORE
              </Text>
            </Group>
            <Group>
              <Text size="2rem" fw={900} style={{ color: '#8b5cf6' }}>
                {Math.round(customerStats?.paymentScore || 100)}%
              </Text>
              <RingProgress
                size={60}
                thickness={6}
                sections={[
                  { value: customerStats?.paymentScore || 100, color: getPaymentScoreColor(customerStats?.paymentScore || 100) }
                ]}
              />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Main Content */}
        <Card
          shadow="xl"
          padding={0}
          radius="xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List
              style={{
                backgroundColor: 'rgba(74, 55, 40, 0.2)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
              }}
            >
              <Tabs.Tab value="overview" style={{ color: '#ffffff' }}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="invoices" style={{ color: '#ffffff' }}>
                Invoices
              </Tabs.Tab>
              <Tabs.Tab value="activity" style={{ color: '#ffffff' }}>
                Activity
              </Tabs.Tab>
            </Tabs.List>

            <Box p="xl">
              <Tabs.Panel value="overview">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="xl">
                      {/* Contact Information */}
                      <Card
                        padding="lg"
                        style={{
                          background: 'rgba(74, 55, 40, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.1)'
                        }}
                      >
                        <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                          Contact Information
                        </Title>
                        <Stack gap="md">
                          <Group gap="md">
                            <ThemeIcon size={40} color="blue" variant="light">
                              <IconMail size={20} />
                            </ThemeIcon>
                            <div>
                              <Text size="sm" style={{ color: '#a1a1aa' }}>Email</Text>
                              <Text fw={500} style={{ color: '#ffffff' }}>{customer.email}</Text>
                            </div>
                          </Group>
                          
                          <Group gap="md">
                            <ThemeIcon size={40} color="green" variant="light">
                              <IconPhone size={20} />
                            </ThemeIcon>
                            <div>
                              <Text size="sm" style={{ color: '#a1a1aa' }}>Phone</Text>
                              <Text fw={500} style={{ color: '#ffffff' }}>{customer.phone}</Text>
                            </div>
                          </Group>
                          
                          {customer.address && (
                            <Group gap="md">
                              <ThemeIcon size={40} color="red" variant="light">
                                <IconMapPin size={20} />
                              </ThemeIcon>
                              <div>
                                <Text size="sm" style={{ color: '#a1a1aa' }}>Personal Address</Text>
                                <Text fw={500} style={{ color: '#ffffff' }}>
                                  {customer.address}
                                </Text>
                              </div>
                            </Group>
                          )}
                          
                          {customer.businessAddress && (
                            <Group gap="md">
                              <ThemeIcon size={40} color="blue" variant="light">
                                <IconBuilding size={20} />
                              </ThemeIcon>
                              <div>
                                <Text size="sm" style={{ color: '#a1a1aa' }}>Business Address</Text>
                                <Text fw={500} style={{ color: '#ffffff' }}>
                                  {customer.businessAddress}
                                </Text>
                              </div>
                            </Group>
                          )}
                          
                          {customer.permitNumber && (
                            <Group gap="md">
                              <ThemeIcon size={40} color="green" variant="light">
                                <IconFileText size={20} />
                              </ThemeIcon>
                              <div>
                                <Text size="sm" style={{ color: '#a1a1aa' }}>Permit Number</Text>
                                <Text fw={500} style={{ color: '#ffffff' }}>{customer.permitNumber}</Text>
                              </div>
                            </Group>
                          )}
                          
                          {customer.website && (
                            <Group gap="md">
                              <ThemeIcon size={40} color="cyan" variant="light">
                                <IconWorld size={20} />
                              </ThemeIcon>
                              <div>
                                <Text size="sm" style={{ color: '#a1a1aa' }}>Website</Text>
                                <Text fw={500} style={{ color: '#ffffff' }}>{customer.website}</Text>
                              </div>
                            </Group>
                          )}
                        </Stack>
                      </Card>

                      {/* Business Information */}
                      <Card
                        padding="lg"
                        style={{
                          background: 'rgba(74, 55, 40, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.1)'
                        }}
                      >
                        <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                          Business Information
                        </Title>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <div>
                            <Text size="sm" style={{ color: '#a1a1aa' }}>Customer Type</Text>
                            <Text fw={500} style={{ color: '#ffffff' }}>{customer.customerType || 'Regular'}</Text>
                          </div>
                          {customer.industry && (
                            <div>
                              <Text size="sm" style={{ color: '#a1a1aa' }}>Industry</Text>
                              <Text fw={500} style={{ color: '#ffffff' }}>{customer.industry}</Text>
                            </div>
                          )}
                          {customer.taxId && (
                            <div>
                              <Text size="sm" style={{ color: '#a1a1aa' }}>Tax ID</Text>
                              <Text fw={500} style={{ color: '#ffffff' }}>{customer.taxId}</Text>
                            </div>
                          )}
                          {customer.referralSource && (
                            <div>
                              <Text size="sm" style={{ color: '#a1a1aa' }}>Referral Source</Text>
                              <Text fw={500} style={{ color: '#ffffff' }}>{customer.referralSource}</Text>
                            </div>
                          )}
                        </SimpleGrid>
                      </Card>

                      {/* Notes */}
                      {customer.notes && (
                        <Card
                          padding="lg"
                          style={{
                            background: 'rgba(74, 55, 40, 0.2)',
                            border: '1px solid rgba(212, 175, 55, 0.1)'
                          }}
                        >
                          <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                            Notes
                          </Title>
                          <Text style={{ color: '#ffffff' }}>{customer.notes}</Text>
                        </Card>
                      )}
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 4 }}>
                    {/* Quick Actions */}
                    <Card
                      padding="lg"
                      style={{
                        background: 'rgba(74, 55, 40, 0.2)',
                        border: '1px solid rgba(212, 175, 55, 0.1)'
                      }}
                    >
                      <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                        Quick Actions
                      </Title>
                      <Stack gap="sm">
                        <Button
                          leftSection={<IconPlus size={16} />}
                          fullWidth
                          variant="light"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          Create Invoice
                        </Button>
                        <Button
                          leftSection={<IconPhone size={16} />}
                          fullWidth
                          variant="light"
                          style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}
                        >
                          Call Customer
                        </Button>
                        <Button
                          leftSection={<IconMail size={16} />}
                          fullWidth
                          variant="light"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                          }}
                        >
                          Send Email
                        </Button>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="invoices">
                <Card
                  padding="lg"
                  style={{
                    background: 'rgba(74, 55, 40, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.1)'
                  }}
                >
                  <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                    Customer Invoices
                  </Title>
                  
                  <ScrollArea style={{ height: 400 }}>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ color: '#d4af37' }}>Invoice #</Table.Th>
                          <Table.Th style={{ color: '#d4af37' }}>Date</Table.Th>
                          <Table.Th style={{ color: '#d4af37' }}>Amount</Table.Th>
                          <Table.Th style={{ color: '#d4af37' }}>Status</Table.Th>
                          <Table.Th style={{ color: '#d4af37' }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {customerInvoices.map((invoice) => (
                          <Table.Tr key={invoice.id}>
                            <Table.Td style={{ color: '#ffffff' }}>{invoice.invoiceNumber}</Table.Td>
                            <Table.Td style={{ color: '#ffffff' }}>{formatDate(invoice.date)}</Table.Td>
                            <Table.Td style={{ color: '#10b981' }}>{formatCurrency(invoice.total)}</Table.Td>
                            <Table.Td>
                              <Badge
                                color={getInvoiceStatusColor(invoice.status)}
                                variant="light"
                                size="sm"
                              >
                                {invoice.status}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <ActionIcon size="sm" variant="light" color="blue">
                                  <IconEye size={14} />
                                </ActionIcon>
                                <ActionIcon size="sm" variant="light" color="green">
                                  <IconDownload size={14} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Card>
              </Tabs.Panel>

              <Tabs.Panel value="activity">
                <Card
                  padding="lg"
                  style={{
                    background: 'rgba(74, 55, 40, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.1)'
                  }}
                >
                  <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                    Recent Activity
                  </Title>
                  
                  <Timeline active={0} bulletSize={24} lineWidth={2}>
                    <Timeline.Item
                      bullet={<IconCheck size={12} />}
                      title="Payment Received"
                      color="green"
                    >
                      <Text size="sm" style={{ color: '#a1a1aa' }}>
                        Payment of {formatCurrency(1500)} received for Invoice #INV-001
                      </Text>
                      <Text size="xs" style={{ color: '#6b7280' }}>
                        2 days ago
                      </Text>
                    </Timeline.Item>
                    
                    <Timeline.Item
                      bullet={<IconFileText size={12} />}
                      title="Invoice Created"
                      color="blue"
                    >
                      <Text size="sm" style={{ color: '#a1a1aa' }}>
                        Invoice #INV-002 created for {formatCurrency(2200)}
                      </Text>
                      <Text size="xs" style={{ color: '#6b7280' }}>
                        1 week ago
                      </Text>
                    </Timeline.Item>
                    
                    <Timeline.Item
                      bullet={<IconUser size={12} />}
                      title="Customer Updated"
                      color="yellow"
                    >
                      <Text size="sm" style={{ color: '#a1a1aa' }}>
                        Customer information updated
                      </Text>
                      <Text size="xs" style={{ color: '#6b7280' }}>
                        2 weeks ago
                      </Text>
                    </Timeline.Item>
                  </Timeline>
                </Card>
              </Tabs.Panel>
            </Box>
          </Tabs>
        </Card>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Customer"
        centered
        styles={{
          modal: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          title: {
            color: '#ffffff',
            fontWeight: 600
          }
        }}
      >
        <Stack gap="md">
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Warning"
            color="red"
            variant="light"
          >
            This action cannot be undone. Are you sure you want to delete this customer?
          </Alert>
          
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                color: '#9ca3af',
                border: '1px solid rgba(156, 163, 175, 0.2)'
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteCustomer}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              Delete Customer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default CustomerDetails;