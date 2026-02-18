const express = require('express');
const router = express.Router();

const getDb = (req) => req.app.locals.db;

// ============================================================
// REFERENCE DATA & AUTH API
// ============================================================

// GET all doctors
router.get('/doctors', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM doctors ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create doctor
router.post('/doctors', async (req, res) => {
  try {
    const db = getDb(req);
    const {
      name, specialty, qualification, email, password, contact, securityPin,
      salary, hra, ta, medical, bonus, otherPerkLabel, otherPerk, notes
    } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO doctors (
        name, specialty, qualification, email, password, contact, securityPin,
        salary, hra, ta, medical, bonus, otherPerkLabel, otherPerk, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, specialty || 'Dental Surgeon', qualification || '',
        email, password, contact || '', securityPin || '',
        salary || 0, hra || 0, ta || 0, medical || 0, bonus || 0,
        otherPerkLabel || '', otherPerk || 0, notes || ''
      ]
    );
    
    res.json({ id: result.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update doctor
router.put('/doctors/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const {
      name, specialty, qualification, email, password, contact,
      salary, hra, ta, medical, bonus, otherPerkLabel, otherPerk, notes
    } = req.body;
    
    await db.execute(
      `UPDATE doctors SET
        name=?, specialty=?, qualification=?, email=?, password=?, contact=?,
        salary=?, hra=?, ta=?, medical=?, bonus=?, 
        otherPerkLabel=?, otherPerk=?, notes=?
       WHERE id=?`,
      [
        name, specialty, qualification, email, password, contact,
        salary || 0, hra || 0, ta || 0, medical || 0, bonus || 0,
        otherPerkLabel || '', otherPerk || 0, notes || '',
        req.params.id
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE doctor
router.delete('/doctors/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM doctors WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all treatments
router.get('/treatments', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM treatments ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create treatment
router.post('/treatments', async (req, res) => {
  try {
    const db = getDb(req);
    const { name, cost, description } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO treatments (name, cost, description) VALUES (?, ?, ?)',
      [name, cost || 0, description || '']
    );
    
    res.json({ id: result.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update treatment
router.put('/treatments/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const { name, cost, description } = req.body;
    
    await db.execute(
      'UPDATE treatments SET name=?, cost=?, description=? WHERE id=?',
      [name, cost, description, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE treatment
router.delete('/treatments/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM treatments WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all medicines
router.get('/medicines', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM medicines ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create medicine
router.post('/medicines', async (req, res) => {
  try {
    const db = getDb(req);
    const { name, dosage, frequency, duration } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO medicines (name, dosage, frequency, duration) VALUES (?, ?, ?, ?)',
      [name, dosage || '', frequency || '', duration || '']
    );
    
    res.json({ id: result.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update medicine
router.put('/medicines/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const { name, dosage, frequency, duration } = req.body;
    
    await db.execute(
      'UPDATE medicines SET name=?, dosage=?, frequency=?, duration=? WHERE id=?',
      [name, dosage, frequency, duration, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE medicine
router.delete('/medicines/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM medicines WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AUTH: Login
router.post('/auth/login', async (req, res) => {
  try {
    const db = getDb(req);
    const { username, password } = req.body;
    
    const [[user]] = await db.execute(
      'SELECT * FROM users WHERE username=? AND password=?',
      [username, password]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
