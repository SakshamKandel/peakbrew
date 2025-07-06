import { useState, useEffect } from 'react';
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
import { format } from 'date-fns';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const { logout, currentUser } = useAuth();

  // Helper function to safely format dates
  const formatInvoiceDate = (dateValue) => {
    if (!dateValue) return 'No Date';
    
    let date;
    
    // Handle various date formats
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      // Firestore Timestamp
      date = dateValue.toDate();
    } else if (dateValue.seconds) {
      // Firestore Timestamp object
      date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'string') {
      // String date
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      // Already a Date object
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
      
      // Automatically open invoice preview after creation
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
        // Find the invoice to get PDF URL for deletion
        const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'invoices', invoiceId));
        
        // If there's a PDF stored, delete it from storage
        if (invoiceToDelete && invoiceToDelete.pdfURL) {
          try {
            const { ref, deleteObject } = await import('firebase/storage');
            const pdfRef = ref(storage, `invoices/${invoiceId}.pdf`);
            await deleteObject(pdfRef);
          } catch (storageError) {
            console.log('PDF file may not exist in storage:', storageError);
            // Continue even if PDF deletion fails
          }
        }
        
        // Refresh the invoices list
        await fetchInvoices();
        
        notifications.show({
          title: 'Success',
          message: 'Invoice and associated files deleted successfully!',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting invoice:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete invoice. Please try again.',
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
    <Container fluid p={0} style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <LoadingOverlay visible={loading} />
      
      {/* Modern Enhanced Header */}
      <Paper 
        shadow="xl" 
        p="xl" 
        mb={0}
        style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 0,
          borderBottom: '4px solid #e8c848',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(232, 200, 72, 0.1) 0%, transparent 100%)',
          borderRadius: '0 0 0 100px'
        }} />
        
        <Flex justify="space-between" align="center" style={{ position: 'relative', zIndex: 10 }}>
          <Group gap="xl">
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Logo size={80} forDashboard={true} style={{ filter: 'drop-shadow(0 4px 12px rgba(232, 200, 72, 0.4))' }} />
            </div>
            <Box>
              <Title order={1} style={{ 
                color: '#e8c848', 
                fontSize: '2.5rem', 
                fontWeight: 800,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                marginBottom: '4px'
              }}>
                {COMPANY_INFO.name}
              </Title>
              <Text style={{ 
                color: '#cbd5e1', 
                fontSize: '1.2rem', 
                fontWeight: 600, 
                marginBottom: '4px'
              }}>
                {COMPANY_INFO.tagline}
              </Text>
              <Group gap="xs">
                <Text style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.95rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  Inovice Management
                </Text>
              </Group>
            </Box>
          </Group>
          
          <Group gap="md">
            <Button
              leftSection={<IconPlus size={20} />}
              onClick={() => setShowForm(true)}
              size="lg"
              style={{ 
                background: 'linear-gradient(135deg, #e8c848 0%, #f59e0b 100%)',
                color: '#1a1a1a',
                border: 'none',
                fontWeight: 700,
                fontSize: '16px',
                padding: '12px 24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(232, 200, 72, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(232, 200, 72, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(232, 200, 72, 0.3)';
              }}
            >
              Create Invoice
            </Button>
            
            <ActionIcon
              size={52}
              style={{ 
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <IconLogout size={22} />
            </ActionIcon>
          </Group>
        </Flex>
      </Paper>

      <Container size="xl" p="xl">
        {/* Minimalist Stats Cards - Beer/Liquor Theme */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
          <Card 
            shadow="sm" 
            padding="xl" 
            radius="md"
            style={{ 
              border: '1px solid #e0e0e0',
              backgroundColor: 'white',
              borderTop: '4px solid #8b4513' // Saddle brown accent
            }}
          >
            <Group justify="space-between" mb="md">
              <Text size="sm" tt="uppercase" fw={600} style={{ color: '#666', letterSpacing: '0.5px' }}>
                Total Invoices
              </Text>
              <ThemeIcon 
                style={{ backgroundColor: '#8b4513', color: 'white' }} 
                size={36} 
                radius="md"
              >
                <IconFileText size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={900} size="2rem" mb="xs">
              {totalInvoices}
            </Text>
            <Text size="xs" opacity={0.8}>
              <IconTrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
              All time total
            </Text>
          </Card>

          <Card 
            shadow="md" 
            padding="xl" 
            radius="lg"
            style={{ 
              border: '1px solid #e9ecef',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white'
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" tt="uppercase" fw={700} opacity={0.9}>
                Total Revenue
              </Text>
              <ThemeIcon color="white" variant="light" size={40} radius="md">
                <IconCurrencyDollar size={24} />
              </ThemeIcon>
            </Group>
            <Text fw={900} size="2rem" mb="xs">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text size="xs" opacity={0.8}>
              <IconTrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
              Gross earnings
            </Text>
          </Card>

          <Card 
            shadow="sm" 
            padding="xl" 
            radius="md"
            style={{ 
              border: '1px solid #e0e0e0',
              backgroundColor: 'white',
              borderTop: '4px solid #ff6347' // Tomato accent
            }}
          >
            <Group justify="space-between" mb="md">
              <Text size="sm" tt="uppercase" fw={600} style={{ color: '#666', letterSpacing: '0.5px' }}>
                Pending
              </Text>
              <ThemeIcon 
                style={{ backgroundColor: '#ff6347', color: 'white' }} 
                size={36} 
                radius="md"
              >
                <IconPackage size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="2.2rem" mb="xs" style={{ color: '#2c2c2c' }}>
              {pendingInvoices}
            </Text>
            <Text size="sm" style={{ color: '#666' }}>
              <IconCalendar size={14} style={{ display: 'inline', marginRight: 4 }} />
              Awaiting payment
            </Text>
          </Card>

          <Card 
            shadow="sm" 
            padding="xl" 
            radius="md"
            style={{ 
              border: '1px solid #e0e0e0',
              backgroundColor: 'white',
              borderTop: '4px solid #d4af37' // Gold accent
            }}
          >
            <Group justify="space-between" mb="md">
              <Text size="sm" tt="uppercase" fw={600} style={{ color: '#666', letterSpacing: '0.5px' }}>
                This Month
              </Text>
              <ThemeIcon 
                style={{ backgroundColor: '#d4af37', color: 'white' }} 
                size={36} 
                radius="md"
              >
                <IconCalendar size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={900} size="2rem" mb="xs">
              {invoices.filter(inv => {
                const invoiceDate = new Date(inv.date);
                const now = new Date();
                return invoiceDate.getMonth() === now.getMonth() && 
                       invoiceDate.getFullYear() === now.getFullYear();
              }).length}
            </Text>
            <Text size="xs" opacity={0.8}>
              <IconTrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
              Current month
            </Text>
          </Card>
        </SimpleGrid>

      {/* Minimalist Invoices Table */}
      <Card shadow="sm" padding={0} radius="md" style={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <Box p="xl" style={{ backgroundColor: '#f8f8f8', borderBottom: '1px solid #e0e0e0' }}>
          <Group justify="space-between" align="center">
            <Box>
              <Title order={2} style={{ color: '#2c2c2c', fontWeight: 600 }} mb="xs">Recent Invoices</Title>
              <Text style={{ color: '#666' }} size="sm">Manage and track your invoice status</Text>
            </Box>
            <Button
              leftSection={<IconSearch size={16} />}
              style={{ 
                backgroundColor: '#d4af37',
                color: '#1a1a1a',
                border: 'none',
                '&:hover': {
                  backgroundColor: '#b8860b'
                }
              }}
              radius="md"
            >
              Search Invoices
            </Button>
          </Group>
        </Box>

        <Box p="xl">
          {invoices.length === 0 ? (
            <Stack align="center" py={80}>
              <ThemeIcon size={80} color="gray" variant="light" radius="xl">
                <IconFileText size={50} />
              </ThemeIcon>
              <Title order={3} c="gray.6" ta="center">No invoices created yet</Title>
              <Text size="md" c="dimmed" ta="center" maw={400}>
                Start by creating your first invoice to track payments and manage your business transactions
              </Text>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => setShowForm(true)}
                size="lg"
                mt="lg"
                style={{ 
                  background: `linear-gradient(135deg, ${COMPANY_INFO.colors.primary} 0%, #f39c12 100%)`,
                  border: 'none'
                }}
              >
                Create Your First Invoice
              </Button>
            </Stack>
          ) : (
            <Table.ScrollContainer minWidth={900}>
              <Table 
                striped 
                highlightOnHover 
                verticalSpacing="md"
                style={{ '--table-border-color': '#e9ecef' }}
              >
                <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                  <Table.Tr>
                    <Table.Th style={{ fontWeight: 700, color: '#495057' }}>Invoice #</Table.Th>
                    <Table.Th style={{ fontWeight: 700, color: '#495057' }}>Customer</Table.Th>
                    <Table.Th style={{ fontWeight: 700, color: '#495057' }}>Date</Table.Th>
                    <Table.Th style={{ fontWeight: 700, color: '#495057' }}>Amount</Table.Th>
                    <Table.Th style={{ fontWeight: 700, color: '#495057' }}>Status</Table.Th>
                    <Table.Th style={{ fontWeight: 700, color: '#495057' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {invoices.map((invoice) => (
                    <Table.Tr key={invoice.id} style={{ cursor: 'pointer' }}>
                      <Table.Td>
                        <Text fw={700} c="blue" size="sm">#{invoice.invoiceNumber}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Box>
                          <Text fw={500} size="sm">{invoice.customerName}</Text>
                          <Text c="dimmed" size="xs">{invoice.customerEmail}</Text>
                        </Box>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatInvoiceDate(invoice.date)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={700} size="sm" c="green">
                          ${invoice.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={invoice.status === 'paid' ? 'green' : invoice.status === 'pending' ? 'yellow' : 'red'}
                          variant="light"
                          radius="md"
                          size="sm"
                        >
                          {(invoice.status || 'pending').toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            size="lg"
                            color="blue"
                            variant="light"
                            radius="md"
                            onClick={() => setPreviewInvoice(invoice)}
                          >
                            <IconEye size={18} />
                          </ActionIcon>
                          <ActionIcon
                            size="lg"
                            color="orange"
                            variant="light"
                            radius="md"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon
                            size="lg"
                            color="red"
                            variant="light"
                            radius="md"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Box>
      </Card>
      </Container>

      {/* Modals */}
      <Modal
        opened={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingInvoice(null);
        }}
        title={
          <Group gap="sm">
            <Logo size={24} forDashboard={true} />
            <Title order={3}>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</Title>
          </Group>
        }
        size="xl"
        centered
        radius="lg"
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
            <Logo size={24} forDashboard={true} />
            <Title order={3}>Invoice Preview</Title>
          </Group>
        }
        size="xl"
        centered
        radius="lg"
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
    </Container>
  );
}