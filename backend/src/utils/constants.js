module.exports = {
  ROLES: {
    ADMIN: 'admin',
    SALES_ATTENDANT: 'sales_attendant'
  },
  MOVEMENT_TYPES: {
    RESTOCK: 'restock',
    SALE: 'sale',
    ADJUSTMENT: 'adjustment'
  },
  PAYMENT_METHODS: {
    CASH: 'cash',
    MPESA: 'mpesa',
    CARD: 'card',
    INSURANCE: 'insurance'
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },
  ALERTS: {
    LOW_STOCK_THRESHOLD: 10,
    EXPIRY_WARNING_DAYS: 30,
    EXPIRY_DANGER_DAYS: 7
  }
};
