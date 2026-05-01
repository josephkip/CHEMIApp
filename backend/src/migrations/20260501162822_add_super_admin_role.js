/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
  await knex.raw("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'sales_attendant'));");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
  await knex.raw("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'sales_attendant'));");
};
