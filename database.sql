-- ============================================================
-- AURA DENTAL CLINIC — Database Schema (Enhanced)
-- MySQL 8.0+
-- Run: mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS aura_dental 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE aura_dental;

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  age INT,
  gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
  contact VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  medicalHistory JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_contact (contact)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCTORS (Enhanced with salary & perks)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  specialty VARCHAR(150) DEFAULT 'Dental Surgeon',
  qualification VARCHAR(200),
  contact VARCHAR(20),
  email VARCHAR(150) UNIQUE,
  password VARCHAR(100),
  securityPin VARCHAR(4),
  -- Salary & Perks
  salary DECIMAL(10,2) DEFAULT 0,
  hra DECIMAL(10,2) DEFAULT 0,
  ta DECIMAL(10,2) DEFAULT 0,
  medical DECIMAL(10,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  otherPerkLabel VARCHAR(100),
  otherPerk DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TREATMENTS (Master list)
-- ============================================================
CREATE TABLE IF NOT EXISTS treatments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MEDICINES (Master list)
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CHAIRS
-- ============================================================
CREATE TABLE IF NOT EXISTS chairs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('available', 'occupied', 'cleaning') DEFAULT 'available',
  patientName VARCHAR(150),
  startTime DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCTOR QUEUE (Walk-ins)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientId INT NOT NULL,
  time VARCHAR(10),
  consultationFee DECIMAL(10,2) DEFAULT 0,
  status ENUM('waiting', 'with-doctor', 'completed', 'cancelled') DEFAULT 'waiting',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VISITS (Core clinical record)
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientId INT NOT NULL,
  doctorId INT NOT NULL,
  visitDate DATE NOT NULL,
  chiefComplaint VARCHAR(250),
  diagnosis TEXT,
  labTests JSON,
  teeth JSON,
  notes TEXT,
  procedureDone TEXT,
  totalCost DECIMAL(10,2) DEFAULT 0,
  amountPaid DECIMAL(10,2) DEFAULT 0,
  paymentMethod VARCHAR(50),
  discount DECIMAL(10,2) DEFAULT 0,
  discountReason VARCHAR(250),
  finalAmount DECIMAL(10,2),
  chairAssigned INT,
  status ENUM('pending', 'in-treatment', 'completed', 'cancelled') DEFAULT 'pending',
  paymentStatus ENUM('pending', 'paid') DEFAULT 'pending',
  prescriptionReady TINYINT(1) DEFAULT 0,
  prescriptionPrinted TINYINT(1) DEFAULT 0,
  opdReviewedAt DATETIME,
  rxPrintedAt DATETIME,
  completedAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE RESTRICT,
  INDEX idx_patient (patientId),
  INDEX idx_doctor (doctorId),
  INDEX idx_date (visitDate),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VISIT TREATMENTS (Junction table)
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_treatments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitId INT NOT NULL,
  treatmentId INT,
  treatmentName VARCHAR(150),
  cost DECIMAL(10,2),
  FOREIGN KEY (visitId) REFERENCES visits(id) ON DELETE CASCADE,
  INDEX idx_visit (visitId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VISIT MEDICINES (Junction table)
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitId INT NOT NULL,
  medicineId INT,
  medicineName VARCHAR(150),
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  FOREIGN KEY (visitId) REFERENCES visits(id) ON DELETE CASCADE,
  INDEX idx_visit (visitId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USERS (Login credentials)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(150),
  role ENUM('admin', 'doctor', 'receptionist') DEFAULT 'receptionist',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STAFF (Enhanced with perks)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  password VARCHAR(100),
  securityPin VARCHAR(4),
  contact VARCHAR(20),
  salary DECIMAL(10,2) DEFAULT 0,
  hra DECIMAL(10,2) DEFAULT 0,
  ta DECIMAL(10,2) DEFAULT 0,
  medical DECIMAL(10,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Doctors
INSERT IGNORE INTO doctors (id, name, specialty, email, password, securityPin, salary, hra, ta, medical, bonus) VALUES
  (1, 'Dr. Sahil Chawla', 'Dental Surgeon', 'sahil@auradental.com', 'doctor123', '1234', 80000, 20000, 5000, 3000, 120000),
  (2, 'Dr. Kiran Kumar', 'Orthodontist', 'kiran@auradental.com', 'doctor123', '2345', 75000, 18000, 5000, 3000, 100000),
  (3, 'Dr. Priyal Sharma', 'Endodontist', 'priyal@auradental.com', 'doctor123', '3456', 70000, 17000, 5000, 3000, 90000);

-- Treatments
INSERT IGNORE INTO treatments (id, name, cost) VALUES
  (1, 'Consultation', 500),
  (2, 'Scaling & Polishing', 1500),
  (3, 'Root Canal Treatment', 3000),
  (4, 'PFM Crown', 5000),
  (5, 'Extraction', 1000),
  (6, 'Composite Filling', 800),
  (7, 'Teeth Whitening', 8000),
  (8, 'Braces (Full)', 50000),
  (9, 'Denture (Full)', 15000),
  (10, 'Implant', 25000),
  (11, 'Cavity Filling', 600),
  (12, 'Deep Cleaning', 2500),
  (13, 'Wisdom Tooth Extraction', 2000),
  (14, 'Gum Treatment', 3500);

-- Medicines
INSERT IGNORE INTO medicines (id, name, dosage, frequency, duration) VALUES
  (1, 'AMOXICILLIN 500MG', '1 tablet', '3 times/day', '5 days'),
  (2, 'IBUPROFEN 400MG', '1 tablet', '3 times/day', '3 days'),
  (3, 'METRONIDAZOLE 400MG', '1 tablet', '3 times/day', '5 days'),
  (4, 'PARACETAMOL 500MG', '1-2 tablets', 'As needed', '3 days'),
  (5, 'CHLORHEXIDINE MOUTHWASH', '10ml rinse', 'Twice daily', '7 days'),
  (6, 'VITAMIN C 500MG', '1 tablet', 'Once daily', '10 days'),
  (7, 'DICLOFENAC GEL', 'Apply locally', '3 times/day', '5 days'),
  (8, 'BETADINE GARGLE', '15ml diluted', 'Twice daily', '5 days');

-- Chairs
INSERT IGNORE INTO chairs (id) VALUES (1), (2), (3), (4), (5), (6);

-- Users
INSERT IGNORE INTO users (id, username, password, name, role) VALUES
  (1, 'admin', 'admin123', 'Admin User', 'admin'),
  (2, 'doctor1', 'doctor123', 'Dr. Sahil Chawla', 'doctor'),
  (3, 'reception', 'reception123', 'Reception Staff', 'receptionist');

-- Staff
INSERT IGNORE INTO staff (id, name, role, email, password, securityPin, salary, hra, ta, medical, bonus) VALUES
  (1, 'Emma Wilson', 'Receptionist', 'emma@auradental.com', 'reception123', '4567', 25000, 5000, 2000, 1000, 20000),
  (2, 'James Brown', 'Dental Assistant', 'james@auradental.com', 'assistant123', '5678', 20000, 4000, 2000, 1000, 15000);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- SELECT 'Database setup complete!' AS status;
-- SELECT COUNT(*) AS doctor_count FROM doctors;
-- SELECT COUNT(*) AS treatment_count FROM treatments;
-- SELECT COUNT(*) AS medicine_count FROM medicines;
-- SELECT COUNT(*) AS chair_count FROM chairs;
