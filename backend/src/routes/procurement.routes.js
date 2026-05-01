const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurement.controller');
const authenticate = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleGuard');

router.use(authenticate);

// Suppliers
router.get('/suppliers', procurementController.getSuppliers);
router.post('/suppliers', adminOnly, procurementController.createSupplier);
router.put('/suppliers/:id', adminOnly, procurementController.updateSupplier);

// Purchase Orders (LPO)
router.get('/lpo', procurementController.getPurchaseOrders);
router.get('/lpo/:id', procurementController.getPurchaseOrderById);
router.post('/lpo', adminOnly, procurementController.createPurchaseOrder);

// Goods Received Notes (GRN)
router.get('/grn', procurementController.getGRNs);
router.get('/grn/:id', procurementController.getGRNById);
router.post('/grn', adminOnly, procurementController.createGRN);

module.exports = router;
