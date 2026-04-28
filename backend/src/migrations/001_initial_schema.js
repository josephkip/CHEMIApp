/**
 * CHEMIApp Initial Database Schema
 */
exports.up = function(knex) {
  return knex.schema
    // Users table
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('username', 50).notNullable().unique();
      table.string('email', 100).notNullable().unique();
      table.string('full_name', 100).notNullable();
      table.string('password_hash').notNullable();
      table.enum('role', ['admin', 'sales_attendant']).notNullable().defaultTo('sales_attendant');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login');
      table.timestamps(true, true);
    })
    // Categories table
    .createTable('categories', table => {
      table.increments('id').primary();
      table.string('name', 100).notNullable().unique();
      table.text('description');
      table.timestamps(true, true);
    })
    // Items table
    .createTable('items', table => {
      table.increments('id').primary();
      table.string('name', 200).notNullable();
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
      table.decimal('buying_price', 10, 2).notNullable();
      table.decimal('selling_price', 10, 2).notNullable();
      table.integer('stock_quantity').notNullable().defaultTo(0);
      table.integer('reorder_level').notNullable().defaultTo(10);
      table.date('expiry_date');
      table.string('batch_number', 50);
      table.string('supplier', 200);
      table.string('unit', 50).defaultTo('pcs');
      table.text('description');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);

      table.index(['category_id']);
      table.index(['name']);
      table.index(['expiry_date']);
      table.index(['stock_quantity']);
    })
    // Sales table
    .createTable('sales', table => {
      table.increments('id').primary();
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.decimal('total_amount', 12, 2).notNullable();
      table.decimal('total_profit', 12, 2).notNullable().defaultTo(0);
      table.enum('payment_method', ['cash', 'mpesa', 'card', 'insurance']).defaultTo('cash');
      table.string('receipt_number', 30).notNullable().unique();
      table.string('customer_name', 100);
      table.text('notes');
      table.timestamps(true, true);

      table.index(['user_id']);
      table.index(['created_at']);
      table.index(['receipt_number']);
    })
    // Sale Items table
    .createTable('sale_items', table => {
      table.increments('id').primary();
      table.integer('sale_id').unsigned().notNullable().references('id').inTable('sales').onDelete('CASCADE');
      table.integer('item_id').unsigned().references('id').inTable('items').onDelete('SET NULL');
      table.string('item_name', 200).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('selling_price', 10, 2).notNullable();
      table.decimal('buying_price', 10, 2).notNullable();
      table.decimal('profit', 10, 2).notNullable();
      table.timestamps(true, true);

      table.index(['sale_id']);
      table.index(['item_id']);
    })
    // Stock Movements table
    .createTable('stock_movements', table => {
      table.increments('id').primary();
      table.integer('item_id').unsigned().notNullable().references('id').inTable('items').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.enum('movement_type', ['restock', 'sale', 'adjustment']).notNullable();
      table.integer('quantity').notNullable();
      table.integer('stock_before').notNullable();
      table.integer('stock_after').notNullable();
      table.text('notes');
      table.timestamps(true, true);

      table.index(['item_id']);
      table.index(['created_at']);
      table.index(['movement_type']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('stock_movements')
    .dropTableIfExists('sale_items')
    .dropTableIfExists('sales')
    .dropTableIfExists('items')
    .dropTableIfExists('categories')
    .dropTableIfExists('users');
};
