const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/specialties', require('./routes/specialty.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/medical-records', require('./routes/medicalRecord.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/public', require('./routes/public.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Turnotopia API is running 🏥' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🏥 Turnotopia Server running on port ${PORT}`);
});

module.exports = app;
