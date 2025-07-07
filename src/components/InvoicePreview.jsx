import { useRef } from 'react';
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
import logoSvgSrc from '../assets/peak brew.svg';

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

  const generateAndUploadPDF = async (forceRegenerate = false) => {
    if (!invoice || !invoice.id) {
      return;
    }

    const notificationId = notifications.show({
      loading: true,
      title: 'Generating Professional PDF',
      message: 'Creating updated invoice PDF with latest information...',
      autoClose: false,
    });

    try {
      // Force regeneration if invoice was recently edited or explicitly requested
      const shouldForceRegenerate = forceRegenerate || 
        (invoice.updatedAt && new Date() - new Date(invoice.updatedAt.toDate ? invoice.updatedAt.toDate() : invoice.updatedAt) < 60000); // Within last minute
      
      // Always regenerate PDF to ensure latest data
      console.log('Generating fresh PDF with current invoice data');
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
          img.src = logoSvgSrc;
        });
      };

      // Create modern PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Set PDF metadata
      pdfDoc.setTitle(`Peak Brew Trading - Invoice ${invoice.invoiceNumber}`);
      pdfDoc.setAuthor('Peak Brew Trading');
      pdfDoc.setSubject(`Invoice #${invoice.invoiceNumber}`);
      pdfDoc.setCreator('Peak Brew Invoice Management System');
      pdfDoc.setProducer('Peak Brew Trading');
      pdfDoc.setCreationDate(new Date());
      
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Modern color palette
      const primaryBlue = rgb(0.2, 0.4, 0.7); // #3366B3
      const accentGold = rgb(0.83, 0.69, 0.22); // #D4AF37
      const darkText = rgb(0.1, 0.1, 0.1); // #1A1A1A
      const lightText = rgb(0.4, 0.4, 0.4); // #666666
      const borderGray = rgb(0.9, 0.9, 0.9); // #E6E6E6
      const lightBg = rgb(0.98, 0.98, 0.98); // #FAFAFA
      const white = rgb(1, 1, 1);
      const statusGreen = rgb(0.15, 0.7, 0.15); // #26B226
      const statusOrange = rgb(0.95, 0.6, 0.1); // #F39C1F
      const statusRed = rgb(0.8, 0.2, 0.2); // #CC3333
      
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
      
      // === CLEAN HEADER SECTION ===
      
      // Company logo and name
      if (logoImage) {
        page.drawImage(logoImage, {
          x: 50,
          y: height - 100,
          width: 60,
          height: 60,
        });
      }
      
      // Company name
      page.drawText('PEAK BREW TRADING', {
        x: 125,
        y: height - 65,
        size: 24,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      // Company subtitle
      page.drawText('Premium Beer Distribution', {
        x: 125,
        y: height - 85,
        size: 11,
        font: helveticaFont,
        color: lightText,
      });
      
      // Company contact info with proper spacing across multiple lines
      page.drawText('7840 Tyler Blvd, Unit 6201', {
        x: 125,
        y: height - 95,
        size: 9,
        font: helveticaFont,
        color: lightText,
      });
      
      page.drawText('Mentor, OH 44060, USA', {
        x: 125,
        y: height - 105,
        size: 9,
        font: helveticaFont,
        color: lightText,
      });
      
      page.drawText('Phone: +1 412-894-6129', {
        x: 125,
        y: height - 115,
        size: 9,
        font: helveticaFont,
        color: lightText,
      });
      
      page.drawText('Email: peakbrewtrading@gmail.com', {
        x: 125,
        y: height - 125,
        size: 9,
        font: helveticaFont,
        color: lightText,
      });
      
      // Invoice title and number - right side
      page.drawText('INVOICE', {
        x: width - 150,
        y: height - 65,
        size: 28,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      page.drawText(`#${safeText(invoice.invoiceNumber)}`, {
        x: width - 150,
        y: height - 90,
        size: 12,
        font: helveticaBoldFont,
        color: darkText,
      });
      
      // Status badge
      const statusText = safeText(invoice.status.toUpperCase());
      const statusColor = invoice.status?.toLowerCase() === 'paid' ? statusGreen : 
                         invoice.status?.toLowerCase() === 'pending' ? statusOrange : 
                         statusRed;
      
      page.drawRectangle({
        x: width - 150,
        y: height - 115,
        width: 80,
        height: 20,
        color: statusColor,
        borderRadius: 10,
      });
      
      page.drawText(statusText, {
        x: width - 140,
        y: height - 108,
        size: 10,
        font: helveticaBoldFont,
        color: white,
      });
      
      currentY = height - 150;
      
      // === CLEAN INVOICE DETAILS SECTION ===
      
      // Draw a light separator line
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: width - 50, y: currentY },
        thickness: 1,
        color: borderGray,
      });
      
      currentY -= 30;
      
      // Invoice and customer information in clean boxes
      const boxWidth = (width - 130) / 2; // Two equal columns with spacing
      
      // Left box - Invoice Information
      page.drawRectangle({
        x: 50,
        y: currentY - 80,
        width: boxWidth,
        height: 80,
        color: lightBg,
        borderColor: borderGray,
        borderWidth: 1,
        borderRadius: 4,
      });
      
      page.drawText('Invoice Information', {
        x: 60,
        y: currentY - 20,
        size: 12,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      page.drawText(`Date: ${safeText(formatInvoiceDate(invoice.date))}`, {
        x: 60,
        y: currentY - 40,
        size: 10,
        font: helveticaFont,
        color: darkText,
      });
      
      page.drawText(`Invoice ID: ${safeText(invoice.invoiceNumber)}`, {
        x: 60,
        y: currentY - 55,
        size: 10,
        font: helveticaFont,
        color: darkText,
      });
      
      page.drawText(`Permit: ${safeText(invoice.permitNumber || '06756556-1')}`, {
        x: 60,
        y: currentY - 70,
        size: 10,
        font: helveticaFont,
        color: darkText,
      });
      
      // Right box - Customer Information
      const rightBoxX = 80 + boxWidth;
      page.drawRectangle({
        x: rightBoxX,
        y: currentY - 80,
        width: boxWidth,
        height: 80,
        color: lightBg,
        borderColor: borderGray,
        borderWidth: 1,
        borderRadius: 4,
      });
      
      page.drawText('Bill To', {
        x: rightBoxX + 10,
        y: currentY - 20,
        size: 12,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      const customerName = safeText(invoice.customerName);
      page.drawText(customerName.length > 30 ? customerName.substring(0, 30) + '...' : customerName, {
        x: rightBoxX + 10,
        y: currentY - 40,
        size: 11,
        font: helveticaBoldFont,
        color: darkText,
      });
      
      if (invoice.customerEmail) {
        const email = safeText(invoice.customerEmail);
        page.drawText(email.length > 35 ? email.substring(0, 35) + '...' : email, {
          x: rightBoxX + 10,
          y: currentY - 55,
          size: 9,
          font: helveticaFont,
          color: lightText,
        });
      }
      
      if (invoice.customerPhone) {
        page.drawText(safeText(invoice.customerPhone), {
          x: rightBoxX + 10,
          y: currentY - 70,
          size: 9,
          font: helveticaFont,
          color: lightText,
        });
      }
      
      currentY -= 110;
      
      // === MODERN ITEMS TABLE ===
      
      // Table header
      page.drawText('Items', {
        x: 50,
        y: currentY,
        size: 16,
        font: helveticaBoldFont,
        color: primaryBlue,
      });
      
      currentY -= 30;
      
      // Table setup with clean design
      const tableY = currentY;
      const tableHeight = 25;
      const rowHeight = 30;
      
      // Define columns with precise positioning
      const tableColumns = [
        { label: 'Description', x: 50, width: 250, align: 'left' },
        { label: 'Qty', x: 310, width: 50, align: 'center' },
        { label: 'Unit Price', x: 370, width: 80, align: 'right' },
        { label: 'Total', x: 460, width: 85, align: 'right' }
      ];
      
      const tableWidth = 495;
      
      // Table header background
      page.drawRectangle({
        x: 50,
        y: tableY - tableHeight,
        width: tableWidth,
        height: tableHeight,
        color: primaryBlue,
      });
      
      // Header text
      tableColumns.forEach(col => {
        let textX = col.x + 10;
        if (col.align === 'center') textX = col.x + col.width / 2 - (col.label.length * 3);
        if (col.align === 'right') textX = col.x + col.width - 10 - (col.label.length * 6);
        
        page.drawText(col.label, {
          x: textX,
          y: tableY - 16,
          size: 11,
          font: helveticaBoldFont,
          color: white,
        });
      });
      
      currentY = tableY - tableHeight;
      
      // Table rows
      let subtotalCalc = 0;
      
      invoice.items.forEach((item, index) => {
        const itemPrice = item.price || 0;
        const quantity = item.quantity || 0;
        const itemTotal = quantity * itemPrice;
        subtotalCalc += itemTotal;
        
        // Row background (alternating colors)
        const rowBg = index % 2 === 0 ? white : lightBg;
        
        page.drawRectangle({
          x: 50,
          y: currentY - rowHeight,
          width: tableWidth,
          height: rowHeight,
          color: rowBg,
          borderColor: borderGray,
          borderWidth: 0.5,
        });
        
        // Product description
        const productName = safeText(item.product || item.name || '');
        const containerInfo = item.container && item.netContent ? 
          `${safeText(item.container)} (${safeText(item.netContent)})` : '';
        
        const maxProductChars = 35;
        const displayName = productName.length > maxProductChars ? 
          productName.substring(0, maxProductChars) + '...' : productName;
        
        page.drawText(displayName, {
          x: 60,
          y: currentY - 12,
          size: 10,
          font: helveticaBoldFont,
          color: darkText,
        });
        
        if (containerInfo) {
          const maxContainerChars = 40;
          const displayContainer = containerInfo.length > maxContainerChars ? 
            containerInfo.substring(0, maxContainerChars) + '...' : containerInfo;
          
          page.drawText(displayContainer, {
            x: 60,
            y: currentY - 24,
            size: 8,
            font: helveticaFont,
            color: lightText,
          });
        }
        
        // Quantity (centered)
        const qtyText = quantity.toString();
        page.drawText(qtyText, {
          x: 335 - (qtyText.length * 3),
          y: currentY - 18,
          size: 10,
          font: helveticaFont,
          color: darkText,
        });
        
        // Unit Price (right aligned)
        const priceText = `$${itemPrice.toFixed(2)}`;
        page.drawText(priceText, {
          x: 440 - (priceText.length * 6),
          y: currentY - 18,
          size: 10,
          font: helveticaFont,
          color: darkText,
        });
        
        // Total (right aligned, bold)
        const totalText = `$${itemTotal.toFixed(2)}`;
        page.drawText(totalText, {
          x: 535 - (totalText.length * 6),
          y: currentY - 18,
          size: 10,
          font: helveticaBoldFont,
          color: primaryBlue,
        });
        
        currentY -= rowHeight;
      });
      
      // Table bottom line
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: 545, y: currentY },
        thickness: 2,
        color: primaryBlue,
      });
      
      currentY -= 40;
      
      // === CLEAN TOTALS SECTION ===
      
      const subtotal = invoice.subtotal || subtotalCalc;
      const total = invoice.total || subtotal;
      
      // Total box
      const totalBoxWidth = 180;
      const totalBoxHeight = 50;
      const totalBoxX = width - totalBoxWidth - 50;
      
      page.drawRectangle({
        x: totalBoxX,
        y: currentY - totalBoxHeight,
        width: totalBoxWidth,
        height: totalBoxHeight,
        color: primaryBlue,
        borderRadius: 4,
      });
      
      page.drawText('TOTAL AMOUNT', {
        x: totalBoxX + 15,
        y: currentY - 20,
        size: 12,
        font: helveticaBoldFont,
        color: white,
      });
      
      const totalAmountText = `$${total.toFixed(2)}`;
      page.drawText(totalAmountText, {
        x: totalBoxX + 15,
        y: currentY - 38,
        size: 18,
        font: helveticaBoldFont,
        color: accentGold,
      });
      
      currentY -= 80;
      
      // === FOOTER SECTION ===
      
      // Professional message based on payment status
      const isInvoicePaid = invoice.status?.toLowerCase() === 'paid';
      
      if (isInvoicePaid) {
        page.drawText('Payment Confirmation', {
          x: 50,
          y: currentY,
          size: 12,
          font: helveticaBoldFont,
          color: statusGreen,
        });
        
        currentY -= 20;
        
        page.drawText('We acknowledge receipt of your payment for this invoice. Your account has been credited', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: darkText,
        });
        
        currentY -= 12;
        
        page.drawText('and this transaction is now complete. We appreciate your business with Peak Brew Trading.', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: darkText,
        });
        
        currentY -= 18;
        
        page.drawText('Should you require any assistance or have questions regarding this invoice,', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: lightText,
        });
        
        currentY -= 12;
        
        page.drawText('please do not hesitate to contact our customer service team.', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: lightText,
        });
      } else {
        page.drawText('Payment Terms & Instructions', {
          x: 50,
          y: currentY,
          size: 12,
          font: helveticaBoldFont,
          color: primaryBlue,
        });
        
        currentY -= 20;
        
        page.drawText('Payment for this invoice is due within 30 days of the invoice date. Please ensure', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: darkText,
        });
        
        currentY -= 12;
        
        page.drawText('timely payment to maintain your account in good standing and avoid service interruptions.', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: darkText,
        });
        
        currentY -= 18;
        
        page.drawText('For payment inquiries, account questions, or to discuss payment arrangements,', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: lightText,
        });
        
        currentY -= 12;
        
        page.drawText('please contact our accounts receivable department immediately.', {
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color: lightText,
        });
      }
      
      currentY -= 30;
      
      // Footer line
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: width - 50, y: currentY },
        thickness: 1,
        color: borderGray,
      });
      
      currentY -= 15;
      
      // Company footer info with generation timestamp
      page.drawText(`${COMPANY_INFO.name} | Professional Invoice System`, {
        x: 50,
        y: currentY,
        size: 8,
        font: helveticaFont,
        color: lightText,
      });
      
      const generationTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      page.drawText(`Generated: ${generationTime}`, {
        x: width - 150,
        y: currentY,
        size: 8,
        font: helveticaFont,
        color: lightText,
      });
      
      // Generate and save PDF with current timestamp to ensure freshness
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const fileSizeKB = (pdfBlob.size / 1024).toFixed(1);
      console.log(`Fresh PDF generated: ${fileSizeKB} KB with latest invoice data`);
      
      // Always upload new PDF to ensure latest data is stored
      const timestamp = new Date().getTime();
      const pdfStorageRef = storageRef(storage, `invoices/${invoice.id}_${timestamp}.pdf`);
      await uploadBytes(pdfStorageRef, pdfBlob);
      const pdfURL = await getDownloadURL(pdfStorageRef);
      
      // Update invoice with new PDF URL
      const invoiceDocRef = doc(db, 'invoices', invoice.id);
      await updateDoc(invoiceDocRef, { 
        pdfURL,
        pdfGeneratedAt: new Date(),
        lastModified: new Date()
      });

      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'PDF Generated Successfully',
        message: `Updated invoice PDF created! (${fileSizeKB} KB)`,
        loading: false,
        autoClose: 3000,
      });

      // Download the fresh PDF with unique filename
      const downloadFilename = `Invoice-${invoice.invoiceNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = downloadFilename;
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      padding: '20px'
    }}>
      <Container size="xl" py="xl">
        {/* Action Buttons - Hidden in PDF */}
        <Paper p="md" mb="xl" className="skip-pdf" style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '12px'
        }}>
          <Group justify="space-between" className="skip-pdf">
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={onClose}
              className="skip-pdf"
              style={{
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                color: '#9ca3af',
                border: '1px solid rgba(156, 163, 175, 0.2)'
              }}
            >
              Back to Dashboard
            </Button>
            
            <Group className="skip-pdf">
              <Button
                leftSection={<IconEdit size={16} />}
                variant="light"
                onClick={onEdit}
                className="skip-pdf"
                style={{
                  backgroundColor: 'rgba(251, 146, 60, 0.1)',
                  color: '#fb923c',
                  border: '1px solid rgba(251, 146, 60, 0.2)'
                }}
              >
                Edit Invoice
              </Button>
              
              {invoice.pdfURL ? (
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={downloadExistingPDF}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #14f195 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  Download PDF
                </Button>              ) : (
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={() => generateAndUploadPDF(true)} // Force regeneration
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  Generate PDF
                </Button>
              )}
            </Group>
          </Group>
        </Paper>        {/* Invoice Content - Redesigned with Dark Theme */}
        <Paper
          ref={invoiceRef}
          shadow="xl"
          p={40}
          radius="xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            maxWidth: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: 'Inter, Arial, sans-serif',
            color: '#ffffff'
          }}
        >
        <Stack gap="lg"> {/* Good spacing for readability */}
          {/* Company Header with Logo - Enlarged and prominent */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group mb="md" gap="md">
                <Logo size={160} style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.3))' }} /> {/* Much larger logo */}
                <Box>
                  <Title order={2} style={{ color: '#d4af37', fontSize: '18px', fontWeight: 700 }}>
                    {COMPANY_INFO.name}
                  </Title>
                  <Text style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>{COMPANY_INFO.tagline}</Text>
                </Box>
              </Group>
              <Text style={{ fontSize: '10px', lineHeight: 1.4, color: '#a1a1aa' }}>
                <IconMapPin size={12} style={{ display: 'inline', marginRight: 4, color: '#d4af37' }} />
                {getFullAddress()}<br />
                <IconMail size={12} style={{ display: 'inline', marginRight: 4, color: '#d4af37' }} />
                {COMPANY_INFO.contact.email}<br />
                <IconPhone size={12} style={{ display: 'inline', marginRight: 4, color: '#d4af37' }} />
                {COMPANY_INFO.contact.phone}
              </Text>
            </Box>
            
            <Box ta="right">
              <Title order={2} style={{ color: '#ffffff', fontSize: 'lg' }}>INVOICE</Title>
              <Text size="md" fw={600} style={{ color: '#d4af37' }}>#{invoice.invoiceNumber}</Text>
              <Badge color={getStatusColor(invoice.status)} size="md" mt="xs">
                {(invoice.status || 'pending').toUpperCase()}
              </Badge>
            </Box>
          </Group>

          <Divider style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} />

          {/* Invoice Details and Customer Info */}
          <Grid>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <Box>
                  <Text fw={600} style={{ color: '#d4af37' }} mb="xs" size="sm">
                    <IconCalendar size={14} style={{ display: 'inline', marginRight: 8, color: '#d4af37' }} />
                    Invoice Date:
                  </Text>
                  <Text size="sm" style={{ color: '#ffffff' }}>{formatInvoiceDate(invoice.date)}</Text>
                </Box>
                
                <Box>
                  <Text fw={600} style={{ color: '#d4af37' }} mb="xs" size="sm">
                    Permit Number:
                  </Text>
                  <Text size="sm" style={{ color: '#ffffff' }}>{invoice.permitNumber || '06756556-1'}</Text>
                </Box>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Box>
                <Text fw={600} style={{ color: '#d4af37' }} mb="xs" size="sm">
                  <IconUser size={14} style={{ display: 'inline', marginRight: 8, color: '#d4af37' }} />
                  Bill To:
                </Text>
                <Text fw={600} size="sm" style={{ color: '#ffffff' }}>{invoice.customerName}</Text>
                {invoice.customerEmail && (
                  <Text size="xs" style={{ color: '#a1a1aa' }}>
                    <IconMail size={12} style={{ display: 'inline', marginRight: 4, color: '#d4af37' }} />
                    {invoice.customerEmail}
                  </Text>
                )}
                {invoice.customerPhone && (
                  <Text size="xs" style={{ color: '#a1a1aa' }}>
                    <IconPhone size={12} style={{ display: 'inline', marginRight: 4, color: '#d4af37' }} />
                    {invoice.customerPhone}
                  </Text>
                )}
                {invoice.customerAddress && (
                  <Text size="xs" style={{ color: '#a1a1aa' }} mt="xs">
                    <IconMapPin size={12} style={{ display: 'inline', marginRight: 4, color: '#d4af37' }} />
                    {invoice.customerAddress}
                  </Text>
                )}
              </Box>
            </Grid.Col>
          </Grid>

          <Divider style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} />

          {/* Items Table - Enhanced for perfect alignment and visibility */}
          <Box>
            <Title order={4} mb="md" style={{ color: '#d4af37', fontSize: '16px', fontWeight: 600 }}>
              Invoice Items
            </Title>
            <Table 
              striped 
              withTableBorder 
              className="invoice-table-enhanced"
              style={{ 
                fontSize: '13px', 
                borderWidth: '2px', 
                borderColor: 'rgba(212, 175, 55, 0.4)', 
                tableLayout: 'fixed', 
                width: '100%',
                backgroundColor: 'rgba(26, 19, 16, 0.8)', // Darker background for better contrast
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <Table.Thead>
                <Table.Tr style={{ 
                  backgroundColor: 'rgba(212, 175, 55, 0.15)', 
                  borderBottom: '2px solid rgba(212, 175, 55, 0.5)' 
                }}>
                  <Table.Th style={{ 
                    fontWeight: 700, 
                    fontSize: '14px', 
                    padding: '16px 12px', 
                    width: '45%', 
                    color: '#d4af37',
                    textAlign: 'left',
                    verticalAlign: 'middle'
                  }}>
                    Product Description
                  </Table.Th>
                  <Table.Th style={{ 
                    fontWeight: 700, 
                    fontSize: '14px', 
                    textAlign: 'center', 
                    padding: '16px 12px', 
                    width: '12%', 
                    color: '#d4af37',
                    verticalAlign: 'middle'
                  }}>
                    Qty
                  </Table.Th>
                  <Table.Th style={{ 
                    fontWeight: 700, 
                    fontSize: '14px', 
                    textAlign: 'right', 
                    padding: '16px 12px', 
                    width: '21.5%', 
                    color: '#d4af37',
                    verticalAlign: 'middle'
                  }}>
                    Unit Price
                  </Table.Th>
                  <Table.Th style={{ 
                    fontWeight: 700, 
                    fontSize: '14px', 
                    textAlign: 'right', 
                    padding: '16px 12px', 
                    width: '21.5%', 
                    color: '#d4af37',
                    verticalAlign: 'middle'
                  }}>
                    Total Amount
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoice.items?.map((item, index) => (
                  <Table.Tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                      backgroundColor: index % 2 === 0 ? 'rgba(26, 19, 16, 0.6)' : 'rgba(26, 19, 16, 0.8)'
                    }}
                  >
                    <Table.Td style={{ 
                      fontSize: '13px', 
                      padding: '14px 12px', 
                      verticalAlign: 'top', 
                      width: '45%', 
                      wordWrap: 'break-word',
                      textAlign: 'left'
                    }}>
                      <Text fw={600} size="14px" style={{ 
                        marginBottom: '4px', 
                        lineHeight: 1.3, 
                        color: '#ffffff',
                        fontWeight: 700
                      }}>
                        {item.product || item.name || 'Unknown Product'}
                      </Text>
                      {(item.container || item.netContent) && (
                        <Text size="11px" style={{ 
                          marginBottom: '2px', 
                          lineHeight: 1.2, 
                          color: '#d4af37',
                          fontWeight: 500
                        }}>
                          {item.container && item.netContent ? `${item.container} (${item.netContent})` : (item.container || item.netContent)}
                        </Text>
                      )}
                      {item.description && (
                        <Text size="10px" style={{ 
                          fontStyle: 'italic', 
                          lineHeight: 1.2, 
                          color: '#a1a1aa' 
                        }}>
                          {item.description}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ 
                      fontSize: '14px', 
                      textAlign: 'center', 
                      padding: '14px 12px', 
                      verticalAlign: 'middle', 
                      fontWeight: 600, 
                      width: '12%', 
                      color: '#ffffff'
                    }}>
                      {item.quantity}
                    </Table.Td>
                    <Table.Td style={{ 
                      fontSize: '14px', 
                      textAlign: 'right', 
                      padding: '14px 12px', 
                      verticalAlign: 'middle', 
                      fontWeight: 500, 
                      width: '21.5%', 
                      color: '#ffffff'
                    }}>
                      $ {item.price?.toFixed(2)}
                    </Table.Td>
                    <Table.Td style={{ 
                      fontSize: '14px', 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      padding: '14px 12px', 
                      verticalAlign: 'middle', 
                      color: '#d4af37', 
                      width: '21.5%'
                    }}>
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
                    <Text fw={700} size="md" style={{ color: '#ffffff' }}>Total:</Text>
                    <Text fw={700} size="md" style={{ color: '#d4af37' }}>
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
              <Text fw={600} style={{ color: '#d4af37' }} mb="xs" size="sm">
                Notes:
              </Text>
              <Text size="xs" style={{ whiteSpace: 'pre-wrap', color: '#ffffff' }}>
                {invoice.notes}
              </Text>
            </Box>
          )}

          {/* Footer */}
          <Box mt="xl" pt="md" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Text ta="center" size="xs" style={{ color: '#a1a1aa' }}>
              Thank you for your business! Please remit payment by the due date.
            </Text>
            <Text ta="center" size="xs" style={{ color: '#a1a1aa' }} mt="xs">
              {COMPANY_INFO.name} | {getContactLine()}
            </Text>
          </Box>
        </Stack>
      </Paper>
    </Container>
    </div>
  );
}
