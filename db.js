const mysql = require("mysql");

var connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: "cloudpc",
  dateStrings: "date",
  timeout: 30000,
  charset: "utf8",
});

module.exports = connection;
