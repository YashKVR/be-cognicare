const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'CogniCare Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/organizations', require('./routes/organizations.route'));
app.use('/api/clinics', require('./routes/clinics.route'));
app.use('/api/addons', require('./routes/addons.route'));
app.use('/api/patients', require('./routes/patients.route'));
app.use('/api/appointments', require('./routes/appointments.route'));
app.use('/api/ehr', require('./routes/ehr.route'));
app.use('/api/analytics', require('./routes/analytics.route'));
app.use('/api/backup', require('./routes/backup.route'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 CogniCare Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;