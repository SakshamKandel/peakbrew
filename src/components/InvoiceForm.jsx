import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Grid,
  Select,
  NumberInput,
  Text,
  Title,
  Divider,
  ActionIcon,
  Table,
  Badge,
  Box,
  Loader,
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconCalendar,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconSearch,
} from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { notifications } from '@mantine/notifications';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';

const beerProducts = [
  { id: 'yak-barahsinghe-pilsner-330', name: 'Barahsinghe Pilsner', brand: 'Yak', container: 'Bottle', netContent: '330 ml', alcPercent: 5, unitPerCase: 24, price: 52, availability: 'Available' },
  { id: 'yak-barahsinghe-pilsner-650', name: 'Barahsinghe Pilsner', brand: 'Yak', container: 'Bottle', netContent: '650 ml', alcPercent: 5, unitPerCase: 12, price: 52, availability: 'Available' },
  { id: 'yak-barahsinghe-hazy-ipa-330', name: 'Barahsinghe Hazy IPA', brand: 'Yak', container: 'Bottle', netContent: '330 ml', alcPercent: 5.5, unitPerCase: 24, price: 55, availability: 'Out of Stock' },
  { id: 'gorkha-gorkha-premium-330', name: 'Gorkha Premium', brand: 'Gorkha', container: 'Bottle', netContent: '330 ml', alcPercent: 5, unitPerCase: 24, price: 55, availability: 'Out of Stock' },
  { id: 'gorkha-gorkha-strong-500', name: 'Gorkha Strong', brand: 'Gorkha', container: 'Can', netContent: '500 ml', alcPercent: 6, unitPerCase: 12, price: 55, availability: 'Out of Stock' },
  { id: 'nepal-ice-nepal-ice-premium-330', name: 'Nepal Ice Premium', brand: 'Nepal Ice', container: 'Bottle', netContent: '330 ml', alcPercent: 5.5, unitPerCase: 24, price: 50, availability: 'Available' },
];

const InvoiceForm = ({ onSave, onCancel, invoice = null }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: new Date(),
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    permitNumber: '06756556-1',
    paymentMethod: 'Cash', // Default payment method
    items: [],
    notes: '',
    status: 'pending'
  });

  // Customer autocomplete state - temporarily disabled
  // const [customers, setCustomers] = useState([]);
  // const [customerLoading, setCustomerLoading] = useState(false);
  // const [customerSearchValue, setCustomerSearchValue] = useState('');

  // Fetch existing customers - temporarily disabled
  /*
  const fetchCustomers = async () => {
    if (!currentUser) return;
    
    setCustomerLoading(true);
    try {
      const q = query(
        collection(db, 'customers'),
        where("userId", "==", currentUser.uid),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const customerList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Save customer to Firestore
  const saveCustomer = async (customerData) => {
    if (!currentUser) return;

    try {
      const existingCustomer = customers.find(
        c => c.name.toLowerCase() === customerData.name.toLowerCase()
      );
      
      if (!existingCustomer) {
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          userId: currentUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await fetchCustomers(); // Refresh customer list
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customerName) => {
    if (!customerName || typeof customerName !== 'string') return;
    
    const selectedCustomer = customers.find(
      c => c.name && c.name.toLowerCase() === customerName.toLowerCase()
    );
    
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || '',
        customerPhone: selectedCustomer.phone || '',
        customerAddress: selectedCustomer.address || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerName: customerName
      }));
    }
    setCustomerSearchValue(customerName);
  };
  */

  // Helper function to safely parse dates
  const parseDate = (dateValue) => {
    if (!dateValue) return new Date();
    
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? new Date() : dateValue;
    }
    
    // If it's a Firestore Timestamp
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    
    // If it's a Firestore Timestamp object
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }
    
    // If it's a string or number
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  useEffect(() => {
    // Temporarily disabled customer fetching
    // if (currentUser) {
    //   fetchCustomers();
    // }
    
    if (invoice) {
      console.log('Loading invoice for editing:', invoice);
      const formDataToLoad = {
        ...invoice,
        date: parseDate(invoice.date)
      };
      console.log('Form data set to:', formDataToLoad);
      setFormData(formDataToLoad);
      // setCustomerSearchValue(invoice.customerName || '');
    } else {
      console.log('Creating new invoice');
      const invoiceNum = `INV-${Date.now()}`;
      setFormData(prev => ({ ...prev, invoiceNumber: invoiceNum }));
    }
  }, [invoice, currentUser]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        productId: '', 
        product: '',
        container: '', 
        netContent: '', 
        alcPercent: '', 
        unitPerCase: '', 
        quantity: 1, 
        price: 0, 
        total: 0 
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'quantity' || field === 'price') {
        newItems[index].total = newItems[index].quantity * newItems[index].price;
      }
      
      if (field === 'productId') {
        const product = beerProducts.find(p => p.id === value);
        if (product) {
          newItems[index] = {
            ...newItems[index],
            productId: product.id,
            product: product.name,
            container: product.container,
            netContent: product.netContent,
            alcPercent: product.alcPercent,
            unitPerCase: product.unitPerCase,
            price: product.price,
            total: newItems[index].quantity * product.price
          };
        }
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal;

    // Save customer data if it's new - temporarily disabled
    // if (formData.customerName && formData.customerEmail) {
    //   await saveCustomer({
    //     name: formData.customerName,
    //     email: formData.customerEmail,
    //     phone: formData.customerPhone,
    //     address: formData.customerAddress
    //   });
    // }

    // Ensure we have a valid date
    const validDate = parseDate(formData.date);

    const invoiceDataToSave = {
      ...formData,
      date: validDate,
      subtotal,
      total
    };

    console.log('Submitting invoice data:', invoiceDataToSave);
    
    onSave(invoiceDataToSave);
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      padding: '12px',
      boxSizing: 'border-box'
    }}>
      <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={0}>
        <Paper shadow="xl" p={{ base: 'md', sm: 'xl' }} radius="xl" style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          color: '#ffffff',
          width: '100%',
          boxSizing: 'border-box'
        }}>
        <form onSubmit={handleSubmit}>
          <Stack gap={{ base: 'md', sm: 'xl' }}>
            {/* Header */}
            <Group wrap="wrap" gap={{ base: 'sm', sm: 'md' }}>
              <ActionIcon
                size="lg"
                variant="light"
                onClick={onCancel}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Group wrap="wrap" gap={{ base: 'xs', sm: 'md' }}>
                <Logo size={80} style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))' }} className="responsive-form-logo" />
                <div>
                  <Title order={2} style={{ color: '#d4af37', fontSize: '20px' }} className="responsive-form-title">
                    {invoice ? 'Edit Invoice' : 'Create Invoice'}
                  </Title>
                  <Text style={{ color: '#a1a1aa', fontSize: '14px' }}>{COMPANY_INFO.name}</Text>
                </div>
              </Group>
            </Group>

            <Divider style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }} />

            {/* Invoice Details */}
            <Stack gap="md">
              <Group>
                <IconCalendar size={20} color="#d4af37" />
                <Title order={3} style={{ color: '#d4af37' }}>Invoice Details</Title>
              </Group>
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Invoice Number"
                    placeholder="INV-001"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    required
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DateInput
                    label="Date"
                    placeholder="Select date"
                    value={formData.date}
                    onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                    required
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Permit Number"
                    placeholder="06756556-1"
                    value={formData.permitNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, permitNumber: e.target.value }))}
                    required
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Payment Method"
                    placeholder="Select payment method"
                    value={formData.paymentMethod}
                    onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    data={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Online', label: 'Online Payment' },
                      { value: 'Check', label: 'Check' },
                      { value: 'Bank Transfer', label: 'Bank Transfer' },
                      { value: 'Credit Card', label: 'Credit Card' }
                    ]}
                    required
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }} />

            {/* Customer Information */}
            <Stack gap="md">
              <Group>
                <IconUser size={20} color="#d4af37" />
                <Title order={3} style={{ color: '#d4af37' }}>Customer Information</Title>
              </Group>
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Customer Name"
                    placeholder="Enter customer name"
                    value={formData.customerName || ''}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setFormData(prev => ({ ...prev, customerName: value }));
                    }}
                    leftSection={<IconUser size={16} />}
                    required
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Email"
                    placeholder="customer@example.com"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    leftSection={<IconMail size={16} />}
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    leftSection={<IconPhone size={16} />}
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Textarea
                    label="Address"
                    placeholder="Customer address"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    minRows={3}
                    styles={{
                      label: { color: '#d4af37', fontWeight: 600 },
                      input: {
                        backgroundColor: 'rgba(74, 55, 40, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: '#d4af37'
                        }
                      }
                    }}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }} />

            {/* Items Section */}
            <Stack gap="md">
              <Group justify="space-between">
                <Group>
                  <Logo size={140} style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))' }} />
                  <Title order={3} style={{ color: '#d4af37' }}>Invoice Items</Title>
                </Group>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={addItem}
                  variant="filled"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                    color: '#1a1a1a',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  Add Item
                </Button>
              </Group>

              {formData.items.length > 0 ? (
                <Table style={{
                  backgroundColor: 'rgba(74, 55, 40, 0.2)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid rgba(212, 175, 55, 0.3)'
                }}>
                  <Table.Thead>
                    <Table.Tr style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}>
                      <Table.Th style={{ color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.2)', padding: '16px 12px', fontSize: '14px', fontWeight: 700, width: '40%', minWidth: '200px' }}>Product</Table.Th>
                      <Table.Th style={{ color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.2)', padding: '16px 12px', fontSize: '14px', fontWeight: 700, textAlign: 'center', width: '12%', minWidth: '80px' }}>Qty</Table.Th>
                      <Table.Th style={{ color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.2)', padding: '16px 12px', fontSize: '14px', fontWeight: 700, textAlign: 'right', width: '20%', minWidth: '100px' }}>Price ($)</Table.Th>
                      <Table.Th style={{ color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.2)', padding: '16px 12px', fontSize: '14px', fontWeight: 700, textAlign: 'right', width: '20%', minWidth: '100px' }}>Total ($)</Table.Th>
                      <Table.Th width="8%" style={{ borderColor: 'rgba(212, 175, 55, 0.2)', padding: '16px 8px', textAlign: 'center', minWidth: '60px' }}>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {formData.items.map((item, index) => (
                      <Table.Tr key={index} style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
                        <Table.Td style={{ borderColor: 'rgba(212, 175, 55, 0.1)', padding: '12px', verticalAlign: 'top', width: '40%' }}>
                          <Select
                            placeholder="Select a product"
                            data={beerProducts.map(product => ({
                              value: product.id,
                              label: `${product.name} - ${product.container} (${product.netContent})`
                            }))}
                            value={item.productId}
                            onChange={(value) => updateItem(index, 'productId', value)}
                            searchable
                            required
                            styles={{
                              input: {
                                backgroundColor: 'rgba(74, 55, 40, 0.3)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                color: '#ffffff',
                                fontSize: '13px',
                                '&:focus': {
                                  borderColor: '#d4af37'
                                }
                              },
                              dropdown: {
                                backgroundColor: 'rgba(74, 55, 40, 0.95)',
                                border: '1px solid rgba(212, 175, 55, 0.2)'
                              },
                              option: {
                                color: '#ffffff',
                                fontSize: '13px',
                                '&[data-selected]': {
                                  backgroundColor: 'rgba(212, 175, 55, 0.3)'
                                }
                              }
                            }}
                          />
                        </Table.Td>
                        <Table.Td style={{ borderColor: 'rgba(212, 175, 55, 0.1)', padding: '12px', textAlign: 'center', width: '12%' }}>
                          <NumberInput
                            min={1}
                            value={item.quantity}
                            onChange={(value) => updateItem(index, 'quantity', value)}
                            required
                            size="sm"
                            styles={{
                              input: {
                                backgroundColor: 'rgba(74, 55, 40, 0.3)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                color: '#ffffff',
                                textAlign: 'center',
                                fontSize: '13px',
                                '&:focus': {
                                  borderColor: '#d4af37'
                                }
                              }
                            }}
                          />
                        </Table.Td>
                        <Table.Td style={{ borderColor: 'rgba(212, 175, 55, 0.1)', padding: '12px', textAlign: 'right', width: '20%' }}>
                          <NumberInput
                            min={0}
                            decimalScale={2}
                            value={item.price}
                            onChange={(value) => updateItem(index, 'price', value)}
                            required
                            size="sm"
                            styles={{
                              input: {
                                backgroundColor: 'rgba(74, 55, 40, 0.3)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                color: '#ffffff',
                                textAlign: 'right',
                                fontSize: '13px',
                                '&:focus': {
                                  borderColor: '#d4af37'
                                }
                              }
                            }}
                          />
                        </Table.Td>
                        <Table.Td style={{ borderColor: 'rgba(212, 175, 55, 0.1)', padding: '12px', textAlign: 'right', width: '20%' }}>
                          <Text fw={600} style={{ color: '#d4af37', fontSize: '14px' }}>$ {item.total.toFixed(2)}</Text>
                        </Table.Td>
                        <Table.Td style={{ borderColor: 'rgba(212, 175, 55, 0.1)', padding: '12px', textAlign: 'center', width: '8%' }}>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => removeItem(index)}
                            size="sm"
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444'
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Paper p="xl" ta="center" style={{
                  backgroundColor: 'rgba(74, 55, 40, 0.2)',
                  color: '#a1a1aa',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}>
                  <Logo size={160} style={{ opacity: 0.25, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))' }} />
                  <Text size="lg" mt="md" style={{ color: '#a1a1aa' }}>No items added yet</Text>
                  <Text size="sm" style={{ color: '#a1a1aa' }}>Click "Add Item" to get started</Text>
                </Paper>
              )}

              {/* Summary */}
              {formData.items.length > 0 && (
                <Box>
                  <Paper p="md" radius="md" style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.2)'
                  }}>
                    <Group justify="flex-end">
                      <Stack gap="xs" align="flex-end">
                        <Group gap="xl">
                          <Text fw={700} size="lg" style={{ color: '#ffffff' }}>Total:</Text>
                          <Text fw={700} size="lg" style={{ color: '#d4af37' }}>$ {total.toFixed(2)}</Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>
                </Box>
              )}
            </Stack>

            <Divider style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }} />

            {/* Notes */}
            <Textarea
              label="Notes (Optional)"
              placeholder="Any additional notes or terms..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              minRows={3}
              styles={{
                label: { color: '#d4af37', fontWeight: 600 },
                input: {
                  backgroundColor: 'rgba(74, 55, 40, 0.3)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#ffffff',
                  '&:focus': {
                    borderColor: '#d4af37'
                  }
                }
              }}
            />

            {/* Status */}
            <Select
              label="Status"
              placeholder="Select status"
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' }
              ]}
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              required
              styles={{
                label: { color: '#d4af37', fontWeight: 600 },
                input: {
                  backgroundColor: 'rgba(74, 55, 40, 0.3)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#ffffff',
                  '&:focus': {
                    borderColor: '#d4af37'
                  }
                },
                dropdown: {
                  backgroundColor: 'rgba(74, 55, 40, 0.95)',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                },
                option: {
                  color: '#ffffff',
                  '&[data-selected]': {
                    backgroundColor: 'rgba(212, 175, 55, 0.3)'
                  }
                }
              }}
            />

            {/* Actions */}
            <Group justify="flex-end" gap="md">
              <Button
                variant="light"
                onClick={onCancel}
                style={{
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  color: '#9ca3af',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                  color: '#1a1a1a',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                {invoice ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </Group>
          </Stack>
        </form>
        </Paper>
      </Container>
      <style>{`
        @media (max-width: 600px) {
          .responsive-form-logo { width: 50px !important; height: 50px !important; }
          .responsive-form-title { font-size: 16px !important; }
          .mantine-Container-root { padding-left: 0 !important; padding-right: 0 !important; }
          .mantine-Paper-root { margin: 8px !important; }
          .mantine-TextInput-input, .mantine-NumberInput-input, .mantine-Select-input { 
            font-size: 14px !important; 
            padding: 8px !important; 
          }
          .mantine-Table-root { font-size: 12px !important; }
          .mantine-Button-root { padding: 8px 12px !important; font-size: 14px !important; }
          .mantine-ActionIcon-root { width: 32px !important; height: 32px !important; }
        }
        @media (max-width: 768px) {
          .responsive-form-logo { width: 60px !important; height: 60px !important; }
          .responsive-form-title { font-size: 18px !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceForm;
