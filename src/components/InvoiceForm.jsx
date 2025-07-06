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
      setFormData({
        ...invoice,
        date: parseDate(invoice.date)
      });
      // setCustomerSearchValue(invoice.customerName || '');
    } else {
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
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

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

    onSave({
      ...formData,
      date: validDate,
      subtotal,
      tax,
      total
    });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <Container size="xl" py="xl">
      <Paper shadow="md" p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Header */}
            <Group>
              <ActionIcon
                size="lg"
                variant="light"
                onClick={onCancel}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Group>
                <Logo size={70} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                <div>
                  <Title order={2} style={{ color: COMPANY_INFO.colors.primary }}>
                    {invoice ? 'Edit Invoice' : 'Create Invoice'}
                  </Title>
                  <Text c="dimmed">{COMPANY_INFO.name}</Text>
                </div>
              </Group>
            </Group>

            <Divider />

            {/* Invoice Details */}
            <Stack gap="md">
              <Group>
                <IconCalendar size={20} color="#1971c2" />
                <Title order={3}>Invoice Details</Title>
              </Group>
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Invoice Number"
                    placeholder="INV-001"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    required
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DateInput
                    label="Date"
                    placeholder="Select date"
                    value={formData.date}
                    onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                    required
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Customer Information */}
            <Stack gap="md">
              <Group>
                <IconUser size={20} color="#1971c2" />
                <Title order={3}>Customer Information</Title>
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
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    leftSection={<IconPhone size={16} />}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Textarea
                    label="Address"
                    placeholder="Customer address"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    minRows={3}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Items Section */}
            <Stack gap="md">
              <Group justify="space-between">
                <Group>
                  <Logo size={60} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                  <Title order={3}>Invoice Items</Title>
                </Group>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={addItem}
                  variant="filled"
                >
                  Add Item
                </Button>
              </Group>

              {formData.items.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Product</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>Price ($)</Table.Th>
                      <Table.Th>Total ($)</Table.Th>
                      <Table.Th width={50}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {formData.items.map((item, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
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
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            min={1}
                            value={item.quantity}
                            onChange={(value) => updateItem(index, 'quantity', value)}
                            required
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            min={0}
                            decimalScale={2}
                            value={item.price}
                            onChange={(value) => updateItem(index, 'price', value)}
                            required
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500}>$ {item.total.toFixed(2)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => removeItem(index)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Paper p="xl" ta="center" c="dimmed">
                  <Logo size={80} style={{ opacity: 0.25, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))' }} />
                  <Text size="lg" mt="md">No items added yet</Text>
                  <Text size="sm">Click "Add Item" to get started</Text>
                </Paper>
              )}

              {/* Summary */}
              {formData.items.length > 0 && (
                <Box>
                  <Paper p="md" bg="gray.0" radius="md">
                    <Group justify="flex-end">
                      <Stack gap="xs" align="flex-end">
                        <Group gap="xl">
                          <Text>Subtotal:</Text>
                          <Text>$ {subtotal.toFixed(2)}</Text>
                        </Group>
                        <Group gap="xl">
                          <Text>Tax (10%):</Text>
                          <Text>$ {tax.toFixed(2)}</Text>
                        </Group>
                        <Divider w="100%" />
                        <Group gap="xl">
                          <Text fw={700} size="lg">Total:</Text>
                          <Text fw={700} size="lg" c="blue">$ {total.toFixed(2)}</Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>
                </Box>
              )}
            </Stack>

            <Divider />

            {/* Notes */}
            <Textarea
              label="Notes (Optional)"
              placeholder="Any additional notes or terms..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              minRows={3}
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
            />

            {/* Actions */}
            <Group justify="flex-end" gap="md">
              <Button
                variant="light"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                gradient={{ from: 'blue', to: 'cyan' }}
                variant="gradient"
              >
                {invoice ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default InvoiceForm;
