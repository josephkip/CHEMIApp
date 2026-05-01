const db = require('../config/database');
const { parsePagination, paginatedResponse } = require('../utils/helpers');

class ProcurementService {
  // Suppliers
  async getSuppliers() {
    return db('suppliers').orderBy('name', 'asc');
  }

  async createSupplier(data) {
    const [supplier] = await db('suppliers').insert(data).returning('*');
    return supplier;
  }

  async updateSupplier(id, data) {
    const [supplier] = await db('suppliers').where('id', id).update({ ...data, updated_at: new Date() }).returning('*');
    return supplier;
  }

  // Purchase Orders (LPO)
  async getPurchaseOrders(query) {
    const { page, limit, offset } = parsePagination(query);
    let q = db('purchase_orders')
      .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
      .leftJoin('users', 'purchase_orders.created_by', 'users.id')
      .select('purchase_orders.*', 'suppliers.name as supplier_name', 'users.full_name as created_by_name')
      .orderBy('purchase_orders.created_at', 'desc');

    const countQuery = q.clone().clearSelect().clearOrder().count('purchase_orders.id as total').first();
    const { total } = await countQuery;
    const data = await q.limit(limit).offset(offset);
    return paginatedResponse(data, parseInt(total), page, limit);
  }

  async createPurchaseOrder(data, userId) {
    const { supplier_id, notes, items } = data; // items: [{ item_id, quantity, buying_price }]
    let po;
    await db.transaction(async trx => {
      let total = 0;
      for (const it of items) total += (it.quantity * it.buying_price);

      [po] = await trx('purchase_orders').insert({
        supplier_id,
        created_by: userId,
        status: 'pending',
        total_amount: total,
        notes
      }).returning('*');

      const poItems = items.map(it => ({
        po_id: po.id,
        item_id: it.item_id,
        quantity: it.quantity,
        buying_price: it.buying_price
      }));
      await trx('purchase_order_items').insert(poItems);
    });
    return po;
  }

  async getPurchaseOrderById(id) {
    const po = await db('purchase_orders')
      .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
      .select('purchase_orders.*', 'suppliers.name as supplier_name')
      .where('purchase_orders.id', id).first();
    if (!po) throw new Error('PO not found');

    const items = await db('purchase_order_items')
      .leftJoin('items', 'purchase_order_items.item_id', 'items.id')
      .select('purchase_order_items.*', 'items.name as item_name')
      .where('po_id', id);
    po.items = items;
    return po;
  }

  // Goods Received Notes (GRN)
  async getGRNs(query) {
    const { page, limit, offset } = parsePagination(query);
    let q = db('goods_received_notes')
      .leftJoin('suppliers', 'goods_received_notes.supplier_id', 'suppliers.id')
      .leftJoin('users', 'goods_received_notes.received_by', 'users.id')
      .select('goods_received_notes.*', 'suppliers.name as supplier_name', 'users.full_name as received_by_name')
      .orderBy('goods_received_notes.created_at', 'desc');

    const countQuery = q.clone().clearSelect().clearOrder().count('goods_received_notes.id as total').first();
    const { total } = await countQuery;
    const data = await q.limit(limit).offset(offset);
    return paginatedResponse(data, parseInt(total), page, limit);
  }

  async createGRN(data, userId) {
    const { po_id, supplier_id, notes, items } = data; 
    let grn;
    await db.transaction(async trx => {
      [grn] = await trx('goods_received_notes').insert({
        po_id,
        supplier_id,
        received_by: userId,
        notes
      }).returning('*');

      for (const it of items) {
        await trx('grn_items').insert({
          grn_id: grn.id,
          item_id: it.item_id,
          quantity_received: it.quantity_received,
          buying_price: it.buying_price
        });

        // Update item stock & buying price
        const item = await trx('items').where('id', it.item_id).first();
        if (item) {
          const newStock = item.stock_quantity + it.quantity_received;
          await trx('items').where('id', it.item_id).update({
            stock_quantity: newStock,
            buying_price: it.buying_price // Update buying price based on last GRN
          });

          // Stock movement
          await trx('stock_movements').insert({
            item_id: item.id,
            user_id: userId,
            movement_type: 'restock',
            quantity: it.quantity_received,
            stock_before: item.stock_quantity,
            stock_after: newStock,
            notes: `GRN #${grn.id}`
          });
        }
      }

      if (po_id) {
        await trx('purchase_orders').where('id', po_id).update({ status: 'received' });
      }
    });
    return grn;
  }

  async getGRNById(id) {
    const grn = await db('goods_received_notes')
      .leftJoin('suppliers', 'goods_received_notes.supplier_id', 'suppliers.id')
      .leftJoin('users', 'goods_received_notes.received_by', 'users.id')
      .select('goods_received_notes.*', 'suppliers.name as supplier_name', 'users.full_name as received_by_name')
      .where('goods_received_notes.id', id).first();
    if (!grn) throw new Error('GRN not found');

    const items = await db('grn_items')
      .leftJoin('items', 'grn_items.item_id', 'items.id')
      .select('grn_items.*', 'items.name as item_name')
      .where('grn_id', id);
    grn.items = items;
    return grn;
  }
}

module.exports = new ProcurementService();
