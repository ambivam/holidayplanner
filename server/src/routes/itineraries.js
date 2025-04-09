const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Trip, Itinerary } = require('../models');
const router = express.Router({ mergeParams: true });

// Get trip itinerary
router.get('/', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: {
        id: req.params.tripId,
        UserId: req.user.id
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const itinerary = await Itinerary.findAll({
      where: { TripId: req.params.tripId },
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });

    res.json(itinerary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add itinerary item
router.post('/',
  auth,
  [
    body('day').isInt({ min: 1 }),
    body('date').isISO8601(),
    body('activity').trim().notEmpty(),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    body('location').trim().optional(),
    body('notes').trim().optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const trip = await Trip.findOne({
        where: {
          id: req.params.tripId,
          UserId: req.user.id
        }
      });

      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      const itineraryItem = await Itinerary.create({
        ...req.body,
        TripId: req.params.tripId
      });

      res.status(201).json(itineraryItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update itinerary item
router.put('/:itemId',
  auth,
  [
    body('day').isInt({ min: 1 }).optional(),
    body('date').isISO8601().optional(),
    body('activity').trim().notEmpty().optional(),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    body('location').trim().optional(),
    body('notes').trim().optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const trip = await Trip.findOne({
        where: {
          id: req.params.tripId,
          UserId: req.user.id
        }
      });

      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      const itineraryItem = await Itinerary.findOne({
        where: {
          id: req.params.itemId,
          TripId: req.params.tripId
        }
      });

      if (!itineraryItem) {
        return res.status(404).json({ message: 'Itinerary item not found' });
      }

      await itineraryItem.update(req.body);
      res.json(itineraryItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete itinerary item
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: {
        id: req.params.tripId,
        UserId: req.user.id
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const itineraryItem = await Itinerary.findOne({
      where: {
        id: req.params.itemId,
        TripId: req.params.tripId
      }
    });

    if (!itineraryItem) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }

    await itineraryItem.destroy();
    res.json({ message: 'Itinerary item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
