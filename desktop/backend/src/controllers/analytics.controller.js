const analyticsService = require('../services/analytics.service');

exports.getSummary = async (req, res, next) => {
  try { res.json(await analyticsService.getSummary(req.query)); } catch (err) { next(err); }
};

exports.getSalesTrend = async (req, res, next) => {
  try { res.json(await analyticsService.getSalesTrend(req.query)); } catch (err) { next(err); }
};

exports.getTopItems = async (req, res, next) => {
  try { res.json(await analyticsService.getTopItems(req.query)); } catch (err) { next(err); }
};

exports.getItemReport = async (req, res, next) => {
  try { res.json(await analyticsService.getItemReport(req.query)); } catch (err) { next(err); }
};

exports.getCategoryBreakdown = async (req, res, next) => {
  try { res.json(await analyticsService.getCategoryBreakdown(req.query)); } catch (err) { next(err); }
};
