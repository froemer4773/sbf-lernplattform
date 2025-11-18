require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// Middleware
// ================================

// Security
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: 'Zu viele Anfragen von dieser IP, bitte später erneut versuchen.'
});
app.use('/api/', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ================================
// Routes - Angepasst für Ihre Datenbank
// ================================

const authRoutes = require('./routes/auth.routes');
const questionRoutes = require('./routes/question.routes');
const progressRoutes = require('./routes/progress.routes');

app.use('/api/auth', authRoutes);
app.use('/api', questionRoutes);
app.use('/api/progress', progressRoutes);

// ================================
// Health Check
// ================================

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: process.env.DB_NAME
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'SBF-Lernplattform API',
        version: '2.0.0 - Angepasst für bestehende Datenbank',
        database: 'd0455d0b',
        docs: '/api/docs'
    });
});

// ================================
// Error Handling
// ================================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' && status === 500
        ? 'Ein Fehler ist aufgetreten'
        : err.message;
    
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ================================
// Start Server
// ================================

const db = require('./config/database');

// Test Database Connection
db.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        console.log('📊 Database:', process.env.DB_NAME);
        console.log('👤 User:', process.env.DB_USER);
        connection.release();
        
        // Start Server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔐 CORS enabled for: ${process.env.FRONTEND_URL}`);
            console.log('\n📋 API Endpoints:');
            console.log('  POST   /api/auth/register');
            console.log('  POST   /api/auth/login');
            console.log('  GET    /api/auth/me');
            console.log('  GET    /api/licenses');
            console.log('  GET    /api/categories/:schein');
            console.log('  GET    /api/questions');
            console.log('  GET    /api/questions/:frage_id');
            console.log('  GET    /api/questions/:frage_id/image');
            console.log('  POST   /api/progress/submit');
            console.log('  GET    /api/progress/user');
            console.log('  GET    /api/progress/wrong');
            console.log('  GET    /api/progress/bookmarks');
        });
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.error('💡 Bitte .env Datei überprüfen:');
        console.error('   DB_HOST=' + process.env.DB_HOST);
        console.error('   DB_USER=' + process.env.DB_USER);
        console.error('   DB_NAME=' + process.env.DB_NAME);
        process.exit(1);
    });

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    db.end();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    db.end();
    process.exit(0);
});

module.exports = app;
