const express = require('express');
const { getDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctor.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.use(auth);

router.route('/').get(getDoctors).post(authorize('admin'), createDoctor);
router.route('/:id').get(getDoctor).put(authorize('admin'), updateDoctor).delete(authorize('admin'), deleteDoctor);

module.exports = router;
