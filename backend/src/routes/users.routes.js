const router = require('express').Router();
const users = require('../controllers/users.controller');
const authenticate = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(adminOnly);

router.get('/', users.getAll);
router.put('/:id', users.update);
router.put('/:id/toggle-active', users.toggleActive);
router.put('/:id/reset-password', users.resetPassword);

module.exports = router;
