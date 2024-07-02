const express = require("express");
const {
  register,
  verifyEmailOTP,
  resendEmailVerificationOTP,
  forgotPassword,
  resendForgotPasswordOTP,
  login,
} = require("../Controllers/user");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/resend-email-verification-otp", resendEmailVerificationOTP);
router.post("/forgot-password", forgotPassword);
router.post("/resend-forgot-password-otp", resendForgotPasswordOTP);
router.post("/login", login);

module.exports = router;
