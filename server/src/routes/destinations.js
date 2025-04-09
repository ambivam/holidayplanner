const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Trip, Destination } = require('../models');
const router = express.Router();

// Get all destinations for a trip
router.get('/:tripId', auth, async (req, res) => {
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

    const destinations = await Destination.findAll({
      where: { TripId: req.params.tripId }
    });

    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a destination to a trip
router.post('/:tripId',
  auth,
  [
    body('name').trim().notEmpty(),
    body('country').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('description').trim().optional()
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

      const destination = await Destination.create({
        ...req.body,
        TripId: req.params.tripId
      });

      res.status(201).json(destination);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update a destination
router.put('/:tripId/:id',
  auth,
  [
    body('name').trim().notEmpty().optional(),
    body('country').trim().notEmpty().optional(),
    body('city').trim().notEmpty().optional(),
    body('description').trim().optional()
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

      const destination = await Destination.findOne({
        where: {
          id: req.params.id,
          TripId: req.params.tripId
        }
      });

      if (!destination) {
        return res.status(404).json({ message: 'Destination not found' });
      }

      await destination.update(req.body);
      res.json(destination);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a destination
router.delete('/:tripId/:id', auth, async (req, res) => {
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

    const destination = await Destination.findOne({
      where: {
        id: req.params.id,
        TripId: req.params.tripId
      }
    });

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    await destination.destroy();
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
