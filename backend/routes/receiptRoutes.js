const express = require('express');
const router = express.Router();
const {
  uploadAndScanReceipt,
  getReceiptById,
  getUserReceipts,
  deleteReceipt,
} = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', protect, upload.single('receipt'), uploadAndScanReceipt);
router.get('/', protect, getUserReceipts);
router.get('/:id', protect, getReceiptById);
router.delete('/:id', protect, deleteReceipt);

module.exports = router;
