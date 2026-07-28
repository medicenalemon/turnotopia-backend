const Specialty = require('../models/Specialty');

exports.getSpecialties = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    const specialties = await Specialty.find(filter).sort('name');
    res.json({ success: true, count: specialties.length, data: specialties });
  } catch (error) { next(error); }
};

exports.getSpecialty = async (req, res, next) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) return res.status(404).json({ success: false, message: 'Especialidad no encontrada.' });
    res.json({ success: true, data: specialty });
  } catch (error) { next(error); }
};

exports.createSpecialty = async (req, res, next) => {
  try {
    const specialty = await Specialty.create(req.body);
    res.status(201).json({ success: true, data: specialty });
  } catch (error) { next(error); }
};

exports.updateSpecialty = async (req, res, next) => {
  try {
    const specialty = await Specialty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!specialty) return res.status(404).json({ success: false, message: 'Especialidad no encontrada.' });
    res.json({ success: true, data: specialty });
  } catch (error) { next(error); }
};

exports.deleteSpecialty = async (req, res, next) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) return res.status(404).json({ success: false, message: 'Especialidad no encontrada.' });
    specialty.isActive = false;
    await specialty.save();
    res.json({ success: true, message: 'Especialidad desactivada correctamente.' });
  } catch (error) { next(error); }
};
