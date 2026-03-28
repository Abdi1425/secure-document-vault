/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * PURPOSE: Protect routes by verifying JWT tokens
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const pool = require('../config/database');

const isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            pool.query(
                'SELECT id, name, email FROM users WHERE id = ?',
                [decoded.id],
                (error, results) => {
                    if (error || results.length === 0) {
                        return next();
                    }
                    req.user = results[0];
                    return next();
                }
            );
        } catch (error) {
            console.log('Token verification failed:', error.message);
            return next();
        }
    } else {
        next();
    }
};

const requireLogin = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
};

module.exports = { isLoggedIn, requireLogin };
