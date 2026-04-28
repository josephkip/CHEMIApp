const itemsService = require('../services/items.service');

exports.getAll = async (req, res, next) => {
  try { res.json(await itemsService.getAll(req.query)); } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try { res.json(await itemsService.getById(req.params.id)); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try { res.status(201).json(await itemsService.create({ ...req.body, user_id: req.user.id })); } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { res.json(await itemsService.update(req.params.id, req.body)); } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try { res.json(await itemsService.delete(req.params.id)); } catch (err) { next(err); }
};

exports.restock = async (req, res, next) => {
  try {
    const { quantity, notes } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
    res.json(await itemsService.restock(req.params.id, quantity, req.user.id, notes));
  } catch (err) { next(err); }
};

exports.getLowStock = async (req, res, next) => {
  try { res.json(await itemsService.getLowStock()); } catch (err) { next(err); }
};

exports.getExpiring = async (req, res, next) => {
  try { res.json(await itemsService.getExpiring()); } catch (err) { next(err); }
};

exports.getStockMovements = async (req, res, next) => {
  try { res.json(await itemsService.getStockMovements(req.params.id, req.query)); } catch (err) { next(err); }
};
