const mongoose = require('mongoose');
const { Schema } = mongoose;

const resellerSchema = new Schema({
  User_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  Book_id: {
    type: Schema.Types.ObjectId,
    ref: 'Book', 
    required: true
  },
  address: {
    type: String,
    required: true
  },
  upi_id: {
    type: String,
    required: false 
  },
  bank_acc_no: {
    type: String,
    required: false 
  },
  ifsc_code: {
    type: String,
    required: false 
  },
  Resell_Status: {
    type: String,
    trim: true,
    default: "Pending",
    enum: ["Pending", "Sell", "Collected", "Cancelled"]
  },
  Delivery_User_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('Reseller', resellerSchema);

