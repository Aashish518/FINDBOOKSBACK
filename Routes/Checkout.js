const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const Order = require("../Schema/Order");
const Authmid = require("../middleware/AuthMid");
const Book = require("../Schema/Book");
const User = require("../Schema/User");
const Payment = require("../Schema/Payment");
const Reseller = require("../Schema/Reseller")

router.post(
  "/Order",
  Authmid,
  [
    body("address").notEmpty().withMessage("Please enter address"),
    body("city").notEmpty().withMessage("Please enter city"),
    body("state").notEmpty().withMessage("Please enter state"),
    body("country").notEmpty().withMessage("Please enter country"),
    body("pincode").notEmpty().withMessage("Please enter pincode"),
    body("cartid").notEmpty().withMessage("Cart ID is required"),
    // body("totalamount")
    //   .notEmpty()
    //   .isNumeric()
    //   .withMessage("Total amount is required and must be numeric"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const addressString =`${ req.body.address }, ${ req.body.city }, ${ req.body.state }, ${ req.body.country } - ${ req.body.pincode }`;
      const order = new Order({
        books: req.body.books || [], // Ensure books are included from the request body


        Address: addressString,
        // Total_Amount: req.body.totalamount,
        User_id: req.userId,
        Cart_id: req.body.cartid,
      });

      const savedOrder = await order.save();

      res.status(201).json({ order: savedOrder });
    } catch (error) {
      console.error("Error saving order:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/Orders", Authmid, async (req, res) => {
  try {
    const orders = await Order.find({});

    if (!orders) {
      return res.status(404).json({ message: "No orders found" });
    }

    const userIds = orders.map(order => order.User_id);
    const orderIds = orders.map(order => order._id);

    const user = await User.find({ _id: { $in: userIds } });
    const payment = await Payment.find({ order_id: { $in: orderIds } });

    res.json({ orders: orders, user: user, payment: payment, delivery: req.userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/Order", Authmid, async (req, res) => {
  try {
    // Find orders associated with the user
    const orders = await Order.find({ User_id: req.userId });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "No orders found for this user" });
    }

    // Extract book IDs from orders
    const bookIds = orders.flatMap((c) => c.books.map((b) => b.book_id));
    console.log("Book IDs:", bookIds);
    if (bookIds.length === 0) {
      return res.json({ orders, books: [] });
    }

    // Fetch book details
    // Fetch all books once
    const bookDocs = await Book.find({ _id: { $in: bookIds } });

    // Create a map of book documents for quick lookup
    const bookMap = new Map(
      bookDocs.map((book) => [book._id.toString(), book])
    );

    // Reconstruct the books array with duplicates based on bookIds
    const books = bookIds
      .map((id) => bookMap.get(id.toString()))
      .filter(Boolean);
    console.log("nnnnnnnnnnnnnnn",books)

    let userId;
      books.map(async (book) => {
        userId = book.User_id;
        console.log("lllllllllllllll",userId)
      })
    



    res.json({ orders, books, userId });
  } catch (error) {
    console.error("Error fetching order data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/CurrentOrder", Authmid, async (req, res) => {
  try {
    // Get the latest order for the user
    const order = await Order.findOne({ User_id: req.userId }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.json({ order });

  } catch (error) {
    console.error("Error fetching current order:", error.message);

    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/:orderId/Order",
  Authmid,
  [body("status").notEmpty().withMessage("Order status is required")],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (status === "Shipped") {
        const order = await Order.findOne({ _id: orderId });
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        const ordered_book = order.books.map((item) => item.book_id);

        const resellers = await Reseller.find({ Book_id: { $in: ordered_book } });

        const notCollectedBooks = resellers.filter(reseller => reseller.Resell_Status !== "Collected");

        if (notCollectedBooks.length > 0) {
          return res.status(404).json({
            message: "Order cannot be updated until all resellers have collected the books",
            notCollectedBooks: notCollectedBooks.map(reseller => reseller.Book_id)
          });
        }
      }


      let updateData = { Order_Status: status };
      if (status === "Delivered") {
        updateData.Delivery_User_id = req.userId;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        message: "Order status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }

  }
);

module.exports = router;

