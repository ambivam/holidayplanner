const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Trip, Destination, Itinerary, Budget, PackingList } = require('../models');
const router = express.Router();

// Get all trips for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const trips = await Trip.findAll({
      where: { UserId: req.user.id },
      include: [Destination]
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new trip
router.post('/',
  auth,
  [
    body('title').trim().isLength({ min: 3 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('description').trim().optional(),
    body('totalBudget').isNumeric()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const trip = await Trip.create({
        ...req.body,
        UserId: req.user.id,
        status: 'planned'
      });

      res.status(201).json(trip);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get a specific trip
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id
      },
      include: [Destination]
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a trip
router.put('/:id',
  auth,
  [
    body('title').trim().isLength({ min: 3 }).optional(),
    body('startDate').isISO8601().optional(),
    body('endDate').isISO8601().optional(),
    body('description').trim().optional(),
    body('totalBudget').isNumeric().optional(),
    body('status').isIn(['planned', 'ongoing', 'completed', 'cancelled']).optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const trip = await Trip.findOne({
        where: {
          id: req.params.id,
          UserId: req.user.id
        }
      });

      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      await trip.update(req.body);
      res.json(trip);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a trip
router.delete('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    await trip.destroy();
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
