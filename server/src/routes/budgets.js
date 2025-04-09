const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Trip, Budget } = require('../models');
const router = express.Router({ mergeParams: true });

// Get trip budget items
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

    const budgetItems = await Budget.findAll({
      where: { TripId: req.params.tripId },
      order: [['date', 'ASC']]
    });

    // Calculate totals
    const total = budgetItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalPaid = budgetItems
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    res.json({
      items: budgetItems,
      summary: {
        total,
        totalPaid,
        remaining: trip.totalBudget - total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add budget item
router.post('/',
  auth,
  [
    body('category').isIn(['accommodation', 'transportation', 'food', 'activities', 'shopping', 'other']),
    body('description').trim().notEmpty(),
    body('amount').isFloat({ min: 0 }),
    body('date').isISO8601(),
    body('isPaid').isBoolean().optional(),
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

      const budgetItem = await Budget.create({
        ...req.body,
        TripId: req.params.tripId
      });

      res.status(201).json(budgetItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update budget item
router.put('/:itemId',
  auth,
  [
    body('category').isIn(['accommodation', 'transportation', 'food', 'activities', 'shopping', 'other']).optional(),
    body('description').trim().notEmpty().optional(),
    body('amount').isFloat({ min: 0 }).optional(),
    body('date').isISO8601().optional(),
    body('isPaid').isBoolean().optional(),
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

      const budgetItem = await Budget.findOne({
        where: {
          id: req.params.itemId,
          TripId: req.params.tripId
        }
      });

      if (!budgetItem) {
        return res.status(404).json({ message: 'Budget item not found' });
      }

      await budgetItem.update(req.body);
      res.json(budgetItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete budget item
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

    const budgetItem = await Budget.findOne({
      where: {
        id: req.params.itemId,
        TripId: req.params.tripId
      }
    });

    if (!budgetItem) {
      return res.status(404).json({ message: 'Budget item not found' });
    }

    await budgetItem.destroy();
    res.json({ message: 'Budget item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
