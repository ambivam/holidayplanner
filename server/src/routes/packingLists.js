const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Trip, PackingList } = require('../models');
const router = express.Router({ mergeParams: true });

// Get packing list items
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

    const packingList = await PackingList.findAll({
      where: { TripId: req.params.tripId },
      order: [['category', 'ASC'], ['item', 'ASC']]
    });

    // Group items by category
    const groupedItems = packingList.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({
      items: packingList,
      groupedItems,
      summary: {
        totalItems: packingList.length,
        packedItems: packingList.filter(item => item.isPacked).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add packing list item
router.post('/',
  auth,
  [
    body('category').isIn(['clothing', 'toiletries', 'electronics', 'documents', 'other']),
    body('item').trim().notEmpty(),
    body('quantity').isInt({ min: 1 }).optional(),
    body('isPacked').isBoolean().optional(),
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

      const packingItem = await PackingList.create({
        ...req.body,
        TripId: req.params.tripId
      });

      res.status(201).json(packingItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update packing list item
router.put('/:itemId',
  auth,
  [
    body('category').isIn(['clothing', 'toiletries', 'electronics', 'documents', 'other']).optional(),
    body('item').trim().notEmpty().optional(),
    body('quantity').isInt({ min: 1 }).optional(),
    body('isPacked').isBoolean().optional(),
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

      const packingItem = await PackingList.findOne({
        where: {
          id: req.params.itemId,
          TripId: req.params.tripId
        }
      });

      if (!packingItem) {
        return res.status(404).json({ message: 'Packing list item not found' });
      }

      await packingItem.update(req.body);
      res.json(packingItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete packing list item
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

    const packingItem = await PackingList.findOne({
      where: {
        id: req.params.itemId,
        TripId: req.params.tripId
      }
    });

    if (!packingItem) {
      return res.status(404).json({ message: 'Packing list item not found' });
    }

    await packingItem.destroy();
    res.json({ message: 'Packing list item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle packed status
router.patch('/:itemId/toggle',
  auth,
  async (req, res) => {
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

      const packingItem = await PackingList.findOne({
        where: {
          id: req.params.itemId,
          TripId: req.params.tripId
        }
      });

      if (!packingItem) {
        return res.status(404).json({ message: 'Packing list item not found' });
      }

      await packingItem.update({ isPacked: !packingItem.isPacked });
      res.json(packingItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
