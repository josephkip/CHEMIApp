const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Clear existing data
  await knex('stock_movements').del();
  await knex('sale_items').del();
  await knex('sales').del();
  await knex('items').del();
  await knex('categories').del();
  await knex('users').del();

  // Create super admin user (username: admin, password: Admin@123)
  const adminId = uuidv4();
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  await knex('users').insert({
    id: adminId,
    username: 'admin',
    email: 'admin@moreranchemist.com',
    full_name: 'System Administrator',
    password_hash: passwordHash,
    role: 'super_admin',
    is_active: true
  });

  // Seed categories
  const categories = [
    { name: 'Painkillers & Analgesics', description: 'Pain relief medications' },
    { name: 'Antibiotics', description: 'Anti-bacterial medications' },
    { name: 'Antimalarials', description: 'Malaria treatment and prevention' },
    { name: 'Cough & Cold', description: 'Cough syrups, decongestants, cold remedies' },
    { name: 'Vitamins & Supplements', description: 'Nutritional supplements and vitamins' },
    { name: 'First Aid', description: 'Bandages, antiseptics, wound care' },
    { name: 'Skin Care', description: 'Dermatological products and cosmetics' },
    { name: 'Baby Care', description: 'Infant and child care products' },
    { name: 'Medical Equipment', description: 'Thermometers, BP monitors, etc.' },
    { name: 'Chronic Medication', description: 'Diabetes, hypertension, etc.' },
    { name: 'Eye & Ear Care', description: 'Eye drops, ear drops, solutions' },
    { name: 'Digestive Health', description: 'Antacids, laxatives, anti-diarrhea' }
  ];

  await knex('categories').insert(categories);

  // Fetch inserted categories to get their real IDs
  const cats = await knex('categories').select('id', 'name');
  const catId = (name) => cats.find(c => c.name === name)?.id;

  // Seed sample items using real category IDs
  const items = [
    { name: 'Paracetamol 500mg (100 tabs)', category_id: catId('Painkillers & Analgesics'), buying_price: 80, selling_price: 150, stock_quantity: 200, reorder_level: 20, expiry_date: '2027-06-15', batch_number: 'PCM-2024-001', supplier: 'Dawa Ltd', unit: 'pack' },
    { name: 'Ibuprofen 400mg (30 tabs)', category_id: catId('Painkillers & Analgesics'), buying_price: 120, selling_price: 200, stock_quantity: 150, reorder_level: 15, expiry_date: '2027-08-20', batch_number: 'IBU-2024-001', supplier: 'Beta Healthcare', unit: 'pack' },
    { name: 'Amoxicillin 500mg (21 caps)', category_id: catId('Antibiotics'), buying_price: 180, selling_price: 350, stock_quantity: 100, reorder_level: 10, expiry_date: '2027-03-10', batch_number: 'AMX-2024-001', supplier: 'Cosmos Ltd', unit: 'pack' },
    { name: 'Metronidazole 400mg (20 tabs)', category_id: catId('Antibiotics'), buying_price: 90, selling_price: 180, stock_quantity: 80, reorder_level: 10, expiry_date: '2027-09-01', batch_number: 'MTZ-2024-001', supplier: 'Dawa Ltd', unit: 'pack' },
    { name: 'Artemether/Lumefantrine (AL)', category_id: catId('Antimalarials'), buying_price: 250, selling_price: 450, stock_quantity: 60, reorder_level: 10, expiry_date: '2027-04-15', batch_number: 'AL-2024-001', supplier: 'Novartis', unit: 'pack' },
    { name: 'Benylin Cough Syrup 100ml', category_id: catId('Cough & Cold'), buying_price: 200, selling_price: 350, stock_quantity: 45, reorder_level: 8, expiry_date: '2027-12-30', batch_number: 'BEN-2024-001', supplier: 'Johnson & Johnson', unit: 'bottle' },
    { name: 'Vitamin C 1000mg (30 tabs)', category_id: catId('Vitamins & Supplements'), buying_price: 350, selling_price: 550, stock_quantity: 90, reorder_level: 10, expiry_date: '2028-01-15', batch_number: 'VTC-2024-001', supplier: 'Nature Made', unit: 'pack' },
    { name: 'Multivitamin (60 tabs)', category_id: catId('Vitamins & Supplements'), buying_price: 450, selling_price: 750, stock_quantity: 70, reorder_level: 8, expiry_date: '2028-06-20', batch_number: 'MLT-2024-001', supplier: 'Centrum', unit: 'pack' },
    { name: 'Cotton Wool 100g', category_id: catId('First Aid'), buying_price: 80, selling_price: 150, stock_quantity: 120, reorder_level: 15, expiry_date: null, batch_number: 'CW-2024-001', supplier: 'Local Supplier', unit: 'roll' },
    { name: 'Bandage Gauze Roll', category_id: catId('First Aid'), buying_price: 50, selling_price: 100, stock_quantity: 200, reorder_level: 20, expiry_date: null, batch_number: 'BG-2024-001', supplier: 'Local Supplier', unit: 'roll' },
    { name: 'Digital Thermometer', category_id: catId('Medical Equipment'), buying_price: 300, selling_price: 550, stock_quantity: 25, reorder_level: 5, expiry_date: null, batch_number: 'THR-2024-001', supplier: 'Omron', unit: 'pcs' },
    { name: 'Blood Pressure Monitor', category_id: catId('Medical Equipment'), buying_price: 2500, selling_price: 4500, stock_quantity: 8, reorder_level: 3, expiry_date: null, batch_number: 'BPM-2024-001', supplier: 'Omron', unit: 'pcs' },
    { name: 'Metformin 500mg (100 tabs)', category_id: catId('Chronic Medication'), buying_price: 200, selling_price: 400, stock_quantity: 5, reorder_level: 10, expiry_date: '2027-07-20', batch_number: 'MET-2024-001', supplier: 'Dawa Ltd', unit: 'pack' },
    { name: 'Amlodipine 5mg (30 tabs)', category_id: catId('Chronic Medication'), buying_price: 150, selling_price: 300, stock_quantity: 3, reorder_level: 10, expiry_date: '2027-05-10', batch_number: 'AML-2024-001', supplier: 'Beta Healthcare', unit: 'pack' },
    { name: 'ORS Sachets (10 pack)', category_id: catId('Digestive Health'), buying_price: 100, selling_price: 200, stock_quantity: 150, reorder_level: 20, expiry_date: '2028-03-01', batch_number: 'ORS-2024-001', supplier: 'WHO Supplies', unit: 'pack' }
  ];

  await knex('items').insert(items);
};
