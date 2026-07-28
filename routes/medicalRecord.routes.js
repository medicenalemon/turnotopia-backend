const express = require('express');
const { getRecords, getRecord, getPatientRecords, createRecord, updateRecord, deleteRecord } = require('../controllers/medicalRecord.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.use(auth);

router.route('/').get(getRecords).post(createRecord);
router.get('/patient/:patientId', getPatientRecords);
router.route('/:id').get(getRecord).put(updateRecord).delete(authorize('admin'), deleteRecord);

module.exports = router;
