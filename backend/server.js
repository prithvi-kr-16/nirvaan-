require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ─── Multer PDF Storage ───────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are supported.'));
    cb(null, true);
  }
});

// ─── Mongoose Connection ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'nirvaan' })
  .then(() => console.log('✅ Connected to MongoDB Atlas (nirvaan)'))
  .catch(err => { console.error('❌ MongoDB connection error:', err.message); process.exit(1); });

// ─── Schemas & Models ─────────────────────────────────────────────────────────

// User
const UserSchema = new mongoose.Schema({
  account: { name: String, email: { type: String, unique: true, lowercase: true }, mobile: String, password: String },
  role: { type: String, default: 'patient' },
  profile: mongoose.Schema.Types.Mixed,
  healthProfile: {
    personalHealth: mongoose.Schema.Types.Mixed,
    medicalSummary: mongoose.Schema.Types.Mixed,
    medicalHistory: [mongoose.Schema.Types.Mixed]
  },
  familyMembers: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

// Doctor
const DoctorSchema = new mongoose.Schema({
  // sourceId makes the supplied directory safe to import more than once.
  sourceId: { type: String, index: true },
  name: String,
  specialty: String,
  specialization: String,
  qualification: String,
  hospital: String,
  clinicName: String,
  clinicAddress: String,
  location: String,
  city: String,
  experience: String,
  rating: { type: Number, default: 4.5 },
  fee: String,
  availableDays: String,
  availableTime: String,
  availability: String,
  photo: String,
  image: String,
  languages: String,
  about: String,
  phone: String,
  email: String
}, { timestamps: true });
const Doctor = mongoose.model('Doctor', DoctorSchema);

// Hospital
const HospitalSchema = new mongoose.Schema({
  name: String, type: String, address: String, city: String, state: String,
  phone: String, email: String, departments: [String], beds: Number,
  rating: { type: Number, default: 4.5 }, accredited: Boolean
}, { timestamps: true });
const Hospital = mongoose.model('Hospital', HospitalSchema);

// Appointment
const AppointmentSchema = new mongoose.Schema({
  userEmail: { type: String, lowercase: true }, type: String,
  doctorId: String, doctorName: String, hospitalName: String, department: String,
  name: String, phone: String, date: String, timeSlot: String,
  status: { type: String, default: 'Confirmed' }
}, { timestamps: true });
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// Medicine
const MedicineSchema = new mongoose.Schema({
  name: String, brand: String, category: String, dosage: String,
  price: Number, stock: { type: Number, default: 100 }, prescription: { type: Boolean, default: false },
  description: String, image: String
}, { timestamps: true });
const Medicine = mongoose.model('Medicine', MedicineSchema);

// PharmacyOrder
const PharmacyOrderSchema = new mongoose.Schema({
  email: { type: String, lowercase: true }, name: String, phone: String,
  address: String, items: [{ name: String, quantity: Number, price: Number }],
  total: Number, status: { type: String, default: 'Processing' }
}, { timestamps: true });
const PharmacyOrder = mongoose.model('PharmacyOrder', PharmacyOrderSchema);

// DiagnosticTest
const DiagnosticTestSchema = new mongoose.Schema({
  name: String, category: String, price: Number, description: String,
  duration: String, preparation: String, report: String
}, { timestamps: true });
const DiagnosticTest = mongoose.model('DiagnosticTest', DiagnosticTestSchema);

// DiagnosticBooking
const DiagnosticBookingSchema = new mongoose.Schema({
  email: { type: String, lowercase: true }, testName: String, name: String,
  phone: String, date: String, timeSlot: String, address: String,
  status: { type: String, default: 'Scheduled' }
}, { timestamps: true });
const DiagnosticBooking = mongoose.model('DiagnosticBooking', DiagnosticBookingSchema);

// AmbulanceDispatch
const DispatchSchema = new mongoose.Schema({
  email: { type: String, lowercase: true }, name: String, phone: String,
  location: String, condition: String, ambulanceType: String,
  status: { type: String, default: 'Dispatched' }
}, { timestamps: true });
const Dispatch = mongoose.model('Dispatch', DispatchSchema);

// CareProvider (Find Care)
const CareProviderSchema = new mongoose.Schema({
  name: String,
  careType: {
    type: String, required: true,
    enum: ['Home Nurses', 'Patient Care Helpers', 'Physiotherapy', 'Speech Therapy',
      'Elder Care', 'Post Surgery Care', 'Mother & Baby Care', 'Mental Wellness Support',
      'Disability Support', 'Respiratory Care', 'Bedridden Patient Care',
      'Companion Care', 'Trainer', 'Nutrient Support']
  },
  description: String, qualifications: String, experience: String,
  rating: { type: Number, default: 4.5 }, reviewCount: { type: Number, default: 0 },
  pricePerHour: Number, pricePerVisit: Number,
  city: String, location: String, address: String,
  phone: String, email: String, availability: String,
  languages: [String], gender: String,
  services: [String], image: String,
  isAvailable: { type: Boolean, default: true },
  verified: { type: Boolean, default: false }
}, { timestamps: true });
const CareProvider = mongoose.model('CareProvider', CareProviderSchema);

// CareBooking
const CareBookingSchema = new mongoose.Schema({
  userEmail: { type: String, lowercase: true }, userName: String, userPhone: String,
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareProvider' },
  providerName: String, careType: String,
  date: String, timeSlot: String, address: String,
  notes: String, status: { type: String, default: 'Confirmed' }
}, { timestamps: true });
const CareBooking = mongoose.model('CareBooking', CareBookingSchema);

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// Serve uploaded PDFs
app.use('/uploads', express.static(uploadDir));

// ─── AUTH ─────────────────────────────────────────────────────────────────────

// 1. Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { account, role, profile } = req.body;
    if (!account?.email || !account?.name || !account?.password)
      return res.status(400).json({ message: 'Missing required registration details.' });

    const exists = await User.findOne({ 'account.email': account.email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ account: { ...account, email: account.email.toLowerCase() }, role: role || 'patient', profile });
    res.status(201).json({ message: 'Account created successfully!', user: { name: user.account.name, email: user.account.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ 'account.email': email.toLowerCase() });
    if (!user || user.account.password !== password)
      return res.status(401).json({ message: 'Invalid email or password.' });

    res.status(200).json({ message: 'Login successful!', user: { name: user.account.name, email: user.account.email, role: user.role, mobile: user.account.mobile } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. OTP register (phone)
app.post('/api/auth/otp-register', async (req, res) => {
  try {
    const { mobile, name } = req.body;
    const email = `${mobile}@nirvaan.org`;
    const exists = await User.findOne({ 'account.email': email });
    if (exists) return res.status(409).json({ message: 'Account already exists with this mobile.' });

    const user = await User.create({ account: { name, email, mobile, password: 'OTP_VERIFIED' }, role: 'patient', profile: { name, mobile, email } });
    res.status(201).json({ message: 'OTP registration successful!', user: { name: user.account.name, email: user.account.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── USER DASHBOARD HISTORY ───────────────────────────────────────────────────

// 4. Get combined user history
app.get('/api/user/history', async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [appointments, orders, diagnostics, dispatches, careBookings] = await Promise.all([
      Appointment.find({ userEmail: email }).sort({ createdAt: -1 }),
      PharmacyOrder.find({ email }).sort({ createdAt: -1 }),
      DiagnosticBooking.find({ email }).sort({ createdAt: -1 }),
      Dispatch.find({ email }).sort({ createdAt: -1 }),
      CareBooking.find({ userEmail: email }).sort({ createdAt: -1 })
    ]);

    res.status(200).json({ appointments, orders, diagnostics, dispatches, careBookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── HEALTH PROFILE ───────────────────────────────────────────────────────────

// 5. Get health profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ 'account.email': email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const hp = user.healthProfile || {};
    if (!hp.personalHealth) {
      hp.personalHealth = { fullName: user.account.name, email: user.account.email, phone: user.account.mobile, dob: '', gender: '', bloodType: '', height: '', weight: '', emergencyContact: '', address: '' };
    }
    if (!hp.medicalSummary) hp.medicalSummary = { allergies: '', conditions: '', medications: '', surgeries: '', illnesses: '', vaccination: '', familyRisk: '', notes: '' };
    if (!hp.medicalHistory) hp.medicalHistory = [];

    res.status(200).json(hp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Update health profile
app.post('/api/user/profile', async (req, res) => {
  try {
    const { email, personalHealth, medicalSummary } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOneAndUpdate(
      { 'account.email': email.toLowerCase() },
      { $set: { 'healthProfile.personalHealth': personalHealth, 'healthProfile.medicalSummary': medicalSummary } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'Profile updated!', healthProfile: user.healthProfile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Add personal medical history record
app.post('/api/user/medical-history', async (req, res) => {
  try {
    const { email, record } = req.body;
    if (!email || !record) return res.status(400).json({ message: 'Email and record are required.' });

    const newRecord = { id: 'hist-' + Date.now(), ...record };
    const user = await User.findOneAndUpdate(
      { 'account.email': email.toLowerCase() },
      { $push: { 'healthProfile.medicalHistory': newRecord } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(201).json({ message: 'Record added!', record: newRecord });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. Delete personal medical history record
app.delete('/api/user/medical-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    await User.findOneAndUpdate(
      { 'account.email': email },
      { $pull: { 'healthProfile.medicalHistory': { id } } }
    );
    res.status(200).json({ message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── FAMILY MEMBERS ───────────────────────────────────────────────────────────

// 9. Get family members
app.get('/api/user/family', async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ 'account.email': email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user.familyMembers || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 10. Add family member
app.post('/api/user/family', async (req, res) => {
  try {
    const { email, member } = req.body;
    if (!email || !member) return res.status(400).json({ message: 'Email and member data required.' });

    const newMember = { id: 'fam-' + Date.now(), ...member, medicalHistory: [], medicalReports: [] };
    const user = await User.findOneAndUpdate(
      { 'account.email': email.toLowerCase() },
      { $push: { familyMembers: newMember } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(201).json({ message: 'Family member added!', member: newMember });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 11. Update family member
app.put('/api/user/family/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, member } = req.body;
    if (!email || !member) return res.status(400).json({ message: 'Email and member data required.' });

    const user = await User.findOne({ 'account.email': email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const idx = user.familyMembers.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Family member not found.' });

    const existing = user.familyMembers[idx];
    user.familyMembers[idx] = { ...existing, ...member, id, medicalHistory: existing.medicalHistory, medicalReports: existing.medicalReports };
    user.markModified('familyMembers');
    await user.save();
    res.status(200).json({ message: 'Family member updated!', member: user.familyMembers[idx] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 12. Delete family member
app.delete('/api/user/family/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ 'account.email': email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const member = user.familyMembers.find(m => m.id === id);
    if (member?.medicalReports) {
      for (const rep of member.medicalReports) {
        const fp = path.join(uploadDir, rep.filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    }

    await User.findOneAndUpdate({ 'account.email': email }, { $pull: { familyMembers: { id } } });
    res.status(200).json({ message: 'Family member deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 13. Add family member medical history
app.post('/api/user/family/:familyMemberId/medical-history', async (req, res) => {
  try {
    const { familyMemberId } = req.params;
    const { email, record } = req.body;
    if (!email || !record) return res.status(400).json({ message: 'Email and record required.' });

    const user = await User.findOne({ 'account.email': email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const member = user.familyMembers.find(m => m.id === familyMemberId);
    if (!member) return res.status(404).json({ message: 'Family member not found.' });

    const newRecord = { id: 'fam-hist-' + Date.now(), ...record };
    if (!member.medicalHistory) member.medicalHistory = [];
    member.medicalHistory.push(newRecord);
    user.markModified('familyMembers');
    await user.save();
    res.status(201).json({ message: 'Record added!', record: newRecord });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 14. Delete family member medical history record
app.delete('/api/user/family/:familyMemberId/medical-history/:recordId', async (req, res) => {
  try {
    const { familyMemberId, recordId } = req.params;
    const email = req.query.email?.toLowerCase();

    const user = await User.findOne({ 'account.email': email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const member = user.familyMembers.find(m => m.id === familyMemberId);
    if (!member) return res.status(404).json({ message: 'Family member not found.' });

    member.medicalHistory = (member.medicalHistory || []).filter(r => r.id !== recordId);
    user.markModified('familyMembers');
    await user.save();
    res.status(200).json({ message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 15. Upload family member medical report
app.post('/api/user/family/:familyMemberId/reports', upload.single('pdf'), async (req, res) => {
  try {
    const { familyMemberId } = req.params;
    const { email, name, type, date, doctor, notes } = req.body;

    if (!email) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded.' });

    const user = await User.findOne({ 'account.email': email.toLowerCase() });
    if (!user) { fs.unlinkSync(req.file.path); return res.status(404).json({ message: 'User not found.' }); }

    const member = user.familyMembers.find(m => m.id === familyMemberId);
    if (!member) { fs.unlinkSync(req.file.path); return res.status(404).json({ message: 'Family member not found.' }); }

    if (!member.medicalReports) member.medicalReports = [];
    const newReport = {
      id: 'rep-' + Date.now(), name: name || req.file.originalname.replace('.pdf', ''),
      type: type || 'Other', date: date || new Date().toISOString().split('T')[0],
      doctor: doctor || '', filename: req.file.filename, originalName: req.file.originalname,
      size: (req.file.size / (1024 * 1024)).toFixed(1) + ' MB',
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes: notes || ''
    };
    member.medicalReports.push(newReport);
    user.markModified('familyMembers');
    await user.save();
    res.status(201).json({ message: 'Report uploaded!', report: newReport });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 16. Serve PDF report
app.get('/api/user/reports/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const email = req.query.email?.toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ 'account.email': email });
    if (!user) return res.status(403).json({ message: 'Access denied.' });

    const hasAccess = (user.familyMembers || []).some(m =>
      (m.medicalReports || []).some(r => r.filename === filename)
    );
    if (!hasAccess) return res.status(403).json({ message: 'Access denied.' });

    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 17. Delete family member report
app.delete('/api/user/family/:familyMemberId/reports/:reportId', async (req, res) => {
  try {
    const { familyMemberId, reportId } = req.params;
    const email = req.query.email?.toLowerCase();

    const user = await User.findOne({ 'account.email': email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const member = user.familyMembers.find(m => m.id === familyMemberId);
    if (!member) return res.status(404).json({ message: 'Family member not found.' });

    const reportIdx = (member.medicalReports || []).findIndex(r => r.id === reportId);
    if (reportIdx === -1) return res.status(404).json({ message: 'Report not found.' });

    const report = member.medicalReports[reportIdx];
    const fp = path.join(uploadDir, report.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);

    member.medicalReports.splice(reportIdx, 1);
    user.markModified('familyMembers');
    await user.save();
    res.status(200).json({ message: 'Report deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DOCTORS ──────────────────────────────────────────────────────────────────

// Keep the public response compatible with both the original database fields
// and the doctor-card fields used by the frontend.
const formatDoctor = (doctor) => {
  const data = doctor.toObject ? doctor.toObject() : doctor;
  return {
    ...data,
    id: String(data._id || data.id),
    specialty: data.specialty || data.specialization || 'General Medicine',
    qualification: data.qualification || '',
    clinicName: data.clinicName || data.hospital || data.location || '',
    photo: data.photo || data.image || '',
    availableDays: data.availableDays || data.availability || 'Please call to confirm',
    availableTime: data.availableTime || 'Please call to confirm'
  };
};

// 18. Get all doctors (with optional search)
app.get('/api/doctors', async (req, res) => {
  try {
    const { search, city, specialization } = req.query;
    const filters = [];
    if (city) filters.push({ $or: [{ city: new RegExp(city, 'i') }, { location: new RegExp(city, 'i') }] });
    if (specialization) filters.push({ $or: [{ specialty: new RegExp(specialization, 'i') }, { specialization: new RegExp(specialization, 'i') }] });
    if (search) filters.push({
      $or: [
        { name: new RegExp(search, 'i') },
        { specialty: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') },
        { hospital: new RegExp(search, 'i') },
        { clinicName: new RegExp(search, 'i') }
      ]
    });
    const query = filters.length ? { $and: filters } : {};

    const doctors = await Doctor.find(query).sort({ rating: -1 });
    res.status(200).json(doctors.map(formatDoctor));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 19. Book doctor appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const appt = await Appointment.create(req.body);
    res.status(201).json({ message: 'Appointment booked successfully!', appointment: appt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── HOSPITALS ────────────────────────────────────────────────────────────────

// 20. Get hospitals
app.get('/api/hospitals', async (req, res) => {
  try {
    const { city, search } = req.query;
    const query = {};
    if (city) query.city = new RegExp(city, 'i');
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { city: new RegExp(search, 'i') }];
    const hospitals = await Hospital.find(query).sort({ rating: -1 });
    res.status(200).json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PHARMACY ─────────────────────────────────────────────────────────────────

// 21. Get medicines
app.get('/api/medicines', async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (category) query.category = new RegExp(category, 'i');
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { brand: new RegExp(search, 'i') }];
    const medicines = await Medicine.find(query);
    res.status(200).json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 22. Place pharmacy order
app.post('/api/orders', async (req, res) => {
  try {
    const order = await PharmacyOrder.create(req.body);
    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DIAGNOSTICS ─────────────────────────────────────────────────────────────

// 23. Get diagnostic tests
app.get('/api/tests', async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (category) query.category = new RegExp(category, 'i');
    if (search) query.name = new RegExp(search, 'i');
    const tests = await DiagnosticTest.find(query);
    res.status(200).json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 24. Book diagnostic test
app.post('/api/diagnostics', async (req, res) => {
  try {
    const booking = await DiagnosticBooking.create(req.body);
    res.status(201).json({ message: 'Test booked successfully!', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── EMERGENCY ────────────────────────────────────────────────────────────────

// 25. Request ambulance
app.post('/api/emergency', async (req, res) => {
  try {
    const dispatch = await Dispatch.create(req.body);
    res.status(201).json({ message: 'Ambulance dispatched!', dispatch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── FIND CARE / CARE PROVIDERS ───────────────────────────────────────────────

// 26. Get all care types (category list)
app.get('/api/care/types', (req, res) => {
  const careTypes = [
    { id: 'home-nurses', label: 'Home Nurses', description: 'Professional nursing care at your home', icon: '👩‍⚕️' },
    { id: 'patient-care-helpers', label: 'Patient Care Helpers', description: 'Trained helpers for daily patient care', icon: '🤝' },
    { id: 'physiotherapy', label: 'Physiotherapy', description: 'Physical therapy & rehabilitation', icon: '🏃' },
    { id: 'speech-therapy', label: 'Speech Therapy', description: 'Speech & language therapy', icon: '💬' },
    { id: 'elder-care', label: 'Elder Care', description: 'Specialized care for elderly', icon: '👴' },
    { id: 'post-surgery-care', label: 'Post Surgery Care', description: 'Recovery & post-surgery assistance', icon: '🏥' },
    { id: 'mother-baby-care', label: 'Mother & Baby Care', description: 'Maternal & newborn care at home', icon: '👶' },
    { id: 'mental-wellness', label: 'Mental Wellness Support', description: 'Counseling & mental health support', icon: '🧠' },
    { id: 'disability-support', label: 'Disability Support', description: 'Specialized care for differently abled', icon: '♿' },
    { id: 'respiratory-care', label: 'Respiratory Care', description: 'Breathing therapy & respiratory care', icon: '🫁' },
    { id: 'bedridden-care', label: 'Bedridden Patient Care', description: 'Complete care for bedridden patients', icon: '🛏️' },
    { id: 'companion-care', label: 'Companion Care', description: 'Trusted companionship & support', icon: '🤗' },
    { id: 'trainer', label: 'Trainer', description: 'Personal trainers for fitness & wellness', icon: '🏋️' },
    { id: 'nutrient-support', label: 'Nutrient Support', description: 'Diet & nutrition support at home', icon: '🥗' }
  ];
  res.status(200).json(careTypes);
});

// 27. Get care providers (searchable, filterable)
app.get('/api/care/providers', async (req, res) => {
  try {
    const { careType, city, search, available } = req.query;
    const filters = [];
    if (careType) filters.push({ careType: new RegExp(careType.replace(/-/g, ' '), 'i') });
    if (city) filters.push({
      $or: [
        { city: new RegExp(city, 'i') },
        { location: new RegExp(city, 'i') },
        { address: new RegExp(city, 'i') }
      ]
    });
    if (available === 'true') filters.push({ isAvailable: true });
    if (search) filters.push({
      $or: [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { careType: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') }
      ]
    });
    const query = filters.length ? { $and: filters } : {};
    const providers = await CareProvider.find(query).sort({ rating: -1, reviewCount: -1 });
    res.status(200).json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 28. Get single provider by ID
app.get('/api/care/providers/:id', async (req, res) => {
  try {
    const provider = await CareProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });
    res.status(200).json(provider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 29. Book care provider
app.post('/api/care/book', async (req, res) => {
  try {
    const { providerId, userEmail, userName, userPhone, date, timeSlot, address, notes } = req.body;
    if (!providerId || !userEmail || !date || !timeSlot)
      return res.status(400).json({ message: 'Provider ID, email, date and time slot are required.' });

    const provider = await CareProvider.findById(providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });

    const booking = await CareBooking.create({
      userEmail: userEmail.toLowerCase(), userName, userPhone,
      providerId, providerName: provider.name, careType: provider.careType,
      date, timeSlot, address, notes
    });
    res.status(201).json({ message: 'Care booking confirmed!', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 30. Admin: Add care provider
app.post('/api/admin/care/providers', async (req, res) => {
  try {
    const provider = await CareProvider.create(req.body);
    res.status(201).json({ message: 'Provider added!', provider });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 31. Admin: Update care provider
app.put('/api/admin/care/providers/:id', async (req, res) => {
  try {
    const provider = await CareProvider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!provider) return res.status(404).json({ message: 'Provider not found.' });
    res.status(200).json({ message: 'Provider updated!', provider });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 32. Admin: Delete care provider
app.delete('/api/admin/care/providers/:id', async (req, res) => {
  try {
    await CareProvider.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Provider deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 33. Seed sample care providers (run once)
app.post('/api/admin/seed-providers', async (req, res) => {
  try {
    const existing = await CareProvider.countDocuments();
    if (existing > 0) return res.status(200).json({ message: 'Providers already seeded.' });

    const sampleProviders = [
      { name: 'Priya Sharma', careType: 'Home Nurses', description: 'Experienced ICU-trained home nurse with 8 years of experience.', qualifications: 'B.Sc Nursing, ICU Certified', experience: '8 years', rating: 4.9, reviewCount: 142, pricePerHour: 350, city: 'Delhi', location: 'South Delhi', phone: '9876001001', gender: 'Female', availability: 'Mon-Sat, 6am-8pm', services: ['Wound Care', 'Medication Administration', 'IV Therapy', 'Vital Monitoring'], languages: ['Hindi', 'English'], verified: true },
      { name: 'Rajesh Kumar', careType: 'Home Nurses', description: 'Certified home nurse specializing in post-operative and critical care.', qualifications: 'GNM Nursing', experience: '6 years', rating: 4.7, reviewCount: 98, pricePerHour: 300, city: 'Mumbai', location: 'Andheri', phone: '9876001002', gender: 'Male', availability: 'Daily, 8am-6pm', services: ['Post-op Care', 'Catheter Care', 'Feeding Tube Management'], languages: ['Hindi', 'Marathi'], verified: true },
      { name: 'Anita Mehta', careType: 'Patient Care Helpers', description: 'Compassionate care helper for elderly and recovering patients.', qualifications: 'Nursing Assistant Certificate', experience: '4 years', rating: 4.6, reviewCount: 67, pricePerHour: 200, city: 'Delhi', location: 'North Delhi', phone: '9876001003', gender: 'Female', availability: 'Mon-Fri, 8am-8pm', services: ['Bathing Assistance', 'Meal Preparation', 'Mobility Support', 'Companionship'], languages: ['Hindi', 'Punjabi'], verified: true },
      { name: 'Dr. Sanjay Patel', careType: 'Physiotherapy', description: 'Certified physiotherapist specializing in orthopedic and neurological rehabilitation.', qualifications: 'BPT, MPT (Ortho)', experience: '10 years', rating: 4.8, reviewCount: 203, pricePerHour: 500, pricePerVisit: 700, city: 'Ahmedabad', location: 'Navrangpura', phone: '9876001004', gender: 'Male', availability: 'Daily, 9am-5pm', services: ['Sports Injuries', 'Post-Stroke Rehab', 'Back Pain', 'Knee Rehabilitation'], languages: ['Hindi', 'Gujarati', 'English'], verified: true },
      { name: 'Meena Iyer', careType: 'Physiotherapy', description: 'Expert in home-based physiotherapy for elderly and post-surgical patients.', qualifications: 'BPT', experience: '7 years', rating: 4.7, reviewCount: 115, pricePerHour: 450, city: 'Bangalore', location: 'Koramangala', phone: '9876001005', gender: 'Female', availability: 'Mon-Sat, 8am-6pm', services: ['Manual Therapy', 'Electrotherapy', 'Geriatric Physio'], languages: ['Kannada', 'Tamil', 'English'], verified: true },
      { name: 'Dr. Ritu Agarwal', careType: 'Speech Therapy', description: 'Certified speech language pathologist helping children and adults.', qualifications: 'M.Sc Speech & Language Pathology', experience: '9 years', rating: 4.9, reviewCount: 178, pricePerHour: 600, city: 'Delhi', location: 'West Delhi', phone: '9876001006', gender: 'Female', availability: 'Mon-Sat, 10am-6pm', services: ['Autism Communication', 'Stuttering Therapy', 'Voice Disorders', 'Swallowing Disorders'], languages: ['Hindi', 'English'], verified: true },
      { name: 'Sunita Rao', careType: 'Elder Care', description: 'Dedicated elder care specialist with expertise in geriatric health management.', qualifications: 'BSc Nursing, Geriatric Care Certified', experience: '12 years', rating: 4.8, reviewCount: 231, pricePerHour: 400, city: 'Hyderabad', location: 'Jubilee Hills', phone: '9876001007', gender: 'Female', availability: 'Daily, 24x7 available', services: ['Alzheimer Care', 'Mobility Assistance', 'Medication Management', 'Fall Prevention'], languages: ['Telugu', 'Hindi', 'English'], verified: true },
      { name: 'Kavya Nair', careType: 'Mother & Baby Care', description: 'Certified lactation consultant and newborn care expert.', qualifications: 'ANM, IBCLC Certified', experience: '5 years', rating: 4.9, reviewCount: 89, pricePerHour: 350, city: 'Kochi', location: 'Ernakulam', phone: '9876001008', gender: 'Female', availability: 'Daily, 7am-9pm', services: ['Breastfeeding Support', 'Newborn Bathing', 'Postpartum Care', 'Baby Massage'], languages: ['Malayalam', 'Hindi', 'English'], verified: true },
      { name: 'Dr. Ashwin Desai', careType: 'Mental Wellness Support', description: 'Licensed counselor and mental wellness coach specializing in anxiety and depression.', qualifications: 'M.A. Psychology, Licensed Counselor', experience: '11 years', rating: 4.8, reviewCount: 164, pricePerHour: 700, city: 'Mumbai', location: 'Bandra', phone: '9876001009', gender: 'Male', availability: 'Mon-Fri, 11am-7pm', services: ['Anxiety Therapy', 'Depression Counseling', 'Stress Management', 'Family Therapy'], languages: ['Hindi', 'Marathi', 'English'], verified: true },
      { name: 'Pooja Singh', careType: 'Disability Support', description: 'Experienced disability support worker for physically and intellectually disabled individuals.', qualifications: 'BSc Occupational Therapy', experience: '6 years', rating: 4.7, reviewCount: 72, pricePerHour: 300, city: 'Delhi', location: 'East Delhi', phone: '9876001010', gender: 'Female', availability: 'Mon-Sat, 8am-6pm', services: ['Wheelchair Assistance', 'Life Skills Training', 'Community Integration', 'Behavioral Support'], languages: ['Hindi', 'English'], verified: true },
      { name: 'Dr. Harish Menon', careType: 'Respiratory Care', description: 'Respiratory therapist specializing in COPD, asthma, and ventilator management at home.', qualifications: 'B.Sc Respiratory Therapy, CRT', experience: '8 years', rating: 4.8, reviewCount: 93, pricePerHour: 550, city: 'Chennai', location: 'T. Nagar', phone: '9876001011', gender: 'Male', availability: 'Daily, 24x7 on-call', services: ['Oxygen Therapy', 'Nebulization', 'Chest Physiotherapy', 'Ventilator Care'], languages: ['Tamil', 'Malayalam', 'English'], verified: true },
      { name: 'Geeta Pandey', careType: 'Bedridden Patient Care', description: 'Specialist in comprehensive care for completely bedridden patients including ICU-level support at home.', qualifications: 'B.Sc Nursing, Critical Care Certified', experience: '9 years', rating: 4.9, reviewCount: 187, pricePerHour: 450, city: 'Delhi', location: 'Dwarka', phone: '9876001012', gender: 'Female', availability: 'Daily, 12-hour shifts', services: ['Pressure Sore Prevention', 'Nasogastric Feeding', 'Urinary Catheter Care', 'Bed Bath'], languages: ['Hindi', 'English'], verified: true },
      { name: 'Arjun Kapoor', careType: 'Companion Care', description: 'Friendly companion care provider for the elderly, offering emotional support and daily activity assistance.', qualifications: 'Social Work Diploma, First Aid Certified', experience: '3 years', rating: 4.6, reviewCount: 44, pricePerHour: 200, city: 'Pune', location: 'Kothrud', phone: '9876001013', gender: 'Male', availability: 'Daily, flexible hours', services: ['Social Engagement', 'Errand Running', 'Light Housekeeping', 'Medication Reminders'], languages: ['Hindi', 'Marathi', 'English'], verified: false },
      { name: 'Neha Joshi', careType: 'Trainer', description: 'Certified personal trainer and wellness coach specializing in rehabilitation fitness and senior fitness.', qualifications: 'ACE Certified Personal Trainer, Yoga Instructor', experience: '5 years', rating: 4.7, reviewCount: 128, pricePerHour: 400, city: 'Bangalore', location: 'Indiranagar', phone: '9876001014', gender: 'Female', availability: 'Daily, 6am-8pm', services: ['Strength Training', 'Yoga', 'Senior Fitness', 'Post-Rehab Exercise'], languages: ['Kannada', 'Hindi', 'English'], verified: true },
      { name: 'Divya Pillai', careType: 'Nutrient Support', description: 'Registered dietitian providing personalized nutrition counseling and meal planning at home.', qualifications: 'M.Sc Dietetics, RD', experience: '7 years', rating: 4.8, reviewCount: 156, pricePerHour: 500, city: 'Kochi', location: 'Kakkanad', phone: '9876001015', gender: 'Female', availability: 'Mon-Sat, 9am-5pm', services: ['Diabetic Diet', 'Weight Management', 'Heart-Healthy Diet', 'Cancer Nutrition'], languages: ['Malayalam', 'Tamil', 'English'], verified: true },
      { name: 'Suresh Yadav', careType: 'Post Surgery Care', description: 'Expert in post-operative recovery care at home including wound management and mobility support.', qualifications: 'GNM, Wound Care Certified', experience: '7 years', rating: 4.8, reviewCount: 134, pricePerHour: 400, city: 'Lucknow', location: 'Gomti Nagar', phone: '9876001016', gender: 'Male', availability: 'Daily, 8am-8pm', services: ['Wound Dressing', 'Suture Care', 'Physiotherapy Assistance', 'Drain Management'], languages: ['Hindi', 'English'], verified: true }
    ];

    await CareProvider.insertMany(sampleProviders);
    res.status(201).json({ message: `Seeded ${sampleProviders.length} care providers.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── SERVER START ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Nirvaan Backend running at http://localhost:${PORT}`);
});
