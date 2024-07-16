const express = require("express");
const sensorRouter = require("./Routes/sensor");
const userRouter = require("./Routes/user");
const db = require("./Database/db");
const app = express();
const port = 5000;
const cron = require("node-cron");
const cors = require("cors");
const { calculateAndStoreHourlySummary } = require("./Services/sensor");

app.use(cors());
app.use(express.json());
app.use("/api/sensors", sensorRouter);
app.use("/api/users", userRouter);

let deviceId;
app.post('/setDeviceId', (req, res) => {
  const { device_id } = req.body;
  if (!device_id) {
    return res.status(400).send('device_id is required');
  }
  deviceId = device_id;
  res.status(200).send(`device_id set to ${device_id}`);
});

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
      isVerified VARCHAR(255) NOT NULL,
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

function createThreePhaseSummaryTable() {
  const createTableQuery = ` CREATE TABLE IF NOT EXISTS ThreePhaseSummary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    voltage DECIMAL(10, 2),
    power DECIMAL(10, 2),
    apparent_power DECIMAL(10, 2),
    reactive_power DECIMAL(10, 2),
    energy DECIMAL(10, 2),
    power_factor DECIMAL(4, 2),
    frequency DECIMAL(6, 2),
    reading_time TIME,
    reading_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error("Error creating Device table:", err.message);
    }
  });
}

cron.schedule("* * * * *", () => {
  if (deviceId) {
    calculateAndStoreHourlySummary(deviceId, (err, summary) => {
      if (err) {
        console.error(
          `Error calculating and storing hourly summary: ${err.message}`
        );
        return;
      }
      console.log(`Hourly summary stored successfully for ${deviceId}`);
    });
  } else {
    console.log("device_id is not set. Skipping cron job.");
  }
});

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
createThreePhaseSummaryTable();

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
