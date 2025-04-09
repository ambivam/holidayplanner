const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../holiday-planner.db')
});

const User = require('./User')(sequelize);
const Trip = require('./Trip')(sequelize);
const Destination = require('./Destination')(sequelize);
const Itinerary = require('./Itinerary')(sequelize);
const Budget = require('./Budget')(sequelize);
const PackingList = require('./PackingList')(sequelize);

// Define relationships
User.hasMany(Trip);
Trip.belongsTo(User);

Trip.hasOne(Itinerary);
Itinerary.belongsTo(Trip);

Trip.hasOne(Budget);
Budget.belongsTo(Trip);

Trip.hasOne(PackingList);
PackingList.belongsTo(Trip);

Trip.belongsTo(Destination);
Destination.hasMany(Trip);

module.exports = {
  sequelize,
  User,
  Trip,
  Destination,
  Itinerary,
  Budget,
  PackingList
};
