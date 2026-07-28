const express = require('express');
const { getPatients, getPatient, createPatient, updatePatient, deletePatient, getPatientAppointments } = require('../controllers/patient.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.use(auth);

router.route('/').get(getPatients).post(createPatient);
router.route('/:id').get(getPatient).put(updatePatient).delete(authorize('admin'), deletePatient);
router.get('/:id/appointments', getPatientAppointments);

module.exports = router;
