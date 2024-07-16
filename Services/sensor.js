const { json } = require("body-parser");
const db = require("../Database/db");
const wifi = require("node-wifi");
const moment = require("moment");
wifi.init({
  iface: null,
});

function insertSensorData(data, callback) {
  db.query(
    "SELECT * FROM Sensor WHERE device_id = ?",
    [data.device_id],
    (err, rows) => {
      if (err) return callback(err);

      const { phase1, phase2, phase3, three_phase, ...sensorData } = data;
      // console.log("three_phase", three_phase);
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
          three_phase: JSON.stringify([three_phase]),
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
        const updated3phaseArray = [
          ...JSON.parse(rows[0].three_phase || "[]"),
          three_phase,
        ];
        existingData.push(sensorData);

        const updatedData = {
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          voltage: JSON.stringify(voltageArray),
          phase1: JSON.stringify(updatedPhase1Array),
          phase2: JSON.stringify(updatedPhase2Array),
          phase3: JSON.stringify(updatedPhase3Array),
          three_phase: JSON.stringify(updated3phaseArray),
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

function updateNewSensorData(data, callback) {
  db.query("SELECT * FROM User WHERE email = ?", [data.email], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) {
      return callback(new Error("Email not found"));
    }

    // Email exists, update device_name and device_id
    db.query(
      "UPDATE User SET device_name = ?, device_id = ? WHERE email = ?",
      [data.device_name, data.device_id, data.email],
      (err, result) => {
        if (err) return callback(err);
        callback(null, result);
      }
    );
  });
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
        const three_phaseData = JSON.parse(row.three_phase || "[]");

        return {
          ...row,
          voltage: JSON.parse(row.voltage),
          phase1: phase1Data,
          phase2: phase2Data,
          phase3: phase3Data,
          three_phase: three_phaseData,
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

// function calculateAndStoreHourlySummary(device_id, callback) {
//   const currentDateTime = new Date();
//   const currentDate = currentDateTime.toISOString().split("T")[0];
//   const currentHour = currentDateTime.getHours();

//   // Calculate start and end times for the current hour
//   const startTime = `${currentDate} ${String(currentHour).padStart(
//     2,
//     "0"
//   )}:00:00`;
//   const endTime = `${currentDate} ${String(currentHour).padStart(
//     2,
//     "0"
//   )}:59:59`;

//   // Query to fetch data for the current hour
//   const query = `
//     SELECT
//       AVG(voltage) AS avg_voltage,
//       AVG(current) AS avg_current,
//       AVG(power) AS avg_power,
//       AVG(apparent_power) AS avg_apparent_power,
//       AVG(reactive_power) AS avg_reactive_power,
//       AVG(energy) AS avg_energy,
//       AVG(power_factor) AS avg_power_factor,
//       AVG(frequency) AS avg_frequency,
//       COUNT(*) AS data_count
//     FROM Sensor
//     WHERE device_id = ? AND
//           DATE(reading_date) = ? AND
//           reading_time BETWEEN ? AND ?
//   `;

//   db.query(query, [device_id, currentDate, startTime, endTime], (err, rows) => {
//     if (err) {
//       console.error(`Error calculating hourly summary: ${err.message}`);
//       return callback(err);
//     }

//     // Calculate total minutes data was available in this hour
//     const totalMinutes = rows[0].data_count;

//     // Calculate averages based on available minutes
//     const summary = {
//       device_id: device_id,
//       voltage: rows[0].avg_voltage * totalMinutes,
//       current: rows[0].avg_current * totalMinutes,
//       power: rows[0].avg_power * totalMinutes,
//       apparent_power: rows[0].avg_apparent_power * totalMinutes,
//       reactive_power: rows[0].avg_reactive_power * totalMinutes,
//       energy: rows[0].avg_energy * totalMinutes,
//       power_factor: rows[0].avg_power_factor * totalMinutes,
//       frequency: rows[0].avg_frequency * totalMinutes,
//       reading_time: String(currentHour).padStart(2, "0") + ":00:00",
//       reading_date: currentDate,
//     };

//     // Divide averages by total minutes to get hourly average
//     summary.voltage /= totalMinutes;
//     summary.current /= totalMinutes;
//     summary.power /= totalMinutes;
//     summary.apparent_power /= totalMinutes;
//     summary.reactive_power /= totalMinutes;
//     summary.energy /= totalMinutes;
//     summary.power_factor /= totalMinutes;
//     summary.frequency /= totalMinutes;

//     // Pass summary to callback
//     callback(null, summary);
//   });
// }

function calculateAndStoreHourlySummary(device_id, callback) {
  const currentDate = moment().format("YYYY-MM-DD");
  const query = `
    SELECT
      device_id, three_phase.power, three_phase.apparent_power, three_phase.reactive_power, 
      three_phase.energy, three_phase.power_factor, three_phase.frequency, three_phase.reading_time,
      three_phase.reading_date
    FROM Sensor
    WHERE device_id = ? AND DATE(three_phase.reading_date) = ?
  `;

  db.query(query, [device_id, currentDate], (err, rows) => {
    if (err) {
      console.error(`Error fetching data: ${err.message}`);
      return callback(err);
    }

    const hourlyData = Array(24)
      .fill(null)
      .map(() => ({
        power: 0,
        apparent_power: 0,
        reactive_power: 0,
        energy: 0,
        power_factor: 0,
        frequency: 0,
        count: 0,
      }));

    rows.forEach((row) => {
      const readingTime = moment(row.reading_time, "HH:mm:ss");
      const hour = readingTime.hours();
      hourlyData[hour].power += row.power;
      hourlyData[hour].apparent_power += row.apparent_power;
      hourlyData[hour].reactive_power += row.reactive_power;
      hourlyData[hour].energy += row.energy;
      hourlyData[hour].power_factor += row.power_factor;
      hourlyData[hour].frequency += row.frequency;
      hourlyData[hour].count += 1;
    });

    const summaries = hourlyData.map((hour, index) => {
      const minutesInHour = hour.count ? hour.count : 60;
      return {
        device_id,
        power: hour.power / minutesInHour || 0,
        apparent_power: hour.apparent_power / minutesInHour || 0,
        reactive_power: hour.reactive_power / minutesInHour || 0,
        energy: hour.energy / minutesInHour || 0,
        power_factor: hour.power_factor / minutesInHour || 0,
        frequency: hour.frequency / minutesInHour || 0,
        reading_time: `${String(index).padStart(2, "0")}:00:00`,
        reading_date: currentDate,
      };
    });

    const summaryInsertPromises = summaries.map(
      (summary) =>
        new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO ThreePhaseSummary SET ?",
            summary,
            (err, result) => {
              if (err) {
                console.error(`Error storing summary: ${err.message}`);
                return reject(err);
              }
              resolve(result);
            }
          );
        })
    );

    Promise.all(summaryInsertPromises)
      .then(() => {
        const deleteQuery = `
          DELETE FROM Sensor
          WHERE device_id = ? AND DATE(reading_date) = ?
        `;
        db.query(deleteQuery, [device_id, currentDate], (err, result) => {
          if (err) {
            console.error(`Error deleting old data: ${err.message}`);
            return callback(err);
          }
          callback(null, {
            message: "Summary stored and old data deleted successfully",
          });
        });
      })
      .catch(callback);
  });
}

function calculateAndStoreHourlySummary(device_id, callback) {
  const currentDate = moment().format("YYYY-MM-DD");
  const query = `
    SELECT
      device_id, three_phase.power, three_phase.apparent_power, three_phase.reactive_power, 
      three_phase.energy, three_phase.power_factor, three_phase.frequency, three_phase.reading_time,
      three_phase.reading_date
    FROM Sensor
    WHERE device_id = ? AND DATE(three_phase.reading_date) = ?
  `;

  db.query(query, [device_id, currentDate], (err, rows) => {
    if (err) {
      console.error(`Error fetching data: ${err.message}`);
      return callback(err);
    }

    const hourlyData = Array(24)
      .fill(null)
      .map(() => ({
        power: 0,
        apparent_power: 0,
        reactive_power: 0,
        energy: 0,
        power_factor: 0,
        frequency: 0,
        count: 0,
      }));

    rows.forEach((row) => {
      const readingTime = moment(row.reading_time, "HH:mm:ss");
      const hour = readingTime.hours();
      hourlyData[hour].power += row.power;
      hourlyData[hour].apparent_power += row.apparent_power;
      hourlyData[hour].reactive_power += row.reactive_power;
      hourlyData[hour].energy += row.energy;
      hourlyData[hour].power_factor += row.power_factor;
      hourlyData[hour].frequency += row.frequency;
      hourlyData[hour].count += 1;
    });

    const summaries = hourlyData.map((hour, index) => {
      const minutesInHour = hour.count ? hour.count : 60;
      return {
        device_id,
        power: hour.power / minutesInHour || 0,
        apparent_power: hour.apparent_power / minutesInHour || 0,
        reactive_power: hour.reactive_power / minutesInHour || 0,
        energy: hour.energy / minutesInHour || 0,
        power_factor: hour.power_factor / minutesInHour || 0,
        frequency: hour.frequency / minutesInHour || 0,
        reading_time: `${String(index).padStart(2, "0")}:00:00`,
        reading_date: currentDate,
      };
    });

    const summaryInsertPromises = summaries.map(
      (summary) =>
        new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO ThreePhaseSummary SET ?",
            summary,
            (err, result) => {
              if (err) {
                console.error(`Error storing summary: ${err.message}`);
                return reject(err);
              }
              resolve(result);
            }
          );
        })
    );

    Promise.all(summaryInsertPromises)
      .then(() => {
        const deleteQuery = `
          DELETE FROM Sensor
          WHERE device_id = ? AND DATE(reading_date) = ?
        `;
        db.query(deleteQuery, [device_id, currentDate], (err, result) => {
          if (err) {
            console.error(`Error deleting old data: ${err.message}`);
            return callback(err);
          }
          callback(null, {
            message: "Summary stored and old data deleted successfully",
          });
        });
      })
      .catch(callback);
  });
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
  updateNewSensorData,
  calculateAndStoreHourlySummary,
  // calculateAndStoreHourlySummary,
};
