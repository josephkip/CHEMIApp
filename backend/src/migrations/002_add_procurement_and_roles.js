exports.up = function(knex) {
  return knex.schema
    // Create suppliers table
    .createTable('suppliers', table => {
      table.increments('id').primary();
      table.string('name', 200).notNullable();
      table.string('contact_person', 100);
      table.string('email', 100);
      table.string('phone', 50);
      table.text('address');
      table.timestamps(true, true);
    })
    // Modify users
    .alterTable('users', table => {
      table.jsonb('permissions').defaultTo('{"can_make_sales": true, "can_receive_payments": true, "can_edit_stock": false}');
    })
    // Modify sales
    .alterTable('sales', table => {
      table.enum('status', ['pending', 'completed']).defaultTo('completed');
    })
    // Modify items
    .alterTable('items', table => {
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('SET NULL');
      table.decimal('profit_margin', 5, 2).defaultTo(0);
    })
    // Create purchase_orders
    .createTable('purchase_orders', table => {
      table.increments('id').primary();
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('SET NULL');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.enum('status', ['draft', 'pending', 'received', 'cancelled']).defaultTo('draft');
      table.decimal('total_amount', 12, 2).defaultTo(0);
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('purchase_order_items', table => {
      table.increments('id').primary();
      table.integer('po_id').unsigned().notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
      table.integer('item_id').unsigned().references('id').inTable('items').onDelete('SET NULL');
      table.integer('quantity').notNullable();
      table.decimal('buying_price', 10, 2).notNullable();
    })
    // Create goods_received_notes
    .createTable('goods_received_notes', table => {
      table.increments('id').primary();
      table.integer('po_id').unsigned().references('id').inTable('purchase_orders').onDelete('SET NULL');
      table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('SET NULL');
      table.uuid('received_by').references('id').inTable('users').onDelete('SET NULL');
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('grn_items', table => {
      table.increments('id').primary();
      table.integer('grn_id').unsigned().notNullable().references('id').inTable('goods_received_notes').onDelete('CASCADE');
      table.integer('item_id').unsigned().references('id').inTable('items').onDelete('SET NULL');
      table.integer('quantity_received').notNullable();
      table.decimal('buying_price', 10, 2).notNullable();
    })
    // Create stock_takes
    .createTable('stock_takes', table => {
      table.increments('id').primary();
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.enum('status', ['draft', 'completed']).defaultTo('draft');
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('stock_take_items', table => {
      table.increments('id').primary();
      table.integer('stock_take_id').unsigned().notNullable().references('id').inTable('stock_takes').onDelete('CASCADE');
      table.integer('item_id').unsigned().notNullable().references('id').inTable('items').onDelete('CASCADE');
      table.integer('expected_quantity').notNullable();
      table.integer('actual_quantity');
      table.integer('variance');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('stock_take_items')
    .dropTableIfExists('stock_takes')
    .dropTableIfExists('grn_items')
    .dropTableIfExists('goods_received_notes')
    .dropTableIfExists('purchase_order_items')
    .dropTableIfExists('purchase_orders')
    .alterTable('items', table => {
      table.dropColumn('supplier_id');
      table.dropColumn('profit_margin');
    })
    .alterTable('sales', table => {
      table.dropColumn('status');
    })
    .alterTable('users', table => {
      table.dropColumn('permissions');
    })
    .dropTableIfExists('suppliers');
};
