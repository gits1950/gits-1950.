const pool = require("./db");
async function seed() {
  try {
    const doctors = [["Dr. Sahil Chawla","Dental Surgeon"],["Dr. Kiran Kumar","Orthodontist"],["Dr. Priyal Sharma","Endodontist"]];
    for (const [name, spec] of doctors) {
      const [rows] = await pool.query("SELECT id FROM doctors WHERE name = ?", [name]);
      if (!rows.length) { await pool.query("INSERT INTO doctors (name, specialization) VALUES (?, ?)", [name, spec]); console.log("Inserted:", name); }
      else { console.log("Already exists:", name); }
    }
  } catch (err) { console.error("Seed failed:", err.message); process.exit(1); }
  finally { await pool.end(); }
}
seed();
