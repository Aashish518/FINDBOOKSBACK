const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  summary: {
    totalOrders: { type: Number, required: true },
    totalRevenue: { type: Number, required: true },
    averageOrderValue: { type: Number, required: true },
    totalBooksSold: { type: Number, required: true },
    uniqueCustomers: { type: Number, required: true },
    paymentMethods: {
      online: { type: Number, required: true },
      cod: { type: Number, required: true }
    },
    orderStatus: {
      type: Map,
      of: Number,
      required: true
    }
  },
  topBooks: [{
    name: { type: String, required: true },
    author: { type: String, required: true },
    sales: { type: Number, required: true },
    revenue: { type: Number, required: true }
  }],
  pdfPath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", reportSchema); 