const { ROLES } = require('../utils/constants');

function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

function adminOnly(req, res, next) {
  return roleGuard(ROLES.ADMIN, ROLES.SUPER_ADMIN)(req, res, next);
}

function superAdminOnly(req, res, next) {
  return roleGuard(ROLES.SUPER_ADMIN)(req, res, next);
}

module.exports = { roleGuard, adminOnly, superAdminOnly };
