const pool = require('../config/database');
const cryptoUtils = require('../utils/crypto');

exports.generateKeyPair = (req, res) => {
    try {
        const userId = req.user.id;
        
        // Generate keys
        const { privateKey, publicKey } = cryptoUtils.generateKeyPair();
        
        // Insert or update keys
        pool.query(
            'SELECT id FROM user_keys WHERE user_id = ?',
            [userId],
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.redirect('/profile'); 
                }
                
                if (results.length > 0) {
                    // Update existing
                    pool.query(
                        'UPDATE user_keys SET public_key = ?, private_key = ? WHERE user_id = ?',
                        [publicKey, privateKey, userId],
                        (err) => {
                            if (err) console.log(err);
                            res.redirect('/profile');
                        }
                    );
                } else {
                    // Insert new
                    pool.query(
                        'INSERT INTO user_keys (user_id, public_key, private_key) VALUES (?, ?, ?)',
                        [userId, publicKey, privateKey],
                        (err) => {
                            if (err) console.log(err);
                            res.redirect('/profile');
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.redirect('/profile');
    }
};
