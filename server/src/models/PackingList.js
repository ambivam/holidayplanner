const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('PackingList', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category: {
      type: DataTypes.ENUM('clothing', 'toiletries', 'electronics', 'documents', 'other'),
      allowNull: false
    },
    item: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    isPacked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT
    }
  });
};
