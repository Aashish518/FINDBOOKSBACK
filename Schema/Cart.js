const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true 
  },
  books: [
    {
      book_id: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: true
      },
      book_quantity: {
        type: Number,
        required: true,
        min: 1
      },
    }
  ],
  cart_quantity: {
    type: Number,
    required: true,
    min: 0
  }
});

module.exports = mongoose.model('Cart', cartSchema);