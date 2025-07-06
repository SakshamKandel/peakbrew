import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Grid,
  Card,
  Text,
  Button,
  Table,
  Badge,
  Group,
  Title,
  Paper,
  ActionIcon,
  LoadingOverlay,
  Stack,
  Flex,
  ThemeIcon,
  Modal,
  Box,
  SimpleGrid,
  TextInput,
  Tooltip,
  Avatar,
  Divider,
  Progress,
  RingProgress,
  Menu,
  Burger,
  NavLink,
  AppShell,
  ScrollArea,
  rem,
} from '@mantine/core';
import {
  IconPlus,
  IconFileText,
  IconEdit,
  IconLogout,
  IconCurrencyDollar,
  IconPackage,
  IconEye,
  IconTrash,
  IconTrendingUp,
  IconCalendar,
  IconSearch,
  IconBell,
  IconSettings,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconUsers,
  IconMail,
  IconPhone,
  IconDashboard,
  IconFilter,
  IconDownload,
  IconRefresh,
  IconStar,
  IconHeart,
  IconTrendingDown,
  IconAnalyze,
  IconChartLine,
  IconReportAnalytics,
  IconBuildingBank,
  IconCreditCard,
  IconCalendarEvent,
  IconUserCheck,
  IconDotsVertical,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  orderBy, 
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';
import { format } from 'date-fns';

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, delay = 0 }) => (
  <MotionCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    style={{
      background: `linear-gradient(135deg, ${color}08 0%, ${color}02 100%)`,
      borderLeft: `4px solid ${color}`,
      position: 'relative',
      overflow: 'hidden',
    }}
    shadow="lg"
    p="xl"
    radius="lg"
  >
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.05) 100%)',
      borderRadius: '0 0 0 40px',
    }} />
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Group justify="space-between" mb="md">
        <ThemeIcon size={50} radius="xl" style={{ backgroundColor: 'white', color, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Icon size={24} />
        </ThemeIcon>
        <Group gap={4}>
          {trend === 'up' ? (
            <IconTrendingUp size={16} style={{ color: '#10b981' }} />
          ) : (
            <IconTrendingDown size={16} style={{ color: '#ef4444' }} />
          )}
          <Text size="sm" fw={600} style={{ color: trend === 'up' ? '#10b981' : '#ef4444' }}>
            {trendValue}
          </Text>
        </Group>
      </Group>
      <Text size="sm" fw={600} tt="uppercase" style={{ color: '#6b7280', letterSpacing: '0.5px' }} mb="xs">
        {title}
      </Text>
      <Text size="2rem" fw={900} style={{ color: '#111827' }}>
        {value}
      </Text>
    </div>
  </MotionCard>
);

const QuickActionCard = ({ title, description, icon: Icon, color, onClick, delay = 0 }) => (
  <MotionCard
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    style={{
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
      transition: 'all 0.3s ease',
      border: '1px solid #e5e7eb',
    }}
    onClick={onClick}
    shadow="md"
    p="xl"
    radius="lg"
    className="hover-lift"
  >
    <Stack align="center" spacing="md">
      <ThemeIcon 
        size={64} 
        radius="xl" 
        style={{ 
          backgroundColor: `${color}15`, 
          color,
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        }}
      >
        <Icon size={32} />
      </ThemeIcon>
      <div style={{ textAlign: 'center' }}>
        <Title order={4} style={{ color: '#111827', marginBottom: '8px' }}>
          {title}
        </Title>
        <Text size="sm" style={{ color: '#6b7280' }}>
          {description}
        </Text>
      </div>
    </Stack>
  </MotionCard>
);

const AnimatedTableRow = ({ children, delay = 0 }) => (
  <motion.tr
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="hover:bg-gray-50 transition-colors duration-200"
  >
    {children}
  </motion.tr>
);

export default function ModernDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [navbarOpened, setNavbarOpened] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { logout, currentUser } = useAuth();

  const formatInvoiceDate = (dateValue) => {
    if (!dateValue) return 'No Date';
    
    let date;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'Invalid Date';
    }
    
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, 'MMM dd, yyyy');
  };

  useEffect(() => {
    if (currentUser) {
      fetchInvoices();
    }
  }, [currentUser]);

  const fetchInvoices = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'invoices'), 
        where("userId", "==", currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const invoiceList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch invoices.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (invoiceData) => {
    if (!currentUser) {
      return notifications.show({
        title: 'Error',
        message: 'You must be logged in to create an invoice.',
        color: 'red',
      });
    }
    try {
      const newInvoice = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await fetchInvoices();
      setShowForm(false);
      setEditingInvoice(null);
      
      const createdInvoice = {
        id: newInvoice.id,
        ...invoiceData,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setPreviewInvoice(createdInvoice);
      
      notifications.show({
        title: 'Success',
        message: 'Invoice created successfully!',
        color: 'green',
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create invoice.',
        color: 'red',
      });
    }
  };

  const handleUpdateInvoice = async (invoiceData) => {
    if (!currentUser) {
      return notifications.show({
        title: 'Error',
        message: 'You must be logged in to update an invoice.',
        color: 'red',
      });
    }
    try {
      const invoiceRef = doc(db, 'invoices', editingInvoice.id);
      await updateDoc(invoiceRef, {
        ...invoiceData,
        updatedAt: new Date()
      });
      
      await fetchInvoices();
      setShowForm(false);
      setEditingInvoice(null);
      notifications.show({
        title: 'Success',
        message: 'Invoice updated successfully!',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update invoice.',
        color: 'red',
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'invoices', invoiceId));
        await fetchInvoices();
        notifications.show({
          title: 'Success',
          message: 'Invoice deleted successfully!',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting invoice:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete invoice.',
          color: 'red',
        });
      }
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      notifications.show({
        title: 'Success',
        message: 'Logged out successfully!',
        color: 'green',
      });
    } catch (error) {
      console.error('Error logging out:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to log out.',
        color: 'red',
      });
    }
  };

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const thisMonthInvoices = invoices.filter(inv => {
    const invoiceDate = new Date(inv.date);
    const now = new Date();
    return invoiceDate.getMonth() === now.getMonth() && 
           invoiceDate.getFullYear() === now.getFullYear();
  }).length;

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm) {
    return (
      <InvoiceForm
        invoice={editingInvoice}
        onSave={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
        onCancel={() => {
          setShowForm(false);
          setEditingInvoice(null);
        }}
      />
    );
  }

  if (previewInvoice) {
    return (
      <InvoicePreview
        invoice={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        onEdit={() => {
          handleEditInvoice(previewInvoice);
          setPreviewInvoice(null);
        }}
      />
    );
  }

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !navbarOpened },
      }}
      padding="md"
      className="bg-gray-50"
    >
      <LoadingOverlay visible={loading} />
      
      <AppShell.Header className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <Burger
              opened={navbarOpened}
              onClick={() => setNavbarOpened(!navbarOpened)}
              hiddenFrom="sm"
              size="sm"
            />
            <div className="flex items-center gap-3">
              <Logo size={40} forDashboard={true} />
              <div>
                <Title order={3} className="text-gray-900 font-bold">
                  {COMPANY_INFO.name}
                </Title>
                <Text size="sm" className="text-gray-600">
                  Dashboard
                </Text>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <TextInput
              placeholder="Search invoices..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              styles={{
                input: {
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  '&:focus': {
                    borderColor: COMPANY_INFO.colors.primary,
                  },
                },
              }}
            />
            
            <Tooltip label="Notifications">
              <ActionIcon size="lg" variant="subtle" className="hover:bg-gray-100">
                <IconBell size={20} />
              </ActionIcon>
            </Tooltip>
            
            <Menu position="bottom-end">
              <Menu.Target>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors">
                  <Avatar size="sm" className="bg-gradient-to-br from-blue-500 to-purple-600">
                    {currentUser?.email?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div className="text-right">
                    <Text size="sm" className="font-medium text-gray-900">
                      {currentUser?.email?.split('@')[0]}
                    </Text>
                    <Text size="xs" className="text-gray-500">
                      Administrator
                    </Text>
                  </div>
                </div>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={16} />}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  leftSection={<IconLogout size={16} />} 
                  onClick={handleLogout}
                  color="red"
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>
      </AppShell.Header>

      <AppShell.Navbar className="border-r border-gray-200 bg-white">
        <AppShell.Section className="p-4">
          <div className="space-y-2">
            <NavLink
              label="Overview"
              leftSection={<IconDashboard size={20} />}
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className="rounded-lg"
            />
            <NavLink
              label="Invoices"
              leftSection={<IconFileText size={20} />}
              active={activeTab === 'invoices'}
              onClick={() => setActiveTab('invoices')}
              className="rounded-lg"
            />
            <NavLink
              label="Analytics"
              leftSection={<IconChartLine size={20} />}
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              className="rounded-lg"
            />
            <NavLink
              label="Customers"
              leftSection={<IconUsers size={20} />}
              active={activeTab === 'customers'}
              onClick={() => setActiveTab('customers')}
              className="rounded-lg"
            />
          </div>
        </AppShell.Section>
        
        <AppShell.Section className="p-4 border-t border-gray-200">
          <Paper 
            p="md" 
            radius="xl" 
            style={{ 
              background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
              border: '1px solid #e5e7eb'
            }}
          >
            <Group mb="md">
              <ThemeIcon size={40} radius="xl" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                <IconBuildingBank size={20} />
              </ThemeIcon>
              <div>
                <Title order={5} style={{ color: '#111827' }}>
                  Peak Brew
                </Title>
                <Text size="xs" style={{ color: '#6b7280' }}>
                  Premium Quality
                </Text>
              </div>
            </Group>
            <Text size="sm" style={{ color: '#374151', marginBottom: '12px' }}>
              Your trusted partner for premium beer distribution
            </Text>
            <Group gap="xs" style={{ fontSize: '13px', color: '#6b7280' }}>
              <IconPhone size={14} />
              <Text size="xs">{COMPANY_INFO.contact.phone}</Text>
            </Group>
            <Group gap="xs" style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              <IconMail size={14} />
              <Text size="xs" truncate>{COMPANY_INFO.contact.email}</Text>
            </Group>
          </Paper>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Welcome Header */}
              <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Title order={1} className="text-white mb-2">
                      Welcome back! 👋
                    </Title>
                    <Text size="lg" className="text-blue-100">
                      Here's what's happening with your business today
                    </Text>
                  </div>
                  <div className="hidden md:block">
                    <Button 
                      size="lg" 
                      variant="white" 
                      className="font-semibold"
                      leftSection={<IconPlus size={20} />}
                      onClick={() => setShowForm(true)}
                    >
                      Create Invoice
                    </Button>
                  </div>
                </div>
              </MotionBox>

              {/* Stats Grid */}
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                <StatCard
                  title="Total Invoices"
                  value={totalInvoices}
                  icon={IconFileText}
                  trend="up"
                  trendValue="+12%"
                  color="#3B82F6"
                  delay={0.1}
                />
                <StatCard
                  title="Total Revenue"
                  value={`$${totalAmount.toLocaleString()}`}
                  icon={IconCurrencyDollar}
                  trend="up"
                  trendValue="+8.2%"
                  color="#10B981"
                  delay={0.2}
                />
                <StatCard
                  title="Pending"
                  value={pendingInvoices}
                  icon={IconPackage}
                  trend="down"
                  trendValue="-3.1%"
                  color="#F59E0B"
                  delay={0.3}
                />
                <StatCard
                  title="This Month"
                  value={thisMonthInvoices}
                  icon={IconCalendar}
                  trend="up"
                  trendValue="+15%"
                  color="#8B5CF6"
                  delay={0.4}
                />
              </SimpleGrid>

              {/* Quick Actions */}
              <div>
                <Title order={2} className="text-gray-900 mb-6">
                  Quick Actions
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                  <QuickActionCard
                    title="Create Invoice"
                    description="Generate a new invoice for your customers"
                    icon={IconFileText}
                    color="#3B82F6"
                    onClick={() => setShowForm(true)}
                    delay={0.1}
                  />
                  <QuickActionCard
                    title="View Analytics"
                    description="Monitor your business performance"
                    icon={IconChartLine}
                    color="#10B981"
                    onClick={() => setActiveTab('analytics')}
                    delay={0.2}
                  />
                  <QuickActionCard
                    title="Manage Customers"
                    description="View and update customer information"
                    icon={IconUsers}
                    color="#F59E0B"
                    onClick={() => setActiveTab('customers')}
                    delay={0.3}
                  />
                  <QuickActionCard
                    title="Export Reports"
                    description="Download detailed business reports"
                    icon={IconReportAnalytics}
                    color="#8B5CF6"
                    onClick={() => {}}
                    delay={0.4}
                  />
                </SimpleGrid>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Title order={2} className="text-gray-900">
                    Recent Activity
                  </Title>
                  <Button 
                    variant="subtle" 
                    rightSection={<IconChevronRight size={16} />}
                    onClick={() => setActiveTab('invoices')}
                  >
                    View All
                  </Button>
                </div>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="overflow-hidden border-0 shadow-lg"
                >
                  <div className="overflow-x-auto">
                    <Table striped highlightOnHover>
                      <Table.Thead className="bg-gray-50">
                        <Table.Tr>
                          <Table.Th className="font-semibold text-gray-900">Invoice</Table.Th>
                          <Table.Th className="font-semibold text-gray-900">Customer</Table.Th>
                          <Table.Th className="font-semibold text-gray-900">Amount</Table.Th>
                          <Table.Th className="font-semibold text-gray-900">Status</Table.Th>
                          <Table.Th className="font-semibold text-gray-900">Date</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filteredInvoices.slice(0, 5).map((invoice, index) => (
                          <AnimatedTableRow key={invoice.id} delay={index * 0.1}>
                            <Table.Td>
                              <Text className="font-medium text-blue-600">
                                #{invoice.invoiceNumber}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <div>
                                <Text className="font-medium text-gray-900">
                                  {invoice.customerName}
                                </Text>
                                <Text size="sm" className="text-gray-500">
                                  {invoice.customerEmail}
                                </Text>
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <Text className="font-semibold text-green-600">
                                ${invoice.total?.toLocaleString() || '0.00'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={
                                  invoice.status === 'paid' ? 'green' :
                                  invoice.status === 'pending' ? 'yellow' : 'red'
                                }
                                variant="light"
                                className="capitalize"
                              >
                                {invoice.status || 'pending'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text className="text-gray-600">
                                {formatInvoiceDate(invoice.date)}
                              </Text>
                            </Table.Td>
                          </AnimatedTableRow>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                </MotionCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AppShell.Main>
    </AppShell>
  );
}