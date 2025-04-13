const mongoose = require('mongoose');
const { Schema } = mongoose;

const ratingSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  book_id: {
    type: Schema.Types.ObjectId,
    ref: 'Book', 
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 1, 
    max: 5
  },
  date: {
    type: Date,
    default: Date.now 
  }
});

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
