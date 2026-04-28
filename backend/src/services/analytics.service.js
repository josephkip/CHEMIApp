const db = require('../config/database');

class AnalyticsService {
  async getSummary(query) {
    const { start_date, end_date } = this._parseDates(query);

    const salesStats = await db('sales')
      .where('created_at', '>=', start_date).where('created_at', '<=', end_date)
      .select(db.raw('COUNT(*) as total_sales, COALESCE(SUM(total_amount),0) as total_revenue, COALESCE(SUM(total_profit),0) as total_profit'))
      .first();

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

    const todayStats = await db('sales')
      .where('created_at', '>=', todayStart).where('created_at', '<=', todayEnd)
      .select(db.raw('COUNT(*) as total_sales, COALESCE(SUM(total_amount),0) as revenue, COALESCE(SUM(total_profit),0) as profit'))
      .first();

    const lowStockCount = await db('items').where('is_active', true).whereRaw('stock_quantity <= reorder_level').count('id as count').first();
    const expiringCount = await db('items').where('is_active', true).whereNotNull('expiry_date')
      .where('expiry_date', '<=', db.raw("CURRENT_DATE + INTERVAL '30 days'")).count('id as count').first();
    const totalItems = await db('items').where('is_active', true).count('id as count').first();
    const totalCategories = await db('categories').count('id as count').first();

    return {
      period: { start_date, end_date },
      today: { sales: parseInt(todayStats.total_sales), revenue: parseFloat(todayStats.revenue), profit: parseFloat(todayStats.profit) },
      period_totals: { sales: parseInt(salesStats.total_sales), revenue: parseFloat(salesStats.total_revenue), profit: parseFloat(salesStats.total_profit) },
      inventory: { total_items: parseInt(totalItems.count), total_categories: parseInt(totalCategories.count), low_stock: parseInt(lowStockCount.count), expiring_soon: parseInt(expiringCount.count) }
    };
  }

  async getSalesTrend(query) {
    const { start_date, end_date, group_by } = this._parseDates(query);
    let dateFormat = 'YYYY-MM-DD';
    if (group_by === 'week') dateFormat = 'IYYY-IW';
    else if (group_by === 'month') dateFormat = 'YYYY-MM';

    return db('sales').where('created_at', '>=', start_date).where('created_at', '<=', end_date)
      .select(db.raw(`TO_CHAR(created_at, '${dateFormat}') as period, COUNT(*) as sales_count, SUM(total_amount) as revenue, SUM(total_profit) as profit`))
      .groupByRaw(`TO_CHAR(created_at, '${dateFormat}')`)
      .orderByRaw(`TO_CHAR(created_at, '${dateFormat}') ASC`);
  }

  async getTopItems(query) {
    const { start_date, end_date } = this._parseDates(query);
    const limit = parseInt(query.limit) || 10;

    return db('sale_items').join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.created_at', '>=', start_date).where('sales.created_at', '<=', end_date)
      .select('sale_items.item_name', db.raw('SUM(sale_items.quantity) as total_qty, SUM(sale_items.selling_price * sale_items.quantity) as total_revenue, SUM(sale_items.profit) as total_profit'))
      .groupBy('sale_items.item_name').orderBy('total_revenue', 'desc').limit(limit);
  }

  async getItemReport(query) {
    const { start_date, end_date } = this._parseDates(query);
    return db('sale_items').join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.created_at', '>=', start_date).where('sales.created_at', '<=', end_date)
      .select('sale_items.item_name', 'sale_items.quantity', 'sale_items.selling_price', 'sale_items.buying_price', 'sale_items.profit', 'sales.created_at', 'sales.receipt_number')
      .orderBy('sales.created_at', 'desc');
  }

  async getCategoryBreakdown(query) {
    const { start_date, end_date } = this._parseDates(query);
    return db('sale_items').join('sales', 'sale_items.sale_id', 'sales.id')
      .join('items', 'sale_items.item_id', 'items.id')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('sales.created_at', '>=', start_date).where('sales.created_at', '<=', end_date)
      .select('categories.name as category', db.raw('SUM(sale_items.quantity) as total_qty, SUM(sale_items.selling_price * sale_items.quantity) as revenue, SUM(sale_items.profit) as profit'))
      .groupBy('categories.name').orderBy('revenue', 'desc');
  }

  _parseDates(query) {
    const now = new Date();
    const start_date = query.start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end_date = query.end_date || now.toISOString().split('T')[0];
    const group_by = query.group_by || 'day';
    return { start_date, end_date: end_date + ' 23:59:59', group_by };
  }
}

module.exports = new AnalyticsService();
