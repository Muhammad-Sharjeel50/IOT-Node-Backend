const express = require("express");
const {
  insertSensor,
  fetchSensorData,
  updateSensor,
  deleteSensor,
  getWifiCredientals,
  setWifiCredientals,
  setWifiConnection,
  getWifiConnection,
  deviceStatus,
} = require("../Controllers/sensor");

const router = express.Router();

router.post("/insert", insertSensor);

router.post("/set-wifi-cred", setWifiCredientals);

router.post("/get-wifi-cred", getWifiCredientals);

router.post("/set-wifi-connection", setWifiConnection);

router.get("/get-wifi-connection", getWifiConnection);

router.get("/data/:device_id", fetchSensorData);

router.put("/update/:device_id", updateSensor);

router.delete("/delete/:device_id", deleteSensor);

router.post("/device-status", deviceStatus);

module.exports = router;
