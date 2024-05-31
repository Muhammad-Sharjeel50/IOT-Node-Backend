const {
  insertSensorData,
  getSensorData,
  updateSensorData,
  deleteSensorData,
  getWifiCredientalsUsingId,
  setWifiConnectionUsingCredentials,
  setWifiCredientalsUsingCreds,
  getWifiConnectionUsingCredientals,
  updateDeviceStatus,
  registerDevice,
} = require("../Services/sensor");

function insertSensor(req, res) {
  const {
    device_id,
    temperature,
    humidity,
    phase1,
    phase2,
    phase3,
    power,
    carbon_dioxide,
    pollutant,
    gas_level,
    reading_time,
    reading_date,
    status,
  } = req.body;

  const data = {
    device_id,
    temperature,
    humidity,
    phase1,
    phase2,
    phase3,
    power,
    carbon_dioxide,
    pollutant,
    gas_level,
    reading_time,
    reading_date,
    status,
  };

  insertSensorData(data, (err, result) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    res
      .status(201)
      .send({ message: "New record created successfully", data: result });
  });
}


function fetchSensorData(req, res) {
  const device_id = req.params.device_id;
  getSensorData(device_id, (err, data) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    res.json(data);
  });
}

function updateSensor(req, res) {
  const device_id = req.params.device_id;
  const newData = req.body;

  updateSensorData(device_id, newData, (err, result) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    res.status(200).send("Sensor data updated successfully");
  });
}

function deleteSensor(req, res) {
  const device_id = req.params.device_id;

  deleteSensorData(device_id, (err, result) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    res.status(200).send("Sensor data deleted successfully");
  });
}

function setWifiCredientals(req, res) {
  const { userId, password } = req.body;
  const data = {
    userId: userId,
    password: password,
  };
  console.log("data", data);

  setWifiCredientalsUsingCreds(data, (err, result) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    res
      .status(200)
      .send({ message: "Wifi credentials set successfully", result });
  });
}

function getWifiCredientals(req, res) {
  const id = req.params.device_id;
  getWifiCredientalsUsingId(id, (err, result) => {
    if (err) return res.status(500).send(`Error: ${err.message}`);
    res.status(200).send("Wifi credentials get succesfully", result);
  });
}

function setWifiConnection(req, res) {
  const { ssid, password } = req.body;
  setWifiConnectionUsingCredentials({ ssid, password }, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ ssid: ssid, password: password });
  });
}

function getWifiConnection(req, res) {
  const { ssid, password } = req.body;
  getWifiConnectionUsingCredientals({ ssid, password }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({
      message: "Wifi credentials retrieved successfully",
      data: { ssid: ssid, password: password },
    });
  });
}

function deviceStatus(req, res) {
  const { device_id, status } = req.body;
  console.log("device ID::", device_id, status);
  if (!["on", "off"].includes(status)) {
    return res
      .status(400)
      .send({ message: "Invalid status. Use 'on' or 'off'." });
  }

  const data = { device_id, status };

  updateDeviceStatus(data, (err, result) => {
    if (err) {
      if (err.message === "Device not found") {
        return res.status(404).send({ message: err.message });
      }
      console.error(`Error updating device status: ${err.message}`);
      return res
        .status(500)
        .send(`Internal server error. Please try again later.`);
    }

    res.status(200).send(result);
  });
}

function registerDevices(req, res) {
  const { device_id, device_name, email } = req.body;

  const data = { device_id, device_name, email };

  registerDevice(data, (err, result) => {
    if (err) {
      if (err.message === "Device already exists") {
        return res.status(409).send({ message: err.message });
      }
      console.error(`Error registering device: ${err.message}`);
      return res
        .status(500)
        .send(`Internal server error. Please try again later.`);
    }

    res.status(201).send(result);
  });
}

function getRegisterDeviceById(req, res) {
  const { device_id } = req.params;

  getDeviceById(device_id, (err, result) => {
    if (err) {
      if (err.message === "Device not found") {
        return res.status(404).send({ message: err.message });
      }
      console.error(`Error getting device details: ${err.message}`);
      return res
        .status(500)
        .send(`Internal server error. Please try again later.`);
    }

    res.status(200).send(result);
  });
}

module.exports = {
  insertSensor,
  fetchSensorData,
  updateSensor,
  deleteSensor,
  setWifiCredientals,
  getWifiCredientals,
  setWifiConnection,
  getWifiConnection,
  deviceStatus,
  getRegisterDeviceById,
  registerDevices,
};
