require('dotenv').config({ path: '../../.env' });
const knex = require('./config/database');

async function clearDataForHandover() {
  try {
    console.log('===========================================');
    console.log('  MORERAN CHEMIST — DATABASE RESET');
    console.log('  Preparing clean database for client handover');
    console.log('===========================================\n');

    // 1. Sales data
    await knex('sale_items').del();
    console.log('✅ Cleared sale_items');

    await knex('sales').del();
    console.log('✅ Cleared sales');

    // 2. Stock movements
    await knex('stock_movements').del();
    console.log('✅ Cleared stock_movements');

    // 3. Stock takes
    await knex('stock_take_items').del();
    console.log('✅ Cleared stock_take_items');

    await knex('stock_takes').del();
    console.log('✅ Cleared stock_takes');

    // 4. GRNs
    await knex('grn_items').del();
    console.log('✅ Cleared grn_items');

    await knex('goods_received_notes').del();
    console.log('✅ Cleared goods_received_notes');

    // 5. Purchase orders
    await knex('purchase_order_items').del();
    console.log('✅ Cleared purchase_order_items');

    await knex('purchase_orders').del();
    console.log('✅ Cleared purchase_orders');

    // 6. Inventory items
    await knex('items').del();
    console.log('✅ Cleared items');

    // 7. Suppliers
    await knex('suppliers').del();
    console.log('✅ Cleared suppliers');

    // 8. Categories
    await knex('categories').del();
    console.log('✅ Cleared categories');

    // 9. Users — delete all EXCEPT super_admin
    const deleted = await knex('users').where('role', '!=', 'super_admin').del();
    console.log(`✅ Removed ${deleted} non-super-admin user(s)`);

    // Show remaining super admin(s)
    const remaining = await knex('users').select('username', 'full_name', 'role');
    console.log('\n--- Remaining user accounts ---');
    remaining.forEach(u => console.log(`   👤 ${u.full_name} (${u.username}) — ${u.role}`));

    console.log('\n===========================================');
    console.log('  ✅ DATABASE RESET COMPLETE');
    console.log('  The system is ready for client handover.');
    console.log('===========================================');
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

clearDataForHandover();
