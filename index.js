const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/pageRoutes'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/documents', require('./routes/documentRoutes'));

app.use((req, res) => {
    res.status(404).render('index', {
        user_details: req.user,
        message: 'Page not found'
    });
});

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║   🔐 Secure Document Vault                        ║
    ║   Server running on: http://localhost:${PORT}       ║
    ║   Press Ctrl+C to stop                            ║
    ╚═══════════════════════════════════════════════════╝
    `);
});