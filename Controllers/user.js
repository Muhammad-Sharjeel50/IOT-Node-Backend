const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const saltRounds = 10;
const db = require("../Database/db");
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

function register(req, res) {
  const { username, email, password, device_id, isGoogleSignIn } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length > 0) {
      return res.status(409).send({ message: "Email already exists" });
    }

    const otp = generateOTP();
    emailVerificationOtpStore[email] = otp;
    console.log(`OTP for ${email} is ${otp}`);

    const userData = {
      username,
      email,
      password: isGoogleSignIn ? "" : bcrypt.hashSync(password, saltRounds),
      device_id,
      isVerified: false,
    };

    db.query("INSERT INTO User SET ?", userData, (err, result) => {
      if (err) return res.status(500).send(`Error: ${err.message}`);
      sendOTPEmail(email, otp, "emailVerification");
      res.status(201).send({
        message: "User registered successfully. Please verify your email.",
        data: userData,
      });
    });
  });
}

function verifyEmailOTP(req, res) {
  const { email, otp } = req.body;

  const storedOtp = emailVerificationOtpStore[email];

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).send({ message: "Invalid OTP" });
  }

  db.query("UPDATE User SET isVerified = 1 WHERE email = ?", [email], (err) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    delete emailVerificationOtpStore[email];
    res.status(200).send({ message: "Email verified successfully" });
  });
}

function resendEmailVerificationOTP(req, res) {
  const { email } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length === 0) {
      return res.status(404).send({ message: "Email not found" });
    }

    const user = rows[0];

    if (user.isVerified) {
      return res.status(200).send({ message: "Email is already verified" });
    }

    const otp = generateOTP();
    emailVerificationOtpStore[email] = otp;
    console.log(`New OTP for ${email} is ${otp}`);
    sendOTPEmail(email, otp, "emailVerification");

    res
      .status(200)
      .send({ message: "New Email Verification OTP sent to your email" });
  });
}

function forgotPassword(req, res) {
  const { email, password, otp } = req.body;

  const storedOtp = forgotPasswordOtpStore[email];

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).send({ message: "Invalid OTP" });
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err)
      return res.status(500).send(`Error hashing password: ${err.message}`);

    db.query(
      "UPDATE User SET password = ? WHERE email = ?",
      [hash, email],
      (err) => {
        if (err)
          return res
            .status(500)
            .send(`Error updating password: ${err.message}`);
        delete forgotPasswordOtpStore[email];
        res.status(200).send({ message: "Password updated successfully" });
      }
    );
  });
}

function resendForgotPasswordOTP(req, res) {
  const { email } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length === 0) {
      return res.status(404).send({ message: "Email not found" });
    }

    const otp = generateOTP();
    forgotPasswordOtpStore[email] = otp;
    console.log(`New OTP for forgot password for ${email} is ${otp}`);
    sendOTPEmail(email, otp, "forgotPassword");

    res.status(200).send({ message: "New OTP sent to your email" });
  });
}

function generateOTP() {
  return crypto.randomBytes(4).toString("hex").substr(0, 6);
}

function login(req, res) {
  const { email, password, isGoogleSignIn } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length === 0) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const user = rows[0];

    if (!user.isVerified) {
      return res
        .status(401)
        .send({ message: "Please verify your email first" });
    }

    if (isGoogleSignIn) {
      const payload = {
        id: user.id,
        email: user.email,
        device_id: user.device_id ? user.device_id : null,
      };

      const token = jwt.sign(payload, secretKey, { expiresIn: "7d" });

      res.status(200).send({
        message: "Login successful",
        token: token,
      });
    } else {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).send(`Error: ${err.message}`);
        if (!isMatch) {
          return res.status(401).send({ message: "Invalid email or password" });
        }

        const payload = {
          id: user.id,
          email: user.email,
          device_id: user.device_id ? user.device_id : null,
        };

        const token = jwt.sign(payload, secretKey, { expiresIn: "7d" });

        res.status(200).send({
          message: "Login successful",
          token: token,
        });
      });
    }
  });
}

module.exports = {
  register,
  verifyEmailOTP,
  resendEmailVerificationOTP,
  forgotPassword,
  resendForgotPasswordOTP,
  login,
};
