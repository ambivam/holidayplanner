const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Itinerary', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    day: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    activity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME
    },
    endTime: {
      type: DataTypes.TIME
    },
    location: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
    }
  });
};
