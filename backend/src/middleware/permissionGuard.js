function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    const perms = req.user.permissions || {};
    if (!perms[permissionKey]) {
      return res.status(403).json({ error: 'Insufficient permissions for this action.' });
    }
    next();
  };
}

module.exports = { requirePermission };
