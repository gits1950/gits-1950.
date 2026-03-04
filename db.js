require("dotenv").config();
const mysql = require("mysql2/promise");

if (!process.env.DATABASE_URL) { throw new Error("DATABASE_URL missing from .env"); }

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
