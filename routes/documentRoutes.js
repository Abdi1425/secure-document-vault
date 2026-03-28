const express = require('express');
const documentController = require('../controllers/documentController');
const keyController = require('../controllers/keyController');
const { isLoggedIn, requireLogin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(isLoggedIn, requireLogin);

router.get('/upload', (req, res) => {
    res.render('upload', { user_details: req.user });
});
router.post('/upload', documentController.uploadMiddleware, documentController.uploadDocument);

router.get('/verify/:id', documentController.verifyDocument);

router.get('/sign/:id', (req, res) => {
    res.render('sign', { user_details: req.user, docId: req.params.id });
});
router.post('/sign/:id', documentController.signDocument);
router.get('/verify-signature/:id', documentController.verifySignature);

router.post('/generate-keys', keyController.generateKeyPair);
router.get('/list', documentController.listDocuments);

module.exports = router;