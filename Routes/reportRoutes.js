const express = require("express");
const router = express.Router();
const { generateReport, getReports, downloadReport } = require("../controllers/reportController");
const { verifyToken } = require("../middleware/auth");

router.post("/generate", verifyToken, generateReport);
router.get("/", verifyToken, getReports);
router.get("/:reportId/download", verifyToken, downloadReport);

module.exports = router; 