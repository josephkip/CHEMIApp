require('dotenv').config({ path: '../../.env' });
const knex = require('./config/database');

async function clearData() {
  try {
    console.log('Starting data wipe...');

    await knex('sale_items').del();
    console.log('Cleared sale_items');
    
    await knex('sales').del();
    console.log('Cleared sales');
    
    await knex('stock_movements').del();
    console.log('Cleared stock_movements');
    
    await knex('stock_take_items').del();
    console.log('Cleared stock_take_items');
    
    await knex('stock_takes').del();
    console.log('Cleared stock_takes');
    
    await knex('grn_items').del();
    console.log('Cleared grn_items');
    
    await knex('goods_received_notes').del();
    console.log('Cleared goods_received_notes');
    
    await knex('purchase_order_items').del();
    console.log('Cleared purchase_order_items');
    
    await knex('purchase_orders').del();
    console.log('Cleared purchase_orders');
    
    await knex('items').del();
    console.log('Cleared items');
    
    console.log('Database wipe complete!');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    process.exit(0);
  }
}

clearData();
