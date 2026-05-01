const stockTakeService = require('../services/stockTakes.service');

exports.getStockTakes = async (req, res, next) => {
  try { res.json(await stockTakeService.getStockTakes(req.query)); } catch (err) { next(err); }
};

exports.getStockTakeById = async (req, res, next) => {
  try { res.json(await stockTakeService.getStockTakeById(req.params.id)); } catch (err) { next(err); }
};

exports.createStockTake = async (req, res, next) => {
  try { res.status(201).json(await stockTakeService.createStockTake(req.user.id, req.body.notes)); } catch (err) { next(err); }
};

exports.updateStockTakeItems = async (req, res, next) => {
  try { res.json(await stockTakeService.updateStockTakeItems(req.params.id, req.body.items)); } catch (err) { next(err); }
};

exports.completeStockTake = async (req, res, next) => {
  try { res.json(await stockTakeService.completeStockTake(req.params.id, req.user.id)); } catch (err) { next(err); }
};
