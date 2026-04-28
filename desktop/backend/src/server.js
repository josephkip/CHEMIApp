const app = require('./app');
const config = require('./config/env');
require('./config/database'); // Initialize DB connection

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🏥 CHEMIApp Backend Server          ║
  ║     Environment: ${config.NODE_ENV.padEnd(21)}║
  ║     Port: ${String(PORT).padEnd(29)}║
  ║     ${config.PHARMACY.name.padEnd(36)}║
  ╚══════════════════════════════════════════╝
  `);
});
