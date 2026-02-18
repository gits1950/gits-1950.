const express = require('express');
const router = express.Router();

const getDb = (req) => req.app.locals.db;

// ============================================================
// VISITS / TREATMENT PLANS API
// ============================================================

// POST create visit/treatment plan
router.post('/visits', async (req, res) => {
  const db = getDb(req);
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const {
      patientId, doctorId, chiefComplaint, diagnosis,
      labTests, teeth, treatments, medicines, notes, totalCost
    } = req.body;
    
    // Create visit record
    const [result] = await conn.execute(
      `INSERT INTO visits (
        patientId, doctorId, visitDate, chiefComplaint, diagnosis,
        labTests, teeth, notes, totalCost, status, paymentStatus
      ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      [
        patientId,
        doctorId,
        chiefComplaint || '',
        diagnosis || '',
        JSON.stringify(labTests || []),
        JSON.stringify(teeth || []),
        notes || '',
        totalCost || 0
      ]
    );
    
    const visitId = result.insertId;
    
    // Insert treatments
    if (treatments && treatments.length > 0) {
      for (const t of treatments) {
        await conn.execute(
          'INSERT INTO visit_treatments (visitId, treatmentId, treatmentName, cost) VALUES (?, ?, ?, ?)',
          [visitId, t.id, t.name, t.cost || 0]
        );
      }
    }
    
    // Insert medicines
    if (medicines && medicines.length > 0) {
      for (const m of medicines) {
        await conn.execute(
          'INSERT INTO visit_medicines (visitId, medicineId, medicineName, dosage, frequency, duration) VALUES (?, ?, ?, ?, ?, ?)',
          [visitId, m.id, m.name, m.dosage || '', m.frequency || '', m.duration || '']
        );
      }
    }
    
    await conn.commit();
    res.json({ id: visitId, success: true });
    
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// PUT collect payment + assign chair
router.put('/visits/:id/payment', async (req, res) => {
  const db = getDb(req);
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const { amountPaid, paymentMethod, chairAssigned } = req.body;
    
    await conn.execute(
      `UPDATE visits 
       SET amountPaid=?, paymentMethod=?, chairAssigned=?, 
           paymentStatus='paid', status='in-treatment'
       WHERE id=?`,
      [amountPaid || 0, paymentMethod || 'Cash', chairAssigned, req.params.id]
    );
    
    // Update chair status
    if (chairAssigned) {
      const [[visit]] = await conn.execute(
        `SELECT p.name FROM visits v JOIN patients p ON v.patientId=p.id WHERE v.id=?`,
        [req.params.id]
      );
      
      await conn.execute(
        `UPDATE chairs SET status='occupied', patientName=?, startTime=NOW() WHERE id=?`,
        [visit ? visit.name : '', chairAssigned]
      );
    }
    
    await conn.commit();
    res.json({ success: true });
    
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// PUT update visit (OPD review / further treatment)
router.put('/visits/:id/update', async (req, res) => {
  const db = getDb(req);
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const {
      chiefComplaint, diagnosis, labTests, teeth,
      treatments, medicines, notes, totalCost
    } = req.body;
    
    await conn.execute(
      `UPDATE visits 
       SET chiefComplaint=?, diagnosis=?, labTests=?, teeth=?, 
           notes=?, totalCost=?, opdReviewedAt=NOW()
       WHERE id=?`,
      [
        chiefComplaint,
        diagnosis,
        JSON.stringify(labTests || []),
        JSON.stringify(teeth || []),
        notes || '',
        totalCost || 0,
        req.params.id
      ]
    );
    
    // Replace treatments
    await conn.execute('DELETE FROM visit_treatments WHERE visitId=?', [req.params.id]);
    if (treatments && treatments.length > 0) {
      for (const t of treatments) {
        await conn.execute(
          'INSERT INTO visit_treatments (visitId, treatmentId, treatmentName, cost) VALUES (?, ?, ?, ?)',
          [req.params.id, t.id, t.name, t.cost || 0]
        );
      }
    }
    
    // Replace medicines
    await conn.execute('DELETE FROM visit_medicines WHERE visitId=?', [req.params.id]);
    if (medicines && medicines.length > 0) {
      for (const m of medicines) {
        await conn.execute(
          'INSERT INTO visit_medicines (visitId, medicineId, medicineName, dosage, frequency, duration) VALUES (?, ?, ?, ?, ?, ?)',
          [req.params.id, m.id, m.name, m.dosage || '', m.frequency || '', m.duration || '']
        );
      }
    }
    
    await conn.commit();
    res.json({ success: true });
    
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// PUT complete treatment + generate prescription
router.put('/visits/:id/complete', async (req, res) => {
  const db = getDb(req);
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const { procedureDone, discount, discountReason, medicines } = req.body;
    
    const [[visit]] = await conn.execute('SELECT * FROM visits WHERE id=?', [req.params.id]);
    const finalAmount = (visit.totalCost || 0) - (discount || 0);
    
    await conn.execute(
      `UPDATE visits 
       SET procedureDone=?, discount=?, discountReason=?, finalAmount=?,
           status='completed', prescriptionReady=1, completedAt=NOW()
       WHERE id=?`,
      [procedureDone, discount || 0, discountReason || '', finalAmount, req.params.id]
    );
    
    // Update medicines if changed
    if (medicines) {
      await conn.execute('DELETE FROM visit_medicines WHERE visitId=?', [req.params.id]);
      for (const m of medicines) {
        await conn.execute(
          'INSERT INTO visit_medicines (visitId, medicineId, medicineName, dosage, frequency, duration) VALUES (?, ?, ?, ?, ?, ?)',
          [req.params.id, m.id, m.name, m.dosage || '', m.frequency || '', m.duration || '']
        );
      }
    }
    
    // Free chair
    if (visit.chairAssigned) {
      await conn.execute(
        `UPDATE chairs SET status='available', patientName=NULL, startTime=NULL WHERE id=?`,
        [visit.chairAssigned]
      );
    }
    
    await conn.commit();
    res.json({ success: true, finalAmount });
    
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// GET all in-treatment visits
router.get('/visits/in-treatment', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute(
      `SELECT v.*, p.name AS patientName, p.contact, p.age, p.gender,
              d.name AS doctorName
       FROM visits v
       JOIN patients p ON v.patientId=p.id
       JOIN doctors d ON v.doctorId=d.id
       WHERE v.status='in-treatment'
       ORDER BY v.visitDate DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single visit with full details
router.get('/visits/:id', async (req, res) => {
  try {
    const db = getDb(req);
    
    const [[visit]] = await db.execute('SELECT * FROM visits WHERE id=?', [req.params.id]);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    
    const [treatments] = await db.execute('SELECT * FROM visit_treatments WHERE visitId=?', [req.params.id]);
    const [medicines] = await db.execute('SELECT * FROM visit_medicines WHERE visitId=?', [req.params.id]);
    
    res.json({
      ...visit,
      labTests: JSON.parse(visit.labTests || '[]'),
      teeth: JSON.parse(visit.teeth || '[]'),
      treatments,
      medicines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET visits ready for prescription printing
router.get('/visits/pending-rx', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute(
      `SELECT v.*, p.name AS patientName, d.name AS doctorName
       FROM visits v
       JOIN patients p ON v.patientId=p.id
       JOIN doctors d ON v.doctorId=d.id
       WHERE v.prescriptionReady=1 
         AND (v.prescriptionPrinted IS NULL OR v.prescriptionPrinted=0)
       ORDER BY v.completedAt DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mark prescription printed
router.put('/visits/:id/rx-printed', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute(
      'UPDATE visits SET prescriptionPrinted=1, rxPrintedAt=NOW() WHERE id=?',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const db = getDb(req);
    
    const [[rev]] = await db.execute(
      "SELECT COALESCE(SUM(amountPaid), 0) AS today FROM visits WHERE DATE(visitDate)=CURDATE()"
    );
    const [[total]] = await db.execute('SELECT COUNT(*) AS cnt FROM patients');
    const [[inTx]] = await db.execute("SELECT COUNT(*) AS cnt FROM visits WHERE status='in-treatment'");
    const [[pendRx]] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM visits WHERE prescriptionReady=1 AND (prescriptionPrinted IS NULL OR prescriptionPrinted=0)'
    );
    
    res.json({
      todayRevenue: rev.today,
      totalPatients: total.cnt,
      inTreatment: inTx.cnt,
      pendingPrescriptions: pendRx.cnt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
