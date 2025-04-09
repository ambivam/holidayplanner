const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BudgetItem = sequelize.define('BudgetItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tripId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Trips',
      key: 'id',
    },
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: true,
      isValidAmount(value) {
        if (value === null || value === undefined) {
          throw new Error('Amount is required');
        }
        const amount = parseFloat(value);
        if (isNaN(amount) || !isFinite(amount)) {
          throw new Error('Amount must be a valid number');
        }
        if (amount <= 0) {
          throw new Error('Amount must be greater than 0');
        }
      }
    },
    get() {
      const value = this.getDataValue('amount');
      return value === null ? null : parseFloat(value);
    },
    set(value) {
      this.setDataValue('amount', value === null ? null : parseFloat(value));
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  }
});

module.exports = BudgetItem;
