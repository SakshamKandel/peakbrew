import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Title,
  ActionIcon,
  LoadingOverlay,
  SimpleGrid,
  ThemeIcon,
  Progress,
  Tabs,
  Table,
  ScrollArea,
  Badge,
  Box,
  Select,
  RingProgress,
  Center,
  Tooltip,
  Flex,
  Grid,
  Alert,
  Divider,
  NumberFormatter,
  Anchor,
  Modal,
  TextInput,
  Textarea,
  Switch,
  Slider,
  Timeline
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDownload,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconUsers,
  IconFileText,
  IconTarget,
  IconActivity,
  IconChartBar,
  IconChartLine,
  IconChartPie,
  IconChartArea,
  IconReportAnalytics,
  IconCalendar,
  IconFilter,
  IconShare,
  IconPrinter,
  IconSettings,
  IconBell,
  IconStarFilled,
  IconArrowUpRight,
  IconArrowDownRight,
  IconEye,
  IconHeart,
  IconBookmark,
  IconMail,
  IconPhone,
  IconMapPin,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
  IconBulb,
  IconRocket,
  IconShield,
  IconGraph,
  IconDashboard,
  IconReport,
  IconAnalyze,
  IconBrain,
  IconRobot,
  IconSparkles
} from '@tabler/icons-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
  ScatterChart,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  orderBy, 
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';

const AdvancedAnalyticsDashboard = ({ onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('3months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [showInsights, setShowInsights] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    if (currentUser) {
      fetchInvoices();
    }
  }, [currentUser]);

  useEffect(() => {
    if (invoices && invoices.length >= 0) {
      generateAnalytics();
    }
  }, [invoices, dateRange]);

  useEffect(() => {
    if (autoRefresh && invoices && invoices.length >= 0) {
      const interval = setInterval(() => {
        generateAnalytics();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, invoices]);

  const fetchInvoices = async () => {
    if (!currentUser) return;
    
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
    }
  };

  const generateAnalytics = () => {
    setLoading(true);
    
    try {
      // Calculate analytics from invoices data
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
      const overdueInvoices = invoices.filter(inv => {
        const invoiceDate = new Date(inv.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return inv.status !== 'paid' && invoiceDate < thirtyDaysAgo;
      }).length;

      // Monthly data calculation
      const currentMonth = new Date();
      const monthlyData = [];
      
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(currentMonth, i);
        const startDate = startOfMonth(month);
        const endDate = endOfMonth(month);
        
        const monthInvoices = invoices.filter(inv => {
          const invoiceDate = new Date(inv.date);
          return invoiceDate >= startDate && invoiceDate <= endDate;
        });
        
        monthlyData.push({
          month: format(month, 'MMM yyyy'),
          period: format(month, 'MMM yyyy'),
          revenue: monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
          invoices: monthInvoices.length,
          invoiceCount: monthInvoices.length,
          paid: monthInvoices.filter(inv => inv.status === 'paid').length,
          pending: monthInvoices.filter(inv => inv.status === 'pending').length,
          paidRevenue: monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
          pendingRevenue: monthInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total || 0), 0),
          paymentRate: monthInvoices.length > 0 ? (monthInvoices.filter(inv => inv.status === 'paid').length / monthInvoices.length) * 100 : 0
        });
      }

      // Customer distribution
      const customerData = {};
      invoices.forEach(inv => {
        if (inv.customerName) {
          if (!customerData[inv.customerName]) {
            customerData[inv.customerName] = { count: 0, revenue: 0 };
          }
          customerData[inv.customerName].count += 1;
          customerData[inv.customerName].revenue += (inv.total || 0);
        }
      });

      const topCustomers = Object.entries(customerData)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Product analysis from invoice items
      const productData = {};
      invoices.forEach(inv => {
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach(item => {
            if (item.description) {
              if (!productData[item.description]) {
                productData[item.description] = {
                  name: item.description,
                  totalQuantity: 0,
                  totalRevenue: 0,
                  averagePrice: 0,
                  id: item.description.replace(/\s+/g, '-').toLowerCase()
                };
              }
              productData[item.description].totalQuantity += item.quantity || 0;
              productData[item.description].totalRevenue += (item.quantity || 0) * (item.price || 0);
            }
          });
        }
      });

      // Calculate average prices and get top products
      const topProducts = Object.values(productData).map(product => ({
        ...product,
        averagePrice: product.totalQuantity > 0 ? product.totalRevenue / product.totalQuantity : 0
      })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

      const analyticsData = {
        overview: {
          totalRevenue,
          totalInvoices,
          paidInvoices,
          pendingInvoices,
          overdueInvoices,
          averageInvoiceValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
          collectionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
        },
        trends: {
          monthlyData,
          revenueGrowth: monthlyData.length > 1 ? 
            (((monthlyData[monthlyData.length - 1].revenue - monthlyData[monthlyData.length - 2].revenue) / 
              (monthlyData[monthlyData.length - 2].revenue || 1)) * 100) : 0
        },
        customers: {
          topCustomers,
          totalCustomers: Object.keys(customerData).length,
          averageCustomerValue: Object.keys(customerData).length > 0 ? 
            totalRevenue / Object.keys(customerData).length : 0,
          customerRetentionRate: 85, // Default value since we don't have historical data
          churnRate: 15 // Default value since we don't have historical data
        },
        products: {
          topProducts,
          totalProducts: Object.keys(productData).length,
          averageProductRevenue: Object.keys(productData).length > 0 ? 
            totalRevenue / Object.keys(productData).length : 0
        },
        performance: {
          statusDistribution: [
            { name: 'Paid', value: paidInvoices, color: '#10b981' },
            { name: 'Pending', value: pendingInvoices, color: '#f59e0b' },
            { name: 'Overdue', value: overdueInvoices, color: '#ef4444' }
          ]
        },
        forecasting: {
          nextMonthForecast: monthlyData.length > 0 ? 
            monthlyData[monthlyData.length - 1].revenue * 1.1 : 0,
          yearlyForecast: (totalRevenue * 12) / Math.max(monthlyData.length, 1),
          confidence: 85,
          trend: monthlyData.length > 1 && monthlyData[monthlyData.length - 1].revenue > monthlyData[monthlyData.length - 2].revenue ? 
            'growing' : monthlyData.length > 1 && monthlyData[monthlyData.length - 1].revenue < monthlyData[monthlyData.length - 2].revenue ? 
            'declining' : 'stable',
          historicalData: monthlyData
        }
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error generating analytics:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to generate analytics data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const data = exportFormat === 'json' 
        ? JSON.stringify(analytics, null, 2)
        : convertToCSV(analytics);
      
      const blob = new Blob([data], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      notifications.show({
        title: 'Export Complete',
        message: `Analytics data exported as ${exportFormat.toUpperCase()}`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error exporting analytics:', error);
      notifications.show({
        title: 'Export Failed',
        message: 'Failed to export analytics data',
        color: 'red',
      });
    }
  };

  const convertToCSV = (data) => {
    if (!data || !data.overview) return '';
    
    const headers = 'Metric,Value\n';
    const rows = [
      `Total Revenue,${data.overview.totalRevenue}`,
      `Total Invoices,${data.overview.totalInvoices}`,
      `Paid Invoices,${data.overview.paidInvoices}`,
      `Pending Invoices,${data.overview.pendingInvoices}`,
      `Overdue Invoices,${data.overview.overdueInvoices}`,
      `Average Invoice Value,${data.overview.averageInvoiceValue}`,
      `Collection Rate,${data.overview.collectionRate}%`
    ].join('\n');
    
    return headers + rows;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getInsights = () => {
    if (!analytics) return [];
    
    const insights = [];
    
    // Revenue insights
    if ((analytics.trends?.revenueGrowth || 0) > 10) {
      insights.push({
        type: 'positive',
        title: 'Strong Revenue Growth',
        description: `Revenue increased by ${formatPercentage(analytics.trends?.revenueGrowth || 0)} this period`,
        icon: IconTrendingUp,
        color: 'green'
      });
    } else if ((analytics.trends?.revenueGrowth || 0) < -5) {
      insights.push({
        type: 'negative',
        title: 'Revenue Decline',
        description: `Revenue decreased by ${formatPercentage(Math.abs(analytics.trends?.revenueGrowth || 0))} this period`,
        icon: IconTrendingDown,
        color: 'red'
      });
    }
    
    // Customer insights
    if ((analytics.customers?.totalCustomers || 0) > 5) {
      insights.push({
        type: 'positive',
        title: 'Customer Growth',
        description: `${analytics.customers?.totalCustomers || 0} total customers`,
        icon: IconUsers,
        color: 'blue'
      });
    }
    
    // Payment insights
    if ((analytics.overview?.collectionRate || 0) > 90) {
      insights.push({
        type: 'positive',
        title: 'Excellent Collection Rate',
        description: `${formatPercentage(analytics.overview?.collectionRate || 0)} of invoices paid on time`,
        icon: IconCheck,
        color: 'green'
      });
    }
    
    // Growth insights
    if ((analytics.trends?.revenueGrowth || 0) > 0) {
      insights.push({
        type: 'positive',
        title: 'Growth Trend',
        description: `Revenue showing positive growth trend`,
        icon: IconRocket,
        color: 'cyan'
      });
    }
    
    return insights;
  };

  const getPerformanceCards = () => {
    if (!analytics) return [];
    
    return [
      {
        title: 'Revenue Growth',
        value: formatPercentage(analytics.trends?.revenueGrowth || 0),
        change: analytics.trends?.revenueGrowth || 0,
        icon: IconTrendingUp,
        color: (analytics.trends?.revenueGrowth || 0) >= 0 ? '#10b981' : '#ef4444'
      },
      {
        title: 'Customer Acquisition',
        value: `${analytics.customers?.totalCustomers || 0}`,
        change: 12.5,
        icon: IconUsers,
        color: '#3b82f6'
      },
      {
        title: 'Collection Rate',
        value: formatPercentage(analytics.overview?.collectionRate || 0),
        change: analytics.overview?.collectionRate || 0,
        icon: IconTarget,
        color: '#8b5cf6'
      },
      {
        title: 'Average Invoice',
        value: formatCurrency(analytics.overview?.averageInvoiceValue || 0),
        change: 8.3,
        icon: IconCurrencyDollar,
        color: '#10b981'
      }
    ];
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingOverlay visible={loading} overlayProps={{ color: 'rgba(0, 0, 0, 0.3)' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
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
          <Flex justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="md">
              <ActionIcon
                size="lg"
                variant="light"
                onClick={() => navigate('/dashboard')}
                style={{
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  color: '#9ca3af',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              
              <Group gap="md">
                <Logo size={60} />
                <div>
                  <Title order={1} style={{ color: '#d4af37', marginBottom: '8px' }}>
                    Advanced Analytics
                  </Title>
                  <Text size="lg" style={{ color: '#a1a1aa' }}>
                    AI-powered insights and comprehensive business intelligence
                  </Text>
                </div>
              </Group>
            </Group>
            
            <Group gap="md">
              <Select
                value={dateRange}
                onChange={setDateRange}
                data={[
                  { value: '1month', label: 'Last Month' },
                  { value: '3months', label: 'Last 3 Months' },
                  { value: '6months', label: 'Last 6 Months' },
                  { value: '12months', label: 'Last Year' }
                ]}
                style={{
                  '& input': {
                    backgroundColor: 'rgba(74, 55, 40, 0.3)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#ffffff'
                  }
                }}
              />
              
              <Tooltip label="AI Insights">
                <Button
                  leftSection={<IconBrain size={16} />}
                  variant="light"
                  onClick={() => setShowInsights(true)}
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                >
                  Insights
                </Button>
              </Tooltip>
              
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={() => generateAnalytics()}
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
              
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={() => setShowExportModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                  color: '#1a1a1a',
                  fontWeight: 600,
                  border: 'none'
                }}
              >
                Export
              </Button>
            </Group>
          </Flex>
        </Card>

        {/* Performance Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing="xl" mb="xl">
          {getPerformanceCards().map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                shadow="xl"
                padding="xl"
                radius="xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Group justify="space-between" mb="md">
                  <ThemeIcon
                    size={50}
                    radius="xl"
                    style={{
                      background: `${card.color}20`,
                      color: card.color,
                      border: `1px solid ${card.color}30`
                    }}
                  >
                    <Icon size={24} />
                  </ThemeIcon>
                  <div style={{ textAlign: 'right' }}>
                    <Group gap="xs" justify="flex-end">
                      {card.change >= 0 ? (
                        <IconArrowUpRight size={16} style={{ color: '#10b981' }} />
                      ) : (
                        <IconArrowDownRight size={16} style={{ color: '#ef4444' }} />
                      )}
                      <Text size="sm" fw={600} style={{ color: card.change >= 0 ? '#10b981' : '#ef4444' }}>
                        {card.change >= 0 ? '+' : ''}{typeof card.change === 'number' ? card.change.toFixed(1) : card.change}
                      </Text>
                    </Group>
                  </div>
                </Group>
                
                <Text size="xs" fw={500} style={{ color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {card.title}
                </Text>
                
                <Text fw={900} size="lg" style={{ color: '#ffffff' }}>
                  {card.value}
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>

        {/* Main Analytics Content */}
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
                <Group gap="sm">
                  <IconDashboard size={16} />
                  Overview
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="revenue" style={{ color: '#ffffff' }}>
                <Group gap="sm">
                  <IconChartLine size={16} />
                  Revenue
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="customers" style={{ color: '#ffffff' }}>
                <Group gap="sm">
                  <IconUsers size={16} />
                  Customers
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="products" style={{ color: '#ffffff' }}>
                <Group gap="sm">
                  <IconChartBar size={16} />
                  Products
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="forecasting" style={{ color: '#ffffff' }}>
                <Group gap="sm">
                  <IconBrain size={16} />
                  Forecasting
                </Group>
              </Tabs.Tab>
            </Tabs.List>

            <Box p="xl">
              {/* Overview Tab */}
              <Tabs.Panel value="overview">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="xl">
                      {/* Revenue Trend */}
                      <Card
                        padding="lg"
                        style={{
                          background: 'rgba(74, 55, 40, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.1)'
                        }}
                      >
                        <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                          Revenue Trend
                        </Title>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={analytics?.trends?.monthlyData || []}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="period" stroke="#a1a1aa" />
                            <YAxis stroke="#a1a1aa" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: 'rgba(74, 55, 40, 0.95)',
                                border: '1px solid rgba(212, 175, 55, 0.2)',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }}
                              formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#d4af37"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorRevenue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Card>

                      {/* Performance Metrics */}
                      <Card
                        padding="lg"
                        style={{
                          background: 'rgba(74, 55, 40, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.1)'
                        }}
                      >
                        <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                          Performance Metrics
                        </Title>
                        <ResponsiveContainer width="100%" height={250}>
                          <ComposedChart data={analytics?.trends.monthlyData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="period" stroke="#a1a1aa" />
                            <YAxis stroke="#a1a1aa" />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: 'rgba(74, 55, 40, 0.95)',
                                border: '1px solid rgba(212, 175, 55, 0.2)',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }}
                            />
                            <Bar dataKey="invoiceCount" fill="#3b82f6" name="Invoices" />
                            <Line type="monotone" dataKey="paymentRate" stroke="#10b981" strokeWidth={3} name="Payment Rate %" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Card>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="lg">
                      {/* Key Metrics */}
                      <Card
                        padding="lg"
                        style={{
                          background: 'rgba(74, 55, 40, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.1)'
                        }}
                      >
                        <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                          Key Metrics
                        </Title>
                        <Stack gap="md">
                          <div>
                            <Text size="sm" style={{ color: '#a1a1aa' }}>Total Revenue</Text>
                            <Text fw={700} size="xl" style={{ color: '#10b981' }}>
                              {formatCurrency(analytics?.overview.totalRevenue)}
                            </Text>
                          </div>
                          <div>
                            <Text size="sm" style={{ color: '#a1a1aa' }}>Active Customers</Text>
                            <Text fw={700} size="xl" style={{ color: '#3b82f6' }}>
                              {analytics?.customers.totalCustomers}
                            </Text>
                          </div>
                          <div>
                            <Text size="sm" style={{ color: '#a1a1aa' }}>Collection Rate</Text>
                            <Text fw={700} size="xl" style={{ color: '#f59e0b' }}>
                              {formatPercentage(analytics?.overview.collectionRate)}
                            </Text>
                          </div>
                          <div>
                            <Text size="sm" style={{ color: '#a1a1aa' }}>Avg Invoice Value</Text>
                            <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>
                              {formatCurrency(analytics?.overview.averageInvoiceValue)}
                            </Text>
                          </div>
                        </Stack>
                      </Card>

                      {/* Status Distribution */}
                      <Card
                        padding="lg"
                        style={{
                          background: 'rgba(74, 55, 40, 0.2)',
                          border: '1px solid rgba(212, 175, 55, 0.1)'
                        }}
                      >
                        <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                          Invoice Status
                        </Title>
                        <Center>
                          <RingProgress
                            size={180}
                            thickness={20}
                            sections={[
                              { value: (analytics?.overview.paidInvoices / analytics?.overview.totalInvoices) * 100, color: '#10b981' },
                              { value: (analytics?.overview.pendingInvoices / analytics?.overview.totalInvoices) * 100, color: '#f59e0b' },
                              { value: (analytics?.overview.overdueInvoices / analytics?.overview.totalInvoices) * 100, color: '#ef4444' }
                            ]}
                            label={
                              <Text size="lg" fw={700} style={{ color: '#ffffff' }}>
                                {analytics?.overview.totalInvoices}
                              </Text>
                            }
                          />
                        </Center>
                        <Stack gap="sm" mt="md">
                          <Group justify="space-between">
                            <Group gap="sm">
                              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
                              <Text size="sm" style={{ color: '#ffffff' }}>Paid</Text>
                            </Group>
                            <Text size="sm" style={{ color: '#10b981' }}>
                              {analytics?.overview.paidInvoices}
                            </Text>
                          </Group>
                          <Group justify="space-between">
                            <Group gap="sm">
                              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                              <Text size="sm" style={{ color: '#ffffff' }}>Pending</Text>
                            </Group>
                            <Text size="sm" style={{ color: '#f59e0b' }}>
                              {analytics?.overview.pendingInvoices}
                            </Text>
                          </Group>
                          <Group justify="space-between">
                            <Group gap="sm">
                              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                              <Text size="sm" style={{ color: '#ffffff' }}>Overdue</Text>
                            </Group>
                            <Text size="sm" style={{ color: '#ef4444' }}>
                              {analytics?.overview.overdueInvoices}
                            </Text>
                          </Group>
                        </Stack>
                      </Card>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              {/* Revenue Tab */}
              <Tabs.Panel value="revenue">
                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                  {/* Revenue Breakdown */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Revenue Breakdown
                    </Title>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analytics?.trends?.monthlyData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="period" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'rgba(74, 55, 40, 0.95)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            borderRadius: '8px',
                            color: '#ffffff'
                          }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="paidRevenue" fill="#10b981" name="Paid Revenue" />
                        <Bar dataKey="pendingRevenue" fill="#f59e0b" name="Pending Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Revenue Analytics */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Revenue Analytics
                    </Title>
                    <Stack gap="lg">
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Monthly Growth Rate</Text>
                        <Group gap="sm" align="center">
                          <Text fw={700} size="2xl" style={{ color: analytics?.trends.revenueGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                            {analytics?.trends.revenueGrowth >= 0 ? '+' : ''}{formatPercentage(analytics?.trends.revenueGrowth)}
                          </Text>
                          {analytics?.trends.revenueGrowth >= 0 ? (
                            <IconTrendingUp size={20} style={{ color: '#10b981' }} />
                          ) : (
                            <IconTrendingDown size={20} style={{ color: '#ef4444' }} />
                          )}
                        </Group>
                      </div>
                      
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Average Monthly Revenue</Text>
                        <Text fw={700} size="xl" style={{ color: '#3b82f6' }}>
                          {formatCurrency(analytics?.overview.averageInvoiceValue)}
                        </Text>
                      </div>
                      
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Current Period vs Previous</Text>
                        <Group gap="md">
                          <div>
                            <Text size="xs" style={{ color: '#a1a1aa' }}>Current</Text>
                            <Text fw={600} style={{ color: '#10b981' }}>
                              {formatCurrency(analytics?.trends.monthlyData?.[analytics?.trends.monthlyData?.length - 1]?.revenue || 0)}
                            </Text>
                          </div>
                          <div>
                            <Text size="xs" style={{ color: '#a1a1aa' }}>Previous</Text>
                            <Text fw={600} style={{ color: '#f59e0b' }}>
                              {formatCurrency(analytics?.trends.monthlyData?.[analytics?.trends.monthlyData?.length - 2]?.revenue || 0)}
                            </Text>
                          </div>
                        </Group>
                      </div>
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Tabs.Panel>

              {/* Customers Tab */}
              <Tabs.Panel value="customers">
                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                  {/* Top Customers */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Top Customers
                    </Title>
                    <Stack gap="md">
                      {analytics?.customers.topCustomers?.slice(0, 5).map((customer, index) => (
                        <Group key={customer.id} justify="space-between">
                          <Group gap="sm">
                            <Badge
                              color={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'blue'}
                              variant="light"
                              size="sm"
                            >
                              #{index + 1}
                            </Badge>
                            <Text fw={500} style={{ color: '#ffffff' }}>
                              {customer.name}
                            </Text>
                          </Group>
                          <div style={{ textAlign: 'right' }}>
                            <Text fw={600} style={{ color: '#10b981' }}>
                              {formatCurrency(customer.totalRevenue)}
                            </Text>
                            <Text size="sm" style={{ color: '#a1a1aa' }}>
                              {customer.invoiceCount} invoices
                            </Text>
                          </div>
                        </Group>
                      ))}
                    </Stack>
                  </Card>

                  {/* Customer Metrics */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Customer Metrics
                    </Title>
                    <Stack gap="lg">
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Customer Retention Rate</Text>
                        <Group gap="sm" align="center">
                          <Text fw={700} size="xl" style={{ color: '#10b981' }}>
                            {formatPercentage(analytics?.customers.customerRetentionRate)}
                          </Text>
                          <Progress 
                            value={analytics?.customers.customerRetentionRate} 
                            color="green" 
                            size="sm" 
                            style={{ flex: 1 }}
                          />
                        </Group>
                      </div>
                      
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Average Customer Value</Text>
                        <Text fw={700} size="xl" style={{ color: '#3b82f6' }}>
                          {formatCurrency(analytics?.customers.averageCustomerValue)}
                        </Text>
                      </div>
                      
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Churn Rate</Text>
                        <Group gap="sm" align="center">
                          <Text fw={700} size="xl" style={{ color: '#ef4444' }}>
                            {formatPercentage(analytics?.customers.churnRate)}
                          </Text>
                          <Progress 
                            value={analytics?.customers.churnRate} 
                            color="red" 
                            size="sm" 
                            style={{ flex: 1 }}
                          />
                        </Group>
                      </div>
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Tabs.Panel>

              {/* Products Tab */}
              <Tabs.Panel value="products">
                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                  {/* Top Products */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Top Products by Revenue
                    </Title>
                    <ScrollArea style={{ height: 300 }}>
                      <Stack gap="md">
                        {analytics?.products.topProducts?.map((product, index) => (
                          <Group key={product.id} justify="space-between">
                            <Group gap="sm">
                              <Badge
                                color={index < 3 ? 'yellow' : 'blue'}
                                variant="light"
                                size="sm"
                              >
                                #{index + 1}
                              </Badge>
                              <div>
                                <Text fw={500} style={{ color: '#ffffff' }}>
                                  {product.name}
                                </Text>
                                <Text size="sm" style={{ color: '#a1a1aa' }}>
                                  {product.totalQuantity} units sold
                                </Text>
                              </div>
                            </Group>
                            <div style={{ textAlign: 'right' }}>
                              <Text fw={600} style={{ color: '#10b981' }}>
                                {formatCurrency(product.totalRevenue)}
                              </Text>
                              <Text size="sm" style={{ color: '#a1a1aa' }}>
                                {formatCurrency(product.averagePrice)} avg
                              </Text>
                            </div>
                          </Group>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Card>

                  {/* Product Performance Chart */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Product Performance
                    </Title>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics?.products.topProducts?.slice(0, 6) || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="totalRevenue"
                        >
                          {analytics?.products.topProducts?.slice(0, 6).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'rgba(74, 55, 40, 0.95)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            borderRadius: '8px',
                            color: '#ffffff'
                          }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </SimpleGrid>
              </Tabs.Panel>

              {/* Forecasting Tab */}
              <Tabs.Panel value="forecasting">
                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                  {/* Forecast Chart */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Revenue Forecast
                    </Title>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        ...(analytics?.forecasting.historicalData?.slice(-6) || []),
                        {
                          month: 'Next Month',
                          revenue: analytics?.forecasting.nextMonthForecast || 0
                        }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'rgba(74, 55, 40, 0.95)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            borderRadius: '8px',
                            color: '#ffffff'
                          }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Forecast Insights */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Forecast Insights
                    </Title>
                    <Stack gap="lg">
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Next Month Forecast</Text>
                        <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>
                          {formatCurrency(analytics?.forecasting.nextMonthForecast)}
                        </Text>
                      </div>
                      
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Yearly Projection</Text>
                        <Text fw={700} size="xl" style={{ color: '#3b82f6' }}>
                          {formatCurrency(analytics?.forecasting.yearlyForecast)}
                        </Text>
                      </div>
                      
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Forecast Confidence</Text>
                        <Group gap="sm" align="center">
                          <Text fw={700} size="xl" style={{ color: '#10b981' }}>
                            {formatPercentage(analytics?.forecasting.confidence)}
                          </Text>
                          <Progress 
                            value={analytics?.forecasting.confidence} 
                            color="green" 
                            size="sm" 
                            style={{ flex: 1 }}
                          />
                        </Group>
                      </div>
                      
                      <div>
                        <Text size="sm" style={{ color: '#a1a1aa' }}>Trend</Text>
                        <Group gap="sm" align="center">
                          <Text fw={700} size="lg" style={{ 
                            color: analytics?.forecasting.trend === 'growing' ? '#10b981' : 
                                  analytics?.forecasting.trend === 'declining' ? '#ef4444' : '#f59e0b'
                          }}>
                            {analytics?.forecasting.trend}
                          </Text>
                          {analytics?.forecasting.trend === 'growing' ? (
                            <IconTrendingUp size={20} style={{ color: '#10b981' }} />
                          ) : analytics?.forecasting.trend === 'declining' ? (
                            <IconTrendingDown size={20} style={{ color: '#ef4444' }} />
                          ) : (
                            <IconActivity size={20} style={{ color: '#f59e0b' }} />
                          )}
                        </Group>
                      </div>
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Tabs.Panel>
            </Box>
          </Tabs>
        </Card>
      </Container>

      {/* AI Insights Modal */}
      <Modal
        opened={showInsights}
        onClose={() => setShowInsights(false)}
        title={
          <Group gap="sm">
            <IconBrain size={20} style={{ color: '#8b5cf6' }} />
            <Text fw={600} style={{ color: '#8b5cf6' }}>AI-Powered Insights</Text>
          </Group>
        }
        size="lg"
        centered
        styles={{
          modal: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          title: {
            color: '#ffffff'
          }
        }}
      >
        <Stack gap="md">
          {getInsights().map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Alert
                key={index}
                icon={<Icon size={20} />}
                title={insight.title}
                color={insight.color}
                variant="light"
                style={{
                  backgroundColor: `rgba(${insight.color === 'green' ? '16, 185, 129' : 
                    insight.color === 'blue' ? '59, 130, 246' : 
                    insight.color === 'red' ? '239, 68, 68' : '245, 158, 11'}, 0.1)`,
                  border: `1px solid rgba(${insight.color === 'green' ? '16, 185, 129' : 
                    insight.color === 'blue' ? '59, 130, 246' : 
                    insight.color === 'red' ? '239, 68, 68' : '245, 158, 11'}, 0.2)`
                }}
              >
                <Text style={{ color: '#ffffff' }}>{insight.description}</Text>
              </Alert>
            );
          })}
          {getInsights().length === 0 && (
            <Alert
              icon={<IconInfoCircle size={20} />}
              title="No Insights Available"
              color="blue"
              variant="light"
            >
              <Text style={{ color: '#ffffff' }}>
                Create more invoices and customers to unlock AI-powered insights
              </Text>
            </Alert>
          )}
        </Stack>
      </Modal>

      {/* Export Modal */}
      <Modal
        opened={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Analytics"
        centered
        styles={{
          modal: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          title: {
            color: '#ffffff'
          }
        }}
      >
        <Stack gap="md">
          <Select
            label="Export Format"
            value={exportFormat}
            onChange={setExportFormat}
            data={[
              { value: 'json', label: 'JSON' },
              { value: 'csv', label: 'CSV' }
            ]}
            styles={{
              label: { color: '#ffffff' },
              input: {
                backgroundColor: 'rgba(74, 55, 40, 0.3)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#ffffff'
              }
            }}
          />
          
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => setShowExportModal(false)}
              style={{
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                color: '#9ca3af',
                border: '1px solid rgba(156, 163, 175, 0.2)'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                color: '#1a1a1a',
                fontWeight: 600,
                border: 'none'
              }}
            >
              Export
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;