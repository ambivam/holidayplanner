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

    console.log('Finding items for trip:', { 
      tripId, 
      userId: req.user.id,
      parsedTripId: parseInt(tripId, 10)
    });

    const items = await ItineraryItem.findAll({
      where: { tripId: parseInt(tripId, 10) },
      order: [['date', 'ASC']],
    });

    // Log raw items and parsed items
    console.log('Database query result:', {
      count: items.length,
      rawItems: items,
      parsedItems: items.map(item => item.toJSON())
    });

    // Verify each item's data
    const verifiedItems = items.map(item => {
      const itemData = item.toJSON();
      console.log('Processing item:', {
        id: itemData.id,
        tripId: itemData.tripId,
        date: itemData.date,
        activity: itemData.activity
      });
      return itemData;
    });

    res.json(verifiedItems);
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new itinerary item
router.post('/trips/:tripId/itinerary', [
  express.json(),
  (req, res, next) => {
    console.log('Raw request body:', req.body);
    next();
  },
  logRequest,
  auth,
  (req, res, next) => {
    console.log('Incoming request:', {
      body: req.body,
      headers: req.headers,
      contentType: req.headers['content-type'],
      method: req.method,
      url: req.url
    });
    next();
  },
  body('date')
    .exists()
    .withMessage('Date is required')
    .notEmpty()
    .withMessage('Date cannot be empty')
    .custom((value, { req }) => {
      console.log('Validating date:', {
        value,
        type: typeof value,
        body: req.body
      });
      try {
        // Try to parse the date
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        
        // Log successful parsing
        console.log('Date validated successfully:', {
          original: value,
          parsed: date,
          timestamp: date.getTime(),
          iso: date.toISOString()
        });
        return true;
      } catch (error) {
        console.error('Date validation error:', {
          error: error.message,
          value,
          type: typeof value
        });
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
    // Log detailed request information
    console.log('Processing request:', {
      body: req.body,
      params: req.params,
      method: req.method,
      path: req.path,
      headers: req.headers,
      contentType: req.headers['content-type'],
      bodyKeys: Object.keys(req.body),
      bodyTypes: Object.entries(req.body).map(([key, value]) => [key, typeof value]),
      rawBody: req.body ? JSON.stringify(req.body) : undefined
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array();
      
      // Log validation errors with detailed context
      console.log('Validation failed:', {
        body: req.body,
        rawBody: JSON.stringify(req.body),
        contentType: req.headers['content-type'],
        errors: validationErrors,
        bodyKeys: Object.keys(req.body),
        bodyTypes: Object.entries(req.body).map(([key, value]) => [key, typeof value])
      });
      
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors.map(err => ({
          field: err.param,
          value: err.value,
          msg: err.msg,
          location: err.location
        })),
        receivedBody: req.body
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

    // Validate and parse the date
    let parsedDate;
    try {
      if (!date) {
        throw new Error('Date is required');
      }

      console.log('Attempting to parse date:', {
        rawDate: date,
        type: typeof date,
        isString: typeof date === 'string',
        isDate: date instanceof Date,
        hasTime: typeof date === 'string' && date.includes('T')
      });

      parsedDate = new Date(date);
      
      console.log('Date parsing result:', {
        input: date,
        parsed: parsedDate,
        timestamp: parsedDate.getTime(),
        iso: parsedDate.toISOString(),
        valid: !isNaN(parsedDate.getTime())
      });

      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date value');
      }
    } catch (error) {
      console.error('Date validation failed:', {
        error: error.message,
        receivedDate: date,
        type: typeof date
      });
      return res.status(400).json({
        message: 'Invalid date format',
        error: error.message,
        receivedDate: date,
        type: typeof date
      });
    }

    const itemData = {
      tripId: parseInt(tripId, 10),
      date: parsedDate,
      activity: activity.trim(),
      location: location.trim(),
      notes: notes ? notes.trim() : ''
    };
    console.log('Attempting to create item:', {
      data: itemData,
      tripId: itemData.tripId,
      tripIdType: typeof itemData.tripId
    });

    const item = await ItineraryItem.create(itemData);
    
    console.log('Database response:', {
      created: item ? true : false,
      item: item ? item.toJSON() : null,
      id: item ? item.id : null,
      tripId: item ? item.tripId : null
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
