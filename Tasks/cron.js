const cron = require("node-cron");
const { calculateAndStoreHourlySummary } = require("../Services/sensor");

const scheduledJobs = {};

function scheduleSummaryJob(req, res) {
  const { device_id } = req.body;

  if (scheduledJobs[device_id]) {
    return res
      .status(400)
      .send({ message: "A job is already scheduled for this device ID" });
  }

  const job = cron.schedule("* * * * *", () => {
    calculateAndStoreHourlySummary(device_id, (err, result) => {
      if (err) {
        console.error(
          `Error calculating and storing daily summary: ${err.message}`
        );
      } else {
        console.log(result.message);
      }
    });
  });

  scheduledJobs[device_id] = job;
  res.status(200).send({
    message: `Job scheduled successfully for device_id: ${device_id}`,
  });
}

module.exports = {
  scheduleSummaryJob,
};
