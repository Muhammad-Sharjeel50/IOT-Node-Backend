const bcrypt = require("bcrypt");
const saltRounds = 10;

function register(req, res) {
  const { username, email, password, device_id } = req.body;

  // Check if the email already exists
  db.query("SELECT * FROM Users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length > 0) {
      return res.status(409).send({ message: "Email already exists" });
    }

    // Hash the password before storing
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) return res.status(500).send(`Error: ${err.message}`);

      const userData = { username, email, password: hash, device_id };

      // Insert new user into the database
      db.query("INSERT INTO Users SET ?", userData, (err, result) => {
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
  db.query("SELECT * FROM Users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    if (rows.length === 0) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const user = rows[0];

    // Compare hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).send(`Error: ${err.message}`);
      if (!isMatch) {
        return res.status(401).send({ message: "Invalid email or password" });
      }

      // Successful login
      res.status(200).send({ message: "Login successful", data: user });
    });
  });
}

module.exports = {
  register,
  login,
};
