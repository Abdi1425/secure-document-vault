const express = require('express');
const { isLoggedIn, requireLogin } = require('../middleware/authMiddleware');
const pool = require('../config/database');

const router = express.Router();

router.get('/', isLoggedIn, (req, res) => {
    res.render('index', { user_details: req.user });
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/profile', isLoggedIn, requireLogin, (req, res) => {
    pool.query(
        'SELECT public_key FROM user_keys WHERE user_id = ?',
        [req.user.id],
        (error, keys) => {
            res.render('profile', {
                user_details: req.user,
                hasKeys: keys && keys.length > 0,
                publicKey: keys && keys.length > 0 ? keys[0].public_key.substring(0, 100) + '...' : null
            });
        }
    );
});

module.exports = router;