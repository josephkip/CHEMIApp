const router = require('express').Router();
const items = require('../controllers/items.controller');
const authenticate = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleGuard');

router.use(authenticate);

router.get('/', items.getAll);
router.get('/alerts/low-stock', items.getLowStock);
router.get('/alerts/expiring', items.getExpiring);
router.get('/:id', items.getById);
router.get('/:id/movements', items.getStockMovements);

router.post('/', adminOnly, items.create);
router.put('/:id', adminOnly, items.update);
router.delete('/:id', adminOnly, items.delete);
router.post('/:id/restock', adminOnly, items.restock);

module.exports = router;
