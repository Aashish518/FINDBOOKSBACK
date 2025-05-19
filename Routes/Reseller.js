const express = require('express');
const router = express.Router();
const Reseller = require('../Schema/Reseller');
const Book = require('../Schema/Book');

// DELETE endpoint to remove a reseller book by ID
router.delete('/resellerbook/:id', async (req, res) => {
  try {
    const resellerBook = await Reseller.findById(req.params.id);
    if (!resellerBook) {
      return res.status(404).json({ message: 'Reseller book entry not found' });
    }

    // Verify the referenced book exists
    const book = await Book.findById(resellerBook.Book_id);
    if (!book) {
      return res.status(404).json({ message: 'Referenced book not found' });
    }

    await Reseller.findByIdAndDelete(req.params.id);
    res.json({ 
      message: 'Reseller book deleted successfully',
      deletedBookId: resellerBook.Book_id
    });
  } catch (error) {
    console.error('Error deleting reseller book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
