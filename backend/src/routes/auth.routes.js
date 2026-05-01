const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const { superAdminOnly } = require('../middleware/roleGuard');

router.post('/login', auth.login);
router.post('/register', authenticate, superAdminOnly, auth.register);
router.post('/refresh', auth.refreshToken);
router.put('/change-password', authenticate, auth.changePassword);
router.get('/me', authenticate, auth.me);

module.exports = router;
