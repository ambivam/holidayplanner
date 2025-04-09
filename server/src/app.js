const express = require('express');
const sequelize = require('./config/database');
const Trip = require('./models/Trip');
const ItineraryItem = require('./models/ItineraryItem');
const BudgetItem = require('./models/BudgetItem');
const PackingItem = require('./models/PackingItem');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const itineraryRoutes = require('./routes/itinerary');
const budgetRoutes = require('./routes/budget');
const packingRoutes = require('./routes/packing');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', tripRoutes);
app.use('/api', itineraryRoutes);
app.use('/api', budgetRoutes);
app.use('/api', packingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Define model associations
Trip.hasMany(ItineraryItem, { foreignKey: 'tripId', onDelete: 'CASCADE' });
ItineraryItem.belongsTo(Trip, { foreignKey: 'tripId' });

Trip.hasMany(BudgetItem, { foreignKey: 'tripId', onDelete: 'CASCADE' });
BudgetItem.belongsTo(Trip, { foreignKey: 'tripId' });

Trip.hasMany(PackingItem, { foreignKey: 'tripId', onDelete: 'CASCADE' });
PackingItem.belongsTo(Trip, { foreignKey: 'tripId' });

// Sync database
sequelize.sync({ force: true }).then(() => {
  console.log('Database synced successfully');
}).catch(err => {
  console.error('Error syncing database:', err);
});

module.exports = app;
