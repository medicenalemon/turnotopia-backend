const express = require('express');
const { getSpecialties, getSpecialty, createSpecialty, updateSpecialty, deleteSpecialty } = require('../controllers/specialty.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.use(auth);

router.route('/').get(getSpecialties).post(authorize('admin'), createSpecialty);
router.route('/:id').get(getSpecialty).put(authorize('admin'), updateSpecialty).delete(authorize('admin'), deleteSpecialty);

module.exports = router;
