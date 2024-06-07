const express = require("express");
const sensorRouter = require("./Routes/sensor");
const userRouter = require("./Routes/user");
const db = require("./Database/db");
const app = express();
const port = 5000;
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use("/api/sensors", sensorRouter);
app.use("/api/users", userRouter);

function createSensorTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Sensor (
      id INT AUTO_INCREMENT PRIMARY KEY,
      device_id VARCHAR(255) NOT NULL,
      temperature FLOAT,
      humidity FLOAT,
      power FLOAT,
      voltage JSON,
      phase1 JSON,
      phase2 JSON,
      phase3 JSON,
      three_phase JSON,
      carbon_dioxide FLOAT,
      pollutant VARCHAR(50),
      gas_level FLOAT,
      reading_time TIME,
      reading_date DATE,
      data JSON,
      status VARCHAR(50)
    )
  `;
  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error("Error creating table:", err.message);
    }
  });
}

function createWifiCredentialsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS WifiCredentials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ssid VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error("Error creating WifiCredentials table:", err.message);
    }
  });
}

function createUserTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS User (
      id INT AUTO_INCREMENT PRIMARY KEY,
      device_id VARCHAR(255),
      device_name VARCHAR(255),
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error("Error creating User table:", err.message);
    }
  });
}

function createDeviceTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('on', 'off') DEFAULT 'off'
    )
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error("Error creating Device table:", err.message);
    }
  });
}

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Connected to the RDS MySQL database");
  }
});

db.on("error", (err) => {
  console.error("Database error:", err.message);
});

createSensorTable();
createWifiCredentialsTable();
createUserTable();
createDeviceTable();
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
