import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconUsers,
  IconMoon,
  IconSun,
  IconX,
  IconCheck,
  IconExclamationCircle,
  IconArrowUpRight,
  IconArrowDownRight,
  IconDots,
  IconRefresh,
  IconCalculator,
} from '@tabler/icons-react';
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
import customerService from '../services/customerService';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import CustomerManagement from './CustomerManagement';
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(null);
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

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
      console.error('Failed to fetch invoices.');
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
      return console.error('You must be logged in to create an invoice.');
    }
    try {
      const newInvoice = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const createdInvoice = {
        id: newInvoice.id,
        ...invoiceData,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update customer statistics if customerName is provided
      if (invoiceData.customerName) {
        try {
          // Find customer by name
          const customersResult = await customerService.getCustomers(currentUser.uid);
          const customer = customersResult.customers.find(c => 
            c.name.toLowerCase() === invoiceData.customerName.toLowerCase()
          );
          
          if (customer) {
            await customerService.updateCustomerStats(customer.id, createdInvoice, 'add');
          }
        } catch (customerError) {
          console.error('Error updating customer stats:', customerError);
        }
      }
      
      await fetchInvoices();
      setShowForm(false);
      setEditingInvoice(null);
      
      setPreviewInvoice(createdInvoice);
      
      console.log('Invoice created successfully!');
    } catch (error) {
      console.error('Error creating invoice:', error);
      console.error('Failed to create invoice.');
    }
  };

  const handleUpdateInvoice = async (invoiceData) => {
    if (!currentUser) {
      return console.error('You must be logged in to update an invoice.');
    }
    
    if (!editingInvoice || !editingInvoice.id) {
      return console.error('No invoice selected for editing.');
    }
    
    try {
      console.log('Updating invoice with ID:', editingInvoice.id);
      console.log('Invoice data to update:', invoiceData);
      
      const invoiceRef = doc(db, 'invoices', editingInvoice.id);
      await updateDoc(invoiceRef, {
        ...invoiceData,
        userId: currentUser.uid, // Ensure user ID is maintained
        updatedAt: new Date(),
        pdfURL: null // Clear PDF URL to force regeneration
      });
      
      // Update customer statistics if customer has changed or invoice amount changed
      if (invoiceData.customerName || editingInvoice.customerName) {
        try {
          const customersResult = await customerService.getCustomers(currentUser.uid);
          
          // Remove from old customer if customer name changed
          if (editingInvoice.customerName && editingInvoice.customerName !== invoiceData.customerName) {
            const oldCustomer = customersResult.customers.find(c => 
              c.name.toLowerCase() === editingInvoice.customerName.toLowerCase()
            );
            if (oldCustomer) {
              await customerService.updateCustomerStats(oldCustomer.id, editingInvoice, 'remove');
            }
          }
          
          // Add to new customer
          if (invoiceData.customerName) {
            const newCustomer = customersResult.customers.find(c => 
              c.name.toLowerCase() === invoiceData.customerName.toLowerCase()
            );
            if (newCustomer) {
              await customerService.updateCustomerStats(newCustomer.id, {
                ...invoiceData,
                id: editingInvoice.id
              }, 'add');
            }
          }
        } catch (customerError) {
          console.error('Error updating customer stats:', customerError);
        }
      }
      
      console.log('Invoice updated successfully in database');
      
      await fetchInvoices();
      setShowForm(false);
      setEditingInvoice(null);
      console.log('Invoice updated successfully!');
    } catch (error) {
      console.error('Error updating invoice:', error);
      console.error('Failed to update invoice. Please try again.');
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
        
        console.log('Invoice deleted successfully!');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        console.error('Failed to delete invoice.');
      }
    }
  };

  const handleEditInvoice = (invoice) => {
    console.log('Edit invoice clicked for:', invoice);
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logged out successfully!');
    } catch (error) {
      console.error('Error logging out:', error);
      console.error('Failed to log out.');
    }
  };

  // Real-time analytics calculations
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;

  // Calculate revenue separately for paid invoices only
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, invoice) => sum + (invoice.total || 0), 0);

  // Real-time monthly data calculation
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);
  const twoMonthsAgo = subMonths(currentMonth, 2);
  const threeMonthsAgo = subMonths(currentMonth, 3);

  const getMonthlyData = (month) => {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    const monthInvoices = invoices.filter(inv => {
      if (!inv.date) return false;
      
      let invoiceDate;
      // Handle different date formats
      if (inv.date.toDate && typeof inv.date.toDate === 'function') {
        invoiceDate = inv.date.toDate();
      } else if (inv.date.seconds) {
        invoiceDate = new Date(inv.date.seconds * 1000);
      } else if (typeof inv.date === 'string') {
        invoiceDate = new Date(inv.date);
      } else if (inv.date instanceof Date) {
        invoiceDate = inv.date;
      } else {
        return false;
      }
      
      // Check if date is valid
      if (isNaN(invoiceDate.getTime())) return false;
      
      // Include invoices from the entire month (inclusive of start and end dates)
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
    
    console.log(`Monthly data for ${format(month, 'MMM yyyy')}: ${monthInvoices.length} invoices, $${monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0)} revenue`);
    
    const paidInvoicesInMonth = monthInvoices.filter(inv => inv.status === 'paid');
    const pendingInvoicesInMonth = monthInvoices.filter(inv => inv.status === 'pending');

    return {
      month: format(month, 'MMM'),
      revenue: paidInvoicesInMonth.reduce((sum, inv) => sum + (inv.total || 0), 0),
      pending: pendingInvoicesInMonth.reduce((sum, inv) => sum + (inv.total || 0), 0),
      invoices: monthInvoices.length,
      paidCount: paidInvoicesInMonth.length,
      pendingCount: pendingInvoicesInMonth.length,
    };
  };

  const monthlyData = [
    getMonthlyData(threeMonthsAgo),
    getMonthlyData(twoMonthsAgo),
    getMonthlyData(lastMonth),
    getMonthlyData(currentMonth),
  ];

  console.log('Total invoices for analytics:', invoices.length);
  console.log('Monthly data:', monthlyData);
  
  // Validate monthly data for chart
  const validMonthlyData = monthlyData.filter(data => data && data.month && typeof data.revenue === 'number');
  console.log('Valid monthly data for chart:', validMonthlyData);

  // Calculate real percentages
  const paidPercentage = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : 0;
  const pendingPercentage = totalInvoices > 0 ? ((pendingInvoices / totalInvoices) * 100).toFixed(1) : 0;
  
  // Revenue growth calculation (only paid invoices)
  const currentMonthRevenue = monthlyData[3]?.revenue || 0;
  const lastMonthRevenue = monthlyData[2]?.revenue || 0;
  const revenueGrowth = lastMonthRevenue > 0 ? 
    (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : 0;
  
  console.log('Revenue growth calculation:');
  console.log('Current month revenue:', currentMonthRevenue);
  console.log('Last month revenue:', lastMonthRevenue);
  console.log('Revenue growth:', revenueGrowth + '%');

  const statusData = [
    { 
      name: 'Paid', 
      value: paidInvoices, 
      amount: totalRevenue,
      color: '#10b981', 
      percentage: paidPercentage,
      description: 'Successfully collected'
    },
    { 
      name: 'Pending', 
      value: pendingInvoices, 
      amount: pendingAmount,
      color: '#f59e0b', 
      percentage: pendingPercentage,
      description: 'Awaiting payment'
    },
  ];


  // Helper function to get invoices by status for detailed view
  const getInvoicesByStatus = (status) => {
    switch (status) {
      case 'paid':
        return invoices.filter(inv => inv.status === 'paid');
      case 'pending':
        return invoices.filter(inv => inv.status === 'pending');
      default:
        return invoices;
    }
  };

  // Real-time stats cards with actual calculations
  const statsCards = [
    { 
      title: 'Total Revenue (Paid)', 
      value: `$${totalRevenue.toLocaleString()}`, 
      icon: IconCurrencyDollar, 
      color: '#10b981', 
      trend: `${paidInvoices} paid invoices`,
      isPositive: revenueGrowth >= 0,
      subtitle: `Growth: ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`,
      clickAction: () => setShowDetailedView('paid'),
      statusType: 'paid'
    },
    { 
      title: 'Awaiting Payment', 
      value: `$${pendingAmount.toLocaleString()}`, 
      icon: IconClock, 
      color: '#f59e0b', 
      trend: `${pendingInvoices} pending invoices`,
      isPositive: false,
      subtitle: 'click to view details',
      clickAction: () => setShowDetailedView('pending'),
      statusType: 'pending'
    },
    { 
      title: 'Total Invoices', 
      value: totalInvoices, 
      icon: IconFileText, 
      color: '#6366f1', 
      trend: `${Math.round((paidInvoices / totalInvoices) * 100)}% completed`,
      isPositive: true,
      subtitle: 'all time invoices',
      clickAction: () => setShowDetailedView('all'),
      statusType: 'all'
    },
    { 
      title: 'Payment Rate', 
      value: `${paidPercentage}%`, 
      icon: IconTarget, 
      color: '#8b5cf6', 
      trend: `${paidInvoices}/${totalInvoices} paid`,
      isPositive: parseFloat(paidPercentage) > 70,
      subtitle: 'success rate',
      clickAction: () => setShowDetailedView('paid'),
      statusType: 'paid'
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
      overflow: 'hidden',
      padding: '8px',
      boxSizing: 'border-box'
    }}>
      <LoadingOverlay 
        visible={loading} 
        overlayProps={{ 
          color: 'rgba(0, 0, 0, 0.8)', 
          backgroundOpacity: 0.8,
          blur: 2
        }}
        loaderProps={{ 
          color: '#d4af37',
          size: 'lg',
          type: 'dots'
        }}
      />
      
      {/* Compact Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }} className="responsive-nav">
        <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap={{ base: 'xs', sm: 'lg' }}>
            <Logo size={40} className="responsive-nav-logo" />
            <div>
              <Title order={3} style={{ 
                color: '#ffffff', 
                fontSize: '1rem', 
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }} className="responsive-nav-title">
                {COMPANY_INFO.name}
              </Title>
              <Text size="xs" style={{ color: '#a1a1aa', margin: 0, fontSize: '10px' }} className="responsive-nav-subtitle">
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




            <Button
              leftSection={<IconUsers size={14} />}
              onClick={() => navigate('/customers')}
              size="sm"
              variant="light"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '10px',
                transition: 'all 0.3s ease'
              }}
              className="nav-btn-customers"
            >
              <span className="btn-text-full">Customers</span>
              <span className="btn-text-short">CRM</span>
            </Button>

            <Button
              leftSection={<IconCalculator size={14} />}
              onClick={() => navigate('/calculator')}
              size="sm"
              variant="light"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '10px',
                transition: 'all 0.3s ease'
              }}
              className="nav-btn-calculator"
            >
              <span className="btn-text-full">Calculator</span>
              <span className="btn-text-short">Calc</span>
            </Button>

            <Button
              leftSection={<IconPlus size={14} />}
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
              className="nav-btn-primary"
            >
              <span className="btn-text-full">New Invoice</span>
              <span className="btn-text-short">New</span>
            </Button>

            <Button
              leftSection={<IconLogout size={14} />}
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
              className="nav-btn-logout"
            >
              <span className="btn-text-full">Logout</span>
              <span className="btn-text-short">Out</span>
            </Button>
          </Group>
        </Flex>
      </div>

      {/* Main Content with Top Margin */}
      <div style={{ paddingTop: '90px' }} className="responsive-main-content">
        <Container size="xl" p={{ base: 'md', sm: 'xl' }} px={{ base: 'sm', sm: 'xl' }}>
          {/* Real-time Stats Grid */}
          <div ref={statsRef}>
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 2, lg: 4 }} spacing={{ base: 'sm', sm: 'md', lg: 'lg' }} mb={{ base: 'md', sm: 'xl' }}>
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
                      onClick={() => card.clickAction && card.clickAction()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(74, 55, 40, 0.08) 100%)';
                        e.currentTarget.style.borderColor = `${card.color}60`;
                        e.currentTarget.style.boxShadow = `0 12px 40px ${card.color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                        e.currentTarget.style.boxShadow = 'none';
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
                      
                      <Group justify="space-between" align="center" mb="xs">
                        <Text size="sm" fw={500} style={{ color: '#d1d5db' }}>
                          {card.title}
                        </Text>
                        <Text size="xs" style={{ color: '#a1a1aa', fontSize: '10px' }}>
                          Click for details
                        </Text>
                      </Group>
                      
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
                    Payment Status Analytics
                  </Title>
                  <Text size="sm" style={{ color: '#a1a1aa' }}>
                    Paid Revenue • Pending Payments
                  </Text>
                </div>
                <ThemeIcon size={40} radius="lg" style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37' }}>
                  <IconChartBar size={20} />
                </ThemeIcon>
              </Group>
              
              {validMonthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={validMonthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#a1a1aa" />
                    <YAxis 
                      stroke="#a1a1aa" 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(74, 55, 40, 0.95)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={(value, name) => {
                        const labels = {
                          revenue: 'Paid Revenue',
                          pending: 'Pending Amount'
                        };
                        return [`$${value.toLocaleString()}`, labels[name] || name];
                      }}
                      labelStyle={{ color: '#ffffff' }}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#ffffff' }}
                      formatter={(value) => {
                        const labels = {
                          revenue: 'Paid Revenue',
                          pending: 'Pending Amount'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: 300, 
                  color: '#a1a1aa' 
                }}>
                  <Text>No revenue data available for the selected period</Text>
                </div>
              )}
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
                    Payment Status Distribution
                  </Title>
                  <Text size="sm" style={{ color: '#a1a1aa' }}>
                    Invoice counts and amounts by status
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
              
              <SimpleGrid cols={2} spacing="lg" mb="xl">
                {statusData.map((item, index) => (
                  <Card
                    key={index}
                    padding="lg"
                    style={{
                      cursor: 'pointer',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      border: `2px solid ${item.color}40`,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'center',
                      minHeight: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    onClick={() => setShowDetailedView(item.name.toLowerCase())}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${item.color}15`;
                      e.currentTarget.style.borderColor = `${item.color}80`;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 12px 24px ${item.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = `${item.color}40`;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Stack gap="sm" align="center">
                      <div style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        boxShadow: `0 0 20px ${item.color}60`
                      }} />
                      
                      <Text size="2xl" fw={900} style={{ color: '#ffffff', lineHeight: 1 }}>
                        {item.value}
                      </Text>
                      
                      <Text size="sm" fw={500} style={{ color: '#a1a1aa' }}>
                        {item.name} Invoices
                      </Text>
                      
                      <Text size="lg" fw={700} style={{ color: item.color, lineHeight: 1 }}>
                        ${item.amount.toLocaleString()}
                      </Text>
                      
                      <Text size="xs" style={{ color: '#9ca3af', textAlign: 'center' }}>
                        {item.description}
                      </Text>
                      
                      <Badge
                        color={item.color.replace('#', '')}
                        variant="light"
                        size="sm"
                        style={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        {item.percentage}% of total
                      </Badge>
                      
                      <Text size="xs" style={{ color: '#6b7280', marginTop: '4px' }}>
                        Click for details
                      </Text>
                    </Stack>
                  </Card>
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
                    formatter={(value, name, props) => [
                      `${value} invoices`, 
                      `${props.payload.name} - $${props.payload.amount.toLocaleString()}`
                    ]}
                    labelFormatter={() => 'Invoice Status'}
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

      {/* Detailed View Modal */}
      <Modal
        opened={!!showDetailedView}
        onClose={() => setShowDetailedView(null)}
        title={
          <Group gap="sm" align="center">
            <Logo size={50} />
            <div>
              <Title order={3} style={{ color: '#d4af37', marginBottom: '4px', fontSize: '1.4rem' }}>
                {showDetailedView === 'paid' && 'Paid Invoices Details'}
                {showDetailedView === 'pending' && 'Pending Payments Details'}
                {showDetailedView === 'all' && 'All Invoices Overview'}
              </Title>
              <Text size="sm" style={{ color: '#a1a1aa' }}>
                {showDetailedView === 'paid' && 'Successfully collected payments'}
                {showDetailedView === 'pending' && 'Invoices awaiting payment'}
                {showDetailedView === 'all' && 'Complete invoice overview'}
              </Text>
            </div>
          </Group>
        }
        size="xl"
        centered
        radius="xl"
        styles={{
          modal: {
            backgroundColor: 'rgba(26, 19, 16, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            color: '#ffffff'
          },
          header: {
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(74, 55, 40, 0.1) 100%)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '20px 24px',
            borderRadius: '16px 16px 0 0'
          },
          body: {
            padding: '24px',
            maxHeight: '70vh',
            overflowY: 'auto',
            backgroundColor: 'transparent'
          },
          close: {
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(212, 175, 55, 0.1)'
            }
          }
        }}
        overlayProps={{
          backgroundOpacity: 0.75,
          blur: 10,
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        {showDetailedView && (
          <Stack gap="lg">
            <Card 
              padding="lg" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(74, 55, 40, 0.05) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: '12px'
              }}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text size="xl" fw={700} style={{ color: '#d4af37', marginBottom: '4px' }}>
                    {showDetailedView === 'paid' && `$${totalRevenue.toLocaleString()}`}
                    {showDetailedView === 'pending' && `$${pendingAmount.toLocaleString()}`}
                    {showDetailedView === 'all' && `${totalInvoices} Total`}
                  </Text>
                  <Text size="sm" style={{ color: '#a1a1aa' }}>
                    {showDetailedView === 'paid' && 'Total Revenue Collected'}
                    {showDetailedView === 'pending' && 'Total Pending Amount'}
                    {showDetailedView === 'all' && 'Total Invoices Created'}
                  </Text>
                </div>
                <Badge
                  color={
                    showDetailedView === 'paid' ? 'green' :
                    showDetailedView === 'pending' ? 'yellow' : 'blue'
                  }
                  size="xl"
                  variant="light"
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  {getInvoicesByStatus(showDetailedView).length} Invoices
                </Badge>
              </Group>
            </Card>
            
            <Card 
              style={{ 
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <ScrollArea style={{ height: 450 }}>
                <Table
                  style={{ 
                    '--table-border-color': 'rgba(255, 255, 255, 0.1)',
                    fontSize: '14px'
                  }}
                  verticalSpacing="md"
                  horizontalSpacing="lg"
                >
                  <Table.Thead style={{ 
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    borderBottom: '2px solid rgba(212, 175, 55, 0.3)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <Table.Tr>
                      <Table.Th style={{ color: '#d4af37', fontWeight: 700, padding: '16px' }}>Invoice #</Table.Th>
                      <Table.Th style={{ color: '#d4af37', fontWeight: 700, padding: '16px' }}>Customer</Table.Th>
                      <Table.Th style={{ color: '#d4af37', fontWeight: 700, padding: '16px' }}>Amount</Table.Th>
                      <Table.Th style={{ color: '#d4af37', fontWeight: 700, padding: '16px' }}>Date</Table.Th>
                      <Table.Th style={{ color: '#d4af37', fontWeight: 700, padding: '16px' }}>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {getInvoicesByStatus(showDetailedView).length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
                          <Text size="lg">No invoices found for this status</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      getInvoicesByStatus(showDetailedView).map((invoice, index) => (
                        <Table.Tr 
                          key={invoice.id} 
                          style={{ 
                            color: '#ffffff',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Table.Td style={{ padding: '16px', fontWeight: 600, color: '#6366f1' }}>
                            #{invoice.invoiceNumber}
                          </Table.Td>
                          <Table.Td style={{ padding: '16px' }}>
                            <div>
                              <Text style={{ color: '#ffffff', fontWeight: 500 }}>
                                {invoice.customerName}
                              </Text>
                              {invoice.customerEmail && (
                                <Text size="xs" style={{ color: '#a1a1aa' }}>
                                  {invoice.customerEmail}
                                </Text>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td style={{ padding: '16px', fontWeight: 600, color: '#10b981' }}>
                            ${invoice.total?.toLocaleString() || '0'}
                          </Table.Td>
                          <Table.Td style={{ padding: '16px', color: '#d1d5db' }}>
                            {formatInvoiceDate(invoice.date)}
                          </Table.Td>
                          <Table.Td style={{ padding: '16px' }}>
                            <Badge
                              color={
                                invoice.status === 'paid' ? 'green' :
                                invoice.status === 'pending' ? 'yellow' : 'red'
                              }
                              variant="light"
                              radius="lg"
                              size="md"
                              style={{ textTransform: 'capitalize', fontWeight: 600 }}
                            >
                              {invoice.status || 'pending'}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card>
          </Stack>
        )}
      </Modal>

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
      <style>{`
        .btn-text-short { display: none; }
        .btn-text-full { display: inline; }
        
        /* Mobile First Approach */
        @media (max-width: 480px) {
          .responsive-nav { 
            min-height: 75px !important;
            padding: 6px !important;
            flex-wrap: wrap !important;
          }
          .responsive-nav-logo { width: 25px !important; height: 25px !important; }
          .responsive-nav-title { display: none !important; }
          .responsive-nav-subtitle { display: none !important; }
          .responsive-main-content { padding-top: 90px !important; }
          .mantine-Container-root { padding-left: 8px !important; padding-right: 8px !important; }
          .mantine-Card-root { padding: 12px !important; margin-bottom: 16px !important; }
          .mantine-ThemeIcon-root { width: 35px !important; height: 35px !important; }
          .mantine-Button-root { padding: 4px 8px !important; font-size: 11px !important; }
          .mantine-Table-root { font-size: 11px !important; }
          .mantine-Text-root { font-size: 12px !important; }
          .mantine-Title-root { font-size: 18px !important; }
          .btn-text-short { display: inline !important; }
          .btn-text-full { display: none !important; }
          .nav-btn-analytics { order: 1 !important; }
          .nav-btn-customers { order: 2 !important; }
          .nav-btn-primary { order: 3 !important; }
          .nav-btn-logout { order: 4 !important; }
          .responsive-nav .mantine-Group-root {
            gap: 4px !important;
          }
          .mantine-SimpleGrid-root { 
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .mantine-ScrollArea-root { max-height: 300px !important; }
          .mantine-Stack-root { gap: 12px !important; }
          .mantine-Group-root { gap: 8px !important; }
          .mantine-ActionIcon-root { width: 28px !important; height: 28px !important; }
          .mantine-Badge-root { font-size: 10px !important; }
          .mantine-Progress-root { height: 4px !important; }
          .mantine-Flex-root { flex-wrap: wrap !important; gap: 8px !important; }
          .mantine-Tabs-tab { padding: 8px 12px !important; font-size: 12px !important; }
          .mantine-Modal-modal { margin: 8px !important; }
          .mantine-Paper-root { border-radius: 12px !important; }
          .mantine-Tooltip-tooltip { font-size: 10px !important; }
        }
        
        @media (max-width: 600px) {
          .responsive-nav { 
            padding: 6px 8px !important;
            position: fixed !important;
            top: 8px !important;
            left: 8px !important;
            right: 8px !important;
            min-height: 60px !important;
          }
          .responsive-nav-logo { width: 30px !important; height: 30px !important; }
          .responsive-nav-title { font-size: 0.8rem !important; }
          .responsive-nav-subtitle { font-size: 8px !important; }
          .responsive-main-content { padding-top: 85px !important; }
          .mantine-Container-root { padding-left: 8px !important; padding-right: 8px !important; }
          .mantine-Card-root { padding: 12px !important; }
          .mantine-ThemeIcon-root { width: 40px !important; height: 40px !important; }
          .mantine-Button-root { padding: 6px 10px !important; font-size: 12px !important; }
          .mantine-Table-root { font-size: 11px !important; }
          .mantine-Text-root { font-size: 12px !important; }
          .btn-text-short { display: inline !important; }
          .btn-text-full { display: none !important; }
          .mantine-SimpleGrid-root { 
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
          .mantine-ScrollArea-root { max-height: 400px !important; }
          .mantine-Drawer-content { padding: 16px !important; }
          .mantine-Modal-body { padding: 16px !important; }
          .mantine-NumberInput-root { font-size: 14px !important; }
          .mantine-Select-root { font-size: 14px !important; }
          .mantine-TextInput-root { font-size: 14px !important; }
          .mantine-Textarea-root { font-size: 14px !important; }
        }
        
        @media (max-width: 768px) {
          .responsive-nav { 
            min-height: 65px !important;
            padding: 8px 10px !important;
          }
          .responsive-nav-logo { width: 35px !important; height: 35px !important; }
          .responsive-nav-title { font-size: 0.9rem !important; }
          .responsive-main-content { padding-top: 80px !important; }
          .mantine-Card-root { padding: 16px !important; }
          .mantine-ThemeIcon-root { width: 50px !important; height: 50px !important; }
          .mantine-SimpleGrid-root { 
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .mantine-Table-root { font-size: 12px !important; }
          .mantine-Button-root { padding: 8px 12px !important; font-size: 13px !important; }
          .mantine-Title-root { font-size: 20px !important; }
          .mantine-Text-root { font-size: 13px !important; }
          .mantine-Badge-root { font-size: 11px !important; }
          .mantine-ActionIcon-root { width: 32px !important; height: 32px !important; }
          .mantine-Avatar-root { width: 40px !important; height: 40px !important; }
          .mantine-Progress-root { height: 6px !important; }
          .mantine-Tabs-tab { padding: 12px 16px !important; font-size: 14px !important; }
          .mantine-Modal-modal { margin: 16px !important; }
          .mantine-Drawer-content { padding: 20px !important; }
        }
        
        @media (max-width: 992px) {
          .mantine-SimpleGrid-root { 
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 24px !important;
          }
          .mantine-Container-root { padding-left: 16px !important; padding-right: 16px !important; }
          .mantine-Card-root { padding: 20px !important; }
          .mantine-Table-root { font-size: 13px !important; }
          .mantine-Button-root { padding: 10px 16px !important; font-size: 14px !important; }
          .mantine-Title-root { font-size: 22px !important; }
          .mantine-Text-root { font-size: 14px !important; }
          .mantine-ScrollArea-root { max-height: 500px !important; }
          .mantine-Drawer-content { padding: 24px !important; }
          .mantine-Modal-body { padding: 24px !important; }
        }
        
        @media (max-width: 1200px) {
          .mantine-SimpleGrid-root { 
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 28px !important;
          }
          .mantine-Container-root { padding-left: 20px !important; padding-right: 20px !important; }
          .mantine-Card-root { padding: 24px !important; }
          .mantine-Table-root { font-size: 14px !important; }
          .mantine-Button-root { padding: 12px 20px !important; font-size: 15px !important; }
          .mantine-Title-root { font-size: 24px !important; }
          .mantine-Text-root { font-size: 15px !important; }
          .mantine-ScrollArea-root { max-height: 600px !important; }
        }
        
        /* Touch-friendly interactions */
        @media (pointer: coarse) {
          .mantine-Button-root { 
            min-height: 44px !important;
            padding: 12px 16px !important;
            touch-action: manipulation !important;
          }
          .mantine-ActionIcon-root { 
            min-width: 44px !important;
            min-height: 44px !important;
            touch-action: manipulation !important;
          }
          .mantine-UnstyledButton-root { 
            min-height: 44px !important;
            touch-action: manipulation !important;
          }
          .mantine-Tabs-tab { 
            min-height: 44px !important;
            touch-action: manipulation !important;
          }
          .mantine-Select-input { 
            min-height: 44px !important;
            touch-action: manipulation !important;
          }
          .mantine-TextInput-input { 
            min-height: 44px !important;
            touch-action: manipulation !important;
          }
          .mantine-NumberInput-input { 
            min-height: 44px !important;
            touch-action: manipulation !important;
          }
          .mantine-Table-tr { 
            min-height: 44px !important;
          }
          .mantine-Table-td { 
            padding: 12px 8px !important;
          }
          .mantine-Table-th { 
            padding: 12px 8px !important;
          }
        }
        
        /* Dark mode optimizations */
        @media (prefers-color-scheme: dark) {
          .mantine-Card-root { 
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .mantine-Paper-root { 
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .mantine-Text-root { 
            color: #ffffff !important;
          }
          .mantine-Title-root { 
            color: #d4af37 !important;
          }
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .mantine-Card-root { 
            border: 2px solid #ffffff !important;
          }
          .mantine-Button-root { 
            border: 2px solid currentColor !important;
          }
          .mantine-ActionIcon-root { 
            border: 2px solid currentColor !important;
          }
          .mantine-Text-root { 
            color: #ffffff !important;
          }
          .mantine-Title-root { 
            color: #ffffff !important;
          }
        }
        
        /* Print styles */
        @media print {
          .responsive-nav { display: none !important; }
          .mantine-ActionIcon-root { display: none !important; }
          .mantine-Button-root { display: none !important; }
          .mantine-Card-root { 
            background: #ffffff !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
          }
          .mantine-Text-root { 
            color: #000000 !important;
          }
          .mantine-Title-root { 
            color: #000000 !important;
          }
          .mantine-Table-root { 
            border: 1px solid #000000 !important;
          }
          .mantine-Table-th { 
            background: #f5f5f5 !important;
            border: 1px solid #000000 !important;
          }
          .mantine-Table-td { 
            border: 1px solid #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}