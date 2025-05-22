const express = require("express");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Book = require("../Schema/Book");
const Subcategory = require("../Schema/Subcategory");
const Authmid = require("../middleware/AuthMid");

const router = express.Router();

// Create uploads directory if not exists
const fs = require("fs");
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// POST Add Book
router.post(
  "/:userRole/Book",
  Authmid,
  upload.single("image"),
  [
    body("BookName").notEmpty().withMessage("Please, Enter book name"),
    body("Author").notEmpty().withMessage("Please, Enter book author"),
    body("Edition"),
    body("Publication_Date").notEmpty().withMessage("Please, Enter publication date"),
    body("Publisher").notEmpty().withMessage("Please, Enter book publisher"),
    body("Description").notEmpty().withMessage("Please, Enter book description"),
    body("Price").notEmpty().withMessage("Please, Enter book price"),
    body("ISBN").notEmpty().withMessage("Please, Enter book ISBN"),
    body("condition"),
    body("SubCategory").notEmpty().withMessage("Please enter subcategory"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userRole = req.params.userRole;
      const isOld = userRole === "Admin" ? false : true;

      if (!req.userId) {
        return res.status(400).json({ error: "Unauthorized request" });
      }

      if (userRole === "Admin") {
        let bookData = await Book.findOne({ ISBN: req.body.ISBN });
        if (bookData) {
          return res.status(400).json({ error: "Book with this ISBN already exists" });
        }
      }

      const subcategory = await Subcategory.findById(req.body.SubCategory);
      if (!subcategory) {
        return res.status(400).json({ error: "Invalid subcategory" });
      }

      const bookImageURL = req.file ? req.file.path : "default.jpg";

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
        Isoldbook: isOld,
      });

      const savedBook = await book.save();
      res.status(201).json({ book: savedBook });
    } catch (error) {
      console.error("Error saving book:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
);

// GET All Books
router.get("/Book", async (req, res) => {
  try {
    const books = await Book.find({});
    if (books.length === 0) {
      return res.status(404).json({ error: "No book data found" });
    }
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// PUT Update Book
router.put(
  "/Book",
  Authmid,
  upload.single("image"),
  [
    body("bookId").notEmpty().withMessage("Book ID is required"),
    body("BookName").optional().notEmpty(),
    body("Author").optional().notEmpty(),
    body("Edition").optional(),
    body("Publication_Date").optional().notEmpty(),
    body("Publisher").optional().notEmpty(),
    body("Description").optional().notEmpty(),
    body("Price").optional().notEmpty(),
    body("ISBN").optional().notEmpty(),
    body("Condition").optional(),
    body("SubCategory").optional().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookId, ...updatedFields } = req.body;

      let book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (req.file) {
        updatedFields.BookImageURL = req.file.path;
      }

      if (updatedFields.SubCategory) {
        const subcategory = await Subcategory.findById(updatedFields.SubCategory);
        if (!subcategory) {
          return res.status(400).json({ error: "Invalid subcategory" });
        }
        updatedFields.Subcategory_id = subcategory._id;
      }

      book = await Book.findByIdAndUpdate(bookId, updatedFields, { new: true });
      res.json({ success: true, message: "Book updated successfully", book });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// DELETE Book
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
      const book = await Book.findByIdAndDelete(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// GET Books by Subcategory Name
router.get("/:Subcategoryname/Books", async (req, res) => {
  try {
    const name = req.params.Subcategoryname;
    const subcategory = await Subcategory.findOne({ Subcategory_Name: name });
    const books = await Book.find({ Subcategory_id: subcategory._id });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
