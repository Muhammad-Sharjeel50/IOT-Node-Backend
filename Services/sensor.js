const db = require("../Database/db");
const wifi = require("node-wifi");
wifi.init({
  iface: null,
});

function insertSensorData(data, callback) {
  db.query(
    "SELECT * FROM Sensor WHERE device_id = ?",
    [data.device_id],
    (err, rows) => {
      if (err) return callback(err);

      const { phase1, phase2, phase3, ...sensorData } = data;
      const voltageArray = [
        phase1?.voltage,
        phase2?.voltage,
        phase3?.voltage,
      ].filter((v) => v !== undefined);

      const status = voltageArray.length > 1 ? "threephase" : "singlephase";

      if (rows.length === 0) {
        const newData = {
          device_id: sensorData.device_id,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          voltage: JSON.stringify(voltageArray),
          phase1: JSON.stringify([phase1]),
          phase2: JSON.stringify([phase2]),
          phase3: JSON.stringify([phase3]),
          power: sensorData.power,
          carbon_dioxide: sensorData.carbon_dioxide,
          pollutant: sensorData.pollutant,
          gas_level: sensorData.gas_level,
          reading_time: sensorData.reading_time,
          reading_date: sensorData.reading_date,
          data: JSON.stringify([sensorData]),
          status: status,
        };

        db.query("INSERT INTO Sensor SET ?", newData, (err, result) => {
          if (err) return callback(err);
          callback(null, newData);
        });
      } else {
        const existingData = JSON.parse(rows[0].data);
        const updatedPhase1Array = [
          ...JSON.parse(rows[0].phase1 || "[]"),
          phase1,
        ];
        const updatedPhase2Array = [
          ...JSON.parse(rows[0].phase2 || "[]"),
          phase2,
        ];
        const updatedPhase3Array = [
          ...JSON.parse(rows[0].phase3 || "[]"),
          phase3,
        ];

        existingData.push(sensorData);

        const updatedData = {
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          voltage: JSON.stringify(voltageArray),
          phase1: JSON.stringify(updatedPhase1Array),
          phase2: JSON.stringify(updatedPhase2Array),
          phase3: JSON.stringify(updatedPhase3Array),
          power: sensorData.power,
          carbon_dioxide: sensorData.carbon_dioxide,
          pollutant: sensorData.pollutant,
          gas_level: sensorData.gas_level,
          reading_time: sensorData.reading_time,
          reading_date: sensorData.reading_date,
          data: JSON.stringify(existingData),
          status: status,
        };

        db.query(
          "UPDATE Sensor SET ? WHERE device_id = ?",
          [updatedData, sensorData.device_id],
          (err, result) => {
            if (err) return callback(err);
            callback(null, result);
          }
        );
      }
    }
  );
}

function getSensorData(device_id, callback) {
  db.query(
    "SELECT * FROM Sensor WHERE device_id = ?",
    [device_id],
    (err, rows) => {
      if (err) return callback(err);
      if (rows.length === 0) return callback(null, []);

      const allData = rows.map((row) => {
        const parsedData = JSON.parse(row.data);
        const phase1Data = JSON.parse(row.phase1 || "[]");
        const phase2Data = JSON.parse(row.phase2 || "[]");
        const phase3Data = JSON.parse(row.phase3 || "[]");

        return {
          ...row,
          voltage: JSON.parse(row.voltage),
          phase1: phase1Data,
          phase2: phase2Data,
          phase3: phase3Data,
          data: parsedData,
        };
      });

      callback(null, allData);
    }
  );
}

function updateSensorData(device_id, newData, callback) {
  db.query(
    "UPDATE Sensor SET data = ? WHERE device_id = ?",
    [JSON.stringify(newData), device_id],
    (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    }
  );
}

// Function to delete sensor data for a device_id
function deleteSensorData(device_id, callback) {
  db.query(
    "DELETE FROM Sensor WHERE device_id = ?",
    device_id,
    (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    }
  );
}

function createUniqueRandomNumbers(max, count) {
  if (count > max + 1) {
    throw new Error(
      "Count cannot be greater than the range of unique numbers."
    );
  }

  let availableNumbers = Array.from({ length: max + 1 }, (_, i) => i);
  let uniqueNumbers = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers.splice(randomIndex, 1)[0];
    uniqueNumbers.push(number);
  }

  return uniqueNumbers;
}

function setWifiCredientalsUsingCreds(data, callback) {
  const uniqueId = createUniqueRandomNumbers(100, 5);
  data.device_id = uniqueId;

  const checkUserSql = "SELECT * FROM User WHERE userId = ?";
  db.query(checkUserSql, [data.userId], (err, results) => {
    if (err) return callback(err);

    if (results.length > 0) {
      return callback(new Error("User already exists"));
    }

    const sql =
      "INSERT INTO User (userId, password, device_id) VALUES (?, ?, ?)";
    const values = [data.userId, data.password, JSON.stringify(data.device_id)];

    db.query(sql, values, (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  });
}

function getWifiCredientalsUsingId(id, callback) {
  db.query("SELECT * from User WHERE device_id = ?", id, (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
}

function setWifiConnectionUsingCredentials({ ssid, password }, callback) {
  wifi.connect({ ssid, password }, (err) => {
    if (err) {
      return callback(err);
    }

    wifi.getCurrentConnections((err, currentConnections) => {
      if (err) {
        return callback(err);
      }

      const connected = currentConnections.some(
        (connection) => connection.ssid === ssid
      );

      if (connected) {
        // Store the credentials in the database
        const query =
          "INSERT INTO WifiCredentials (ssid, password) VALUES (?, ?)";
        db.query(query, [ssid, password], (err, result) => {
          if (err) {
            return callback(err);
          }
          callback(null, {
            message: `Connected to ${ssid} and credentials stored successfully`,
            data: { ssid: ssid, password: password },
          });
        });
      } else {
        callback(
          new Error(
            `Failed to connect to ${ssid}. Incorrect credentials or other error.`
          )
        );
      }
    });
  });
}

function getWifiConnectionUsingCredientals({ ssid, password }, callback) {
  const query = `SELECT ssid, password FROM WifiCredentials WHERE ssid = ? AND password = ?`;
  db.query(query, [ssid, password], (err, results) => {
    if (err) {
      return callback(err);
    }

    if (results.length === 0) {
      return callback(
        null,
        `No credentials found for SSID: ${ssid} and password: ${password}`
      );
    }

    const credentials = results[0];
    callback(null, credentials);
  });
}

function updateDeviceStatus(data, callback) {
  db.query(
    "SELECT * FROM Devices WHERE device_id = ?",
    [data.device_id],
    (err, rows) => {
      if (err) return callback(err);

      if (rows.length === 0) {
        return callback(new Error("Device not found"));
      }

      db.query(
        "UPDATE Devices SET status = ? WHERE device_id = ?",
        [data.status, data.device_id],
        (err, result) => {
          if (err) return callback(err);
          callback(null, {
            message: `Device ${data.device_id} turned ${data.status} successfully`,
          });
        }
      );
    }
  );
}

function registerDevice(data, callback) {
  const { device_id, device_name, email } = data;

  db.query(
    "SELECT * FROM Devices WHERE device_id = ?",
    [device_id],
    (err, rows) => {
      if (err) return callback(err);

      if (rows.length > 0) {
        return callback(new Error("Device already exists"));
      }

      const newDevice = { device_id, device_name, email, status: "off" };

      db.query("INSERT INTO Devices SET ?", newDevice, (err, result) => {
        if (err) return callback(err);
        callback(null, {
          message: "Device registered successfully",
          data: newDevice,
        });
      });
    }
  );
}

function getDeviceById(device_id, callback) {
  db.query(
    "SELECT * FROM Devices WHERE device_id = ?",
    [device_id],
    (err, rows) => {
      if (err) return callback(err);
      if (rows.length === 0) return callback(new Error("Device not found"));

      callback(null, rows[0]);
    }
  );
}

module.exports = {
  insertSensorData,
  getSensorData,
  updateSensorData,
  deleteSensorData,
  setWifiCredientalsUsingCreds,
  getWifiCredientalsUsingId,
  setWifiConnectionUsingCredentials,
  getWifiConnectionUsingCredientals,
  updateDeviceStatus,
  registerDevice,
  getDeviceById,
};
