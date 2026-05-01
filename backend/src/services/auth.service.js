const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/env');
const { generateId } = require('../utils/helpers');

class AuthService {
  async login(username, password) {
    const user = await db('users')
      .where(function() {
        this.where('username', username).orWhere('email', username);
      })
      .where('is_active', true)
      .first();

    if (!user) {
      const err = new Error('Invalid credentials');
      err.type = 'unauthorized';
      throw err;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      const err = new Error('Invalid credentials');
      err.type = 'unauthorized';
      throw err;
    }

    // Update last login
    await db('users').where('id', user.id).update({ last_login: new Date() });

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      }
    };
  }

  async register(userData) {
    const existing = await db('users')
      .where('username', userData.username)
      .orWhere('email', userData.email)
      .first();

    if (existing) {
      const err = new Error('Username or email already exists');
      err.type = 'conflict';
      throw err;
    }

    const passwordHash = await bcrypt.hash(userData.password, 12);
    const id = generateId();

    const [user] = await db('users').insert({
      id,
      username: userData.username,
      email: userData.email,
      full_name: userData.full_name,
      password_hash: passwordHash,
      role: userData.role || 'sales_attendant',
      permissions: userData.permissions || JSON.stringify({ can_make_sales: true, can_receive_payments: true, can_edit_stock: false }),
      is_active: true
    }).returning(['id', 'username', 'email', 'full_name', 'role', 'permissions', 'created_at']);

    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await db('users').where('id', userId).first();
    if (!user) {
      const err = new Error('User not found');
      err.type = 'not_found';
      throw err;
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      const err = new Error('Current password is incorrect');
      err.type = 'unauthorized';
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db('users').where('id', userId).update({ password_hash: passwordHash, updated_at: new Date() });

    return { message: 'Password changed successfully' };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await db('users').where('id', decoded.id).where('is_active', true).first();

      if (!user) {
        const err = new Error('User not found or inactive');
        err.type = 'unauthorized';
        throw err;
      }

      const newToken = this.generateToken(user);
      return { token: newToken };
    } catch (error) {
      const err = new Error('Invalid refresh token');
      err.type = 'unauthorized';
      throw err;
    }
  }

  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        full_name: user.full_name,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions 
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );
  }
}

module.exports = new AuthService();
