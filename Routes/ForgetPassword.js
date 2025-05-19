// const bcrypt = require("bcrypt")
// import userModel from "../models/userModel.js";
// import transporter from "../nodemailer.js";
// const Authmid = require("../middleware/AuthMid");


// export const sendVerifyOtp = async (req, res) => {
//   try {
//     const { userId } = req.body;

//     const user = await userModel.findById(userId);

//     if (user.isAccountVerified) {
//       return res.json({ success: false, message: "Account Already verified" });
//     }

//     const otp = String(Math.floor(100000 + Math.random() * 900000));

//     user.verifyOtp = otp;
//     user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

//     await user.save();

//     const mailOption = {
//       from: "jadavaashish@gmail,com",
//       to: user.email,
//       subject: "Account verificaton otp",
//       text:` Your OTP is ${otp}. Verify your account using this OTP.`,
//     };

//     await transporter.sendMail(mailOption);
//     res.json({ success: true, message: "Verification OTP Sent on Email" });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// //verify the email using otp
// export const verifyEmail = async (req, res) => {
//   const { userId, otp } = req.body;

//   if (!userId || !otp) {
//     return res.json({ success: false, message: "Missing details" });
//   }

//   try {
//     const user = await userModel.findById(userId);

//     if (!user) {
//       return res.json({ success: false, message: "User not found" });
//     }
//     if (user.verifyOtp === "" || user.verifyOtp !== otp) {
//       return res.json({ success: false, message: "Invalid otp" });
//     }
//     if (user.verifyOtpExpireAt < Date.now()) {
//       return res.json({ success: false, message: "Otp expired" });
//     }

//     user.isAccountVerified = true;
//     user.verifyOtp = "";
//     user.verifyOtpExpireAt = 0;

//     await user.save();

//     return res.json({ success: true, message: "Email verified successfully" });
//   } catch (error) {
//     return res.json({ success: false, message: error.message });
//   }
// };

// //send password reset otp
// export const sendResetOtp = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.json({ success: false, message: "Email is required" });
//   }

//   try {
//     const user = await userModel.findOne({ email });

//     if (!user) {
//       return res.json({ success: false, message: "User not found" });
//     }

//     const otp = String(Math.floor(100000 + Math.random() * 900000));

//     user.resetOtp = otp;
//     user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

//     await user.save();

//     const mailOption = {
//       from: "jadavaashish9@gmail.com",
//       to: user.email,
//       subject: "Password Reset OTP",
//       text: `Your OTP for resetting your password is ${otp}. Use this OTP to proceed with resetting your password.`,
//     };

//     await transporter.sendMail(mailOption);

//     return res.json({ success: true, message: "Otp sent to your email" }); 

//   } catch (error) {
//     return res.json({ success: false, message: error.message });
//   }
// };

// //reset user password

// export const resetPassword = async (req,res)=>{
//   const {email,otp,newPassword} = req.body;

//   console.log(newPassword)

//   if(!email || !otp || !newPassword){
//     return res.json({ success: false, message: "Email, OTP, and new password are required" });
//   }

//   try {
    
//     const user = await userModel.findOne({email});
//     if(!user){
//       return res.json({ success: false, message: "User not found" });
//     }

//     if(user.resetOtp === "" || user.resetOtp !== otp){
//       return res.json({ success: false, message: "Invalid OTP" });
//     }

//     if(user.resetOtpExpireAt < Date.now()){
//       return res.json({ success: false, message: "OTP expired" });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword,10);
//     console.log(hashedPassword)
//     user.password = hashedPassword;
//     console.log(user.password)
//     user.resetOtp = '';
//     user.resetOtpExpireAt=0;

//     await user.save();

//     return res.json({ success: true, message: "Password has been reset successfully" });
//   } catch (error) {
//     return res.json({ success: false, message: error.message });
//   }
// }
