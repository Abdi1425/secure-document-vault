/**
 * CRYPTOGRAPHIC UTILITIES
 * 
 * PURPOSE: Core cryptographic functions for Week 7 concepts
 * TECH: Node.js built-in 'crypto' module
 */

const crypto = require('crypto');
const fs = require('fs');

/**
 * Compute hash of a file using specified algorithm
 */
function computeHash(filePath, algorithm = 'sha256') {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash(algorithm);
    hash.update(fileBuffer);
    return hash.digest('hex');
}

/**
 * Compute all three hash types for a file
 */
function computeAllHashes(filePath) {
    return {
        md5: computeHash(filePath, 'md5'),
        sha1: computeHash(filePath, 'sha1'),
        sha256: computeHash(filePath, 'sha256')
    };
}

/**
 * Generate RSA key pair for digital signatures
 */
function generateKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    return { privateKey, publicKey };
}

/**
 * Create digital signature for a file using private key
 */
function signDocument(filePath, privateKey) {
    const fileBuffer = fs.readFileSync(filePath);
    const sign = crypto.createSign('SHA256');
    sign.update(fileBuffer);
    sign.end();
    return sign.sign(privateKey, 'base64');
}

/**
 * Verify digital signature using public key
 */
function verifySignature(filePath, signature, publicKey) {
    const fileBuffer = fs.readFileSync(filePath);
    const verify = crypto.createVerify('SHA256');
    verify.update(fileBuffer);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
}

module.exports = {
    computeHash,
    computeAllHashes,
    generateKeyPair,
    signDocument,
    verifySignature
};