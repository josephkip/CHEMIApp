const db = require('../config/database');
const { parsePagination, paginatedResponse } = require('../utils/helpers');
const { ALERTS } = require('../utils/constants');

class ItemsService {
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    let q = db('items')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .select(
        'items.*',
        'categories.name as category_name'
      )
      .where('items.is_active', true);

    // Search
    if (query.search) {
      q = q.where(function() {
        this.where('items.name', 'ilike', `%${query.search}%`)
          .orWhere('items.batch_number', 'ilike', `%${query.search}%`)
          .orWhere('items.supplier', 'ilike', `%${query.search}%`);
      });
    }

    // Filter by category
    if (query.category_id) {
      q = q.where('items.category_id', query.category_id);
    }

    // Filter by stock status
    if (query.stock_status === 'low') {
      q = q.whereRaw('items.stock_quantity <= items.reorder_level');
    } else if (query.stock_status === 'out') {
      q = q.where('items.stock_quantity', 0);
    } else if (query.stock_status === 'ok') {
      q = q.whereRaw('items.stock_quantity > items.reorder_level');
    }

    // Sorting
    const sortBy = query.sort_by || 'items.name';
    const sortOrder = query.sort_order || 'asc';
    q = q.orderBy(sortBy, sortOrder);

    // Get total count
    const countQuery = q.clone().clearSelect().clearOrder().count('items.id as total').first();
    const { total } = await countQuery;

    // Get paginated data
    const data = await q.limit(limit).offset(offset);

    return paginatedResponse(data, parseInt(total), page, limit);
  }

  async getById(id) {
    const item = await db('items')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .select('items.*', 'categories.name as category_name')
      .where('items.id', id)
      .first();

    if (!item) {
      const err = new Error('Item not found');
      err.type = 'not_found';
      throw err;
    }

    return item;
  }

  async create(data) {
    const [item] = await db('items').insert({
      name: data.name,
      category_id: data.category_id,
      buying_price: data.buying_price,
      selling_price: data.selling_price,
      stock_quantity: data.stock_quantity || 0,
      reorder_level: data.reorder_level || 10,
      expiry_date: data.expiry_date || null,
      batch_number: data.batch_number || null,
      supplier: data.supplier || null,
      unit: data.unit || 'pcs',
      description: data.description || null
    }).returning('*');

    // Record stock movement if initial stock
    if (data.stock_quantity > 0) {
      await db('stock_movements').insert({
        item_id: item.id,
        user_id: data.user_id,
        movement_type: 'restock',
        quantity: data.stock_quantity,
        stock_before: 0,
        stock_after: data.stock_quantity,
        notes: 'Initial stock'
      });
    }

    return item;
  }

  async update(id, data) {
    const existing = await db('items').where('id', id).first();
    if (!existing) {
      const err = new Error('Item not found');
      err.type = 'not_found';
      throw err;
    }

    const [item] = await db('items').where('id', id).update({
      name: data.name !== undefined ? data.name : existing.name,
      category_id: data.category_id !== undefined ? data.category_id : existing.category_id,
      buying_price: data.buying_price !== undefined ? data.buying_price : existing.buying_price,
      selling_price: data.selling_price !== undefined ? data.selling_price : existing.selling_price,
      reorder_level: data.reorder_level !== undefined ? data.reorder_level : existing.reorder_level,
      expiry_date: data.expiry_date !== undefined ? data.expiry_date : existing.expiry_date,
      batch_number: data.batch_number !== undefined ? data.batch_number : existing.batch_number,
      supplier: data.supplier !== undefined ? data.supplier : existing.supplier,
      unit: data.unit !== undefined ? data.unit : existing.unit,
      description: data.description !== undefined ? data.description : existing.description,
      updated_at: new Date()
    }).returning('*');

    return item;
  }

  async delete(id) {
    const existing = await db('items').where('id', id).first();
    if (!existing) {
      const err = new Error('Item not found');
      err.type = 'not_found';
      throw err;
    }

    await db('items').where('id', id).update({ is_active: false, updated_at: new Date() });
    return { message: 'Item deleted successfully' };
  }

  async restock(id, quantity, userId, notes) {
    const item = await db('items').where('id', id).first();
    if (!item) {
      const err = new Error('Item not found');
      err.type = 'not_found';
      throw err;
    }

    const stockBefore = item.stock_quantity;
    const stockAfter = stockBefore + quantity;

    await db.transaction(async trx => {
      await trx('items').where('id', id).update({
        stock_quantity: stockAfter,
        updated_at: new Date()
      });

      await trx('stock_movements').insert({
        item_id: id,
        user_id: userId,
        movement_type: 'restock',
        quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        notes: notes || `Restocked ${quantity} units`
      });
    });

    return { ...item, stock_quantity: stockAfter, stock_before: stockBefore };
  }

  async getLowStock() {
    return db('items')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .select('items.*', 'categories.name as category_name')
      .where('items.is_active', true)
      .whereRaw('items.stock_quantity <= items.reorder_level')
      .orderBy('items.stock_quantity', 'asc');
  }

  async getExpiring() {
    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + ALERTS.EXPIRY_WARNING_DAYS);

    return db('items')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .select('items.*', 'categories.name as category_name')
      .where('items.is_active', true)
      .whereNotNull('items.expiry_date')
      .where('items.expiry_date', '<=', warningDate)
      .orderBy('items.expiry_date', 'asc');
  }

  async getStockMovements(itemId, query) {
    const { page, limit, offset } = parsePagination(query);

    let q = db('stock_movements')
      .leftJoin('users', 'stock_movements.user_id', 'users.id')
      .select('stock_movements.*', 'users.full_name as user_name')
      .where('stock_movements.item_id', itemId)
      .orderBy('stock_movements.created_at', 'desc');

    const countQuery = q.clone().clearSelect().clearOrder().count('stock_movements.id as total').first();
    const { total } = await countQuery;
    const data = await q.limit(limit).offset(offset);

    return paginatedResponse(data, parseInt(total), page, limit);
  }
}

module.exports = new ItemsService();
