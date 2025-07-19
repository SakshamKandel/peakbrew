import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export class CustomerService {
  constructor() {
    this.collectionName = 'customers';
  }

  // Create a new customer
  async createCustomer(customerData, userId) {
    try {
      const customer = {
        ...customerData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalInvoices: 0,
        totalRevenue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        lastInvoiceDate: null,
        paymentHistory: [],
        notes: customerData.notes || '',
        status: 'active'
      };

      const docRef = await addDoc(collection(db, this.collectionName), customer);
      return { id: docRef.id, ...customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Get all customers for a user
  async getCustomers(userId, options = {}) {
    try {
      const {
        searchTerm = '',
        sortBy = 'name',
        sortOrder = 'asc',
        status = 'all',
        limitCount = 100,
        lastDoc = null
      } = options;

      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      // Add status filter
      if (status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      // Only add sorting if we have the proper index or use simple queries
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        q = query(q, orderBy(sortBy, sortOrder));
      }

      // Add pagination
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      let customers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side sorting if not done on server
      if (sortBy === 'name') {
        customers.sort((a, b) => {
          const aVal = a[sortBy]?.toLowerCase() || '';
          const bVal = b[sortBy]?.toLowerCase() || '';
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        });
      }

      // Client-side search filter (for better UX)
      const filteredCustomers = searchTerm 
        ? customers.filter(customer => 
            customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.includes(searchTerm) ||
            customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : customers;

      return {
        customers: filteredCustomers,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  // Get a single customer by ID
  async getCustomer(customerId) {
    try {
      const docRef = doc(db, this.collectionName, customerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Customer not found');
      }
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }

  // Update a customer
  async updateCustomer(customerId, customerData) {
    try {
      const customerRef = doc(db, this.collectionName, customerId);
      const updateData = {
        ...customerData,
        updatedAt: new Date()
      };

      await updateDoc(customerRef, updateData);
      return { id: customerId, ...updateData };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Delete a customer
  async deleteCustomer(customerId) {
    try {
      await deleteDoc(doc(db, this.collectionName, customerId));
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Update customer statistics (called when invoice is created/updated)
  async updateCustomerStats(customerId, invoiceData, operation = 'add') {
    try {
      const customer = await this.getCustomer(customerId);
      
      const multiplier = operation === 'add' ? 1 : -1;
      const updatedStats = {
        totalInvoices: customer.totalInvoices + (multiplier * 1),
        // Only count paid invoices as revenue
        totalRevenue: invoiceData.status === 'paid' ? 
          customer.totalRevenue + (multiplier * (invoiceData.total || 0)) : 
          customer.totalRevenue,
        // Track pending amount separately
        pendingAmount: invoiceData.status === 'pending' ? 
          (customer.pendingAmount || 0) + (multiplier * (invoiceData.total || 0)) : 
          (customer.pendingAmount || 0),
        // Track paid amount separately
        paidAmount: invoiceData.status === 'paid' ? 
          (customer.paidAmount || 0) + (multiplier * (invoiceData.total || 0)) : 
          (customer.paidAmount || 0),
        lastInvoiceDate: operation === 'add' ? new Date() : customer.lastInvoiceDate,
        updatedAt: new Date()
      };

      // Update payment history
      if (operation === 'add') {
        const paymentRecord = {
          invoiceId: invoiceData.id,
          amount: invoiceData.total || 0,
          date: new Date(),
          status: invoiceData.status || 'pending'
        };
        updatedStats.paymentHistory = [
          ...(customer.paymentHistory || []),
          paymentRecord
        ];
      }

      await this.updateCustomer(customerId, updatedStats);
      return updatedStats;
    } catch (error) {
      console.error('Error updating customer stats:', error);
      throw error;
    }
  }



  // Search customers with advanced filters
  async searchCustomers(userId, searchOptions) {
    try {
      const {
        searchTerm = '',
        minRevenue = 0,
        maxRevenue = Infinity,
        minInvoices = 0,
        maxInvoices = Infinity,
        dateRange = null,
        status = 'all'
      } = searchOptions;

      const { customers } = await this.getCustomers(userId, { status });

      return customers.filter(customer => {
        const matchesSearch = !searchTerm || 
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm) ||
          customer.company?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRevenue = 
          (customer.totalRevenue || 0) >= minRevenue && 
          (customer.totalRevenue || 0) <= maxRevenue;

        const matchesInvoices = 
          (customer.totalInvoices || 0) >= minInvoices && 
          (customer.totalInvoices || 0) <= maxInvoices;

        let matchesDateRange = true;
        if (dateRange && dateRange.start && dateRange.end) {
          const createdAt = customer.createdAt.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
          matchesDateRange = createdAt >= dateRange.start && createdAt <= dateRange.end;
        }

        return matchesSearch && matchesRevenue && matchesInvoices && matchesDateRange;
      });
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
}

export default new CustomerService();