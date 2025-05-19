const express = require("express");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Book = require("../Schema/Book");
const Subcategory = require("../Schema/Subcategory");
const Authmid = require("../middleware/AuthMid");

const router = express.Router();

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post(
  "/:userRole/Book",
  Authmid,
  upload.single("image"),
  [
    body("BookName").notEmpty().withMessage("Please, Enter book name"),
    body("Author").notEmpty().withMessage("Please, Enter book author"),
    body("Edition"),
    body("Publication_Date")
      .notEmpty()
      .withMessage("Please, Enter publication date"),
    body("Publisher").notEmpty().withMessage("Please, Enter book publisher"),
    body("Description")
      .notEmpty()
      .withMessage("Please, Enter book description"),
    body("Price").notEmpty().withMessage("Please, Enter book price"),
    body("ISBN").notEmpty().withMessage("Please, Enter book ISBN"),
    body("condition"),
    body("SubCategory").notEmpty().withMessage("Please enter subcategory"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userRole = req.params.userRole; // Extract role from URL params
      const isOld = userRole === "Admin" ? false : true;

      // Ensure userId is present
      if (!req.userId) {
        console.error("User ID is missing in request");
        return res.status(400).json({ error: "Unauthorized request" });
      }

      // Check if book already exists by ISBN
      if (userRole === "Admin") {
        let bookData = await Book.findOne({ ISBN: req.body.ISBN });
        if (bookData) {
          return res
            .status(400)
            .json({ error: "Book with this ISBN already exists" });
        }
      }

      // Validate Subcategory
      if (!req.body.SubCategory) {
        return res.status(400).json({ error: "SubCategory is required" });
      }

      const subcategory = await Subcategory.findById(req.body.SubCategory);
      if (!subcategory) {
        return res.status(400).json({ error: "Invalid subcategory" });
      }

      // Handle book image
      const bookImageURL = req.file ? req.file.path : "default.jpg";

      // Create book
      const book = new Book({
        BookName: req.body.BookName,
        BookImageURL: bookImageURL,
        Author: req.body.Author,
        Edition: req.body.Edition,
        Publication_Date: req.body.Publication_Date,
        Publisher: req.body.Publisher,
        Description: req.body.Description,
        Price: req.body.Price,
        ISBN: req.body.ISBN,
        Condition: req.body.Condition,
        Subcategory_id: subcategory._id,
        User_id: req.userId,
        Isoldbook : isOld,
      });

      const savedBook = await book.save();
      res.status(201).json({ book: savedBook });
    } catch (error) {
      console.error("Error saving book:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
);

router.get("/Book", async (req, res) => {
  try {
    const books = await Book.find({});
    if (books.length === 0) {
      return res.status(404).json({ error: "No book data found" });
    }
    res.json(books);
  } catch (error) {
    console.error("Error fetching book data:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Update Book
router.put(
  "/Book",
  Authmid,
  upload.single("image"), // Allow updating book image
  [
    body("bookId").notEmpty().withMessage("Book ID is required"),
    body("BookName").optional().notEmpty().withMessage("Book name cannot be empty"),
    body("Author").optional().notEmpty().withMessage("Author cannot be empty"),
    body("Edition").optional(),
    body("Publication_Date").optional().notEmpty().withMessage("Publication date is required"),
    body("Publisher").optional().notEmpty().withMessage("Publisher cannot be empty"),
    body("Description").optional().notEmpty().withMessage("Description cannot be empty"),
    body("Price").optional().notEmpty().withMessage("Price is required"),
    body("ISBN").optional().notEmpty().withMessage("ISBN cannot be empty"),
    body("Condition").optional(),
    body("SubCategory").optional().notEmpty().withMessage("Subcategory is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookId, ...updatedFields } = req.body;

      // Check if the book exists
      let book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      // If a new image is uploaded, update the image URL
      if (req.file) {
        updatedFields.BookImageURL = req.file.path;
      }

      // If subcategory is updated, validate it
      if (updatedFields.SubCategory) {
        const subcategory = await Subcategory.findById(updatedFields.SubCategory);
        if (!subcategory) {
          return res.status(400).json({ error: "Invalid subcategory" });
        }
        updatedFields.Subcategory_id = subcategory._id;
      }

      // Update book details
      book = await Book.findByIdAndUpdate(bookId, updatedFields, { new: true });

      res.json({ success: true, message: "Book updated successfully", book });
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Delete Book
router.delete(
  "/Book",
  [body("bookId").notEmpty().withMessage("Book ID is required")],
  Authmid,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookId } = req.body;

      // Find and delete the book
      const book = await Book.findByIdAndDelete(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      res.json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/:Subcategoryname/Books", async (req, res) => {
  try {
      const name = req.params.Subcategoryname; 
      const subcategory = await Subcategory.findOne({Subcategory_Name:name}) ;
      const books = await Book.find({ Subcategory_id: subcategory._id });
      res.json(books);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

module.exports = router;
