const mysql = require("mysql");

const db = mysql.createConnection({
  host: "smarthomesolutions.cn0gyesm6y7c.ca-central-1.rds.amazonaws.com",
  user: "admin",
  password: "haissam1234",
  database: "SMART_HOME_SOLUTIONS",
});

module.exports = db;
