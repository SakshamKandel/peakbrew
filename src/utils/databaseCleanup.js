import { 
  collection, 
  getDocs, 
  deleteDoc,
  doc, 
  query, 
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export class DatabaseCleanup {
  constructor() {
    this.invoicesCollection = 'invoices';
    this.customersCollection = 'customers';
  }

  // Get all invoices for a user
  async getInvoices(userId) {
    try {
      const q = query(
        collection(db, this.invoicesCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  // Delete all invoices for a user
  async deleteAllInvoices(userId) {
    try {
      const invoices = await this.getInvoices(userId);
      
      if (invoices.length === 0) {
        console.log('No invoices found to delete.');
        return { deleted: 0, total: 0 };
      }

      console.log(`Found ${invoices.length} invoices to delete.`);
      
      // Use batch delete for better performance
      const batch = writeBatch(db);
      
      invoices.forEach(invoice => {
        const docRef = doc(db, this.invoicesCollection, invoice.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      
      console.log(`Successfully deleted ${invoices.length} invoices.`);
      return { deleted: invoices.length, total: invoices.length };
    } catch (error) {
      console.error('Error deleting invoices:', error);
      throw error;
    }
  }

  // Delete invoices older than a certain date
  async deleteOldInvoices(userId, daysOld = 30) {
    try {
      const invoices = await this.getInvoices(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldInvoices = invoices.filter(invoice => {
        const createdAt = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
        return createdAt < cutoffDate;
      });
      
      if (oldInvoices.length === 0) {
        console.log(`No invoices older than ${daysOld} days found.`);
        return { deleted: 0, total: invoices.length };
      }

      console.log(`Found ${oldInvoices.length} invoices older than ${daysOld} days to delete.`);
      
      // Use batch delete for better performance
      const batch = writeBatch(db);
      
      oldInvoices.forEach(invoice => {
        const docRef = doc(db, this.invoicesCollection, invoice.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      
      console.log(`Successfully deleted ${oldInvoices.length} old invoices.`);
      return { deleted: oldInvoices.length, total: invoices.length };
    } catch (error) {
      console.error('Error deleting old invoices:', error);
      throw error;
    }
  }

  // Delete unpaid invoices older than a certain date
  async deleteUnpaidInvoices(userId, daysOld = 90) {
    try {
      const invoices = await this.getInvoices(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const unpaidInvoices = invoices.filter(invoice => {
        const createdAt = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
        return createdAt < cutoffDate && invoice.status === 'pending';
      });
      
      if (unpaidInvoices.length === 0) {
        console.log(`No unpaid invoices older than ${daysOld} days found.`);
        return { deleted: 0, total: invoices.length };
      }

      console.log(`Found ${unpaidInvoices.length} unpaid invoices older than ${daysOld} days to delete.`);
      
      // Use batch delete for better performance
      const batch = writeBatch(db);
      
      unpaidInvoices.forEach(invoice => {
        const docRef = doc(db, this.invoicesCollection, invoice.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      
      console.log(`Successfully deleted ${unpaidInvoices.length} unpaid invoices.`);
      return { deleted: unpaidInvoices.length, total: invoices.length };
    } catch (error) {
      console.error('Error deleting unpaid invoices:', error);
      throw error;
    }
  }

  // Get cleanup statistics
  async getCleanupStats(userId) {
    try {
      const invoices = await this.getInvoices(userId);
      
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const stats = {
        totalInvoices: invoices.length,
        paidInvoices: 0,
        pendingInvoices: 0,
        oldInvoices: 0,
        veryOldInvoices: 0,
        unpaidOldInvoices: 0
      };
      
      invoices.forEach(invoice => {
        const createdAt = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
        
        if (invoice.status === 'paid') {
          stats.paidInvoices++;
        } else if (invoice.status === 'pending') {
          stats.pendingInvoices++;
        }
        
        if (createdAt < thirtyDaysAgo) {
          stats.oldInvoices++;
        }
        
        if (createdAt < ninetyDaysAgo) {
          stats.veryOldInvoices++;
          
          if (invoice.status === 'pending') {
            stats.unpaidOldInvoices++;
          }
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw error;
    }
  }

  // Comprehensive cleanup function
  async performCleanup(userId, options = {}) {
    const {
      deleteAll = false,
      deleteOld = false,
      deleteUnpaid = false,
      daysOld = 30,
      unpaidDaysOld = 90
    } = options;
    
    try {
      let results = { deleted: 0, total: 0 };
      
      if (deleteAll) {
        results = await this.deleteAllInvoices(userId);
      } else if (deleteOld) {
        results = await this.deleteOldInvoices(userId, daysOld);
      } else if (deleteUnpaid) {
        results = await this.deleteUnpaidInvoices(userId, unpaidDaysOld);
      }
      
      console.log('Cleanup completed:', results);
      return results;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
}

export default new DatabaseCleanup();