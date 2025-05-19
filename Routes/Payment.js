const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../Schema/Payment");
const Order = require("../Schema/Order");
const Cart = require("../Schema/Cart");
const Book = require("../Schema/Book");
const Reseller = require("../Schema/Reseller");
const authenticateToken = require("../middleware/AuthMid");

const VALID_ORDER_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled", "Return"];

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;

const instance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_SECRET,
});

router.post("/orders", async (req, res) => {
    try {
        console.log("RP"+ req.body.amount);
        const options = {
            amount: req.body.amount * 100,
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        };  

        instance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Something Went Wrong!" });
            }
            res.status(200).json({ 
            data: {
                ...order,
                key: RAZORPAY_KEY_ID 
            } 
        });
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
});

router.post("/verify", authenticateToken, async (req, res) => {
    try {
        const { razorpay_orderID, razorpay_paymentID, razorpay_signature, orderID } = req.body;
        const order = await Order.findOne({ User_id: req.userId }).sort({ createdAt: 1 });
        const sign = razorpay_orderID + "|" + razorpay_paymentID;
        const resultSign = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");
        console.log(razorpay_signature)
        console.log(resultSign)

        if (razorpay_signature === resultSign) {
            const payment = new Payment({
                payment_id: razorpay_paymentID,
                order_id: orderID,
                payment_date: new Date(),
                payment_method: "Razorpay",
                payment_status: "Completed",
                total_payment: req.body.order,
                transaction_Type: "credit"
            });

            const savedPayment = await payment.save();

            return res.status(200).json({ payment: savedPayment });
        } else {
            return res.status(400).json({ message: "Invalid signature" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
});

router.get("/verify", authenticateToken, async (req, res) => {
    try {
        // Fetch all payments, populate order details, and then populate user details
        const payments = await Payment.find({})
            .populate({
                path: "order_id",
                populate: {
                    path: "User_id",  // Ensure it matches the field in OrderSchema
                    model: "User",   // Explicitly mention the User model
                    select: "First_name Last_name", // Fetch only necessary fields
                },
            });

        if (!payments || payments.length === 0) {
            return res.status(404).json({ error: "No payment record found" });
        }

        res.json({ payments });
    } catch (error) {
        console.error("Error fetching payment data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



router.put('/addorder', authenticateToken, async (req, res) => {
    try {
        const { cartid, TotalAmount, status } = req.body;

        let cart = await Cart.findOne({_id: cartid.cartid });
        console.log('cartId', cart);
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        let order = await Order.findOne({ Cart_id: cartid.cartid });
        console.log('order s', order);
        if (!order) {
            return res.status(404).json({ message: "Order not found for this cart" });
        }

        const updatedBooks = cart.books.map(item => ({
            book_id: item.book_id,
            book_quantity: item.book_quantity,
        }));

        // If status is provided and valid, update it
        if (status && VALID_ORDER_STATUSES.includes(status)) {
            order.Order_Status = status;
        }
        
        order.Total_Amount = TotalAmount;
        order.books = updatedBooks;
        console.log('order after', order);
        await order.save();

        const bookIds = order.books.map(item => item.book_id); // Extract book IDs
        console.log("boookboook", bookIds)
        // Fetch resellers who have matching book IDs
        
        let resellers = await Reseller.find({
            Book_id: { $in: bookIds }  // Ensure field name matches schema
        });
        console.log("reeeseeeler", resellers)

        // If matching resellers are found, update their status
        for (let reseller of resellers) {
            reseller.Resell_Status = "Sell";  // Correct assignment
            await reseller.save();  // Save each document individually
        }
        

        res.status(200).json({ message: "Order updated successfully", order });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Add a new route for updating order status
router.put('/:orderId/status', authenticateToken, [
    body('status')
        .isIn(VALID_ORDER_STATUSES)
        .withMessage(`Status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.Order_Status = status;
        await order.save();

        res.status(200).json({ message: "Order status updated successfully", order });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post(
"/:transaction_Type/codpayment",
    authenticateToken,
    [
        body("order_id").notEmpty().withMessage("Order ID is required"),
        body("payment_method").notEmpty().withMessage("Payment method is required"),
        body("payment_status").notEmpty().withMessage("Payment status is required"),
        body("total_payment").isFloat({ gt: 0 }).withMessage("Total payment must be a positive number"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error("Validation errors:", errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { transaction_Type } = req.params;
            const { order_id, payment_method, payment_status, total_payment } = req.body;

            const cod = new Payment({
                order_id,
                payment_method,
                order_model:"Reseller",
                payment_status,
                total_payment,
                transaction_Type,
            });

            const savedPayment = await cod.save();

            return res.status(201).json({ payment: savedPayment });
        } catch (error) {
            console.error("Error saving payment:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

router.put('/codpayment', authenticateToken, async (req, res) => {
    try {
        const { paymentid } = req.body;

        const payment = await Payment.findById(paymentid);

        payment.payment_status = "Completed";
        await payment.save();
        res.status(200).json({
            message: "Order status updated successfully"
        });
    }
    catch (error) {
        console.error("Error saving payment:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;