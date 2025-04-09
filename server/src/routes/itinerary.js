const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logRequest = require('../middleware/logger');
const ItineraryItem = require('../models/ItineraryItem');
const Trip = require('../models/Trip');

// Get all itinerary items for a trip
router.get('/trips/:tripId/itinerary', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const items = await ItineraryItem.findAll({
      where: { tripId },
      order: [['date', 'ASC']],
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new itinerary item
router.post('/trips/:tripId/itinerary', [
  logRequest,
  auth,
  (req, res, next) => {
    console.log('Raw request body:', req.body);
    next();
  },
  body('date')
    .exists()
    .withMessage('Date is required')
    .notEmpty()
    .withMessage('Date cannot be empty')
    .isISO8601()
    .withMessage('Date must be in ISO format')
    .custom((value) => {
      console.log('Validating date:', value);
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid date format');
      }
    }),
  body('activity')
    .trim()
    .notEmpty()
    .withMessage('Activity is required')
    .isLength({ max: 255 })
    .withMessage('Activity must be at most 255 characters'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 255 })
    .withMessage('Location must be at most 255 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be at most 1000 characters'),
], async (req, res) => {
  try {
    // Log the raw request for debugging
    console.log('Request details:', {
      body: req.body,
      params: req.params,
      method: req.method,
      path: req.path
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array();
      
      // Log validation errors
      console.log('Validation failed:', {
        body: req.body,
        errors: validationErrors
      });
      
      return res.status(400).json({ 
        message: validationErrors[0].msg,
        errors: validationErrors.map(err => ({
          field: err.param,
          value: err.value,
          msg: err.msg
        }))
      });
    }

    const { tripId } = req.params;
    const { date, activity, location, notes } = req.body;

    console.log('Processing request with data:', {
      tripId,
      date,
      activity,
      location,
      notes,
      user: req.user
    });

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ 
      where: { 
        id: tripId, 
        userId: req.user.id 
      }
    });

    console.log('Found trip:', trip ? trip.toJSON() : null);

    if (!trip) {
      return res.status(404).json({ 
        message: 'Trip not found',
        tripId,
        userId: req.user.id
      });
    }

    // Validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format',
        receivedDate: date
      });
    }

    const item = await ItineraryItem.create({
      tripId: parseInt(tripId, 10),
      date: parsedDate,
      activity: activity.trim(),
      location: location.trim(),
      notes: notes ? notes.trim() : ''
    });

    console.log('Successfully created item:', item.toJSON());
    res.status(201).json(item);
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Failed to create itinerary item', 
      error: error.message 
    });
  }
});

// Update itinerary item
router.put('/trips/:tripId/itinerary/:id', [
  auth,
  body('date').isISO8601().withMessage('Invalid date'),
  body('activity').trim().notEmpty().withMessage('Activity is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { tripId, id } = req.params;
    const { date, activity, location, notes } = req.body;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await ItineraryItem.findOne({ where: { id, tripId } });
    if (!item) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }

    await item.update({
      date,
      activity,
      location,
      notes,
    });

    res.json(item);
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete itinerary item
router.delete('/trips/:tripId/itinerary/:id', auth, async (req, res) => {
  try {
    const { tripId, id } = req.params;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await ItineraryItem.findOne({ where: { id, tripId } });
    if (!item) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }

    await item.destroy();
    res.json({ message: 'Itinerary item deleted' });
  } catch (error) {
    console.error('Error deleting itinerary item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
