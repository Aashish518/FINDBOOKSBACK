const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Cart = require("../Schema/Cart");
const authenticateToken = require("../middleware/AuthMid");
const Book=require("../Schema/Book");

router.post("/Cart", authenticateToken, async (req, res) => {
    try {
        const { book_id, cart_quantity } = req.body;

        // Validate book ID and cart quantity
        if (!book_id || typeof cart_quantity !== "number" || cart_quantity <= 0) {
            return res.status(400).json({ message: "Invalid book ID or quantity" });
        }

        // Find the user's cart
        let cart = await Cart.findOne({ user_id: req.userId });

        // Find the book details
        const book = await Book.findOne({ _id: book_id });

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        if (!cart) {
            // If the user doesn't have a cart, create a new one
            cart = new Cart({
                user_id: req.userId,
                books: [{ book_id, book_quantity: book.isOldBook ? 1 : cart_quantity }],
                cart_quantity: 1, // Unique book count
            });
        } else {
            // Check if the book already exists in the user's cart
            const existingBook = cart.books.find((b) => b.book_id.toString() === book_id);

            if (existingBook) {
                // If the book exists, update the quantity
                if (book.Isoldbook) {
                    existingBook.book_quantity = 1; // Old books cannot have more than one copy
                } else {
                    existingBook.book_quantity += cart_quantity;
                }
            } else {
                // If the book is not in the cart, add it with correct quantity
                cart.books.push({ book_id, book_quantity: book.Isoldbook ? 1 : cart_quantity });
            }

            // Update total cart quantity (count of unique books)
            cart.cart_quantity = cart.books.length;
        }

        // Save the cart
        await cart.save();

        res.status(201).json({ message: "Item added to cart successfully." });
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


                           

router.put('/Cart', authenticateToken, async (req, res) => {
    try {
        const { book_id } = req.body;

        // Validate input
        if (!book_id) {
            return res.status(400).json({ message: "Book ID is required." });
        }

        // Find the user's cart
        let cart = await Cart.findOne({ user_id: req.userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found." });
        }

        // Remove the book from the cart
        cart.books = cart.books.filter(book => book.book_id.toString() !== book_id);

        // Update cart_quantity based on the number of unique books
        cart.cart_quantity = cart.books.length;

        // Save the updated cart
        await cart.save();

        // Fetch updated book details
        const bookIds = cart.books.map(b => b.book_id);
        const books = await Book.find({ _id: { $in: bookIds } });

        res.json({ message: "Book removed from cart successfully.", cart, books });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});




router.put("/updatequantity", authenticateToken, async (req, res) => {
    try {
        const { book_id, action } = req.body;

        // Find the user's cart
        let cart = await Cart.findOne({ user_id: req.userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Find the book in the cart
        let bookInCart = cart.books.find((b) => b.book_id.toString() === book_id);

        if (!bookInCart) {
            return res.status(404).json({ message: "Book not found in cart" });
        }

        // Update the quantity based on action
        if (action === "I") {
            bookInCart.book_quantity += 1;
        } else if (action === "D" && bookInCart.book_quantity > 1) {
            bookInCart.book_quantity -= 1;
        }

        // Save updated cart
        await cart.save();

        // Fetch updated cart data
        const updatedCart = await Cart.findOne({ user_id: req.userId });
        const bookIds = updatedCart.books.map(b => b.book_id);
        const books = await Book.find({ _id: { $in: bookIds } });

        res.json({ cart: updatedCart, books });
    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


router.get("/Cart", authenticateToken,async (req, res) => {
    try {
      const cart = await Cart.find({user_id: req.userId});
      const bookIds = cart.flatMap(c => c.books.map(b => b.book_id));
      const books = await Book.find({ _id: { $in: bookIds } });

      res.json({cart,books});
    //   console.log(cart);
    //   console.log(books);
    } 
    catch (error) {
      console.error("Error fetching book data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/Cart", authenticateToken, async (req, res) => {
    const result = await Cart.deleteOne({ user_id: req.userId });
    const cart = await Cart.find({ user_id: req.userId });
    const bookIds = cart.flatMap(c => c.books.map(b => b.book_id));
    const books = await Book.find({ _id: { $in: bookIds } });

    res.json({ cart, books });
})




module.exports = router;