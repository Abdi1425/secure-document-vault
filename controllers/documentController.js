/**
 * DOCUMENT MANAGEMENT CONTROLLER
 * 
 * PURPOSE: Handle document upload, integrity verification, and digital signatures
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../config/database');
const cryptoUtils = require('../utils/crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

exports.uploadMiddleware = upload.single('document');

exports.uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user.id;

        if (!file) {
            return res.render('upload', {
                user_details: req.user,
                message: 'Please select a file'
            });
        }

        const filePath = file.path;
        const hashes = cryptoUtils.computeAllHashes(filePath);
        const forceUpload = req.body.forceUpload === 'true';

        const insertDocument = () => {
            pool.query(
                `INSERT INTO documents (user_id, filename, file_path, file_size, md5_hash, sha1_hash, sha256_hash) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, file.originalname, filePath, file.size, hashes.md5, hashes.sha1, hashes.sha256],
                (error, result) => {
                    if (error) {
                        console.log(error);
                        return res.render('upload', {
                            user_details: req.user,
                            message: 'Database error'
                        });
                    }

                    res.render('upload', {
                        user_details: req.user,
                        message: 'Document uploaded successfully!',
                        hashes: hashes,
                        docId: result.insertId
                    });
                }
            );
        };

        if (forceUpload) {
            insertDocument();
        } else {
            // Check for duplicates for this specific user
            pool.query(
                'SELECT id, filename FROM documents WHERE sha256_hash = ? AND user_id = ?',
                [hashes.sha256, userId],
                (duplicateError, duplicateResults) => {
                    if (duplicateError) {
                        console.log(duplicateError);
                        return res.render('upload', {
                            user_details: req.user,
                            message: 'Database error during duplicate check'
                        });
                    }

                    if (duplicateResults.length > 0) {
                        // Duplicate found for this user
                        // Remove the currently uploaded file to save disk space
                        try {
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        } catch (err) {
                            console.error('Failed to remove duplicate file:', err);
                        }

                        const existingDoc = duplicateResults[0];

                        return res.render('upload', {
                            user_details: req.user,
                            duplicateWarning: true,
                            existingDocId: existingDoc.id,
                            existingFilename: existingDoc.filename,
                            message: `The document you selected is identical to a document already in your vault: ${existingDoc.filename}.`
                        });
                    }

                    // If no duplicate is found, proceed with inserting the new document
                    insertDocument();
                }
            );
        }
    } catch (error) {
        console.log(error);
        res.render('upload', {
            user_details: req.user,
            message: 'Upload failed'
        });
    }
};

exports.verifyDocument = (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id;

    pool.query(
        'SELECT * FROM documents WHERE id = ? AND user_id = ?',
        [docId, userId],
        (error, documents) => {
            if (error || documents.length === 0) {
                return res.render('verify', {
                    user_details: req.user,
                    message: 'Document not found'
                });
            }

            const doc = documents[0];
            const currentHashes = cryptoUtils.computeAllHashes(doc.file_path);

            const verification = {
                md5: currentHashes.md5 === doc.md5_hash,
                sha1: currentHashes.sha1 === doc.sha1_hash,
                sha256: currentHashes.sha256 === doc.sha256_hash
            };

            const isIntegrityIntact = verification.md5 && verification.sha1 && verification.sha256;

            res.render('verify', {
                user_details: req.user,
                document: doc,
                verification: verification,
                isIntegrityIntact: isIntegrityIntact,
                currentHashes: currentHashes
            });
        }
    );
};

exports.signDocument = (req, res) => {
    const docId = req.params.id;
    const userId = req.user.id;

    pool.query(
        'SELECT private_key FROM user_keys WHERE user_id = ?',
        [userId],
        (error, keys) => {
            if (error || keys.length === 0) {
                return res.render('sign', {
                    user_details: req.user,
                    message: 'Please generate your RSA key pair first',
                    docId: docId
                });
            }

            pool.query(
                'SELECT * FROM documents WHERE id = ? AND user_id = ?',
                [docId, userId],
                (error, docs) => {
                    if (error || docs.length === 0) {
                        return res.render('sign', {
                            user_details: req.user,
                            message: 'Document not found'
                        });
                    }

                    const doc = docs[0];
                    const signature = cryptoUtils.signDocument(doc.file_path, keys[0].private_key);

                    pool.query(
                        'INSERT INTO digital_signatures (document_id, user_id, signature) VALUES (?, ?, ?)',
                        [docId, userId, signature],
                        (error, result) => {
                            if (error) {
                                console.log(error);
                                return res.render('sign', {
                                    user_details: req.user,
                                    message: 'Failed to save signature'
                                });
                            }

                            res.render('sign', {
                                user_details: req.user,
                                message: 'Document signed successfully!',
                                signature: signature.substring(0, 100) + '...',
                                docId: docId
                            });
                        }
                    );
                }
            );
        }
    );
};

exports.verifySignature = (req, res) => {
    const docId = req.params.id;

    pool.query(
        `SELECT d.*, ds.signature, ds.user_id as signer_id, u.name as signer_name, uk.public_key
         FROM documents d
         JOIN digital_signatures ds ON d.id = ds.document_id
         JOIN users u ON ds.user_id = u.id
         JOIN user_keys uk ON ds.user_id = uk.user_id
         WHERE d.id = ?`,
        [docId],
        (error, results) => {
            if (error || results.length === 0) {
                return res.render('verifySignature', {
                    user_details: req.user,
                    message: 'No signature found for this document'
                });
            }

            const doc = results[0];
            const isValid = cryptoUtils.verifySignature(
                doc.file_path,
                doc.signature,
                doc.public_key
            );

            res.render('verifySignature', {
                user_details: req.user,
                document: doc,
                isValid: isValid,
                signer: doc.signer_name
            });
        }
    );
};

exports.listDocuments = (req, res) => {
    const userId = req.user.id;

    pool.query(
        `SELECT d.*, 
         (SELECT COUNT(*) FROM digital_signatures WHERE document_id = d.id) as has_signature
         FROM documents d 
         WHERE user_id = ? 
         ORDER BY uploaded_at DESC`,
        [userId],
        (error, documents) => {
            if (error) {
                console.log(error);
                return res.render('documents', {
                    user_details: req.user,
                    message: 'Error loading documents'
                });
            }
            res.render('documents', {
                user_details: req.user,
                documents: documents
            });
        }
    );
};