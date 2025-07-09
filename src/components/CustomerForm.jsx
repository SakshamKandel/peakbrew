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
  Title,
  Divider,
  ActionIcon,
  Alert,
  Card,
  Text,
  Avatar,
  Box,
  Flex
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconArrowLeft,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconUserPlus,
  IconEdit
} from '@tabler/icons-react';
// Form handling with standard React state
import { notifications } from '@mantine/notifications';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';

const CustomerForm = ({ customer = null, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    // Personal Information (Essential Only)
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    
    // Business Information (Comprehensive)
    businessName: customer?.businessName || '',
    businessAddress: customer?.businessAddress || '',
    businessCity: customer?.businessCity || '',
    businessState: customer?.businessState || '',
    businessZipCode: customer?.businessZipCode || '',
    businessCountry: customer?.businessCountry || 'United States',
    permitNumber: customer?.permitNumber || '',
    businessLicense: customer?.businessLicense || '',
    taxId: customer?.taxId || '',
    website: customer?.website || '',
    industry: customer?.industry || '',
    businessType: customer?.businessType || '',
    establishedYear: customer?.establishedYear || '',
    numberOfEmployees: customer?.numberOfEmployees || '',
    annualRevenue: customer?.annualRevenue || '',
    
    // Business Contact Details
    businessPhone: customer?.businessPhone || '',
    businessEmail: customer?.businessEmail || '',
    fax: customer?.fax || '',
    contactPerson: customer?.contactPerson || '',
    contactTitle: customer?.contactTitle || '',
    alternateContact: customer?.alternateContact || '',
    alternateContactPhone: customer?.alternateContactPhone || '',
    
    // Business Terms & Financial
    customerType: customer?.customerType || 'regular',
    status: customer?.status || 'active',
    bankName: customer?.bankName || '',
    accountNumber: customer?.accountNumber || '',
    routingNumber: customer?.routingNumber || '',
    
    // Additional Business Information
    referralSource: customer?.referralSource || '',
    notes: customer?.notes || '',
    specialInstructions: customer?.specialInstructions || '',
    preferredDeliveryMethod: customer?.preferredDeliveryMethod || ''
  });

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        return !value ? 'Name is required' : null;
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Please enter a valid email';
      case 'phone':
        if (!value) return 'Phone is required';
        const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(value) ? null : 'Please enter a valid phone number';
      case 'businessEmail':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) ? null : 'Please enter a valid business email';
        }
        return null;
      case 'annualRevenue':
        if (value && (isNaN(value) || value < 0)) return 'Annual revenue must be a positive number';
        return null;
      case 'establishedYear':
        if (value && (isNaN(value) || value < 1800 || value > new Date().getFullYear())) {
          return 'Please enter a valid year';
        }
        return null;
      case 'website':
        if (value && !value.startsWith('http')) return 'Website must start with http:// or https://';
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Update form data when customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData({
        // Personal Information (Essential Only)
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        
        // Business Information (Comprehensive)
        businessName: customer.businessName || '',
        businessAddress: customer.businessAddress || '',
        businessCity: customer.businessCity || '',
        businessState: customer.businessState || '',
        businessZipCode: customer.businessZipCode || '',
        businessCountry: customer.businessCountry || 'United States',
        permitNumber: customer.permitNumber || '',
        businessLicense: customer.businessLicense || '',
        taxId: customer.taxId || '',
        website: customer.website || '',
        industry: customer.industry || '',
        businessType: customer.businessType || '',
        establishedYear: customer.establishedYear || '',
        numberOfEmployees: customer.numberOfEmployees || '',
        annualRevenue: customer.annualRevenue || '',
        
        // Business Contact Details
        businessPhone: customer.businessPhone || '',
        businessEmail: customer.businessEmail || '',
        fax: customer.fax || '',
        contactPerson: customer.contactPerson || '',
        contactTitle: customer.contactTitle || '',
        alternateContact: customer.alternateContact || '',
        alternateContactPhone: customer.alternateContactPhone || '',
        
        // Business Terms & Financial
        customerType: customer.customerType || 'regular',
        status: customer.status || 'active',
        bankName: customer.bankName || '',
        accountNumber: customer.accountNumber || '',
        routingNumber: customer.routingNumber || '',
        
        // Additional Business Information
        referralSource: customer.referralSource || '',
        notes: customer.notes || '',
        specialInstructions: customer.specialInstructions || '',
        preferredDeliveryMethod: customer.preferredDeliveryMethod || ''
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      // Additional validation
      const errors = {};
      
      // Validate all fields
      Object.keys(formData).forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) {
          errors[field] = error;
        }
      });

      // Check validation errors
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }

      // Process the form data with all the fields
      const customerData = {
        // Personal Information (Essential Only)
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        
        // Business Information (Comprehensive)
        businessName: formData.businessName.trim(),
        businessAddress: formData.businessAddress.trim(),
        businessCity: formData.businessCity.trim(),
        businessState: formData.businessState.trim(),
        businessZipCode: formData.businessZipCode.trim(),
        businessCountry: formData.businessCountry,
        permitNumber: formData.permitNumber.trim(),
        businessLicense: formData.businessLicense.trim(),
        taxId: formData.taxId.trim(),
        website: formData.website.trim(),
        industry: formData.industry.trim(),
        businessType: formData.businessType.trim(),
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null,
        numberOfEmployees: formData.numberOfEmployees.trim(),
        annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : 0,
        
        // Business Contact Details
        businessPhone: formData.businessPhone.trim(),
        businessEmail: formData.businessEmail.trim(),
        fax: formData.fax.trim(),
        contactPerson: formData.contactPerson.trim(),
        contactTitle: formData.contactTitle.trim(),
        alternateContact: formData.alternateContact.trim(),
        alternateContactPhone: formData.alternateContactPhone.trim(),
        
        // Business Terms & Financial
        customerType: formData.customerType,
        status: formData.status,
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        routingNumber: formData.routingNumber.trim(),
        
        // Additional Business Information
        referralSource: formData.referralSource.trim(),
        notes: formData.notes.trim(),
        specialInstructions: formData.specialInstructions.trim(),
        preferredDeliveryMethod: formData.preferredDeliveryMethod
      };

      await onSave(customerData);
    } catch (error) {
      console.error('Error saving customer:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save customer. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerInitials = (name) => {
    if (!name) return 'N/A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Container size="xl">
        <Paper shadow="xl" p="xl" radius="xl" style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          color: '#ffffff'
        }}>
          <form onSubmit={handleSubmit}>
            <Stack gap="xl">
              {/* Header */}
              <Group wrap="wrap" gap="md">
                <ActionIcon
                  size="lg"
                  variant="light"
                  onClick={onCancel}
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
                    <Title order={2} style={{ color: '#d4af37', fontSize: '1.5rem' }}>
                      {customer ? 'Edit Customer' : 'Add New Customer'}
                    </Title>
                    <Text style={{ color: '#a1a1aa', fontSize: '14px' }}>
                      {COMPANY_INFO.name} - Customer Management
                    </Text>
                  </div>
                </Group>
              </Group>

              <Divider style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }} />

              {/* Customer Preview */}
              {formData.name && (
                <Card
                  padding="lg"
                  style={{
                    background: 'rgba(74, 55, 40, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.1)'
                  }}
                >
                  <Group gap="md">
                    <Avatar
                      size="lg"
                      radius="xl"
                      style={{
                        background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                        color: '#1a1a1a'
                      }}
                    >
                      {getCustomerInitials(formData.name)}
                    </Avatar>
                    <div>
                      <Text fw={600} size="lg" style={{ color: '#ffffff' }}>
                        {formData.name}
                      </Text>
                      {formData.businessName && (
                        <Text size="sm" style={{ color: '#d4af37' }}>
                          {formData.businessName}
                        </Text>
                      )}
                      <Text size="sm" style={{ color: '#a1a1aa' }}>
                        {formData.email}
                      </Text>
                    </div>
                  </Group>
                </Card>
              )}

              {/* Personal Information - Essential Only */}
              <Card
                padding="xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Group gap="sm" mb="lg">
                  <IconUser size={20} color="#d4af37" />
                  <Title order={3} style={{ color: '#d4af37' }}>
                    Personal Information
                  </Title>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Full Name"
                      placeholder="Enter customer name"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={validationErrors.name}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Email"
                      placeholder="customer@example.com"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={validationErrors.email}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Phone"
                      placeholder="+1 (555) 123-4567"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      error={validationErrors.phone}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Business Information */}
              <Card
                padding="xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Group gap="sm" mb="lg">
                  <IconMapPin size={20} color="#d4af37" />
                  <Title order={3} style={{ color: '#d4af37' }}>
                    Business Information
                  </Title>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Business Name"
                      placeholder="Business or company name"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Contact Person"
                      placeholder="Primary contact person"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Tax ID/EIN"
                      placeholder="Tax identification number"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Permit Number"
                      placeholder="Business permit number"
                      value={formData.permitNumber}
                      onChange={(e) => handleInputChange('permitNumber', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      error={validationErrors.website}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Fax"
                      placeholder="Fax number"
                      value={formData.fax}
                      onChange={(e) => handleInputChange('fax', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={12}>
                    <Select
                      label="Industry"
                      placeholder="Select industry"
                      data={[
                        { value: 'retail', label: 'Retail' },
                        { value: 'wholesale', label: 'Wholesale' },
                        { value: 'manufacturing', label: 'Manufacturing' },
                        { value: 'technology', label: 'Technology' },
                        { value: 'healthcare', label: 'Healthcare' },
                        { value: 'finance', label: 'Finance' },
                        { value: 'education', label: 'Education' },
                        { value: 'hospitality', label: 'Hospitality' },
                        { value: 'construction', label: 'Construction' },
                        { value: 'food_beverage', label: 'Food & Beverage' },
                        { value: 'automotive', label: 'Automotive' },
                        { value: 'real_estate', label: 'Real Estate' },
                        { value: 'professional_services', label: 'Professional Services' },
                        { value: 'other', label: 'Other' }
                      ]}
                      value={formData.industry}
                      onChange={(value) => handleInputChange('industry', value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Business Address */}
              <Card
                padding="xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Group gap="sm" mb="lg">
                  <IconMapPin size={20} color="#d4af37" />
                  <Title order={3} style={{ color: '#d4af37' }}>
                    Business Address
                  </Title>
                </Group>
                
                <Grid>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Business Address"
                      placeholder="Business street address"
                      value={formData.businessAddress}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="City"
                      placeholder="Business city"
                      value={formData.businessCity}
                      onChange={(e) => handleInputChange('businessCity', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="State/Province"
                      placeholder="Business state"
                      value={formData.businessState}
                      onChange={(e) => handleInputChange('businessState', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="ZIP/Postal Code"
                      placeholder="Business ZIP code"
                      value={formData.businessZipCode}
                      onChange={(e) => handleInputChange('businessZipCode', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={12}>
                    <Select
                      label="Country"
                      placeholder="Select country"
                      data={[
                        { value: 'United States', label: 'United States' },
                        { value: 'Canada', label: 'Canada' },
                        { value: 'United Kingdom', label: 'United Kingdom' },
                        { value: 'Australia', label: 'Australia' },
                        { value: 'Germany', label: 'Germany' },
                        { value: 'France', label: 'France' },
                        { value: 'India', label: 'India' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      value={formData.businessCountry}
                      onChange={(value) => handleInputChange('businessCountry', value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Business Terms & Settings */}
              <Card
                padding="xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Group gap="sm" mb="lg">
                  <IconMapPin size={20} color="#d4af37" />
                  <Title order={3} style={{ color: '#d4af37' }}>
                    Business Terms & Settings
                  </Title>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Customer Type"
                      placeholder="Select customer type"
                      data={[
                        { value: 'regular', label: 'Regular Customer' },
                        { value: 'vip', label: 'VIP Customer' },
                        { value: 'wholesale', label: 'Wholesale' },
                        { value: 'retail', label: 'Retail' },
                        { value: 'distributor', label: 'Distributor' },
                        { value: 'reseller', label: 'Reseller' }
                      ]}
                      value={formData.customerType}
                      onChange={(value) => handleInputChange('customerType', value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Status"
                      placeholder="Select status"
                      data={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'suspended', label: 'Suspended' }
                      ]}
                      value={formData.status}
                      onChange={(value) => handleInputChange('status', value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Additional Information */}
              <Card
                padding="xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Group gap="sm" mb="lg">
                  <IconMapPin size={20} color="#d4af37" />
                  <Title order={3} style={{ color: '#d4af37' }}>
                    Additional Information
                  </Title>
                </Group>
                
                <Grid>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Referral Source"
                      placeholder="How did they find you?"
                      value={formData.referralSource}
                      onChange={(e) => handleInputChange('referralSource', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={12}>
                    <Textarea
                      label="Customer Notes"
                      placeholder="Additional notes about this customer..."
                      minRows={4}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      styles={{
                        label: { color: '#d4af37', fontWeight: 600 },
                        input: {
                          backgroundColor: 'rgba(74, 55, 40, 0.3)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#d4af37' }
                        }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Action Buttons */}
              <Group justify="flex-end" mt="xl">
                <Button
                  variant="light"
                  onClick={onCancel}
                  size="lg"
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
                  loading={loading}
                  leftSection={customer ? <IconEdit size={16} /> : <IconUserPlus size={16} />}
                  size="lg"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                    color: '#1a1a1a',
                    fontWeight: 600,
                    border: 'none'
                  }}
                >
                  {customer ? 'Update Customer' : 'Add Customer'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default CustomerForm;