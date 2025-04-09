const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Trip', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('planned', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    totalBudget: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    }
  });
};
