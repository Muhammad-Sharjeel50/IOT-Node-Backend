const userService = require("../Services/user");

async function register(req, res) {
  try {
    const newUser = await userService.register(req.body);
    res.status(201).send({
      message: "User registered successfully. Please verify your email.",
      data: newUser,
    });
  } catch (error) {
    res.status(500).send({ message: `Error: ${error.message}` });
  }
}

async function verifyEmailOTP(req, res) {
  try {
    await userService.verifyEmailOTP(req.body.email, req.body.otp);
    res.status(200).send({ message: "Email verified successfully" });
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
}

async function resendEmailVerificationOTP(req, res) {
  try {
    await userService.resendEmailVerificationOTP(req.body.email);
    res
      .status(200)
      .send({ message: "New Email Verification OTP sent to your email" });
  } catch (error) {
    res.status(500).send({ message: `Error: ${error.message}` });
  }
}

async function forgotPassword(req, res) {
  try {
    await userService.forgotPassword(
      req.body.email,
      req.body.password,
      req.body.otp
    );
    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
}

async function resendForgotPasswordOTP(req, res) {
  try {
    await userService.resendForgotPasswordOTP(req.body.email);
    res.status(200).send({ message: "New OTP sent to your email" });
  } catch (error) {
    res.status(500).send({ message: `Error: ${error.message}` });
  }
}

async function login(req, res) {
  try {
    const result = await userService.login(
      req.body.email,
      req.body.password,
      req.body.isGoogleSignIn
    );
    res.status(200).send(result);
  } catch (error) {
    res.status(401).send({ message: error.message });
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
