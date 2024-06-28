const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const db = require("../Database/db");
const secretKey = "1qaz2wsx3edc4rfv0okm9ijn8uhb7ygv";

function register(req, res) {
  const { username, email, password, device_id, isGoogleSignIn } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length > 0) {
      return res.status(409).send({ message: "Email already exists" });
    }

    if (isGoogleSignIn) {
      const userData = { username, email, password: "", device_id };

      db.query("INSERT INTO User SET ?", userData, (err, result) => {
        if (err) return res.status(500).send(`Error: ${err.message}`);
        res
          .status(201)
          .send({ message: "User registered successfully", data: userData });
      });
    } else {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).send(`Error: ${err.message}`);

        const userData = { username, email, password: hash, device_id };

        db.query("INSERT INTO User SET ?", userData, (err, result) => {
          if (err) return res.status(500).send(`Error: ${err.message}`);
          res
            .status(201)
            .send({ message: "User registered successfully", data: userData });
        });
      });
    }
  });
}

function login(req, res) {
  const { email, password, isGoogleSignIn } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length === 0) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const user = rows[0];

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

function forgotPassword(req, res) {
  const { email, newPassword } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length === 0) {
      return res.status(404).send({ message: "Email not found" });
    }

    bcrypt.hash(newPassword, saltRounds, (err, hash) => {
      if (err) return res.status(500).send(`Error: ${err.message}`);

      db.query(
        "UPDATE User SET password = ? WHERE email = ?",
        [hash, email],
        (err) => {
          if (err) return res.status(500).send(`Error: ${err.message}`);
          res.status(200).send({ message: "Password updated successfully" });
        }
      );
    });
  });
}

module.exports = {
  register,
  login,
  forgotPassword,
};
