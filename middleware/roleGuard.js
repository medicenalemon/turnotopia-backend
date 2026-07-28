const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Debe autenticarse primero.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `El rol '${req.user.role}' no tiene permisos para esta acción.` 
      });
    }

    next();
  };
};

module.exports = authorize;
