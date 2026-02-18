const express = require('express');
const router = express.Router();

// Get database from app.locals
const getDb = (req) => req.app.locals.db;

// ============================================================
// PATIENTS API
// ============================================================

// GET all patients
router.get('/patients', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute(
      'SELECT * FROM patients ORDER BY createdAt DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single patient
router.get('/patients/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute(
      'SELECT * FROM patients WHERE id = ?',
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create patient
router.post('/patients', async (req, res) => {
  try {
    const db = getDb(req);
    const { name, age, gender, contact, email, address, medicalHistory } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO patients (name, age, gender, contact, email, address, medicalHistory)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        age || null,
        gender || 'Male',
        contact || '',
        email || '',
        address || '',
        JSON.stringify(medicalHistory || [])
      ]
    );
    
    res.json({ id: result.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update patient
router.put('/patients/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const { name, age, gender, contact, email, address } = req.body;
    
    await db.execute(
      `UPDATE patients 
       SET name=?, age=?, gender=?, contact=?, email=?, address=?
       WHERE id=?`,
      [name, age, gender, contact, email || '', address || '', req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE patient
router.delete('/patients/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM patients WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET patient visit history
router.get('/patients/:id/history', async (req, res) => {
  try {
    const db = getDb(req);
    const [visits] = await db.execute(
      `SELECT v.*, 
              GROUP_CONCAT(DISTINCT vt.treatmentName) as treatments,
              GROUP_CONCAT(DISTINCT vm.medicineName) as medicines
       FROM visits v
       LEFT JOIN visit_treatments vt ON v.id = vt.visitId
       LEFT JOIN visit_medicines vm ON v.id = vm.visitId
       WHERE v.patientId = ?
       GROUP BY v.id
       ORDER BY v.visitDate DESC`,
      [req.params.id]
    );
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
