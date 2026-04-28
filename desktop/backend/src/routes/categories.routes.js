const router = require('express').Router();
const db = require('../config/database');
const authenticate = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleGuard');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const categories = await db('categories').orderBy('name', 'asc');
    res.json(categories);
  } catch (err) { next(err); }
});

router.post('/', adminOnly, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const [cat] = await db('categories').insert({ name, description }).returning('*');
    res.status(201).json(cat);
  } catch (err) { next(err); }
});

router.put('/:id', adminOnly, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const [cat] = await db('categories').where('id', req.params.id).update({ name, description, updated_at: new Date() }).returning('*');
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json(cat);
  } catch (err) { next(err); }
});

module.exports = router;
