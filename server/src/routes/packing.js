const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const PackingItem = require('../models/PackingItem');
const Trip = require('../models/Trip');

// Get all packing items for a trip
router.get('/trips/:tripId/packing-list', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const items = await PackingItem.findAll({
      where: { tripId },
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching packing list:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new packing item
router.post('/trips/:tripId/packing-list', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { tripId } = req.params;
    const { name, category, quantity, notes } = req.body;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await PackingItem.create({
      tripId,
      name,
      category,
      quantity,
      notes,
      packed: false,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating packing item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update packing item
router.put('/trips/:tripId/packing-list/:id', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { tripId, id } = req.params;
    const { name, category, quantity, notes } = req.body;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await PackingItem.findOne({ where: { id, tripId } });
    if (!item) {
      return res.status(404).json({ message: 'Packing item not found' });
    }

    await item.update({
      name,
      category,
      quantity,
      notes,
    });

    res.json(item);
  } catch (error) {
    console.error('Error updating packing item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle packed status
router.patch('/trips/:tripId/packing-list/:id', [
  auth,
  body('packed').isBoolean().withMessage('Packed must be a boolean'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { tripId, id } = req.params;
    const { packed } = req.body;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await PackingItem.findOne({ where: { id, tripId } });
    if (!item) {
      return res.status(404).json({ message: 'Packing item not found' });
    }

    await item.update({ packed });
    res.json(item);
  } catch (error) {
    console.error('Error updating packing item status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete packing item
router.delete('/trips/:tripId/packing-list/:id', auth, async (req, res) => {
  try {
    const { tripId, id } = req.params;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await PackingItem.findOne({ where: { id, tripId } });
    if (!item) {
      return res.status(404).json({ message: 'Packing item not found' });
    }

    await item.destroy();
    res.json({ message: 'Packing item deleted' });
  } catch (error) {
    console.error('Error deleting packing item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
