import { useState, useEffect } from 'react';
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
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';
import ModernDashboardLayout from './dashboard/ModernDashboardLayout';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import { Modal } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';

export default function EnhancedDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const { currentUser } = useAuth();

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
        orderBy('date', 'desc')
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
        message: 'Failed to fetch invoices. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        const invoiceRef = doc(db, 'invoices', editingInvoice.id);
        await updateDoc(invoiceRef, {
          ...invoiceData,
          updatedAt: new Date()
        });
        
        notifications.show({
          title: 'Success',
          message: 'Invoice updated successfully!',
          color: 'green',
        });
      } else {
        // Create new invoice
        await addDoc(collection(db, 'invoices'), {
          ...invoiceData,
          userId: currentUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        notifications.show({
          title: 'Success',
          message: 'Invoice created successfully!',
          color: 'green',
        });
      }
      
      await fetchInvoices();
      setShowForm(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error saving invoice:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save invoice. Please try again.',
        color: 'red',
      });
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    try {
      await deleteDoc(doc(db, 'invoices', invoice.id));
      await fetchInvoices();
      
      notifications.show({
        title: 'Success',
        message: 'Invoice deleted successfully!',
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
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setShowForm(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleViewInvoice = (invoice) => {
    setPreviewInvoice(invoice);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  const handleClosePreview = () => {
    setPreviewInvoice(null);
  };

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <InvoiceForm
          invoice={editingInvoice}
          onSave={handleSaveInvoice}
          onCancel={handleCancelForm}
        />
      </motion.div>
    );
  }

  if (previewInvoice) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <InvoicePreview
          invoice={previewInvoice}
          onClose={handleClosePreview}
          onEdit={() => {
            setPreviewInvoice(null);
            handleEditInvoice(previewInvoice);
          }}
        />
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ModernDashboardLayout
          invoices={invoices}
          onCreateInvoice={handleCreateInvoice}
          onEditInvoice={handleEditInvoice}
          onViewInvoice={handleViewInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          loading={loading}
        />
      </motion.div>
    </AnimatePresence>
  );
}