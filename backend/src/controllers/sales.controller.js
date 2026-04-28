const salesService = require('../services/sales.service');

exports.create = async (req, res, next) => {
  try { res.status(201).json(await salesService.create(req.body, req.user.id)); } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try { res.json(await salesService.getAll(req.query)); } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try { res.json(await salesService.getById(req.params.id)); } catch (err) { next(err); }
};

exports.getReceipt = async (req, res, next) => {
  try { res.json(await salesService.getReceipt(req.params.id)); } catch (err) { next(err); }
};
