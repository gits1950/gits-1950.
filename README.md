# 🦷 Aura Dental Clinic — Cloud Deployment

> Complete dental clinic management system with real-time features, ready for cloud deployment

**Tech Stack:** Node.js • Express • Socket.io • MySQL • Vanilla JS SPA

---

## 📦 What's Included

```
aura-cloud/
├── public/
│   └── index.html          ← Complete SPA (10,353 lines)
├── routes/
│   ├── patients.js         ← Patient CRUD + history
│   ├── visits.js           ← Treatment workflow + prescriptions
│   ├── queue.js            ← Walk-in queue + chairs
│   └── reference.js        ← Doctors/treatments/medicines/auth
├── server.js               ← Main server (Socket.io + Express)
├── database.sql            ← MySQL schema + seed data
├── package.json
├── .env.example            ← Copy to .env
├── Procfile                ← For Render/Railway/Heroku
├── .gitignore
└── README.md               ← This file
```

---

## ✨ Features

### Clinical Workflow
- ✅ Patient registration + medical history
- ✅ Walk-in queue management
- ✅ Complete OPD form (Chief Complaint → Diagnosis → Tooth Chart → Treatments → Medicines)
- ✅ **OPD Review** — Pre-filled form for additional treatment after payment
- ✅ Payment collection + chair assignment
- ✅ Real-time doctor ↔ reception sync (Socket.io)
- ✅ Prescription generation + printing

### Staff & Doctor Management
- ✅ **Add/Edit Doctors** with salary + perks (HRA, TA, Medical, Bonus)
- ✅ **Add/Edit Staff** with salary + perks
- ✅ Live CTC calculator
- ✅ Auto-populate login dropdown
- ✅ Security PIN for password reset

### Real-Time (Socket.io)
- ✅ Doctor finalizes Rx → Reception gets instant alert (sound + green popup)
- ✅ Notification badges
- ✅ Live activity feed
- ✅ Multi-device sync

### Reports & Analytics
- ✅ Dashboard stats (revenue, patients, in-treatment count)
- ✅ Daily/monthly revenue reports
- ✅ Doctor-wise earnings
- ✅ Treatment-wise analysis

---

## 🚀 Quick Start (Local)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd aura-cloud
npm install
```

### 2. Setup Database
```bash
# Create database and tables
mysql -u root -p < database.sql
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env and set your DB_PASSWORD
```

### 4. Start Server
```bash
npm start          # Production
npm run dev        # Development (auto-reload)
```

### 5. Open Browser
```
http://localhost:3000
```

**Default Logins:**
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@auradental.com` | `admin123` |
| Doctor | `sahil@auradental.com` | `doctor123` |
| Reception | `emma@auradental.com` | `reception123` |

---

## ☁️ Cloud Deployment

### Option A: Render.com (Recommended — Free Tier)

**1. Create MySQL Database**

Visit [PlanetScale](https://planetscale.com) or [Aiven](https://aiven.io):
- Create free MySQL database
- Note: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Import schema: `mysql -h HOST -u USER -p DB_NAME < database.sql`

**2. Deploy to Render**

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     ```
     DB_HOST=your_mysql_host
     DB_USER=your_mysql_user
     DB_PASSWORD=your_mysql_password
     DB_NAME=aura_dental
     ```
5. Click **Create Web Service**
6. Wait 2-3 minutes → Your app is live! 🎉

**URL:** `https://aura-dental-clinic.onrender.com`

---

### Option B: Railway.app

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add MySQL plugin (Railway provides it free)
4. Add environment variables (Railway auto-sets `DATABASE_URL`)
5. Deploy

**Free Credit:** $5/month included

---

### Option C: Heroku

```bash
# Install Heroku CLI first
heroku login
heroku create aura-dental-clinic

# Add MySQL (JawsDB free tier)
heroku addons:create jawsdb:kitefin

# Deploy
git push heroku main

# Import database
heroku run mysql -h JAWSDB_HOST -u JAWSDB_USER -p < database.sql
```

---

### Option D: DigitalOcean / AWS / Your VPS

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MySQL
sudo apt install mysql-server

# 4. Clone & setup
git clone <your-repo>
cd aura-cloud
npm install
mysql -u root -p < database.sql

# 5. Use PM2 to keep running
sudo npm install -g pm2
pm2 start server.js --name aura-dental
pm2 save
pm2 startup
```

**Setup Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | — | MySQL password |
| `DB_NAME` | Yes | `aura_dental` | Database name |
| `PORT` | No | `3000` | Server port (cloud sets this) |
| `NODE_ENV` | No | `production` | Environment |

### Database Schema

**Tables:**
- `patients` — Patient records
- `doctors` — Doctor profiles + salary/perks
- `staff` — Staff profiles + salary/perks
- `treatments` — Master treatment list
- `medicines` — Master medicine list
- `visits` — Core clinical records
- `visit_treatments` — Junction table
- `visit_medicines` — Junction table
- `chairs` — Dental chair status
- `doctor_queue` — Walk-in queue
- `users` — Login credentials

---

## 📡 API Endpoints

### Patients
- `GET /api/patients` — List all
- `GET /api/patients/:id` — Get one
- `POST /api/patients` — Create
- `PUT /api/patients/:id` — Update
- `GET /api/patients/:id/history` — Visit history

### Visits
- `POST /api/visits` — Create treatment plan
- `PUT /api/visits/:id/payment` — Collect payment + assign chair
- `PUT /api/visits/:id/update` — OPD review (add more treatments)
- `PUT /api/visits/:id/complete` — Complete treatment + generate Rx
- `GET /api/visits/in-treatment` — Current patients on chairs
- `GET /api/visits/pending-rx` — Prescriptions ready to print
- `PUT /api/visits/:id/rx-printed` — Mark printed

### Queue
- `GET /api/queue` — Today's walk-in queue
- `POST /api/queue` — Add to queue
- `PUT /api/queue/:id` — Update status
- `GET /api/chairs` — All chairs

### Reference Data
- `GET /api/doctors` — All doctors
- `POST /api/doctors` — Add doctor
- `PUT /api/doctors/:id` — Update doctor
- `GET /api/treatments` — All treatments
- `GET /api/medicines` — All medicines
- `POST /api/auth/login` — Login

### Real-Time (Socket.io)
- `sendPrescription` — Doctor → Reception (instant alert)
- `prescriptionPrinted` — Reception → Doctor (confirmation)
- `confirmPayment` — Payment event

---

## 🧪 Testing

### Test OPD Review Workflow

1. **Login as Reception** → Add walk-in patient → Send to queue
2. **Login as Doctor** → Open patient from queue
3. Fill OPD form: Chief Complaint, Diagnosis, Teeth, Treatments
4. Save treatment plan
5. **Back to Reception** → Collect payment (₹3,000) → Assign Chair 1
6. **Back to Doctor** → Patient now in "In Treatment"
7. Click **"View"** → See summary
8. Click **"📋 Open Full OPD Form"** → Pre-filled form opens
9. **Add more:** Select additional tooth, check "Cavity Filling", update diagnosis
10. Click **"💾 Save & Continue"**
11. Click **"✅ Start Treatment"** → Enter procedure notes, finalize
12. **Reception gets instant alert** (beep + green popup)
13. **Reception** → Print prescription

### Test Doctor/Staff Management

1. **Login as Admin** → Go to Settings
2. Click **"+ Add Doctor"**
3. Fill: Name, Email, Password, PIN, Salary (₹80,000), HRA (₹20,000)
4. Watch CTC update → Save
5. Logout → See new doctor in login dropdown
6. Go to Payroll → Add staff with perks
7. Verify table shows Base | Perks | Total CTC

---

## 🔒 Security Notes

- Change all default passwords in production
- Use strong Security PINs (not 1234, 5678)
- Enable HTTPS (free with Let's Encrypt)
- Set up database backups (daily recommended)
- Use environment variables for secrets (never commit .env)
- For production, add rate limiting and input validation

---

## 📊 Performance Tips

**For production:**
```javascript
// In server.js, add:
app.use(express.json({ limit: '10mb' }));

// Database connection pool (already configured):
connectionLimit: 10  // Adjust based on traffic
```

**Enable gzip compression:**
```bash
npm install compression
```
```javascript
const compression = require('compression');
app.use(compression());
```

---

## 🐛 Troubleshooting

**Database connection fails:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p

# Check environment variables
echo $DB_PASSWORD
```

**Socket.io not connecting:**
- Check firewall allows WebSocket connections
- Verify CORS settings in server.js
- Check browser console for errors

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=8080 npm start
```

---

## 📝 Changelog

**v2.0.0** (Current)
- ✅ OPD Review form with full re-assessment
- ✅ Doctor management with salary + 6 perks
- ✅ Staff perks (HRA, TA, Medical, Bonus)
- ✅ Live CTC calculator
- ✅ Auto-populate login dropdown
- ✅ Enhanced database schema

**v1.0.0**
- Initial release with core features

---

## 🤝 Support

For issues or questions:
1. Check this README
2. Review error logs: `pm2 logs aura-dental`
3. Check database schema matches your import

---

## 📜 License

MIT License — Free to use and modify

---

**Built with ❤️ for Aura Dental Clinic**

🌐 **Live Demo:** *[Your deployed URL]*  
📧 **Support:** *[Your email]*  
💻 **GitHub:** *[Your repo URL]*
