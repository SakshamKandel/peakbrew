import { useRef, useEffect } from 'react';
import { 
  Paper,
  Button,
  Group,
  Text,
  Title,
  Stack,
  Table,
  Badge,
  Box,
  Divider,
  Grid,
  Container,
  ActionIcon,
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconDownload, 
  IconEdit, 
  IconCalendar,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin
} from '@tabler/icons-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { notifications } from '@mantine/notifications';
import { storage, db } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import Logo from './Logo';
import { COMPANY_INFO, getFullAddress, getContactLine } from '../constants/companyInfo';
  IconCalendar,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin
} from '@tabler/icons-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { notifications } from '@mantine/notifications';
import { storage, db } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export default function InvoicePreview({ invoice, onClose, onEdit }) {
  const invoiceRef = useRef();

  // Helper function to safely format dates
  const formatInvoiceDate = (dateValue, formatString = 'MMMM dd, yyyy') => {
    if (!dateValue) return 'No Date';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return format(date, formatString);
  };

  const generateAndUploadPDF = async () => {
    if (!invoice || !invoice.id || invoice.pdfURL) {
      return; // Don't run if no invoice, no ID, or PDF already exists
    }

    const notificationId = notifications.show({
      loading: true,
      title: 'Generating PDF',
      message: 'Creating and saving invoice PDF...',
      autoClose: false,
    });

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Create PDF in portrait (vertical) A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add image to PDF, handle multiple pages if needed
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Generate blob using correct jsPDF method
      const pdfBlob = pdf.output('blob');

      const pdfFileRef = storageRef(storage, `invoices/${invoice.id}/${invoice.invoiceNumber}.pdf`);
      
      await uploadBytes(pdfFileRef, pdfBlob);
      const downloadURL = await getDownloadURL(pdfFileRef);

      const invoiceDocRef = doc(db, 'invoices', invoice.id);
      await updateDoc(invoiceDocRef, { pdfURL: downloadURL });

      // Manually update the invoice object in state to prevent re-upload
      invoice.pdfURL = downloadURL;

      // Auto-download the PDF
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Success',
        message: 'Invoice PDF created and downloaded successfully!',
        loading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error generating or uploading PDF:', error);
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'Error',
        message: 'Failed to create invoice PDF',
        loading: false,
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    generateAndUploadPDF();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl" py="xl">
      {/* Header with actions */}
      <Group justify="space-between" mb="xl">
        <Group>
          <ActionIcon
            size="lg"
            variant="light"
            onClick={onClose}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Group>
            <IconBeer size={30} color="#1971c2" />
            <Box>
              <Title order={2} c="blue">
                Invoice #{invoice.invoiceNumber}
              </Title>
              <Text c="dimmed">Peak Brew Trading</Text>
            </Box>
          </Group>
        </Group>
        
        <Group>
          <Button
            variant="light"
            leftSection={<IconEdit size={16} />}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={generateAndUploadPDF}
            gradient={{ from: 'blue', to: 'cyan' }}
            variant="gradient"
          >
            Download PDF
          </Button>
        </Group>
      </Group>

      {/* Invoice Content for PDF generation */}
      <Paper
        ref={invoiceRef}
        shadow="sm"
        p={40}
        radius="md"
        style={{ 
          backgroundColor: 'white',
          maxWidth: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          fontSize: '12px',
          lineHeight: '1.4'
        }}
      >
        <Stack gap="lg">
          {/* Company Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group mb="sm">
                <IconBeer size={32} color="#1971c2" />
                <Box>
                  <Title order={2} c="blue" size="xl">Peak Brew Trading</Title>
                  <Text c="dimmed" size="sm">Premium Beer Distribution</Text>
                </Box>
              </Group>
              <Text size="xs" c="dimmed">
                Kathmandu, Nepal<br />
                Email: peakbrewtrading@gmail.com<br />
                Phone: +977-XXXXXXXXX
              </Text>
            </Box>
            
            <Box ta="right">
              <Title order={2} c="gray.8" size="lg">INVOICE</Title>
              <Text size="md" fw={600}>#{invoice.invoiceNumber}</Text>
              <Badge color={getStatusColor(invoice.status)} size="md" mt="xs">
                {invoice.status?.toUpperCase()}
              </Badge>
            </Box>
          </Group>

          <Divider />

          {/* Invoice Details and Customer Info */}
          <Grid>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <Box>
                  <Text fw={600} c="blue" mb="xs" size="sm">
                    <IconCalendar size={14} style={{ display: 'inline', marginRight: 8 }} />
                    Invoice Date:
                  </Text>
                  <Text size="sm">{formatInvoiceDate(invoice.date)}</Text>
                </Box>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Stack gap="sm">
                <Box>
                  <Text fw={600} c="blue" mb="xs" size="sm">
                    <IconUser size={14} style={{ display: 'inline', marginRight: 8 }} />
                    Bill To:
                  </Text>
                  <Text fw={500} size="sm">{invoice.customerName}</Text>
                  {invoice.customerEmail && <Text size="xs">{invoice.customerEmail}</Text>}
                  {invoice.customerPhone && <Text size="xs">{invoice.customerPhone}</Text>}
                  {invoice.customerAddress && <Text size="xs">{invoice.customerAddress}</Text>}
                </Box>
              </Stack>
            </Grid.Col>
          </Grid>

          <Divider />

          {/* Items Table */}
          <Box>
            <Text fw={600} c="blue" mb="sm" size="md">
              <IconBeer size={16} style={{ display: 'inline', marginRight: 8 }} />
              Beer Products
            </Text>
            
            <Table striped highlightOnHover fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Container</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Quantity</Table.Th>
                  <Table.Th>Unit Price</Table.Th>
                  <Table.Th>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoice.items?.map((item, index) => (
                  <Table.Tr key={index}>
                    <Table.Td fw={500}>{item.product}</Table.Td>
                    <Table.Td>{item.container}</Table.Td>
                    <Table.Td>{item.netContent}</Table.Td>
                    <Table.Td ta="center">{item.quantity}</Table.Td>
                    <Table.Td ta="right">Rs. {item.price?.toFixed(2)}</Table.Td>
                    <Table.Td ta="right" fw={500}>Rs. {item.total?.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

          {/* Totals */}
          <Group justify="flex-end">
            <Box w={250}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Subtotal:</Text>
                  <Text size="sm">Rs. {invoice.subtotal?.toFixed(2)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Tax (10%):</Text>
                  <Text size="sm">Rs. {invoice.tax?.toFixed(2)}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={700} size="md">Total:</Text>
                  <Text fw={700} size="md" c="blue">Rs. {invoice.total?.toFixed(2)}</Text>
                </Group>
              </Stack>
            </Box>
          </Group>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Divider />
              <Box>
                <Text fw={600} c="blue" mb="xs" size="sm">Notes:</Text>
                <Text size="sm">{invoice.notes}</Text>
              </Box>
            </>
          )}

          {/* Footer */}
          <Box ta="center" pt="md">
            <Text size="xs" c="dimmed">
              Thank you for your business! • Peak Brew Trading
            </Text>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
