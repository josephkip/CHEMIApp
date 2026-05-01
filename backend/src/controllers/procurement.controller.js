const procurementService = require('../services/procurement.service');

exports.getSuppliers = async (req, res, next) => {
  try { res.json(await procurementService.getSuppliers()); } catch (err) { next(err); }
};

exports.createSupplier = async (req, res, next) => {
  try { res.status(201).json(await procurementService.createSupplier(req.body)); } catch (err) { next(err); }
};

exports.updateSupplier = async (req, res, next) => {
  try { res.json(await procurementService.updateSupplier(req.params.id, req.body)); } catch (err) { next(err); }
};

exports.getPurchaseOrders = async (req, res, next) => {
  try { res.json(await procurementService.getPurchaseOrders(req.query)); } catch (err) { next(err); }
};

exports.getPurchaseOrderById = async (req, res, next) => {
  try { res.json(await procurementService.getPurchaseOrderById(req.params.id)); } catch (err) { next(err); }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try { res.status(201).json(await procurementService.createPurchaseOrder(req.body, req.user.id)); } catch (err) { next(err); }
};

exports.getGRNs = async (req, res, next) => {
  try { res.json(await procurementService.getGRNs(req.query)); } catch (err) { next(err); }
};

exports.getGRNById = async (req, res, next) => {
  try { res.json(await procurementService.getGRNById(req.params.id)); } catch (err) { next(err); }
};

exports.createGRN = async (req, res, next) => {
  try { res.status(201).json(await procurementService.createGRN(req.body, req.user.id)); } catch (err) { next(err); }
};
