const pool = require("./db");
async function init() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS patients (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, age INT, mobile VARCHAR(10), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS doctors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, specialization VARCHAR(150))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS visits (id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT, doctor_id INT, visit_type VARCHAR(50) DEFAULT 'consultation', status VARCHAR(50) DEFAULT 'waiting', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL)`);
    console.log("Tables created OK");
  } catch (err) { console.error("Init failed:", err.message); process.exit(1); }
  finally { await pool.end(); }
}
init();
