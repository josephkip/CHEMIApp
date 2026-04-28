const db = require('../config/database');
const { parsePagination, paginatedResponse, generateReceiptNumber } = require('../utils/helpers');

class SalesService {
  async create(saleData, userId) {
    const { items, payment_method, customer_name, notes } = saleData;
    if (!items || items.length === 0) {
      throw Object.assign(new Error('Sale must have at least one item'), { type: 'validation' });
    }

    return db.transaction(async trx => {
      let totalAmount = 0, totalProfit = 0;
      const saleItems = [];

      for (const saleItem of items) {
        const item = await trx('items').where('id', saleItem.item_id).first();
        if (!item) throw Object.assign(new Error(`Item not found: ${saleItem.item_id}`), { type: 'not_found' });
        if (item.stock_quantity < saleItem.quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${item.name}. Available: ${item.stock_quantity}`), { type: 'validation' });
        }

        const sp = saleItem.selling_price || item.selling_price;
        const lineTotal = sp * saleItem.quantity;
        const lineProfit = (sp - item.buying_price) * saleItem.quantity;
        totalAmount += lineTotal;
        totalProfit += lineProfit;

        saleItems.push({ item_id: item.id, item_name: item.name, quantity: saleItem.quantity, selling_price: sp, buying_price: item.buying_price, profit: lineProfit });

        const newStock = item.stock_quantity - saleItem.quantity;
        await trx('items').where('id', item.id).update({ stock_quantity: newStock, updated_at: new Date() });
        await trx('stock_movements').insert({ item_id: item.id, user_id: userId, movement_type: 'sale', quantity: -saleItem.quantity, stock_before: item.stock_quantity, stock_after: newStock, notes: 'Sale' });
      }

      const [sale] = await trx('sales').insert({ user_id: userId, total_amount: totalAmount, total_profit: totalProfit, payment_method: payment_method || 'cash', receipt_number: generateReceiptNumber(), customer_name: customer_name || null, notes: notes || null }).returning('*');

      await trx('sale_items').insert(saleItems.map(si => ({ ...si, sale_id: sale.id })));
      return { ...sale, items: saleItems };
    });
  }

  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    let q = db('sales').leftJoin('users', 'sales.user_id', 'users.id').select('sales.*', 'users.full_name as cashier_name');

    if (query.start_date) q = q.where('sales.created_at', '>=', query.start_date);
    if (query.end_date) q = q.where('sales.created_at', '<=', query.end_date + ' 23:59:59');
    if (query.search) {
      q = q.where(function() { this.where('sales.receipt_number', 'ilike', `%${query.search}%`).orWhere('sales.customer_name', 'ilike', `%${query.search}%`); });
    }
    if (query.payment_method) q = q.where('sales.payment_method', query.payment_method);

    q = q.orderBy('sales.created_at', 'desc');
    const countQuery = q.clone().clearSelect().clearOrder().count('sales.id as total').first();
    const { total } = await countQuery;
    const data = await q.limit(limit).offset(offset);
    return paginatedResponse(data, parseInt(total), page, limit);
  }

  async getById(id) {
    const sale = await db('sales').leftJoin('users', 'sales.user_id', 'users.id').select('sales.*', 'users.full_name as cashier_name').where('sales.id', id).first();
    if (!sale) throw Object.assign(new Error('Sale not found'), { type: 'not_found' });
    const items = await db('sale_items').where('sale_id', id).select('*');
    return { ...sale, items };
  }

  async getReceipt(id) {
    const sale = await this.getById(id);
    return { ...sale, pharmacy: require('../config/env').PHARMACY };
  }
}

module.exports = new SalesService();
