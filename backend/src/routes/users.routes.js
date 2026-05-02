const router = require('express').Router();
const users = require('../controllers/users.controller');
const authenticate = require('../middleware/auth');
const { superAdminOnly } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(superAdminOnly);

router.get('/', users.getAll);
router.put('/:id', users.update);
router.put('/:id/toggle-active', users.toggleActive);
router.put('/:id/reset-password', users.resetPassword);
router.delete('/:id', users.deleteUser);

module.exports = router;
