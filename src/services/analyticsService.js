import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  startAfter,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfDay, endOfDay } from 'date-fns';

export class AdvancedAnalyticsService {
  constructor() {
    this.invoicesCollection = 'invoices';
    this.customersCollection = 'customers';
  }

  // Get comprehensive dashboard analytics
  async getDashboardAnalytics(userId, dateRange = '3months') {
    try {
      const [invoices, customers] = await Promise.all([
        this.getInvoices(userId),
        this.getCustomers(userId)
      ]);

      const analytics = {
        overview: this.calculateOverviewMetrics(invoices, customers),
        revenue: this.calculateRevenueMetrics(invoices, dateRange),
        customers: this.calculateCustomerMetrics(customers, invoices),
        products: this.calculateProductMetrics(invoices),
        trends: this.calculateTrendMetrics(invoices, dateRange),
        forecasting: this.calculateForecastingMetrics(invoices),
        performance: this.calculatePerformanceMetrics(invoices, customers)
      };

      return analytics;
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
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

  // Get all customers for a user
  async getCustomers(userId) {
    try {
      const q = query(
        collection(db, this.customersCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      return []; // Return empty array if customers collection doesn't exist yet
    }
  }

  // Calculate overview metrics
  calculateOverviewMetrics(invoices, customers) {
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalCustomers = customers.length;
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    const overdueInvoices = invoices.filter(inv => this.isOverdue(inv));
    
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    const averageRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    
    return {
      totalInvoices,
      totalRevenue,
      totalCustomers,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      averageInvoiceValue,
      averageRevenuePerCustomer,
      collectionRate: totalInvoices > 0 ? (paidInvoices.length / totalInvoices) * 100 : 0,
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
    };
  }

  // Calculate revenue metrics
  calculateRevenueMetrics(invoices, dateRange) {
    const periods = this.getDatePeriods(dateRange);
    const revenueByPeriod = periods.map(period => {
      const periodInvoices = invoices.filter(inv => 
        this.isInDateRange(inv.date, period.start, period.end)
      );
      
      return {
        period: period.label,
        date: period.start,
        revenue: periodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        invoiceCount: periodInvoices.length,
        paidRevenue: periodInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total || 0), 0),
        pendingRevenue: periodInvoices
          .filter(inv => inv.status === 'pending')
          .reduce((sum, inv) => sum + (inv.total || 0), 0)
      };
    });

    // Calculate growth rates
    const currentPeriod = revenueByPeriod[revenueByPeriod.length - 1];
    const previousPeriod = revenueByPeriod[revenueByPeriod.length - 2];
    const revenueGrowth = previousPeriod && previousPeriod.revenue > 0 
      ? ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100 
      : 0;

    return {
      revenueByPeriod,
      currentPeriodRevenue: currentPeriod?.revenue || 0,
      previousPeriodRevenue: previousPeriod?.revenue || 0,
      revenueGrowth,
      totalRevenue: revenueByPeriod.reduce((sum, period) => sum + period.revenue, 0),
      averageMonthlyRevenue: revenueByPeriod.reduce((sum, period) => sum + period.revenue, 0) / periods.length
    };
  }

  // Calculate customer metrics
  calculateCustomerMetrics(customers, invoices) {
    const customerAnalytics = customers.map(customer => {
      const customerInvoices = invoices.filter(inv => 
        inv.customerEmail === customer.email || inv.customerName === customer.name
      );
      
      return {
        ...customer,
        invoiceCount: customerInvoices.length,
        totalRevenue: customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        averageInvoiceValue: customerInvoices.length > 0 
          ? customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / customerInvoices.length 
          : 0,
        lastInvoiceDate: customerInvoices.length > 0 
          ? Math.max(...customerInvoices.map(inv => new Date(inv.date).getTime()))
          : null,
        paymentScore: this.calculatePaymentScore(customerInvoices)
      };
    });

    // Sort by revenue
    customerAnalytics.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const topCustomers = customerAnalytics.slice(0, 10);
    const customerGrowth = this.calculateCustomerGrowth(customers);
    const customerSegmentation = this.calculateCustomerSegmentation(customerAnalytics);

    return {
      customerAnalytics,
      topCustomers,
      customerGrowth,
      customerSegmentation,
      averageCustomerValue: customerAnalytics.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.length,
      customerRetentionRate: this.calculateRetentionRate(customerAnalytics),
      newCustomersThisMonth: this.getNewCustomersThisMonth(customers).length,
      churnRate: this.calculateChurnRate(customerAnalytics)
    };
  }

  // Calculate product metrics
  calculateProductMetrics(invoices) {
    const productStats = {};
    
    invoices.forEach(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          const productId = item.productId || item.product;
          if (productId) {
            if (!productStats[productId]) {
              productStats[productId] = {
                id: productId,
                name: item.product,
                totalQuantity: 0,
                totalRevenue: 0,
                invoiceCount: 0,
                averagePrice: 0
              };
            }
            
            productStats[productId].totalQuantity += item.quantity || 0;
            productStats[productId].totalRevenue += item.total || 0;
            productStats[productId].invoiceCount += 1;
            productStats[productId].averagePrice = productStats[productId].totalRevenue / productStats[productId].totalQuantity;
          }
        });
      }
    });

    const productArray = Object.values(productStats);
    productArray.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      topProducts: productArray.slice(0, 10),
      productPerformance: productArray,
      totalProductsSold: productArray.reduce((sum, p) => sum + p.totalQuantity, 0),
      averageProductValue: productArray.reduce((sum, p) => sum + p.averagePrice, 0) / productArray.length
    };
  }

  // Calculate trend metrics
  calculateTrendMetrics(invoices, dateRange) {
    const periods = this.getDatePeriods(dateRange);
    
    const trends = periods.map(period => {
      const periodInvoices = invoices.filter(inv => 
        this.isInDateRange(inv.date, period.start, period.end)
      );
      
      return {
        period: period.label,
        date: period.start,
        invoiceCount: periodInvoices.length,
        revenue: periodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        averageInvoiceValue: periodInvoices.length > 0 
          ? periodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / periodInvoices.length 
          : 0,
        paymentRate: periodInvoices.length > 0 
          ? (periodInvoices.filter(inv => inv.status === 'paid').length / periodInvoices.length) * 100 
          : 0
      };
    });

    return {
      trends,
      bestMonth: trends.reduce((best, current) => 
        current.revenue > best.revenue ? current : best, trends[0]),
      averageGrowthRate: this.calculateAverageGrowthRate(trends),
      seasonality: this.calculateSeasonality(trends)
    };
  }

  // Calculate forecasting metrics
  calculateForecastingMetrics(invoices) {
    const last12Months = this.getDatePeriods('12months');
    const monthlyData = last12Months.map(period => {
      const periodInvoices = invoices.filter(inv => 
        this.isInDateRange(inv.date, period.start, period.end)
      );
      
      return {
        month: period.label,
        revenue: periodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        invoiceCount: periodInvoices.length
      };
    });

    // Simple linear regression for forecasting
    const forecast = this.calculateLinearForecast(monthlyData);
    
    return {
      historicalData: monthlyData,
      nextMonthForecast: forecast.nextMonth,
      next3MonthsForecast: forecast.next3Months,
      yearlyForecast: forecast.yearly,
      confidence: forecast.confidence,
      trend: forecast.trend
    };
  }

  // Calculate performance metrics
  calculatePerformanceMetrics(invoices, customers) {
    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);
    
    const currentMonthInvoices = invoices.filter(inv => 
      this.isInDateRange(inv.date, startOfMonth(currentMonth), endOfMonth(currentMonth))
    );
    
    const lastMonthInvoices = invoices.filter(inv => 
      this.isInDateRange(inv.date, startOfMonth(lastMonth), endOfMonth(lastMonth))
    );

    const performance = {
      currentMonth: {
        revenue: currentMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        invoiceCount: currentMonthInvoices.length,
        averageInvoiceValue: currentMonthInvoices.length > 0 
          ? currentMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / currentMonthInvoices.length 
          : 0,
        paymentRate: currentMonthInvoices.length > 0 
          ? (currentMonthInvoices.filter(inv => inv.status === 'paid').length / currentMonthInvoices.length) * 100 
          : 0
      },
      lastMonth: {
        revenue: lastMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        invoiceCount: lastMonthInvoices.length,
        averageInvoiceValue: lastMonthInvoices.length > 0 
          ? lastMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / lastMonthInvoices.length 
          : 0,
        paymentRate: lastMonthInvoices.length > 0 
          ? (lastMonthInvoices.filter(inv => inv.status === 'paid').length / lastMonthInvoices.length) * 100 
          : 0
      }
    };

    // Calculate growth rates
    performance.revenueGrowth = performance.lastMonth.revenue > 0 
      ? ((performance.currentMonth.revenue - performance.lastMonth.revenue) / performance.lastMonth.revenue) * 100 
      : 0;
    
    performance.invoiceGrowth = performance.lastMonth.invoiceCount > 0 
      ? ((performance.currentMonth.invoiceCount - performance.lastMonth.invoiceCount) / performance.lastMonth.invoiceCount) * 100 
      : 0;
    
    performance.averageValueGrowth = performance.lastMonth.averageInvoiceValue > 0 
      ? ((performance.currentMonth.averageInvoiceValue - performance.lastMonth.averageInvoiceValue) / performance.lastMonth.averageInvoiceValue) * 100 
      : 0;

    return performance;
  }

  // Helper methods
  isOverdue(invoice) {
    if (invoice.status === 'paid') return false;
    const invoiceDate = new Date(invoice.date);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return invoiceDate < thirtyDaysAgo;
  }

  isInDateRange(date, start, end) {
    if (!date) return false;
    const invoiceDate = new Date(date);
    return invoiceDate >= start && invoiceDate <= end;
  }

  getDatePeriods(dateRange) {
    const now = new Date();
    const periods = [];
    
    let count = 3;
    switch (dateRange) {
      case '1month':
        count = 1;
        break;
      case '3months':
        count = 3;
        break;
      case '6months':
        count = 6;
        break;
      case '12months':
        count = 12;
        break;
    }

    for (let i = count - 1; i >= 0; i--) {
      const month = subMonths(now, i);
      periods.push({
        start: startOfMonth(month),
        end: endOfMonth(month),
        label: format(month, 'MMM yyyy')
      });
    }

    return periods;
  }

  calculatePaymentScore(invoices) {
    if (invoices.length === 0) return 100;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    return (paidInvoices.length / invoices.length) * 100;
  }

  calculateCustomerGrowth(customers) {
    const periods = this.getDatePeriods('6months');
    return periods.map(period => {
      const periodCustomers = customers.filter(customer => 
        this.isInDateRange(customer.createdAt, period.start, period.end)
      );
      
      return {
        period: period.label,
        count: periodCustomers.length,
        revenue: periodCustomers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)
      };
    });
  }

  calculateCustomerSegmentation(customerAnalytics) {
    const segments = {
      high: customerAnalytics.filter(c => c.totalRevenue > 5000),
      medium: customerAnalytics.filter(c => c.totalRevenue > 1000 && c.totalRevenue <= 5000),
      low: customerAnalytics.filter(c => c.totalRevenue <= 1000)
    };

    return {
      high: { count: segments.high.length, percentage: (segments.high.length / customerAnalytics.length) * 100 },
      medium: { count: segments.medium.length, percentage: (segments.medium.length / customerAnalytics.length) * 100 },
      low: { count: segments.low.length, percentage: (segments.low.length / customerAnalytics.length) * 100 }
    };
  }

  calculateRetentionRate(customerAnalytics) {
    const activeCustomers = customerAnalytics.filter(c => 
      c.lastInvoiceDate && new Date(c.lastInvoiceDate) > subMonths(new Date(), 3)
    );
    return customerAnalytics.length > 0 ? (activeCustomers.length / customerAnalytics.length) * 100 : 0;
  }

  getNewCustomersThisMonth(customers) {
    const currentMonth = new Date();
    return customers.filter(customer => 
      this.isInDateRange(customer.createdAt, startOfMonth(currentMonth), endOfMonth(currentMonth))
    );
  }

  calculateChurnRate(customerAnalytics) {
    const inactiveCustomers = customerAnalytics.filter(c => 
      !c.lastInvoiceDate || new Date(c.lastInvoiceDate) < subMonths(new Date(), 6)
    );
    return customerAnalytics.length > 0 ? (inactiveCustomers.length / customerAnalytics.length) * 100 : 0;
  }

  calculateAverageGrowthRate(trends) {
    if (trends.length < 2) return 0;
    
    let totalGrowth = 0;
    let validPeriods = 0;
    
    for (let i = 1; i < trends.length; i++) {
      const current = trends[i];
      const previous = trends[i - 1];
      
      if (previous.revenue > 0) {
        const growth = ((current.revenue - previous.revenue) / previous.revenue) * 100;
        totalGrowth += growth;
        validPeriods++;
      }
    }
    
    return validPeriods > 0 ? totalGrowth / validPeriods : 0;
  }

  calculateSeasonality(trends) {
    // Simple seasonality calculation based on month-over-month changes
    const seasonalityData = trends.map((trend, index) => {
      if (index === 0) return { ...trend, seasonalityIndex: 1 };
      
      const previous = trends[index - 1];
      const seasonalityIndex = previous.revenue > 0 ? trend.revenue / previous.revenue : 1;
      
      return { ...trend, seasonalityIndex };
    });

    return seasonalityData;
  }

  calculateLinearForecast(monthlyData) {
    if (monthlyData.length < 2) {
      return {
        nextMonth: 0,
        next3Months: [0, 0, 0],
        yearly: 0,
        confidence: 0,
        trend: 'stable'
      };
    }

    // Simple linear regression
    const n = monthlyData.length;
    const sumX = monthlyData.reduce((sum, _, i) => sum + i, 0);
    const sumY = monthlyData.reduce((sum, data) => sum + data.revenue, 0);
    const sumXY = monthlyData.reduce((sum, data, i) => sum + (i * data.revenue), 0);
    const sumXX = monthlyData.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextMonth = slope * n + intercept;
    const next3Months = [
      slope * n + intercept,
      slope * (n + 1) + intercept,
      slope * (n + 2) + intercept
    ];

    const yearly = next3Months.reduce((sum, val) => sum + val, 0) * 4; // Rough yearly estimate

    return {
      nextMonth: Math.max(0, nextMonth),
      next3Months: next3Months.map(val => Math.max(0, val)),
      yearly: Math.max(0, yearly),
      confidence: this.calculateForecastConfidence(monthlyData, slope),
      trend: slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'stable'
    };
  }

  calculateForecastConfidence(data, slope) {
    // Simple confidence calculation based on data consistency
    const averageRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.revenue - averageRevenue, 2), 0) / data.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / averageRevenue;
    
    // Lower coefficient of variation = higher confidence
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  }

  // Export analytics data
  async exportAnalytics(userId, format = 'json') {
    try {
      const analytics = await this.getDashboardAnalytics(userId);
      
      if (format === 'json') {
        return JSON.stringify(analytics, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(analytics);
      }
      
      return analytics;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  convertToCSV(analytics) {
    // Convert analytics object to CSV format
    const csvData = [];
    
    // Add overview metrics
    csvData.push(['Metric', 'Value']);
    csvData.push(['Total Revenue', analytics.overview.totalRevenue]);
    csvData.push(['Total Invoices', analytics.overview.totalInvoices]);
    csvData.push(['Total Customers', analytics.overview.totalCustomers]);
    csvData.push(['Average Invoice Value', analytics.overview.averageInvoiceValue]);
    csvData.push(['Collection Rate', analytics.overview.collectionRate]);
    
    // Add monthly revenue data
    csvData.push(['']);
    csvData.push(['Month', 'Revenue', 'Invoice Count']);
    analytics.revenue.revenueByPeriod.forEach(period => {
      csvData.push([period.period, period.revenue, period.invoiceCount]);
    });
    
    // Convert to CSV string
    return csvData.map(row => row.join(',')).join('\n');
  }
}

export default new AdvancedAnalyticsService();