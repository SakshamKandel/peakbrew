import { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Text,
  Button,
  Table,
  Badge,
  Group,
  Title,
  ActionIcon,
  LoadingOverlay,
  Stack,
  Flex,
  ThemeIcon,
  Modal,
  Box,
  SimpleGrid,
  TextInput,
  Progress,
  Avatar,
  Menu,
  RingProgress,
  ScrollArea,
  Indicator,
  Tooltip,
  Drawer,
  Tabs,
  Switch,
  Notification,
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
  IconUser,
  IconAnalyze,
  IconChartBar,
  IconTarget,
  IconClock,
  IconFilter,
  IconSortDescending,
  IconMenu2,
  IconHome,
  IconFileInvoice,
  IconReportAnalytics,
  IconUserCircle,
  IconMoon,
  IconSun,
  IconX,
  IconCheck,
  IconExclamationCircle,
  IconArrowUpRight,
  IconArrowDownRight,
  IconDots,
  IconRefresh,
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
import { db, storage } from '../firebase';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';
import { format, startOfMonth, endOfMonth, subMonths, isAfter, isBefore } from 'date-fns';
import { useSpring, animated, useTrail } from 'react-spring';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { logout, currentUser } = useAuth();

  // Animation refs
  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    if (currentUser) {
      fetchInvoices();
      // Set up real-time refresh every 30 seconds
      const interval = setInterval(fetchInvoices, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Helper function to safely format dates
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

  // Enhanced filter and sort logic
  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'amount') {
        return (b.total || 0) - (a.total || 0);
      } else if (sortBy === 'customer') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      return 0;
    });

  const fetchInvoices = async (showRefresh = false) => {
    if (!currentUser) return;
    if (showRefresh) setRefreshing(true);
    if (!showRefresh) setLoading(true);
    
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchInvoices(true);
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
        const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
        
        await deleteDoc(doc(db, 'invoices', invoiceId));
        
        if (invoiceToDelete && invoiceToDelete.pdfURL) {
          try {
            const { ref, deleteObject } = await import('firebase/storage');
            const pdfRef = ref(storage, `invoices/${invoiceId}.pdf`);
            await deleteObject(pdfRef);
          } catch (storageError) {
            console.log('PDF file may not exist in storage:', storageError);
          }
        }
        
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

  // Real-time analytics calculations
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const overdueInvoices = invoices.filter(inv => {
    const invoiceDate = new Date(inv.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return inv.status !== 'paid' && invoiceDate < thirtyDaysAgo;
  }).length;

  // Real-time monthly data calculation
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);
  const twoMonthsAgo = subMonths(currentMonth, 2);
  const threeMonthsAgo = subMonths(currentMonth, 3);

  const getMonthlyData = (month) => {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    const monthInvoices = invoices.filter(inv => {
      const invoiceDate = new Date(inv.date);
      return isAfter(invoiceDate, startDate) && isBefore(invoiceDate, endDate);
    });
    return {
      month: format(month, 'MMM'),
      revenue: monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      invoices: monthInvoices.length,
      paid: monthInvoices.filter(inv => inv.status === 'paid').length,
    };
  };

  const monthlyData = [
    getMonthlyData(threeMonthsAgo),
    getMonthlyData(twoMonthsAgo),
    getMonthlyData(lastMonth),
    getMonthlyData(currentMonth),
  ];

  // Calculate real percentages
  const paidPercentage = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : 0;
  const pendingPercentage = totalInvoices > 0 ? ((pendingInvoices / totalInvoices) * 100).toFixed(1) : 0;
  const overduePercentage = totalInvoices > 0 ? ((overdueInvoices / totalInvoices) * 100).toFixed(1) : 0;
  
  // Revenue growth calculation
  const currentMonthRevenue = monthlyData[3]?.revenue || 0;
  const lastMonthRevenue = monthlyData[2]?.revenue || 0;
  const revenueGrowth = lastMonthRevenue > 0 ? 
    (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : 0;

  const statusData = [
    { name: 'Paid', value: paidInvoices, color: '#10b981', percentage: paidPercentage },
    { name: 'Pending', value: pendingInvoices, color: '#f59e0b', percentage: pendingPercentage },
    { name: 'Overdue', value: overdueInvoices, color: '#ef4444', percentage: overduePercentage },
  ];

  // Real-time stats cards with actual calculations
  const statsCards = [
    { 
      title: 'Total Revenue', 
      value: `$${totalAmount.toLocaleString()}`, 
      icon: IconCurrencyDollar, 
      color: '#10b981', 
      trend: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`,
      isPositive: revenueGrowth >= 0,
      subtitle: 'vs last month'
    },
    { 
      title: 'Total Invoices', 
      value: totalInvoices, 
      icon: IconFileText, 
      color: '#d4af37', 
      trend: `${totalInvoices}`,
      isPositive: true,
      subtitle: 'all time'
    },
    { 
      title: 'Paid Invoices', 
      value: paidInvoices, 
      icon: IconCheck, 
      color: '#10b981', 
      trend: `${paidPercentage}%`,
      isPositive: true,
      subtitle: 'completion rate'
    },
    { 
      title: 'Pending Payment', 
      value: pendingInvoices, 
      icon: IconClock, 
      color: '#f59e0b', 
      trend: `${pendingPercentage}%`,
      isPositive: false,
      subtitle: 'awaiting payment'
    },
  ];

  const trail = useTrail(statsCards.length, {
    opacity: statsInView ? 1 : 0,
    transform: statsInView ? 'translateY(0px)' : 'translateY(20px)',
    config: { tension: 300, friction: 30 }
  });

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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      overflow: 'hidden'
    }}>
      <LoadingOverlay visible={loading} />
      
      {/* Compact Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '12px 20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <Flex justify="space-between" align="center">
          <Group gap="lg">
            <Logo size={50} />
            <div>
              <Title order={3} style={{ 
                color: '#ffffff', 
                fontSize: '1.2rem', 
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {COMPANY_INFO.name}
              </Title>
              <Text size="xs" style={{ color: '#a1a1aa', margin: 0 }}>
                Analytics Dashboard
              </Text>
            </div>
          </Group>
          
          <Group gap="sm">
            <Tooltip label="Refresh Data">
              <ActionIcon
                size={36}
                onClick={handleRefresh}
                loading={refreshing}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Notifications">
              <ActionIcon
                size={36}
                onClick={() => setNotificationsOpen(true)}
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  color: '#d4af37',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                <IconBell size={16} />
              </ActionIcon>
            </Tooltip>

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowForm(true)}
              size="sm"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                color: '#1a1a1a',
                border: 'none',
                fontWeight: 600,
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              New Invoice
            </Button>

            <Button
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
              size="sm"
              variant="light"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                transition: 'all 0.3s ease'
              }}
            >
              Logout
            </Button>
          </Group>
        </Flex>
      </div>

      {/* Main Content with Top Margin */}
      <div style={{ paddingTop: '90px' }}>
        <Container size="xl" p="xl">
          {/* Real-time Stats Grid */}
          <div ref={statsRef}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl" mb="xl">
              {trail.map((style, index) => {
                const card = statsCards[index];
                const Icon = card.icon;
                return (
                  <animated.div key={index} style={style}>
                    <Card
                      shadow="xl"
                      padding="xl"
                      radius="xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        color: '#ffffff',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(74, 55, 40, 0.08) 100%)';
                        e.currentTarget.style.borderColor = `${card.color}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                      }}
                    >
                      <Group justify="space-between" mb="lg">
                        <ThemeIcon 
                          size={60}
                          radius="xl"
                          style={{ 
                            background: `${card.color}20`,
                            color: card.color,
                            border: `1px solid ${card.color}30`
                          }} 
                        >
                          <Icon size={28} />
                        </ThemeIcon>
                        <div style={{ textAlign: 'right' }}>
                          <Text size="xs" style={{ color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {card.subtitle}
                          </Text>
                          <Group gap="xs" justify="flex-end">
                            {card.isPositive ? (
                              <IconArrowUpRight size={16} style={{ color: '#10b981' }} />
                            ) : (
                              <IconArrowDownRight size={16} style={{ color: '#ef4444' }} />
                            )}
                            <Text size="sm" style={{ color: card.isPositive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                              {card.trend}
                            </Text>
                          </Group>
                        </div>
                      </Group>
                      
                      <Text size="sm" fw={500} style={{ color: '#d1d5db', marginBottom: '8px' }}>
                        {card.title}
                      </Text>
                      
                      <Text fw={900} size="2.5rem" style={{
                        color: '#ffffff',
                        lineHeight: 1,
                        marginBottom: '16px'
                      }}>
                        {typeof card.value === 'number' ? 
                          <CountUp end={card.value} duration={2} /> : 
                          card.value
                        }
                      </Text>
                      
                      <Progress
                        value={Math.min(100, (card.value / Math.max(...statsCards.map(c => typeof c.value === 'number' ? c.value : 0))) * 100)}
                        size="sm"
                        radius="xl"
                        styles={{
                          bar: { backgroundColor: card.color }
                        }}
                      />
                    </Card>
                  </animated.div>
                );
              })}
            </SimpleGrid>
          </div>

          {/* Advanced Charts Section */}
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" mb="xl">
            {/* Revenue Trend Chart */}
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              <Group justify="space-between" mb="lg">
                <div>
                  <Title order={3} style={{ color: '#d4af37', marginBottom: '4px' }}>
                    Revenue Analytics
                  </Title>
                  <Text size="sm" style={{ color: '#a1a1aa' }}>
                    Real-time monthly performance
                  </Text>
                </div>
                <ThemeIcon size={40} radius="lg" style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37' }}>
                  <IconChartBar size={20} />
                </ThemeIcon>
              </Group>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(74, 55, 40, 0.95)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d4af37"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Status Distribution */}
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                color: '#ffffff'
              }}
            >
              <Group justify="space-between" mb="lg">
                <div>
                  <Title order={3} style={{ color: '#d4af37', marginBottom: '4px' }}>
                    Invoice Status
                  </Title>
                  <Text size="sm" style={{ color: '#a1a1aa' }}>
                    Payment distribution breakdown
                  </Text>
                </div>
                <RingProgress
                  size={60}
                  thickness={6}
                  sections={statusData.map(item => ({
                    value: parseFloat(item.percentage),
                    color: item.color
                  }))}
                />
              </Group>
              
              <SimpleGrid cols={3} spacing="md" mb="lg">
                {statusData.map((item, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      margin: '0 auto 8px'
                    }} />
                    <Text size="xl" fw={700} style={{ color: '#ffffff' }}>
                      {item.value}
                    </Text>
                    <Text size="xs" style={{ color: '#a1a1aa' }}>
                      {item.name}
                    </Text>
                    <Text size="sm" fw={600} style={{ color: item.color }}>
                      {item.percentage}%
                    </Text>
                  </div>
                ))}
              </SimpleGrid>
              
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(74, 55, 40, 0.95)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </SimpleGrid>

          {/* Enhanced Invoice Management */}
          <Card
            shadow="xl"
            padding={0}
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              overflow: 'hidden'
            }}
          >
            <Box p="xl" style={{ 
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)' 
            }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap="md">
                <div>
                  <Title order={2} style={{ 
                    color: '#d4af37', 
                    fontWeight: 700,
                    marginBottom: '4px'
                  }}>
                    Invoice Management
                  </Title>
                  <Text style={{ color: '#a1a1aa' }} size="sm">
                    Comprehensive tracking with real-time updates
                  </Text>
                </div>
                
                <Group gap="md">
                  <TextInput
                    placeholder="Search invoices..."
                    leftSection={<IconSearch size={16} style={{ color: '#d4af37' }} />}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    style={{ minWidth: 280 }}
                    radius="xl"
                    size="md"
                    styles={{
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37',
                          backgroundColor: 'rgba(74, 55, 40, 0.5)'
                        },
                        '&::placeholder': {
                          color: '#a1a1aa'
                        }
                      }
                    }}
                  />
                  
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon
                        size="lg"
                        style={{
                          background: 'rgba(212, 175, 55, 0.1)',
                          color: '#d4af37',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          borderRadius: '12px'
                        }}
                      >
                        <IconFilter size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown style={{
                      background: 'rgba(74, 55, 40, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '12px'
                    }}>
                      <Menu.Item onClick={() => setFilterStatus('all')} style={{ color: '#ffffff' }}>
                        All Status
                      </Menu.Item>
                      <Menu.Item onClick={() => setFilterStatus('paid')} style={{ color: '#ffffff' }}>
                        Paid Only
                      </Menu.Item>
                      <Menu.Item onClick={() => setFilterStatus('pending')} style={{ color: '#ffffff' }}>
                        Pending Only
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon
                        size="lg"
                        style={{
                          background: 'rgba(156, 163, 175, 0.1)',
                          color: '#9ca3af',
                          border: '1px solid rgba(156, 163, 175, 0.2)',
                          borderRadius: '12px'
                        }}
                      >
                        <IconSortDescending size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown style={{
                      background: 'rgba(74, 55, 40, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '12px'
                    }}>
                      <Menu.Item onClick={() => setSortBy('date')} style={{ color: '#ffffff' }}>
                        Sort by Date
                      </Menu.Item>
                      <Menu.Item onClick={() => setSortBy('amount')} style={{ color: '#ffffff' }}>
                        Sort by Amount
                      </Menu.Item>
                      <Menu.Item onClick={() => setSortBy('customer')} style={{ color: '#ffffff' }}>
                        Sort by Customer
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Flex>
            </Box>

            <ScrollArea style={{ height: 500 }}>
              <Box p="xl">
                {filteredAndSortedInvoices.length === 0 && searchTerm ? (
                  <Stack align="center" py={60}>
                    <ThemeIcon size={80} style={{ 
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      color: '#d4af37'
                    }} variant="light" radius="xl">
                      <IconSearch size={40} />
                    </ThemeIcon>
                    <Title order={3} style={{ color: '#ffffff' }} ta="center">
                      No matching invoices found
                    </Title>
                    <Text size="md" style={{ color: '#a1a1aa' }} ta="center" maw={400}>
                      Try adjusting your search term or filters
                    </Text>
                    <Button
                      variant="light"
                      onClick={() => setSearchTerm('')}
                      size="md"
                      mt="md"
                      style={{
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        color: '#d4af37',
                        border: '1px solid rgba(212, 175, 55, 0.2)'
                      }}
                    >
                      Clear Search
                    </Button>
                  </Stack>
                ) : invoices.length === 0 ? (
                  <Stack align="center" py={80}>
                    <ThemeIcon size={100} style={{ 
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      color: '#d4af37'
                    }} variant="light" radius="xl">
                      <IconFileText size={60} />
                    </ThemeIcon>
                    <Title order={3} style={{ color: '#ffffff' }} ta="center">
                      No invoices created yet
                    </Title>
                    <Text size="md" style={{ color: '#a1a1aa' }} ta="center" maw={400}>
                      Start by creating your first invoice to track payments and manage your business
                    </Text>
                    <Button
                      leftSection={<IconPlus size={20} />}
                      onClick={() => setShowForm(true)}
                      size="lg"
                      mt="lg"
                      style={{ 
                        background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                        color: '#1a1a1a',
                        border: 'none',
                        fontWeight: 700,
                        borderRadius: '12px',
                        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)'
                      }}
                    >
                      Create Your First Invoice
                    </Button>
                  </Stack>
                ) : (
                  <Table
                    verticalSpacing="md"
                    style={{ 
                      '--table-border-color': 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Table.Thead style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Table.Tr>
                        <Table.Th style={{ fontWeight: 600, color: '#d4af37' }}>Invoice</Table.Th>
                        <Table.Th style={{ fontWeight: 600, color: '#d4af37' }}>Customer</Table.Th>
                        <Table.Th style={{ fontWeight: 600, color: '#d4af37' }}>Date</Table.Th>
                        <Table.Th style={{ fontWeight: 600, color: '#d4af37' }}>Amount</Table.Th>
                        <Table.Th style={{ fontWeight: 600, color: '#d4af37' }}>Status</Table.Th>
                        <Table.Th style={{ fontWeight: 600, color: '#d4af37' }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredAndSortedInvoices.map((invoice, index) => (
                        <Table.Tr 
                          key={invoice.id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar size="sm" radius="xl" style={{ background: `hsl(${index * 137.5}, 60%, 50%)` }}>
                                {invoice.invoiceNumber?.slice(-2)}
                              </Avatar>
                              <Text fw={600} style={{ color: '#6366f1' }} size="sm">
                                #{invoice.invoiceNumber}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <div>
                              <Text fw={500} size="sm" style={{ color: '#ffffff' }}>
                                {invoice.customerName}
                              </Text>
                              <Text style={{ color: '#a1a1aa' }} size="xs">
                                {invoice.customerEmail}
                              </Text>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" style={{ color: '#d1d5db' }}>
                              {formatInvoiceDate(invoice.date)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} size="sm" style={{ color: '#10b981' }}>
                              ${invoice.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={invoice.status === 'paid' ? 'green' : invoice.status === 'pending' ? 'yellow' : 'red'}
                              variant="light"
                              radius="lg"
                              size="sm"
                              style={{
                                textTransform: 'capitalize',
                                fontWeight: 500
                              }}
                            >
                              {(invoice.status || 'pending')}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="View Invoice">
                                <ActionIcon
                                  size="sm"
                                  style={{
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366f1',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    borderRadius: '8px'
                                  }}
                                  onClick={() => setPreviewInvoice(invoice)}
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Edit Invoice">
                                <ActionIcon
                                  size="sm"
                                  style={{
                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                    color: '#f59e0b',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    borderRadius: '8px'
                                  }}
                                  onClick={() => handleEditInvoice(invoice)}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Delete Invoice">
                                <ActionIcon
                                  size="sm"
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '8px'
                                  }}
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Box>
            </ScrollArea>
          </Card>
        </Container>
      </div>

      {/* Notifications Drawer */}
      <Drawer
        opened={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        position="right"
        size="md"
        styles={{
          drawer: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          header: {
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          },
          title: {
            color: '#ffffff',
            fontWeight: 600
          }
        }}
      >
        <Stack gap="md">
          <Notification
            icon={<IconCheck size={20} />}
            color="green"
            title="Invoice Paid"
            onClose={() => {}}
            styles={{
              root: {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              },
              title: { color: '#ffffff' },
              description: { color: '#d1d5db' }
            }}
          >
            Invoice #INV-001 has been marked as paid
          </Notification>
          
          <Notification
            icon={<IconExclamationCircle size={20} />}
            color="yellow"
            title="Payment Overdue"
            onClose={() => {}}
            styles={{
              root: {
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              },
              title: { color: '#ffffff' },
              description: { color: '#d1d5db' }
            }}
          >
            Invoice #INV-002 is 30 days overdue
          </Notification>
        </Stack>
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        opened={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
        position="right"
        size="md"
        styles={{
          drawer: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          header: {
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          },
          title: {
            color: '#ffffff',
            fontWeight: 600
          }
        }}
      >
        <Stack gap="lg">
          <div>
            <Text fw={500} style={{ color: '#ffffff', marginBottom: '12px' }}>
              Appearance
            </Text>
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="sm" color={darkMode ? 'yellow' : 'blue'}>
                  {darkMode ? <IconMoon size={14} /> : <IconSun size={14} />}
                </ThemeIcon>
                <Text size="sm" style={{ color: '#d1d5db' }}>
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </Group>
              <Switch
                checked={darkMode}
                onChange={(event) => setDarkMode(event.currentTarget.checked)}
                color="blue"
              />
            </Group>
          </div>
          
          <div>
            <Text fw={500} style={{ color: '#ffffff', marginBottom: '12px' }}>
              Notifications
            </Text>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" style={{ color: '#d1d5db' }}>
                  Email notifications
                </Text>
                <Switch defaultChecked color="green" />
              </Group>
              <Group justify="space-between">
                <Text size="sm" style={{ color: '#d1d5db' }}>
                  Push notifications
                </Text>
                <Switch defaultChecked color="green" />
              </Group>
            </Stack>
          </div>
        </Stack>
      </Drawer>

      {/* Enhanced Modals */}
      <Modal
        opened={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingInvoice(null);
        }}
        title={
          <Group gap="sm">
            <Logo size={60} />
            <Title order={3} style={{ color: '#d4af37' }}>
              {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
            </Title>
          </Group>
        }
        size="xl"
        centered
        radius="xl"
        styles={{
          modal: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          header: {
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
          }
        }}
      >
        <InvoiceForm
          invoice={editingInvoice}
          onSave={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
          onCancel={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
        />
      </Modal>

      <Modal
        opened={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        title={
          <Group gap="sm">
            <Logo size={60} />
            <Title order={3} style={{ color: '#d4af37' }}>
              Invoice Preview
            </Title>
          </Group>
        }
        size="xl"
        centered
        radius="xl"
        styles={{
          modal: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          header: {
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
          }
        }}
      >
        {previewInvoice && (
          <InvoicePreview
            invoice={previewInvoice}
            onClose={() => setPreviewInvoice(null)}
            onEdit={() => {
              handleEditInvoice(previewInvoice);
              setPreviewInvoice(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}