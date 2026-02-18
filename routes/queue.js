const express = require('express');
const router = express.Router();

const getDb = (req) => req.app.locals.db;

// ============================================================
// DOCTOR QUEUE & CHAIRS API
// ============================================================

// GET today's queue
router.get('/queue', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute(
      `SELECT q.*, p.name, p.contact, p.age, p.gender
       FROM doctor_queue q
       JOIN patients p ON q.patientId=p.id
       WHERE DATE(q.createdAt)=CURDATE()
       ORDER BY q.createdAt ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add patient to queue
router.post('/queue', async (req, res) => {
  try {
    const db = getDb(req);
    const { patientId, time, consultationFee } = req.body;
    
    const [result] = await db.execute(
      "INSERT INTO doctor_queue (patientId, time, consultationFee, status) VALUES (?, ?, ?, 'waiting')",
      [patientId, time || '', consultationFee || 0]
    );
    
    res.json({ id: result.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update queue status
router.put('/queue/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const { status } = req.body;
    
    await db.execute(
      'UPDATE doctor_queue SET status=? WHERE id=?',
      [status, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE queue entry
router.delete('/queue/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM doctor_queue WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all chairs
router.get('/chairs', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM chairs ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update chair status
router.put('/chairs/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const { status, patientName, startTime } = req.body;
    
    await db.execute(
      'UPDATE chairs SET status=?, patientName=?, startTime=? WHERE id=?',
      [status, patientName || null, startTime || null, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
