/**
 * AUTHENTICATION CONTROLLER
 * 
 * PURPOSE: Handle user registration, login, and logout
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

exports.register = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    pool.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
            return res.render('register', { message: 'Database error' });
        }

        if (results.length > 0) {
            return res.render('register', { message: 'That email is already registered' });
        }

        if (password !== passwordConfirm) {
            return res.render('register', { message: 'Passwords do not match' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.render('register', { message: 'Registration failed' });
                }
                res.render('register', { message: 'User Registered Successfully! Please login.' });
            }
        );
    });
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('login', { message: 'Please provide email and password' });
        }

        pool.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            if (error) {
                console.log(error);
                return res.render('login', { message: 'Database error' });
            }

            if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
                return res.render('login', { message: 'Invalid email or password' });
            }

            const user = results[0];
            
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            const cookieOptions = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
                httpOnly: true
            };

            res.cookie('jwt', token, cookieOptions);
            res.redirect('/');
        });
    } catch (error) {
        console.log(error);
        res.render('login', { message: 'Login failed' });
    }
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 1000),
        httpOnly: true
    });
    res.redirect('/');
};
