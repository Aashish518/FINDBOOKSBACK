const PDFDocument = require('pdfkit');

const generatePDF = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add title
      doc.fontSize(20)
         .text('Sales Report', 50, 50);

      doc.fontSize(12)
         .text(`Period: ${new Date(reportData.period.start).toLocaleDateString()} - ${new Date(reportData.period.end).toLocaleDateString()}`, 50, 80);

      // Summary section
      doc.fontSize(16)
         .text('Summary', 50, 120);

      doc.fontSize(12);
      const summaryY = 150;
      const lineHeight = 25;

      doc.text(`Total Orders: ${reportData.summary.totalOrders}`, 50, summaryY);
      doc.text(`Total Revenue: ₹${reportData.summary.totalRevenue.toFixed(2)}`, 50, summaryY + lineHeight);
      doc.text(`Average Order Value: ₹${reportData.summary.averageOrderValue.toFixed(2)}`, 50, summaryY + lineHeight * 2);
      doc.text(`Total Books Sold: ${reportData.summary.totalBooksSold}`, 50, summaryY + lineHeight * 3);
      doc.text(`Unique Customers: ${reportData.summary.uniqueCustomers}`, 50, summaryY + lineHeight * 4);

      // Payment Methods
      doc.fontSize(16)
         .text('Payment Methods', 50, summaryY + lineHeight * 6);

      doc.fontSize(12);
      doc.text(`Online Payments: ${reportData.summary.paymentMethods.online}`, 50, summaryY + lineHeight * 7);
      doc.text(`Cash on Delivery: ${reportData.summary.paymentMethods.cod}`, 50, summaryY + lineHeight * 8);

      // Order Status
      doc.fontSize(16)
         .text('Order Status', 50, summaryY + lineHeight * 10);

      doc.fontSize(12);
      let statusY = summaryY + lineHeight * 11;
      reportData.summary.orderStatus.forEach((count, status) => {
        doc.text(`${status}: ${count}`, 50, statusY);
        statusY += lineHeight;
      });

      // Top Books
      doc.fontSize(16)
         .text('Top Selling Books', 50, statusY + lineHeight);

      doc.fontSize(12);
      let bookY = statusY + lineHeight * 2;
      reportData.topBooks.forEach(book => {
        doc.text(`${book.name} - ${book.author}`, 50, bookY);
        doc.text(`Sales: ${book.sales}, Revenue: ₹${book.revenue.toFixed(2)}`, 50, bookY + lineHeight);
        bookY += lineHeight * 2;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePDF
}; 