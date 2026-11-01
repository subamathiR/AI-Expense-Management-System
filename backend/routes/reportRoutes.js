const express = require('express');
const router = express.Router();
const {
  getReports,
  createReport,
  getReportById,
  exportReportCSV,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getReports);
router.post('/', protect, createReport);
router.get('/:id', protect, getReportById);
router.get('/:id/export-csv', protect, exportReportCSV);

module.exports = router;
