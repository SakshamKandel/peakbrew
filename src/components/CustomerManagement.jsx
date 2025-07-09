import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Text,
  Button,
  Table,
  Group,
  Title,
  ActionIcon,
  LoadingOverlay,
  Stack,
  Flex,
  Modal,
  TextInput,
  Textarea,
  Select,
  Badge,
  Avatar,
  Menu,
  Tabs,
  SimpleGrid,
  ThemeIcon,
  Progress,
  ScrollArea,
  Tooltip,
  NumberInput,
  Pagination,
  Alert,
  Divider,
  UnstyledButton,
  rem,
  Box
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBuilding,
  IconUsers,
  IconTrendingUp,
  IconCurrencyDollar,
  IconCalendar,
  IconSearch,
  IconFilter,
  IconDownload,
  IconFileText,
  IconChevronRight,
  IconDots,
  IconStar,
  IconStarFilled,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconArrowUpRight,
  IconArrowDownRight,
  IconUserPlus,
  IconUserCheck,
  IconUserX,
  IconChartBar,
  IconTarget,
  IconClock,
  IconHistory,
  IconArrowLeft
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { useSpring, animated } from 'react-spring';
import customerService from '../services/customerService';
import CustomerForm from './CustomerForm';
import CustomerDetails from './CustomerDetails';
import CustomerAnalytics from './CustomerAnalytics';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const [advancedFilters, setAdvancedFilters] = useState({
    minRevenue: '',
    maxRevenue: '',
    minInvoices: '',
    maxInvoices: '',
    dateRange: null
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchCustomers();
      fetchCustomerStats();
    }
  }, [currentUser, sortBy, sortOrder, statusFilter]);

  // Refresh customer data when forms are closed
  useEffect(() => {
    if (!showForm && !showDetails && currentUser) {
      fetchCustomers();
    }
  }, [showForm, showDetails, currentUser]);

  const fetchCustomers = async (showRefresh = false) => {
    if (!currentUser) return;
    
    if (showRefresh) setRefreshing(true);
    if (!showRefresh) setLoading(true);

    try {
      const result = await customerService.getCustomers(currentUser.uid, {
        searchTerm,
        sortBy,
        sortOrder,
        status: statusFilter,
        limitCount: 1000 // Get all for client-side pagination
      });

      setCustomers(result.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      console.error('Failed to fetch customers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCustomerStats = async () => {
    if (!currentUser) return;

    try {
      const stats = await customerService.getCustomerAnalytics(currentUser.uid);
      setCustomerStats(stats);
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  const handleCreateCustomer = async (customerData) => {
    try {
      await customerService.createCustomer(customerData, currentUser.uid);
      
      // Force refresh customer data
      setLoading(true);
      await fetchCustomers();
      await fetchCustomerStats();
      
      setShowForm(false);
      
      console.log('Customer created successfully!');
    } catch (error) {
      console.error('Error creating customer:', error);
      console.error('Failed to create customer.');
    }
  };

  const handleUpdateCustomer = async (customerData) => {
    try {
      await customerService.updateCustomer(editingCustomer.id, customerData);
      
      // Force refresh customer data
      setLoading(true);
      await fetchCustomers();
      await fetchCustomerStats();
      
      setShowForm(false);
      setEditingCustomer(null);
      
      console.log('Customer updated successfully!');
    } catch (error) {
      console.error('Error updating customer:', error);
      console.error('Failed to update customer.');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await customerService.deleteCustomer(customerId);
        await fetchCustomers();
        await fetchCustomerStats();
        
        console.log('Customer deleted successfully!');
      } catch (error) {
        console.error('Error deleting customer:', error);
        console.error('Failed to delete customer.');
      }
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const handleSearch = async () => {
    if (showAdvancedFilters) {
      try {
        const filteredCustomers = await customerService.searchCustomers(
          currentUser.uid,
          {
            searchTerm,
            minRevenue: advancedFilters.minRevenue || 0,
            maxRevenue: advancedFilters.maxRevenue || Infinity,
            minInvoices: advancedFilters.minInvoices || 0,
            maxInvoices: advancedFilters.maxInvoices || Infinity,
            dateRange: advancedFilters.dateRange,
            status: statusFilter
          }
        );
        setCustomers(filteredCustomers);
      } catch (error) {
        console.error('Error searching customers:', error);
        console.error('Failed to search customers.');
      }
    } else {
      await fetchCustomers();
    }
  };

  const handleRefresh = () => {
    fetchCustomers(true);
    fetchCustomerStats();
  };

  // Filter and paginate customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.permitNumber?.includes(searchTerm);
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'MMM dd, yyyy');
  };

  const getCustomerInitials = (name) => {
    if (!name) return 'N/A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const statsCards = customerStats ? [
    {
      title: 'Total Customers',
      value: customerStats.totalCustomers,
      icon: IconUsers,
      color: '#3b82f6',
      trend: `+${customerStats.customerGrowth?.[3]?.count || 0}`,
      subtitle: 'this month'
    },
    {
      title: 'Active Customers',
      value: customerStats.activeCustomers,
      icon: IconUserCheck,
      color: '#10b981',
      trend: `${Math.round((customerStats.activeCustomers / customerStats.totalCustomers) * 100)}%`,
      subtitle: 'active rate'
    },
    {
      title: 'Avg Revenue/Customer',
      value: formatCurrency(customerStats.averageRevenuePerCustomer),
      icon: IconCurrencyDollar,
      color: '#f59e0b',
      trend: formatCurrency(customerStats.averageRevenuePerCustomer),
      subtitle: 'per customer'
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(customerStats.totalPendingAmount || 0),
      icon: IconClock,
      color: '#f59e0b',
      trend: 'Awaiting Payment',
      subtitle: 'pending invoices'
    },
  ] : [];

  if (showForm) {
    return (
      <CustomerForm
        customer={editingCustomer}
        onSave={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
        onCancel={() => {
          setShowForm(false);
          setEditingCustomer(null);
        }}
      />
    );
  }

  if (showDetails && selectedCustomer) {
    return (
      <CustomerDetails
        customer={selectedCustomer}
        onClose={() => {
          setShowDetails(false);
          setSelectedCustomer(null);
        }}
        onEdit={() => {
          setShowDetails(false);
          handleEditCustomer(selectedCustomer);
        }}
      />
    );
  }

  if (showAnalytics) {
    return (
      <CustomerAnalytics
        onClose={() => setShowAnalytics(false)}
        customerStats={customerStats}
      />
    );
  }

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
                title="Back to Dashboard"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <div>
                <Title order={1} style={{ color: '#d4af37', marginBottom: '8px' }}>
                  Customer Management
                </Title>
                <Text size="lg" style={{ color: '#a1a1aa' }}>
                  Manage your customers, track relationships, and analyze performance
                </Text>
              </div>
            </Group>
            
            <Group gap="md">
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={handleRefresh}
                loading={refreshing}
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
                leftSection={<IconChartBar size={16} />}
                onClick={() => setShowAnalytics(true)}
                variant="light"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}
              >
                Analytics
              </Button>
              
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowForm(true)}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                  color: '#1a1a1a',
                  fontWeight: 600,
                  border: 'none'
                }}
              >
                Add Customer
              </Button>
            </Group>
          </Flex>
        </Card>

        {/* Stats Cards */}
        {customerStats && (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl" mb="xl">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
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
                        background: `${stat.color}20`,
                        color: stat.color,
                        border: `1px solid ${stat.color}30`
                      }}
                    >
                      <Icon size={28} />
                    </ThemeIcon>
                    <div style={{ textAlign: 'right' }}>
                      <Text size="xs" style={{ color: '#a1a1aa', textTransform: 'uppercase' }}>
                        {stat.subtitle}
                      </Text>
                      <Text size="sm" fw={600} style={{ color: stat.color }}>
                        {stat.trend}
                      </Text>
                    </div>
                  </Group>
                  
                  <Text size="sm" fw={500} style={{ color: '#d1d5db', marginBottom: '8px' }}>
                    {stat.title}
                  </Text>
                  
                  <Text fw={900} size="2rem" style={{ color: '#ffffff', lineHeight: 1 }}>
                    {typeof stat.value === 'string' && stat.value.length > 20 
                      ? stat.value.substring(0, 20) + '...' 
                      : stat.value}
                  </Text>
                </Card>
              );
            })}
          </SimpleGrid>
        )}

        {/* Search and Filters */}
        <Card
          shadow="xl"
          padding="xl"
          radius="xl"
          mb="xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff'
          }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap="md" mb="md">
            <Text size="lg" fw={600} style={{ color: '#d4af37' }}>
              Search & Filter
            </Text>
            
            <Group gap="sm">
              <Button
                size="sm"
                variant={showAdvancedFilters ? 'filled' : 'light'}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={{
                  backgroundColor: showAdvancedFilters ? '#d4af37' : 'rgba(212, 175, 55, 0.1)',
                  color: showAdvancedFilters ? '#1a1a1a' : '#d4af37',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}
              >
                Advanced Filters
              </Button>
            </Group>
          </Flex>

          <Stack gap="md">
            <Group grow>
              <TextInput
                placeholder="Search customers..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  '& input': {
                    backgroundColor: 'rgba(74, 55, 40, 0.3)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#ffffff'
                  }
                }}
              />
              
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                data={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'vip', label: 'VIP' }
                ]}
                style={{
                  '& input': {
                    backgroundColor: 'rgba(74, 55, 40, 0.3)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#ffffff'
                  }
                }}
              />
              
              <Select
                placeholder="Sort by"
                value={sortBy}
                onChange={setSortBy}
                data={[
                  { value: 'name', label: 'Name' },
                  { value: 'totalRevenue', label: 'Revenue' },
                  { value: 'totalInvoices', label: 'Invoices' },
                  { value: 'createdAt', label: 'Created Date' },
                  { value: 'lastInvoiceDate', label: 'Last Invoice' }
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
                onClick={handleSearch}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                  color: '#1a1a1a',
                  fontWeight: 600,
                  border: 'none'
                }}
              >
                Search
              </Button>
            </Group>

            {showAdvancedFilters && (
              <Card
                padding="md"
                style={{
                  background: 'rgba(74, 55, 40, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.1)'
                }}
              >
                <Group grow>
                  <NumberInput
                    placeholder="Min Revenue"
                    value={advancedFilters.minRevenue}
                    onChange={(value) => setAdvancedFilters(prev => ({ ...prev, minRevenue: value }))}
                    prefix="$"
                    style={{
                      '& input': {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff'
                      }
                    }}
                  />
                  
                  <NumberInput
                    placeholder="Max Revenue"
                    value={advancedFilters.maxRevenue}
                    onChange={(value) => setAdvancedFilters(prev => ({ ...prev, maxRevenue: value }))}
                    prefix="$"
                    style={{
                      '& input': {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff'
                      }
                    }}
                  />
                  
                  <NumberInput
                    placeholder="Min Invoices"
                    value={advancedFilters.minInvoices}
                    onChange={(value) => setAdvancedFilters(prev => ({ ...prev, minInvoices: value }))}
                    style={{
                      '& input': {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff'
                      }
                    }}
                  />
                  
                  <NumberInput
                    placeholder="Max Invoices"
                    value={advancedFilters.maxInvoices}
                    onChange={(value) => setAdvancedFilters(prev => ({ ...prev, maxInvoices: value }))}
                    style={{
                      '& input': {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff'
                      }
                    }}
                  />
                </Group>

                <Divider my="sm" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <Group grow>
                  <DatePickerInput
                    placeholder="Start Date"
                    value={advancedFilters.dateRange?.[0] || null}
                    onChange={(date) => setAdvancedFilters(prev => ([date, prev.dateRange?.[1]]))}
                    style={{
                      '& input': {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff'
                      }
                    }}
                  />
                  
                  <DatePickerInput
                    placeholder="End Date"
                    value={advancedFilters.dateRange?.[1] || null}
                    onChange={(date) => setAdvancedFilters(prev => ([prev.dateRange?.[0], date]))}
                    style={{
                      '& input': {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff'
                      }
                    }}
                  />
                </Group>
              </Card>
            )}
          </Stack>
        </Card>

        {/* Customers Table */}
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
          <Group justify="space-between" mb="xl">
            <div>
              <Title order={3} style={{ color: '#d4af37', marginBottom: '4px' }}>
                Customers ({filteredCustomers.length})
              </Title>
              <Text size="sm" style={{ color: '#a1a1aa' }}>
                Manage customer relationships and track performance
              </Text>
            </div>
          </Group>

          <ScrollArea style={{ height: 600 }}>
            {paginatedCustomers.length === 0 ? (
              <Stack align="center" py={80}>
                <ThemeIcon size={80} style={{ 
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  color: '#d4af37'
                }} variant="light" radius="xl">
                  <IconUsers size={40} />
                </ThemeIcon>
                <Title order={3} style={{ color: '#ffffff' }} ta="center">
                  No customers found
                </Title>
                <Text size="md" style={{ color: '#a1a1aa' }} ta="center">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first customer'}
                </Text>
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => setShowForm(true)}
                  size="lg"
                  mt="md"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                    color: '#1a1a1a',
                    fontWeight: 600,
                    border: 'none'
                  }}
                >
                  Add Your First Customer
                </Button>
              </Stack>
            ) : (
              <Table verticalSpacing="md" style={{ '--table-border-color': 'rgba(255, 255, 255, 0.1)' }}>
                <Table.Thead style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Table.Tr>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Customer</Table.Th>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Contact</Table.Th>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Revenue</Table.Th>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Pending</Table.Th>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Invoices</Table.Th>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Last Invoice</Table.Th>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Status</Table.Th>
                    <Table.Th style={{ color: '#d4af37', fontWeight: 600 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedCustomers.map((customer) => (
                    <Table.Tr 
                      key={customer.id}
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
                          <Avatar 
                            size="md" 
                            radius="xl" 
                            style={{ 
                              background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                              color: '#1a1a1a'
                            }}
                          >
                            {getCustomerInitials(customer.name)}
                          </Avatar>
                          <div>
                            <Text fw={600} size="sm" style={{ color: '#ffffff' }}>
                              {customer.name}
                            </Text>
                            {customer.businessName && (
                              <Text size="xs" style={{ color: '#d4af37' }}>
                                {customer.businessName}
                              </Text>
                            )}
                            {customer.permitNumber && (
                              <Text size="xs" style={{ color: '#a1a1aa' }}>
                                Permit: {customer.permitNumber}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text size="sm" style={{ color: '#d1d5db' }}>
                            {customer.email}
                          </Text>
                          <Text size="xs" style={{ color: '#a1a1aa' }}>
                            {customer.phone}
                          </Text>
                          {customer.businessAddress && (
                            <Text size="xs" style={{ color: '#9ca3af' }}>
                              {customer.businessAddress}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm" style={{ color: '#10b981' }}>
                          {formatCurrency(customer.totalRevenue)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm" style={{ color: '#f59e0b' }}>
                          {formatCurrency(customer.pendingAmount || 0)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" style={{ color: '#6366f1' }}>
                          {customer.totalInvoices || 0}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" style={{ color: '#d1d5db' }}>
                          {formatDate(customer.lastInvoiceDate)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(customer.status)}
                          variant="light"
                          radius="lg"
                          size="sm"
                        >
                          {customer.status || 'active'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="View Customer">
                            <ActionIcon
                              size="sm"
                              onClick={() => handleViewCustomer(customer)}
                              style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                color: '#6366f1',
                                border: '1px solid rgba(99, 102, 241, 0.2)'
                              }}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Edit Customer">
                            <ActionIcon
                              size="sm"
                              onClick={() => handleEditCustomer(customer)}
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.2)'
                              }}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Customer">
                            <ActionIcon
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                              }}
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
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="center" mt="xl">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                size="md"
                style={{
                  '& .mantine-Pagination-control': {
                    backgroundColor: 'rgba(74, 55, 40, 0.3)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#ffffff'
                  },
                  '& .mantine-Pagination-control[data-active]': {
                    backgroundColor: '#d4af37',
                    color: '#1a1a1a'
                  }
                }}
              />
            </Group>
          )}
        </Card>
      </Container>
    </div>
  );
}