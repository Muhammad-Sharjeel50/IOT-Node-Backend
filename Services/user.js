
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const db = require("../Database/db");

const saltRounds = 10;
const secretKey = "1qaz2wsx3edc4rfv0okm9ijn8uhb7ygv";
const emailVerificationOtpStore = {};
const forgotPasswordOtpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "haissamshabbir948@gmail.com",
    pass: "bnqsdgulcqmxjgov",
  },
});

function sendOTPEmail(email, otp, type) {
  let subject, text;

  if (type === "emailVerification") {
    subject = "Email Verification OTP";
    text = `Welcome to Smart Home Solutions! To complete your registration and start managing your IoT devices with ease, please use the following OTP for email verification: ${otp}. Thank you for choosing our service to simplify and secure your smart home experience.`;
  } else if (type === "forgotPassword") {
    subject = "Password Reset OTP";
    text = `Welcome back to Smart Home Solutions! If you requested to reset your password, please use the following OTP to proceed with resetting your password: ${otp}. Secure your smart home experience with us.`;
  } else {
    throw new Error("Invalid OTP type");
  }

  const mailOptions = {
    from: "haissamshabbir948@gmail.com",
    to: email,
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(`Error sending email: ${err.message}`);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
}

function generateOTP() {
  return crypto.randomBytes(4).toString("hex").substr(0, 6);
}

async function register(userData) {
  const { username, email, password, device_id, isGoogleSignIn } = userData;

  const existingUsers = await db.query("SELECT * FROM User WHERE email = ?", [
    email,
  ]);
  if (existingUsers.length > 0) {
    throw new Error("Email already exists");
  }

  const otp = generateOTP();
  emailVerificationOtpStore[email] = otp;
  console.log(`OTP for ${email} is ${otp}`);

  const hashedPassword = isGoogleSignIn
    ? ""
    : bcrypt.hashSync(password, saltRounds);

  const newUser = {
    username,
    email,
    password: hashedPassword,
    device_id,
    isVerified: false,
  };

  await db.query("INSERT INTO User SET ?", newUser);
  sendOTPEmail(email, otp, "emailVerification");

  return newUser;
}

async function verifyEmailOTP(email, otp) {
  const storedOtp = emailVerificationOtpStore[email];

  if (!storedOtp || storedOtp !== otp) {
    throw new Error("Invalid OTP");
  }

  await db.query("UPDATE User SET isVerified = 1 WHERE email = ?", [email]);
  delete emailVerificationOtpStore[email];
}

async function resendEmailVerificationOTP(email) {
  const users = await db.query("SELECT * FROM User WHERE email = ?", [email]);

  if (users.length === 0) {
    throw new Error("Email not found");
  }

  const user = users[0];

  if (user.isVerified) {
    throw new Error("Email is already verified");
  }

  const otp = generateOTP();
  emailVerificationOtpStore[email] = otp;
  console.log(`New OTP for ${email} is ${otp}`);
  sendOTPEmail(email, otp, "emailVerification");
}

async function forgotPassword(email, password, otp) {
  const storedOtp = forgotPasswordOtpStore[email];

  if (!storedOtp || storedOtp !== otp) {
    throw new Error("Invalid OTP");
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  await db.query("UPDATE User SET password = ? WHERE email = ?", [
    hashedPassword,
    email,
  ]);

  delete forgotPasswordOtpStore[email];
}

async function resendForgotPasswordOTP(email) {
  const users = await db.query("SELECT * FROM User WHERE email = ?", [email]);

  if (users.length === 0) {
    throw new Error("Email not found");
  }

  const otp = generateOTP();
  forgotPasswordOtpStore[email] = otp;
  console.log(`New OTP for forgot password for ${email} is ${otp}`);
  sendOTPEmail(email, otp, "forgotPassword");
}

async function login(email, password, isGoogleSignIn) {
  const users = await db.query("SELECT * FROM User WHERE email = ?", [email]);

  if (users.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = users[0];

  if (!user.isVerified) {
    throw new Error("Please verify your email first");
  }

  if (isGoogleSignIn) {
    const payload = {
      id: user.id,
      email: user.email,
      device_id: user.device_id ? user.device_id : null,
    };

    const token = jwt.sign(payload, secretKey, { expiresIn: "7d" });

    return { message: "Login successful", token: token };
  } else {
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const payload = {
      id: user.id,
      email: user.email,
      device_id: user.device_id ? user.device_id : null,
    };

    const token = jwt.sign(payload, secretKey, { expiresIn: "7d" });

    return { message: "Login successful", token: token };
  }
}

module.exports = {
  register,
  verifyEmailOTP,
  resendEmailVerificationOTP,
  forgotPassword,
  resendForgotPasswordOTP,
  login,
};
