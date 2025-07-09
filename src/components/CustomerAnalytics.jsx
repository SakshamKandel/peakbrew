import { useState } from 'react';
import {
  Container,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Title,
  ActionIcon,
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
  UnstyledButton,
  Flex
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconArrowLeft,
  IconUsers,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconFileText,
  IconTarget,
  IconActivity,
  IconChartBar,
  IconReportAnalytics,
  IconDownload,
  IconPrinter,
  IconShare,
  IconRefresh,
  IconStar,
  IconStarFilled,
  IconCalendar,
  IconFilter,
  IconArrowUpRight,
  IconArrowDownRight,
  IconEye,
  IconUserCheck,
  IconUserX,
  IconUserPlus,
  IconClock,
  IconCheck,
  IconX,
  IconGraph,
  IconChartLine,
  IconChartArea,
  IconChartPie
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
  Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';

const CustomerAnalytics = ({ onClose, customerStats }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('3months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Customer Growth Chart Data
  const customerGrowthData = customerStats?.customerGrowth || [];

  // Customer Segmentation Data
  const customerSegmentationData = [
    { name: 'Regular', value: 65, color: '#3b82f6' },
    { name: 'VIP', value: 20, color: '#f59e0b' },
    { name: 'Wholesale', value: 10, color: '#10b981' },
    { name: 'Retail', value: 5, color: '#ef4444' }
  ];

  // Top Customers Revenue Distribution
  const topCustomersData = customerStats?.topCustomers?.slice(0, 5)?.map((customer, index) => ({
    name: customer.name,
    revenue: customer.totalRevenue || 0,
    invoices: customer.totalInvoices || 0,
    rank: index + 1
  })) || [];

  // Monthly Performance Data
  const monthlyPerformanceData = [
    { month: 'Jan', newCustomers: 12, revenue: 45000, retention: 85 },
    { month: 'Feb', newCustomers: 18, revenue: 52000, retention: 87 },
    { month: 'Mar', newCustomers: 15, revenue: 48000, retention: 90 },
    { month: 'Apr', newCustomers: 22, revenue: 58000, retention: 88 },
    { month: 'May', newCustomers: 25, revenue: 62000, retention: 92 },
    { month: 'Jun', newCustomers: 20, revenue: 55000, retention: 89 }
  ];

  // Customer Lifecycle Data
  const customerLifecycleData = [
    { stage: 'New', count: 45, percentage: 25, color: '#3b82f6' },
    { stage: 'Active', count: 120, percentage: 65, color: '#10b981' },
    { stage: 'At Risk', count: 15, percentage: 8, color: '#f59e0b' },
    { stage: 'Churned', count: 5, percentage: 2, color: '#ef4444' }
  ];

  const analyticsCards = [
    {
      title: 'Customer Acquisition Rate',
      value: '15.2%',
      change: '+2.4%',
      positive: true,
      icon: IconUserPlus,
      color: '#10b981'
    },
    {
      title: 'Customer Retention Rate',
      value: '89.5%',
      change: '+1.8%',
      positive: true,
      icon: IconUserCheck,
      color: '#3b82f6'
    },
    {
      title: 'Average Customer Value',
      value: formatCurrency(customerStats?.averageRevenuePerCustomer || 0),
      change: '+12.3%',
      positive: true,
      icon: IconCurrencyDollar,
      color: '#f59e0b'
    },
    {
      title: 'Churn Rate',
      value: '3.2%',
      change: '-0.8%',
      positive: true,
      icon: IconUserX,
      color: '#ef4444'
    }
  ];

  const handleExportReport = () => {
    // Implementation for exporting analytics report
    console.log('Exporting analytics report...');
  };

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
                onClick={onClose}
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
                    Customer Analytics
                  </Title>
                  <Text size="lg" style={{ color: '#a1a1aa' }}>
                    Comprehensive insights into customer behavior and performance
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
                  { value: '1year', label: 'Last Year' }
                ]}
                style={{
                  '& input': {
                    backgroundColor: 'rgba(74, 55, 40, 0.3)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#ffffff'
                  }
                }}
              />
              
              <Button
                leftSection={<IconRefresh size={16} />}
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
                onClick={handleExportReport}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                  color: '#1a1a1a',
                  fontWeight: 600,
                  border: 'none'
                }}
              >
                Export Report
              </Button>
            </Group>
          </Flex>
        </Card>

        {/* Analytics Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl" mb="xl">
          {analyticsCards.map((card, index) => {
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
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Group justify="space-between" mb="md">
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
                    <Group gap="xs" justify="flex-end">
                      {card.positive ? (
                        <IconArrowUpRight size={16} style={{ color: '#10b981' }} />
                      ) : (
                        <IconArrowDownRight size={16} style={{ color: '#ef4444' }} />
                      )}
                      <Text size="sm" fw={600} style={{ color: card.positive ? '#10b981' : '#ef4444' }}>
                        {card.change}
                      </Text>
                    </Group>
                  </div>
                </Group>
                
                <Text size="sm" fw={500} style={{ color: '#d1d5db', marginBottom: '8px' }}>
                  {card.title}
                </Text>
                
                <Text fw={900} size="2rem" style={{ color: '#ffffff', lineHeight: 1 }}>
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
                  <IconChartBar size={16} />
                  Overview
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="growth" style={{ color: '#ffffff' }}>
                <Group gap="sm">
                  <IconTrendingUp size={16} />
                  Growth
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="segmentation" style={{ color: '#ffffff' }}>
                <Group gap="sm">
                  <IconChartPie size={16} />
                  Segmentation
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="performance" style={{ color: '#ffffff' }}>
                <Group gap="sm">
                  <IconTarget size={16} />
                  Performance
                </Group>
              </Tabs.Tab>
            </Tabs.List>

            <Box p="xl">
              <Tabs.Panel value="overview">
                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                  {/* Customer Lifecycle */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Customer Lifecycle
                    </Title>
                    <Stack gap="md">
                      {customerLifecycleData.map((stage, index) => (
                        <div key={index}>
                          <Group justify="space-between" mb="xs">
                            <Text fw={500} style={{ color: '#ffffff' }}>
                              {stage.stage}
                            </Text>
                            <Group gap="sm">
                              <Text size="sm" style={{ color: '#a1a1aa' }}>
                                {stage.count}
                              </Text>
                              <Badge
                                color={stage.color}
                                variant="light"
                                size="sm"
                              >
                                {stage.percentage}%
                              </Badge>
                            </Group>
                          </Group>
                          <Progress
                            value={stage.percentage}
                            color={stage.color}
                            size="sm"
                            radius="xl"
                          />
                        </div>
                      ))}
                    </Stack>
                  </Card>

                  {/* Top Customers */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Top Customers by Revenue
                    </Title>
                    <Stack gap="md">
                      {topCustomersData.map((customer, index) => (
                        <Group key={index} justify="space-between">
                          <Group gap="sm">
                            <Badge
                              color={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}
                              variant="light"
                              size="sm"
                              style={{ minWidth: 30 }}
                            >
                              #{customer.rank}
                            </Badge>
                            <Text fw={500} style={{ color: '#ffffff' }}>
                              {customer.name}
                            </Text>
                          </Group>
                          <div style={{ textAlign: 'right' }}>
                            <Text fw={600} style={{ color: '#10b981' }}>
                              {formatCurrency(customer.revenue)}
                            </Text>
                            <Text size="sm" style={{ color: '#a1a1aa' }}>
                              {customer.invoices} invoices
                            </Text>
                          </div>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Tabs.Panel>

              <Tabs.Panel value="growth">
                <Card
                  padding="lg"
                  style={{
                    background: 'rgba(74, 55, 40, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.1)'
                  }}
                >
                  <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                    Customer Growth Trend
                  </Title>
                  
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={customerGrowthData}>
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
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#d4af37"
                        strokeWidth={3}
                        dot={{ fill: '#d4af37', strokeWidth: 2, r: 6 }}
                        name="New Customers"
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Tabs.Panel>

              <Tabs.Panel value="segmentation">
                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                  {/* Customer Segmentation Pie Chart */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Customer Segmentation
                    </Title>
                    
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={customerSegmentationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {customerSegmentationData.map((entry, index) => (
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

                  {/* Segmentation Details */}
                  <Card
                    padding="lg"
                    style={{
                      background: 'rgba(74, 55, 40, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                      Segment Details
                    </Title>
                    
                    <Stack gap="lg">
                      {customerSegmentationData.map((segment, index) => (
                        <div key={index}>
                          <Group justify="space-between" mb="xs">
                            <Group gap="sm">
                              <Box
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: segment.color
                                }}
                              />
                              <Text fw={500} style={{ color: '#ffffff' }}>
                                {segment.name}
                              </Text>
                            </Group>
                            <Text fw={600} style={{ color: segment.color }}>
                              {segment.value}%
                            </Text>
                          </Group>
                          <Progress
                            value={segment.value}
                            color={segment.color}
                            size="sm"
                            radius="xl"
                          />
                        </div>
                      ))}
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Tabs.Panel>

              <Tabs.Panel value="performance">
                <Card
                  padding="lg"
                  style={{
                    background: 'rgba(74, 55, 40, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.1)'
                  }}
                >
                  <Title order={4} mb="md" style={{ color: '#d4af37' }}>
                    Monthly Performance Metrics
                  </Title>
                  
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyPerformanceData}>
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
                      <Legend />
                      <Bar
                        dataKey="newCustomers"
                        fill="#3b82f6"
                        name="New Customers"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="retention"
                        fill="#10b981"
                        name="Retention %"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Tabs.Panel>
            </Box>
          </Tabs>
        </Card>
      </Container>
    </div>
  );
};

export default CustomerAnalytics;