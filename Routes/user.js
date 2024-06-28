const express = require("express");
const { register, login, forgotPassword } = require("../Controllers/user");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/forget-password", forgotPassword);

module.exports = router;
