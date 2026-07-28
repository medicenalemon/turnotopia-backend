const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updatePassword, getUsers, updateUser, toggleUserActive } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.post('/register', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('role').isIn(['admin', 'doctor', 'receptionist']).withMessage('Rol inválido')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], login);

router.get('/me', auth, getMe);
router.put('/password', auth, updatePassword);
router.get('/users', auth, authorize('admin'), getUsers);
router.put('/users/:id', auth, authorize('admin'), updateUser);
router.patch('/users/:id/toggle', auth, authorize('admin'), toggleUserActive);

module.exports = router;
