const express = require('express');
const router = express.Router();
const { generateReport, getReports, downloadReport } = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

// Generate report endpoint - protected with admin authentication
router.get('/', getReports);
// /id/download
router.get('/:reportId/download', downloadReport);
router.post('/generate', generateReport);

module.exports = router; 