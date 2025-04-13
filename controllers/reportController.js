const Order = require('../Schema/Order');
const Payment = require('../Schema/Payment');
const Book = require('../Schema/Book');
const User = require('../Schema/User');
const Report = require("../Schema/Report");
const fs = require("fs");
const path = require("path");
const { generatePDF } = require("../utils/pdfGenerator");

const reportsDir = path.join(__dirname, "../reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

const generateReport = async (req, res) => {
  try {
    const { startDate, endDate, interval } = req.body;

    if (!startDate || !endDate || !interval) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ success: false, message: "Start date must be before end date" });
    }

    const reportData = {
      period: { start, end },
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalBooksSold: 0,
        uniqueCustomers: 0,
        paymentMethods: { online: 0, cod: 0 },
        orderStatus: new Map()
      },
      topBooks: []
    };

    const orders = await Order.find({
      Order_Date: { $gte: start, $lte: end }
    }).populate('User_id');

    const payments = await Payment.find({
      payment_date: { $gte: start, $lte: end }
    });

    reportData.summary.totalOrders = orders.length;
    reportData.summary.uniqueCustomers = new Set(orders.map(order => order.User_id._id)).size;

    let totalRevenue = 0;
    payments.forEach(payment => {
      if (payment.payment_status.toLowerCase() === "completed") {
        if (payment.transaction_Type.toLowerCase() === "credit") {
          totalRevenue += payment.total_payment;
        } else if (payment.transaction_Type.toLowerCase() === "debit") {
          totalRevenue -= payment.total_payment;
        }
      }
    });
    reportData.summary.totalRevenue = totalRevenue;
    reportData.summary.averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    payments.forEach(payment => {
      if (payment.payment_status.toLowerCase() === "completed") {
        if (payment.payment_method.toLowerCase() === "online") {
          reportData.summary.paymentMethods.online++;
        } else {
          reportData.summary.paymentMethods.cod++;
        }
      }
    });

    orders.forEach(order => {
      const status = order.Order_Status.toLowerCase();
      reportData.summary.orderStatus.set(status, (reportData.summary.orderStatus.get(status) || 0) + 1);
    });

    const bookSales = new Map();
    let totalBooksSold = 0;

    const bookIds = [...new Set(orders.flatMap(order => order.books.map(book => book.book_id)))];

    const books = await Book.find({ _id: { $in: bookIds } });
    const bookMap = new Map(books.map(book => [book._id.toString(), book]));

    orders.forEach(order => {
      order.books.forEach(orderBook => {
        const book = bookMap.get(orderBook.book_id.toString());
        if (!book) return;

        const bookInfo = bookSales.get(book._id.toString()) || {
          name: book.BookName || 'Unknown Book',
          author: book.Author || 'Unknown Author',
          sales: 0,
          revenue: 0
        };

        const quantity = parseInt(orderBook.book_quantity) || 0;
        const price = parseFloat(book.Price) || 0;
        
        bookInfo.sales += quantity;
        bookInfo.revenue += quantity * price;
        totalBooksSold += quantity;

        bookSales.set(book._id.toString(), bookInfo);
      });
    });

    reportData.summary.totalBooksSold = totalBooksSold;

    reportData.topBooks = Array.from(bookSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
      .map(book => ({
        name: book.name,
        author: book.author,
        sales: book.sales,
        revenue: book.revenue
      }));

    const pdfBuffer = await generatePDF(reportData);
    const pdfFileName = `report_${Date.now()}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    const report = new Report({
      ...reportData,
      pdfPath: pdfFileName
    });
    await report.save();

    res.json({
      success: true,
      message: "Report generated successfully",
      data: reportData
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ success: false, message: "Error generating report" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: "Error fetching reports" });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const pdfPath = path.join(reportsDir, report.pdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ success: false, message: "PDF file not found" });
    }

    res.download(pdfPath, `report_${reportId}.pdf`);
  } catch (error) {
    console.error("Error downloading report:", error);
    res.status(500).json({ success: false, message: "Error downloading report" });
  }
};

module.exports = {
  generateReport,
  getReports,
  downloadReport
}; 