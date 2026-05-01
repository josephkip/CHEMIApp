const db = require('../config/database');
const { parsePagination, paginatedResponse } = require('../utils/helpers');

class StockTakeService {
  async getStockTakes(query) {
    const { page, limit, offset } = parsePagination(query);
    let q = db('stock_takes')
      .leftJoin('users', 'stock_takes.created_by', 'users.id')
      .select('stock_takes.*', 'users.full_name as created_by_name')
      .orderBy('stock_takes.created_at', 'desc');

    const countQuery = q.clone().clearSelect().clearOrder().count('stock_takes.id as total').first();
    const { total } = await countQuery;
    const data = await q.limit(limit).offset(offset);
    return paginatedResponse(data, parseInt(total), page, limit);
  }

  async getStockTakeById(id) {
    const st = await db('stock_takes')
      .leftJoin('users', 'stock_takes.created_by', 'users.id')
      .select('stock_takes.*', 'users.full_name as created_by_name')
      .where('stock_takes.id', id).first();
    if (!st) throw new Error('Stock Take not found');

    const items = await db('stock_take_items')
      .leftJoin('items', 'stock_take_items.item_id', 'items.id')
      .select('stock_take_items.*', 'items.name as item_name', 'items.stock_quantity as current_stock')
      .where('stock_take_id', id);
    st.items = items;
    return st;
  }

  async createStockTake(userId, notes) {
    const [st] = await db('stock_takes').insert({
      created_by: userId,
      status: 'draft',
      notes
    }).returning('*');

    // Populate with active items
    const items = await db('items').select('id', 'stock_quantity').where('is_active', true);
    const stItems = items.map(it => ({
      stock_take_id: st.id,
      item_id: it.id,
      expected_quantity: it.stock_quantity,
      actual_quantity: null,
      variance: null
    }));
    if (stItems.length > 0) {
      await db('stock_take_items').insert(stItems);
    }
    return this.getStockTakeById(st.id);
  }

  async updateStockTakeItems(id, itemsData) {
    // itemsData: [{ item_id, actual_quantity }]
    const st = await db('stock_takes').where('id', id).first();
    if (!st || st.status !== 'draft') throw new Error('Invalid or completed stock take');

    await db.transaction(async trx => {
      for (const it of itemsData) {
        if (it.actual_quantity !== null && it.actual_quantity !== undefined) {
          const stItem = await trx('stock_take_items').where({ stock_take_id: id, item_id: it.item_id }).first();
          if (stItem) {
            const variance = it.actual_quantity - stItem.expected_quantity;
            await trx('stock_take_items').where({ stock_take_id: id, item_id: it.item_id })
              .update({ actual_quantity: it.actual_quantity, variance });
          }
        }
      }
    });
    return this.getStockTakeById(id);
  }

  async completeStockTake(id, userId) {
    const st = await db('stock_takes').where('id', id).first();
    if (!st || st.status !== 'draft') throw new Error('Invalid or completed stock take');

    await db.transaction(async trx => {
      await trx('stock_takes').where('id', id).update({ status: 'completed' });

      const items = await trx('stock_take_items').where('stock_take_id', id);
      for (const it of items) {
        if (it.variance !== null && it.variance !== 0) {
          // Update actual stock
          await trx('items').where('id', it.item_id).update({
            stock_quantity: it.actual_quantity,
            updated_at: new Date()
          });

          // Create stock movement
          await trx('stock_movements').insert({
            item_id: it.item_id,
            user_id: userId,
            movement_type: 'adjustment',
            quantity: Math.abs(it.variance), // movement stores absolute or actual depending on setup; wait, usually we store absolute but movement_type is generic. Actually, restock/sale/adjustment is generic, we can store variance directly or absolute. Since stock_after is accurate, we can just use variance.
            stock_before: it.expected_quantity,
            stock_after: it.actual_quantity,
            notes: `Stock Take #${id} variance`
          });
        }
      }
    });
    return this.getStockTakeById(id);
  }
}

module.exports = new StockTakeService();
