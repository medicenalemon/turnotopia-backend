const express = require('express');
const { getStats } = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getStats);

module.exports = router;
