const express = require('express');
const { publicCheckin } = require('../controllers/public.controller');
const router = express.Router();

router.post('/checkin', publicCheckin);

module.exports = router;
