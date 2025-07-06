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
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { notifications } from '@mantine/notifications';
import { storage, db } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import Logo from './Logo';
import { COMPANY_INFO, getFullAddress, getContactLine } from '../constants/companyInfo';
import peakBrewLogo from '../assets/peak brew.svg';

export default function InvoicePreview({ invoice, onClose, onEdit }) {
  const invoiceRef = useRef();

  // Helper function to safely format dates
  const formatInvoiceDate = (dateValue, formatString = 'MMMM dd, yyyy') => {
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
    
    return format(date, formatString);
  };

  const generateAndUploadPDF = async () => {
    if (!invoice || !invoice.id) {
      return;
    }

    const notificationId = notifications.show({
      loading: true,
      title: 'Generating PDF',
      message: 'Creating invoice PDF that matches web design...',
      autoClose: false,
    });

    try {
      // Clean text function for PDF compatibility
      const safeText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/[""]/g, '"')
          .replace(/['']/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Convert logo to PNG for PDF embedding
      const convertLogoToPng = async () => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const logoSize = 150;
          canvas.width = logoSize;
          canvas.height = logoSize;
          
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, logoSize, logoSize);
            
            const imgAspect = img.width / img.height;
            let drawWidth = logoSize;
            let drawHeight = logoSize;
            
            if (imgAspect > 1) {
              drawHeight = logoSize / imgAspect;
            } else {
              drawWidth = logoSize * imgAspect;
            }
            
            const x = (logoSize - drawWidth) / 2;
            const y = (logoSize - drawHeight) / 2;
            
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert logo'));
              }
            }, 'image/png', 1.0);
          };
          
          img.onerror = () => reject(new Error('Failed to load logo'));
          img.src = peakBrewLogo;
        });
      };

      // Create PDF document - exact match to web design
      const pdfDoc = await PDFDocument.create();
      
      // Set PDF metadata
      pdfDoc.setTitle(`Peak Brew Trading - Invoice ${invoice.invoiceNumber}`);
      pdfDoc.setAuthor('Peak Brew Trading');
      pdfDoc.setSubject(`Invoice #${invoice.invoiceNumber}`);
      pdfDoc.setCreator('Peak Brew Invoice System');
      pdfDoc.setProducer('Peak Brew Trading');
      pdfDoc.setCreationDate(new Date());
      
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Colors matching web design
      const primaryBlue = rgb(0.18, 0.42, 0.65); // #2e6aa5 - main blue
      const goldYellow = rgb(1, 0.75, 0); // #ffc000 - PENDING badge color
      const textGray = rgb(0.4, 0.4, 0.4); // #666 - subtitle text
      const textBlack = rgb(0, 0, 0); // #000 - main text
      const lightGray = rgb(0.95, 0.95, 0.95); // #f3f3f3 - light background
      const borderGray = rgb(0.87, 0.87, 0.87); // #dedede - borders
      const white = rgb(1, 1, 1);
      
      // Embed logo
      let logoImage = null;
      try {
        const logoBlob = await convertLogoToPng();
        const logoArrayBuffer = await logoBlob.arrayBuffer();
        logoImage = await pdfDoc.embedPng(logoArrayBuffer);
      } catch (error) {
        console.log('Logo embedding failed, continuing without logo:', error);
      }
      
      let currentY = height - 60;
      
      // === HEADER SECTION - Exact match to web design ===
      
      // Logo (left side)
      if (logoImage) {
        page.drawImage(logoImage, {
          x: 50,
          y: height - 110,
          width: 60,
          height: 60,
        });
      }
      
      // Company info (next to logo)
      page.drawText(safeText('Peak Brew Trading'), {
        x: 125,
        y: height - 65,
        size: 20,
        font: helveticaBoldFont,
        color: goldYellow,
      });
      
      page.drawText(safeText('Premium Beer Distribution'), {
        x: 125,
        y: height - 85,
        size: 11,
        font: helveticaFont,
        color: textGray,
      });
      
      // Company contact details
      page.drawText(safeText(getFullAddress()), {
        x: 50,
        y: height - 130,
        size: 8,
        font: helveticaFont,
        color: textGray,
      });
      
      page.drawText(safeText(COMPANY_INFO.contact.email), {
        x: 50,
        y: height - 142,
        size: 8,
        font: helveticaFont,
        color: textGray,
      });
      
      page.drawText(safeText(COMPANY_INFO.contact.phone), {
        x: 50,
        y: height - 154,
        size: 8,
        font: helveticaFont,
        color: textGray,
      });
      
      // INVOICE title and details (right side)
      page.drawText('INVOICE', {
        x: width - 150,
        y: height - 65,
        size: 18,
        font: helveticaBoldFont,
        color: textBlack,
      });
      
      page.drawText(`#${safeText(invoice.invoiceNumber)}`, {
        x: width - 150,
        y: height - 85,
        size: 12,
        font: helveticaBoldFont,
        color: textBlack,
      });
      
      // Status badge
      const statusText = safeText(invoice.status.toUpperCase());
      const statusColor = invoice.status?.toLowerCase() === 'paid' ? rgb(0.13, 0.8, 0.47) : 
                         invoice.status?.toLowerCase() === 'pending' ? goldYellow : 
                         rgb(0.8, 0.13, 0.13);
      
      // Status badge background
      page.drawRectangle({
        x: width - 150,
        y: height - 110,
        width: 60,
        height: 16,
        color: statusColor,
        borderRadius: 8,
      });
      
      page.drawText(statusText, {
        x: width - 135,
        y: height - 105,
        size: 8,
        font: helveticaBoldFont,
        color: white,
      });
      
      // Date
      page.drawText(safeText(formatInvoiceDate(invoice.date, 'MMM dd, yyyy')), {
        x: width - 150,
        y: height - 125,
        size: 9,
        font: helveticaFont,
        color: textGray,
      });
      
      currentY = height - 180;
      
      // === INVOICE DETAILS SECTION - Matching web design ===
      
      // Invoice Date (left side with icon simulation)
      page.drawText('Invoice Date:', {
        x: 50,
        y: currentY,
        size: 10,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      page.drawText(safeText(formatInvoiceDate(invoice.date)), {
        x: 50,
        y: currentY - 18,
        size: 10,
        font: helveticaFont,
        color: textBlack,
      });
      
      // Bill To (right side)
      page.drawText('Bill To:', {
        x: 300,
        y: currentY,
        size: 10,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      page.drawText(safeText(invoice.customerName), {
        x: 300,
        y: currentY - 18,
        size: 11,
        font: helveticaBoldFont,
        color: textBlack,
      });
      
      // Customer contact details
      let customerY = currentY - 35;
      
      if (invoice.customerEmail) {
        page.drawText(safeText(invoice.customerEmail), {
          x: 300,
          y: customerY,
          size: 9,
          font: helveticaFont,
          color: textGray,
        });
        customerY -= 15;
      }
      
      if (invoice.customerPhone) {
        page.drawText(safeText(invoice.customerPhone), {
          x: 300,
          y: customerY,
          size: 9,
          font: helveticaFont,
          color: textGray,
        });
        customerY -= 15;
      }
      
      if (invoice.customerAddress) {
        page.drawText(safeText(invoice.customerAddress), {
          x: 300,
          y: customerY,
          size: 9,
          font: helveticaFont,
          color: textGray,
        });
      }
      
      currentY -= 100;
      
      // === INVOICE ITEMS SECTION - Exact match to web design ===
      
      page.drawText('Invoice Items', {
        x: 50,
        y: currentY,
        size: 14,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      currentY -= 25;
      
      // Table setup matching web design exactly
      const tableStartY = currentY;
      const tableHeaders = ['Description', 'Qty', 'Price', 'Total'];
      const columnWidths = [300, 60, 80, 80]; // Adjusted to match web layout
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      
      // Table header background
      page.drawRectangle({
        x: 50,
        y: tableStartY - 25,
        width: tableWidth,
        height: 25,
        color: lightGray,
        borderColor: borderGray,
        borderWidth: 1,
      });
      
      // Table headers
      let headerX = 50;
      tableHeaders.forEach((header, index) => {
        page.drawText(header, {
          x: headerX + 8,
          y: tableStartY - 15,
          size: 10,
          font: helveticaBoldFont,
          color: textBlack,
        });
        headerX += columnWidths[index];
      });
      
      currentY = tableStartY - 30;
      
      // Table items
      let subtotalCalc = 0;
      invoice.items.forEach((item, index) => {
        const itemPrice = item.price || 0;
        const quantity = item.quantity || 0;
        const itemTotal = quantity * itemPrice;
        subtotalCalc += itemTotal;
        
        // Alternating row background (striped table like web)
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 50,
            y: currentY - 20,
            width: tableWidth,
            height: 20,
            color: rgb(0.99, 0.99, 0.99),
            borderColor: borderGray,
            borderWidth: 0.5,
          });
        } else {
          page.drawRectangle({
            x: 50,
            y: currentY - 20,
            width: tableWidth,
            height: 20,
            color: white,
            borderColor: borderGray,
            borderWidth: 0.5,
          });
        }
        
        let cellX = 50;
        
        // Description column
        const productName = safeText(item.product || item.name || '');
        const containerInfo = item.container && item.netContent ? 
          `${safeText(item.container)} (${safeText(item.netContent)})` : '';
        
        page.drawText(productName, {
          x: cellX + 8,
          y: currentY - 10,
          size: 9,
          font: helveticaBoldFont,
          color: textBlack,
        });
        
        if (containerInfo) {
          page.drawText(containerInfo, {
            x: cellX + 8,
            y: currentY - 18,
            size: 8,
            font: helveticaFont,
            color: textGray,
          });
        }
        
        cellX += columnWidths[0];
        
        // Quantity (center aligned)
        page.drawText(quantity.toString(), {
          x: cellX + (columnWidths[1] / 2) - 8,
          y: currentY - 12,
          size: 9,
          font: helveticaFont,
          color: textBlack,
        });
        cellX += columnWidths[1];
        
        // Price (right aligned)
        page.drawText(`$ ${itemPrice.toFixed(2)}`, {
          x: cellX + columnWidths[2] - 8,
          y: currentY - 12,
          size: 9,
          font: helveticaFont,
          color: textBlack,
        });
        cellX += columnWidths[2];
        
        // Total (right aligned)
        page.drawText(`$ ${itemTotal.toFixed(2)}`, {
          x: cellX + columnWidths[3] - 8,
          y: currentY - 12,
          size: 9,
          font: helveticaBoldFont,
          color: textBlack,
        });
        
        currentY -= 25; // Spacing between rows
      });
      
      // Table bottom border
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: 50 + tableWidth, y: currentY },
        color: borderGray,
        thickness: 1,
      });
      
      // Vertical table lines
      let lineX = 50;
      columnWidths.forEach((width, index) => {
        if (index < columnWidths.length - 1) {
          lineX += width;
          page.drawLine({
            start: { x: lineX, y: tableStartY },
            end: { x: lineX, y: currentY },
            color: borderGray,
            thickness: 0.5,
          });
        }
      });
      
      currentY -= 30;
      
      // === TOTALS SECTION - Exact match to web design ===
      
      const subtotal = invoice.subtotal || subtotalCalc;
      const taxRate = invoice.taxRate || 10;
      const tax = invoice.tax || (subtotal * taxRate / 100);
      const total = invoice.total || (subtotal + tax);
      
      // Position totals on the right side like web design
      const totalsX = 350;
      
      // Subtotal
      page.drawText('Subtotal:', {
        x: totalsX,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: textBlack,
      });
      
      page.drawText(`$ ${subtotal.toFixed(2)}`, {
        x: totalsX + 120,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: textBlack,
      });
      
      currentY -= 18;
      
      // Tax
      page.drawText(`Tax (${taxRate}%):`, {
        x: totalsX,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: textBlack,
      });
      
      page.drawText(`$ ${tax.toFixed(2)}`, {
        x: totalsX + 120,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: textBlack,
      });
      
      currentY -= 25;
      
      // Total (highlighted like web design)
      page.drawText('Total:', {
        x: totalsX,
        y: currentY,
        size: 12,
        font: helveticaBoldFont,
        color: textBlack,
      });
      
      page.drawText(`$ ${total.toFixed(2)}`, {
        x: totalsX + 120,
        y: currentY,
        size: 12,
        font: helveticaBoldFont,
        color: goldYellow, // Golden color like web design
      });
      
      currentY -= 50;
      
      // === FOOTER - Exact match to web design ===
      
      page.drawText('Thank you for your business! Please remit payment by the due date.', {
        x: 50,
        y: 150,
        size: 9,
        font: helveticaFont,
        color: textGray,
      });
      
      page.drawText(`${safeText(COMPANY_INFO.name)} | ${safeText(getContactLine())}`, {
        x: 50,
        y: 135,
        size: 9,
        font: helveticaFont,
        color: textGray,
      });
      
      // Generate and save PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const fileSizeKB = (pdfBlob.size / 1024).toFixed(1);
      console.log(`PDF generated: ${fileSizeKB} KB`);
      
      // Upload if needed
      if (!invoice.pdfURL) {
        const pdfStorageRef = storageRef(storage, `invoices/${invoice.id}.pdf`);
        await uploadBytes(pdfStorageRef, pdfBlob);
        const pdfURL = await getDownloadURL(pdfStorageRef);
        
        const invoiceDocRef = doc(db, 'invoices', invoice.id);
        await updateDoc(invoiceDocRef, { pdfURL });
      }

      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'PDF Generated Successfully',
        message: `Invoice PDF created matching web design! (${fileSizeKB} KB)`,
        loading: false,
        autoClose: 3000,
      });

      // Download the PDF
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      link.click();

      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error generating PDF:', error);
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'Error',
        message: 'Failed to generate PDF. Please try again.',
        loading: false,
        autoClose: 3000,
      });
    }
  };

  const downloadExistingPDF = async () => {
    if (!invoice.pdfURL) return;
    
    try {
      // Use a different approach to avoid CORS issues
      const link = document.createElement('a');
      link.href = invoice.pdfURL;
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      link.target = '_blank'; // Open in new tab to bypass CORS
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notifications.show({
        title: 'Download Started',
        message: 'PDF download initiated in new tab.',
        color: 'blue',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to download PDF. Opening in new tab instead.',
        color: 'orange',
      });
      // Fallback: open in new tab
      window.open(invoice.pdfURL, '_blank');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'overdue':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="xl" py="xl">
      {/* Action Buttons - Hidden in PDF */}
      <Group justify="space-between" mb="xl" className="skip-pdf">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="light"
          onClick={onClose}
          className="skip-pdf"
        >
          Back to Dashboard
        </Button>
        
        <Group className="skip-pdf">
          <Button
            leftSection={<IconEdit size={16} />}
            variant="light"
            color="orange"
            onClick={onEdit}
            className="skip-pdf"
          >
            Edit Invoice
          </Button>
          
          {invoice.pdfURL ? (
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={downloadExistingPDF}
              color="green"
            >
              Download PDF
            </Button>
          ) : (
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={generateAndUploadPDF}
              color="blue"
            >
              Generate PDF
            </Button>
          )}
        </Group>
      </Group>

      {/* Invoice Content - High-quality PDF optimized for both visual appeal and small size */}
      <Paper
        ref={invoiceRef}
        shadow="md"
        p={30} // Increased padding for better visual appeal
        radius="md"
        style={{ 
          backgroundColor: 'white',
          maxWidth: '210mm', // A4 width
          minHeight: '297mm', // A4 height
          margin: '0 auto',
          fontSize: '14px', // Larger, more readable font
          lineHeight: '1.5',
          fontFamily: 'Inter, Arial, sans-serif', // High-quality font
          border: '1px solid #e9ecef',
        }}
      >
        <Stack gap="lg"> {/* Good spacing for readability */}
          {/* Company Header with Logo - Enlarged and prominent */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group mb="md" gap="md">
                <Logo size={80} style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }} /> {/* Even larger logo */}
                <Box>
                  <Title order={2} style={{ color: COMPANY_INFO.colors.primary, fontSize: '18px', fontWeight: 700 }}>
                    {COMPANY_INFO.name}
                  </Title>
                  <Text c="dimmed" style={{ fontSize: '12px', fontWeight: 500 }}>{COMPANY_INFO.tagline}</Text>
                </Box>
              </Group>
              <Text style={{ fontSize: '10px', lineHeight: 1.4 }} c="dimmed">
                <IconMapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                {getFullAddress()}<br />
                <IconMail size={12} style={{ display: 'inline', marginRight: 4 }} />
                {COMPANY_INFO.contact.email}<br />
                <IconPhone size={12} style={{ display: 'inline', marginRight: 4 }} />
                {COMPANY_INFO.contact.phone}
              </Text>
            </Box>
            
            <Box ta="right">
              <Title order={2} c="gray.8" size="lg">INVOICE</Title>
              <Text size="md" fw={600}>#{invoice.invoiceNumber}</Text>
              <Badge color={getStatusColor(invoice.status)} size="md" mt="xs">
                {(invoice.status || 'pending').toUpperCase()}
              </Badge>
            </Box>
          </Group>

          <Divider />

          {/* Invoice Details and Customer Info */}
          <Grid>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <Box>
                  <Text fw={600} style={{ color: COMPANY_INFO.colors.accent }} mb="xs" size="sm">
                    <IconCalendar size={14} style={{ display: 'inline', marginRight: 8 }} />
                    Invoice Date:
                  </Text>
                  <Text size="sm">{formatInvoiceDate(invoice.date)}</Text>
                </Box>
                
                {invoice.dueDate && (
                  <Box>
                    <Text fw={600} style={{ color: COMPANY_INFO.colors.accent }} mb="xs" size="sm">
                      <IconCalendar size={14} style={{ display: 'inline', marginRight: 8 }} />
                      Due Date:
                    </Text>
                    <Text size="sm">{formatInvoiceDate(invoice.dueDate)}</Text>
                  </Box>
                )}
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Box>
                <Text fw={600} style={{ color: COMPANY_INFO.colors.accent }} mb="xs" size="sm">
                  <IconUser size={14} style={{ display: 'inline', marginRight: 8 }} />
                  Bill To:
                </Text>
                <Text fw={600} size="sm">{invoice.customerName}</Text>
                {invoice.customerEmail && (
                  <Text size="xs" c="dimmed">
                    <IconMail size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {invoice.customerEmail}
                  </Text>
                )}
                {invoice.customerPhone && (
                  <Text size="xs" c="dimmed">
                    <IconPhone size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {invoice.customerPhone}
                  </Text>
                )}
                {invoice.customerAddress && (
                  <Text size="xs" c="dimmed" mt="xs">
                    <IconMapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {invoice.customerAddress}
                  </Text>
                )}
              </Box>
            </Grid.Col>
          </Grid>

          <Divider />

          {/* Items Table - Enhanced for better visual quality */}
          <Box>
            <Title order={4} mb="md" style={{ color: COMPANY_INFO.colors.accent, fontSize: '16px', fontWeight: 600 }}>
              Invoice Items
            </Title>
            <Table striped withTableBorder style={{ fontSize: '12px', borderWidth: '1px' }}>
              <Table.Thead>
                <Table.Tr style={{ backgroundColor: '#f8f9fa' }}>
                  <Table.Th style={{ fontWeight: 700, fontSize: '12px', padding: '12px 8px' }}>Description</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: '12px', textAlign: 'center', padding: '12px 8px' }}>Qty</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: '12px', textAlign: 'right', padding: '12px 8px' }}>Price</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: '12px', textAlign: 'right', padding: '12px 8px' }}>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoice.items?.map((item, index) => (
                  <Table.Tr key={index}>
                    <Table.Td style={{ fontSize: '11px', padding: '10px 8px' }}>
                      <Text fw={500} size="11px">{item.product || item.name}</Text>
                      {item.description && (
                        <Text size="10px" c="dimmed">{item.description}</Text>
                      )}
                      {item.container && (
                        <Text size="9px" c="dimmed">{item.container} ({item.netContent})</Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ fontSize: '11px', textAlign: 'center', padding: '10px 8px' }}>
                      {item.quantity}
                    </Table.Td>
                    <Table.Td style={{ fontSize: '11px', textAlign: 'right', padding: '10px 8px' }}>
                      $ {item.price?.toFixed(2)}
                    </Table.Td>
                    <Table.Td style={{ fontSize: '11px', textAlign: 'right', fontWeight: 600, padding: '10px 8px' }}>
                      $ {(item.quantity * item.price)?.toFixed(2)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

          {/* Totals */}
          <Box>
            <Grid>
              <Grid.Col span={8}></Grid.Col>
              <Grid.Col span={4}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Subtotal:</Text>
                    <Text size="sm">$ {invoice.subtotal?.toFixed(2) || '0.00'}</Text>
                  </Group>
                  
                  {invoice.tax > 0 && (
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>Tax ({invoice.taxRate || 0}%):</Text>
                      <Text size="sm">$ {invoice.tax?.toFixed(2) || '0.00'}</Text>
                    </Group>
                  )}
                  
                  {invoice.discount > 0 && (
                    <Group justify="space-between">
                      <Text size="sm" fw={500} c="green">Discount:</Text>
                      <Text size="sm" c="green">-$ {invoice.discount?.toFixed(2) || '0.00'}</Text>
                    </Group>
                  )}
                  
                  <Divider />
                  
                  <Group justify="space-between">
                    <Text fw={700} size="md">Total:</Text>
                    <Text fw={700} size="md" style={{ color: COMPANY_INFO.colors.primary }}>
                      $ {invoice.total?.toFixed(2) || '0.00'}
                    </Text>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          </Box>

          {/* Notes */}
          {invoice.notes && (
            <Box>
              <Text fw={600} style={{ color: COMPANY_INFO.colors.accent }} mb="xs" size="sm">
                Notes:
              </Text>
              <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                {invoice.notes}
              </Text>
            </Box>
          )}

          {/* Footer */}
          <Box mt="xl" pt="md" style={{ borderTop: '1px solid #e9ecef' }}>
            <Text ta="center" size="xs" c="dimmed">
              Thank you for your business! Please remit payment by the due date.
            </Text>
            <Text ta="center" size="xs" c="dimmed" mt="xs">
              {COMPANY_INFO.name} | {getContactLine()}
            </Text>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
