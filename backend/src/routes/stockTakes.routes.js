const express = require('express');
const router = express.Router();
const stockTakesController = require('../controllers/stockTakes.controller');
const authenticate = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissionGuard');

router.use(authenticate);

// We assume anyone who can edit stock can do stock takes, or maybe admin only
router.get('/', stockTakesController.getStockTakes);
router.get('/:id', stockTakesController.getStockTakeById);
router.post('/', requirePermission('can_edit_stock'), stockTakesController.createStockTake);
router.put('/:id/items', requirePermission('can_edit_stock'), stockTakesController.updateStockTakeItems);
router.post('/:id/complete', requirePermission('can_edit_stock'), stockTakesController.completeStockTake);

module.exports = router;
