const express = require('express');
const Rating = require('../Schema/Rating');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authenticateToken = require("../middleware/AuthMid");

router.post('/Ratings', authenticateToken, [
    body('book_id').notEmpty().withMessage('Book ID is required'),
    body('rate').isInt({ min: 1, max: 5 }).withMessage('Rate must be an integer between 1 and 5')
], async (req, res) => {
    console.log("Incoming Request Body:", req.body); // Debugging
    console.log("User ID from Token:", req.userId); // Debugging

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation Errors:", errors.array()); // Debugging
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rate, book_id } = req.body;
        const user_id = req.userId; // Fix extraction of user_id
        console.log(user_id, book_id);

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized: No user ID found" });
        }

        // Check if the user has already rated the book
        const existingRating = await Rating.findOne({ user_id, book_id });
        if (existingRating) {
            return res.status(400).json({ error: "You have already rated this book" });
        }

        const newRating = new Rating({
            user_id: user_id,
            book_id: book_id,
            rate: rate,
            date: new Date()
        });

        await newRating.save();
        res.status(201).json({ message: 'Rating added successfully', rating: newRating });
    } catch (error) {
        console.error("Error Saving Rating:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get ratings for a book
router.get('/Ratings/:book_id', async (req, res) => {
    try {
        const { book_id } = req.params;
        const ratings = await Rating.find({ book_id }).populate('user_id', 'name');
        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get average rating for a book
router.get('/Ratings/average/:book_id', async (req, res) => {
    try {
        const { book_id } = req.params;
        const ratings = await Rating.find({ book_id });
        
        if (ratings.length === 0) {
            return res.status(200).json({ averageRating: 0 });
        }

        const averageRating = ratings.reduce((sum, rating) => sum + rating.rate, 0) / ratings.length;
        res.status(200).json({ averageRating: averageRating.toFixed(1) });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
