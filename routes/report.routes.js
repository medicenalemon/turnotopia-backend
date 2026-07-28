const express = require('express');
const { getReports } = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.get('/', auth, authorize('admin', 'doctor'), getReports);

module.exports = router;
