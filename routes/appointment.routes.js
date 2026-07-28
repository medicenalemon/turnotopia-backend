const express = require('express');
const { getAppointments, getAppointment, createAppointment, updateAppointment, updateStatus, deleteAppointment, getAvailableSlots, checkinAppointment, callPatient, completeVisit, getWaitingRoom } = require('../controllers/appointment.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.use(auth);

router.get('/available-slots', getAvailableSlots);
router.get('/waiting-room', getWaitingRoom);
router.route('/').get(getAppointments).post(createAppointment);
router.route('/:id').get(getAppointment).put(updateAppointment).delete(authorize('admin'), deleteAppointment);
router.patch('/:id/status', updateStatus);
router.patch('/:id/checkin', checkinAppointment);
router.patch('/:id/call', callPatient);
router.patch('/:id/complete-visit', completeVisit);

module.exports = router;
