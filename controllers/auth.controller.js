const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id, role = null) => {
  const payload = role ? { id, role } : { id };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private (Admin only)
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese email.' });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public Register user
// @route   POST /api/auth/public-register
// @access  Public
exports.publicRegister = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese email.' });
    }

    const user = await User.create({ name, email, password, role: 'receptionist' });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Usuario desactivado. Contacte al administrador.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Patient Login
// @route   POST /api/auth/patient-login
// @access  Public
exports.patientLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { dni, email } = req.body;
    const Patient = require('../models/Patient');
    
    // Case insensitive email search
    const patient = await Patient.findOne({ dni, email: email.toLowerCase() });
    if (!patient) return res.status(401).json({ success: false, message: 'Credenciales inválidas o paciente no registrado.' });

    const token = generateToken(patient._id, 'patient');

    res.json({
      success: true,
      data: {
        token,
        user: { _id: patient._id, name: `${patient.firstName} ${patient.lastName}`, email: patient.email, role: 'patient', isPatient: true }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta.' });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, data: { token }, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese email.' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

// @desc    Toggle user active status
// @route   PATCH /api/auth/users/:id/toggle
// @access  Private (Admin only)
exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'No podés desactivar tu propia cuenta.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user, message: `Usuario ${user.isActive ? 'activado' : 'desactivado'}.` });
  } catch (error) { next(error); }
};
