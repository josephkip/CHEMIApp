const router = require('express').Router();
const analytics = require('../controllers/analytics.controller');
const authenticate = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(adminOnly);

router.get('/summary', analytics.getSummary);
router.get('/sales-trend', analytics.getSalesTrend);
router.get('/top-items', analytics.getTopItems);
router.get('/item-report', analytics.getItemReport);
router.get('/category-breakdown', analytics.getCategoryBreakdown);

module.exports = router;
