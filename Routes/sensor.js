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
  AddSensorData,
  insertHourlySummary
} = require("../Controllers/sensor");

const { scheduleSummaryJob } = require('../Tasks/cron');


const router = express.Router();

router.post("/insert", insertSensor);

router.post("/set-wifi-cred", setWifiCredientals);

router.post("/get-wifi-cred", getWifiCredientals);

router.post("/set-wifi-connection", setWifiConnection);

router.get("/get-wifi-connection", getWifiConnection);

router.get("/data/:device_id", fetchSensorData);

router.put("/update/:device_id", updateSensor);

router.patch("/update/device", AddSensorData);

router.delete("/delete/:device_id", deleteSensor);

router.post("/device-status", deviceStatus);

router.post("/three-phase-summary", insertHourlySummary);


router.post('/scheduleSummary', scheduleSummaryJob);

module.exports = router;
