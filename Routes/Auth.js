const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../Schema/User"); // Adjust the path to your User model
const router = express.Router();
const jwt = require("jsonwebtoken");
const Authmid = require("../middleware/AuthMid");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Otp = require('../Schema/otp');


const JsonSecretKey = process.env.JWT_KEY;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MY_EMAIL, pass: process.env.EMAIL_PASSWORD }
});

router.post("/:otpmessage/forgot-password", async (req, res) => {
  const { otpmessage } = req.params;
  const { email } = req.body;

  const user = await User.findOne({ Email: email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const otp = crypto.randomInt(100000, 999999); // Generate 6-digit OTP
  user.otp = otp;
  await user.save();

  let sendmessage;
  if (otpmessage === "forgotpassword") {
    sendmessage = `Your OTP to reset your password is: ${otp}. 
Do not share this code with anyone. It will expire in 10 minutes.`;
  } else if(otpmessage === "deliverydetail"){
    sendmessage = `Your delivery confirmation OTP is: ${otp}. 
Please provide this code to the delivery agent to receive your order.`;
  } else if(otpmessage === "reselldelivery"){
    sendmessage = `Your OTP to collect the resell product is: ${otp}. 
Please provide this code to the delivery agent to complete the pickup. 
Do not share this code with anyone. It is valid for 10 minutes.`;
  }

  // Send email
  await transporter.sendMail({
    to: email,
    subject: "FINDBOOKS - OTP Verification Code",
    text: sendmessage
  });

  res.json({ message: "OTP sent to email" });
});

// Step 2: Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ Email: email });

  if (!user || user.otp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.otp = null;
  await user.save();

  res.json("{ message: OTP verified }");
});

// Step 3: Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ Email: email });

  if (!user) return res.status(400).json({ message: "User not found" });

  user.Password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password reset successfully" });
});


//Register
router.post('/verifyotp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    // Find the OTP record (case-insensitive)
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    // Check if OTP is correct
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is correct, delete the record to prevent reuse
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
        subject: "FINDBOOKS - OTP Verification Code",
        text: `Welcome to FINDBOOKS! Your verification OTP is: ${OTP}. 
It will expire in 10 minutes. Please do not share this code with anyone.`
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



// Registration route
router.post(
  "/User",
  [
    // Validate fields
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
    // Validate incoming data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if the user already exists
      let user = await User.findOne({ Email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }



      // Hash the password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // Create and save the user
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
        //for generate token threw id
        User: {
          id: newUser.id,
        },
      };
      const authtoken = jwt.sign(data, JsonSecretKey);


      // Respond with success
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

    // Validate incoming data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find the user
      let user = await User.findOne({ Email: email });
      if (!user) {
        return res.status(400).json({ success, error: "User does not exist" });
      }

      // Compare passwords
      const comparePass = await bcrypt.compare(password, user.Password);
      if (!comparePass) {
        return res.status(400).json({ success, error: "Invalid credentials" });
      }

      // Generate JWT token
      const data = {
        User: { id: user.id },
      };
      const authtoken = jwt.sign(data, JsonSecretKey);
      success = true;

      // Respond with the token
      console.log("token: ", authtoken);
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
    const user = await User.findOne({ _id: User_id });
    if (!user) {
      return res.status(404).json({ error: "No user found" });
    }
    res.json({ user: user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/AllUser", async (req, res) => {
  try {
    const users = await User.find({});
    if (!users) {
      return res.status(404).json({ error: "No users data found" });
    }
    res.json({ users: users });
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
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    try {
      // Find and delete the user
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
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, firstname, lastname, email, mobile, password, role } = req.body;

    try {
      // Find user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "No user found" });
      }

      // Prepare update object
      let updatedData = {};
      if (firstname) updatedData.First_name = firstname;
      if (lastname) updatedData.Last_name = lastname;
      if (email) updatedData.Email = email;
      if (mobile) updatedData.Phone_no = mobile;
      if (password) {
        console.log("Hashing password for user:", userId);
        updatedData.Password = await bcrypt.hash(password, 10);
      }
      if (role) {
        updatedData.Role = role;
      }

      // Debugging log
      console.log("Updating user with data:", updatedData);

      // Update user
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