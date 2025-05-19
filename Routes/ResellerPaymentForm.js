const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const authenticateToken = require("../middleware/AuthMid");
const ResellerPaymentModel = require("../Schema/Reseller");

router.post(
  "/ResellerPaymentForm",
  authenticateToken,
  [
    body("address").notEmpty().withMessage("Please enter an address").trim(),
    body("upi_id"),
    body("bank_acc_no"),
    body("ifsc_code"),
    body("Pincode"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const resellerPayment = new ResellerPaymentModel({
        User_id: req.userId,
        Book_id: req.body.bookid,
        address: `${req.body.address} - ${req.body.Pincode}`,
        upi_id: req.body.upi_id,
        bank_acc_no: req.body.bank_acc_no,
        ifsc_code: req.body.ifsc_code,
      });

      const savedResellerPayment = await resellerPayment.save();
      res.status(201).json({ data: savedResellerPayment });
    } catch (error) {
      console.error("Error saving reseller payment details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.delete(
  "/ResellerPaymentForm/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const deletedPayment = await ResellerPaymentModel.findByIdAndDelete(
        req.params.id
      );
      if (!deletedPayment) {
        return res.status(404).json({ error: "Payment details not found" });
      }
      res.status(200).json({ message: "Payment details deleted successfully" });
    } catch (error) {
      console.error("Error deleting reseller payment details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
