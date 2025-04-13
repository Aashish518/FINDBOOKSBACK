const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../Schema/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Authmid = require("../middleware/AuthMid");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Otp = require('../Schema/otp');


const JsonSecretKey = process.env.JWT_KEY;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MY_EMAIL , pass: process.env.EMAIL_PASSWORD }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ Email:email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const otp = crypto.randomInt(100000, 999999);
  user.otp = otp;
  await user.save();

   await transporter.sendMail({
     to: email,
     subject: "Password Reset OTP",
    text: `Your OTP is ${otp}. It is valid for 1 minutes.`
  });

  res.json({ message: "OTP sent to email" });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ Email:email });

  if (!user || user.otp !== otp ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.otp = null;
  await user.save();

  res.json({ message: "OTP verified. You can now reset your password" });
});

router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ Email:email });

  if (!user) return res.status(400).json({ message: "User not found" });

  user.Password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password reset successfully" });
});



router.post('/verifyotp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await Otp.deleteOne({ email });

    res.json({ message: 'OTP verified successfully' });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


router.post('/registerotp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const OTP = crypto.randomInt(100000, 999999).toString();

  try {
    const existingOtp = await Otp.findOne({ email });

    if (existingOtp) {
      existingOtp.otp = OTP;
      await existingOtp.save();
    } else {
      const otp = new Otp({ email, otp: OTP });
      await otp.save();
    }

    try {
      await transporter.sendMail({
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP is ${OTP}. It is valid for 1 minute.`
      });
    } catch (mailError) {
      console.error('Error sending email:', mailError);
      return res.status(500).json({ message: 'Failed to send OTP email.' });
    }

    res.json({ message: 'OTP sent. Please verify your email.', email });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
  }
});



router.post(
  "/User",
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("mobile")
      .isMobilePhone()
      .withMessage("Please provide a valid mobile number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ Email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }

      

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newUser = new User({
        First_name: req.body.firstName,
        Last_name: req.body.lastName,
        Email: req.body.email,
        Phone_no: req.body.mobile,
        Password: hashedPassword,
        Role: req.body.role,
      });

      const savedUser = await newUser.save();

      const data = {
        User: {
          id: newUser.id,
        },
      };
      const authtoken = jwt.sign(data, JsonSecretKey);


      res.status(201).json({ user: savedUser, authtoken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post(
  "/Login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    let success = false;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ Email: email });
      if (!user) {
        return res.status(400).json({ success, error: "User does not exist" });
      }

      const comparePass = await bcrypt.compare(password, user.Password);
      if (!comparePass) {
        return res.status(400).json({ success, error: "Invalid credentials" });
      }

      const data = {
        User: { id: user.id },
      };
      const authtoken = jwt.sign(data, JsonSecretKey);
      success = true;

      res.json({ success, authtoken, user });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/User", Authmid, async (req, res) => {
  try {
    const User_id = req.userId;
    const user = await User.findOne({_id : User_id});
    if (!user) {
      return res.status(404).json({ error: "No user found" });
    }
    res.json({user: user});
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/AllUser", Authmid, async (req, res) => {
    try {
      const users = await User.find({});
      if (!users) {
        return res.status(404).json({ error: "No users data found" });
      }
      res.json({users : users});
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete(
  "/User",
  [
    body("userId").notEmpty().withMessage("User ID is required"),
  ],
  Authmid,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);


router.put(
  "/User",
  [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("firstname").optional(),
    body("lastname").optional(),
    body("email").optional(),
    body("mobile").optional(),
    body("password").optional(),
    body("role").optional(),
  ],
  Authmid,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, firstname, lastname, email, mobile, password, role } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "No user found" });
      }

      let updatedData = {};
      if (firstname) updatedData.First_name = firstname;
      if (lastname) updatedData.Last_name = lastname;
      if (email) updatedData.Email = email;
      if (mobile) updatedData.Phone_no = mobile;
      if (password) {
        updatedData.Password = await bcrypt.hash(password, 10);
      }
      if (role) {
        updatedData.Role = role;
      }


      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $set: updatedData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      res.json({ success: true, message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error.message, error.stack);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);


module.exports = router;
