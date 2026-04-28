const router = require('express').Router();
const sales = require('../controllers/sales.controller');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/', sales.create);
router.get('/', sales.getAll);
router.get('/:id', sales.getById);
router.get('/:id/receipt', sales.getReceipt);

module.exports = router;
