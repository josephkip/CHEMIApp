const db = require('../config/database');

exports.getAll = async (req, res, next) => {
  try {
    const users = await db('users').select('id', 'username', 'email', 'full_name', 'role', 'permissions', 'is_active', 'last_login', 'created_at').orderBy('created_at', 'desc');
    res.json(users);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { full_name, email, role, permissions } = req.body;
    
    const updateData = { full_name, email, role, updated_at: new Date() };
    if (permissions !== undefined) updateData.permissions = permissions;

    const [user] = await db('users').where('id', req.params.id)
      .update(updateData)
      .returning(['id', 'username', 'email', 'full_name', 'role', 'permissions', 'is_active']);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const user = await db('users').where('id', req.params.id).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [updated] = await db('users').where('id', req.params.id)
      .update({ is_active: !user.is_active, updated_at: new Date() })
      .returning(['id', 'username', 'full_name', 'is_active']);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('User@123', 12);
    await db('users').where('id', req.params.id).update({ password_hash: hash, updated_at: new Date() });
    res.json({ message: 'Password reset to default (User@123)' });
  } catch (err) { next(err); }
};
