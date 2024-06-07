const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = '1qaz2wsx3edc4rfv0okm9ijn8uhb7ygv';
const saltRounds = 10;
const db = require("../Database/db");
function register(req, res) {
  const { username, email, password, device_id } = req.body;

  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length > 0) {
      return res.status(409).send({ message: "Email already exists" });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) return res.status(500).send(`Error: ${err.message}`);

      const userData = { username, email, password: hash, device_id };

      // Insert new user into the database
      db.query("INSERT INTO User SET ?", userData, (err, result) => {
        if (err) return res.status(500).send(`Error: ${err.message}`);
        res
          .status(201)
          .send({ message: "User registered successfully", data: userData });
      });
    });
  });
}

function login(req, res) {
  const { email, password } = req.body;

  // Check user credentials
  db.query("SELECT * FROM User WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length === 0) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const user = rows[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).send(`Error: ${err.message}`);
      if (!isMatch) {
        return res.status(401).send({ message: "Invalid email or password" });
      }

      // Successful login
      const payload = {
        id: user.id,
        email: user.email,
        device_id: user.device_id ? user.device_id : null
      };

      const token = jwt.sign(payload, secretKey, { expiresIn: '7d' });

      res.status(200).send({ 
        message: "Login successful", 
        token: token
      });
    });
  });
}

module.exports = {
  register,
  login,
};
