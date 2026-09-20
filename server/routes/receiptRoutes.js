const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadReceipt, scanReceipt } = require('../controllers/receiptController');

router.use(protect);

router.post('/upload', upload.single('receipt'), uploadReceipt);
router.post('/:id/scan', scanReceipt);

module.exports = router;
