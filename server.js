const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const path    = require("path");
const pool    = require("./db");

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET","POST","PUT","PATCH","DELETE"] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/test-db", async (req, res, next) => {
  try { const [rows] = await pool.query("SELECT NOW() AS time"); res.json({ db: "connected", time: rows[0].time }); }
  catch (err) { next(err); }
});

app.get("/api/doctors", async (req, res, next) => {
  try { const [rows] = await pool.query("SELECT * FROM doctors ORDER BY id ASC"); res.json(rows); }
  catch (err) { next(err); }
});

app.get("/api/patients", async (req, res, next) => {
  try { const [rows] = await pool.query("SELECT * FROM patients ORDER BY created_at DESC"); res.json(rows); }
  catch (err) { next(err); }
});

app.get("/api/patients/:id", async (req, res, next) => {
  try {
    const [patients] = await pool.query("SELECT * FROM patients WHERE id = ?", [req.params.id]);
    if (!patients.length) return res.status(404).json({ error: "Patient not found" });
    const [visits] = await pool.query("SELECT v.*, d.name AS doctor_name, d.specialization FROM visits v JOIN doctors d ON v.doctor_id = d.id WHERE v.patient_id = ? ORDER BY v.created_at DESC", [req.params.id]);
    res.json({ ...patients[0], visits });
  } catch (err) { next(err); }
});

app.post("/api/patients", async (req, res, next) => {
  try {
    const { name, age, mobile } = req.body;
    if (!name || !mobile) return res.status(400).json({ error: "Name and mobile required" });
    if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ error: "Mobile must be 10 digits" });
    const [result] = await pool.query("INSERT INTO patients (name, age, mobile) VALUES (?, ?, ?)", [name, age || null, mobile]);
    const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

app.get("/api/visits", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT v.id, v.visit_type, v.status, v.created_at, p.name AS patient_name, p.mobile AS patient_mobile, d.name AS doctor_name, d.specialization FROM visits v JOIN patients p ON v.patient_id = p.id JOIN doctors d ON v.doctor_id = d.id ORDER BY v.created_at DESC");
    res.json(rows);
  } catch (err) { next(err); }
});

app.get("/api/visits/today", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT v.id, v.visit_type, v.status, v.created_at, p.name AS patient_name, p.mobile AS patient_mobile, d.name AS doctor_name, d.specialization FROM visits v JOIN patients p ON v.patient_id = p.id JOIN doctors d ON v.doctor_id = d.id WHERE DATE(v.created_at) = CURDATE() ORDER BY v.created_at ASC");
    res.json(rows);
  } catch (err) { next(err); }
});

app.post("/api/visits", async (req, res, next) => {
  try {
    const { patient_id, doctor_id, visit_type } = req.body;
    if (!patient_id || !doctor_id) return res.status(400).json({ error: "patient_id and doctor_id required" });
    const [result] = await pool.query("INSERT INTO visits (patient_id, doctor_id, visit_type, status) VALUES (?, ?, ?, 'waiting')", [patient_id, doctor_id, visit_type || "consultation"]);
    const [rows] = await pool.query("SELECT * FROM visits WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

app.patch("/api/visits/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID = ["waiting","consulting","completed","cancelled"];
    if (!VALID.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const [result] = await pool.query("UPDATE visits SET status=? WHERE id=?", [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Visit not found" });
    const [rows] = await pool.query("SELECT * FROM visits WHERE id=?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(new Date().toISOString(), err.message);
  res.status(500).json({ error: "Internal server error" });
});
app.use((req, res) => { res.status(404).json({ error: req.method + " " + req.path + " not found" }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Aura Dental Care API running on port " + PORT));
