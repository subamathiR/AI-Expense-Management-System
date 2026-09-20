const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getReports,
  createReport,
  submitReport,
} = require('../controllers/reportController');

router.use(protect);

router.get('/', getReports);
router.post('/', createReport);
router.post('/:id/submit', submitReport);

module.exports = router;
