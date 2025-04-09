const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const BudgetItem = require('../models/BudgetItem');
const Trip = require('../models/Trip');
const { Sequelize } = require('sequelize');

// Get budget overview and items for a trip
router.get('/trips/:tripId/budget', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const items = await BudgetItem.findAll({
      where: { tripId },
      order: [['date', 'DESC']],
    });

    // Calculate totals
    const spent = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalBudget = parseFloat(trip.totalBudget) || 0;
    const remaining = totalBudget - spent;

    console.log('Budget overview:', {
      tripId,
      totalBudget,
      spent,
      remaining,
      itemCount: items.length
    });

    res.json({
      totalBudget,
      spent,
      remaining,
      items: items.map(item => ({
        ...item.toJSON(),
        amount: parseFloat(item.amount) || 0
      })),
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new budget item
router.post('/trips/:tripId/budget', [
  auth,
  body('category')
    .exists().withMessage('Category is required')
    .trim()
    .notEmpty().withMessage('Category cannot be empty')
    .isString().withMessage('Category must be text'),
  body('description')
    .exists().withMessage('Description is required')
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isString().withMessage('Description must be text')
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
  body('amount')
    .exists().withMessage('Amount is required')
    .notEmpty().withMessage('Amount cannot be empty')
    .custom((value) => {
      console.log('Validating amount:', { value, type: typeof value });
      if (!value && value !== 0) {
        throw new Error('Amount is required');
      }
      const amount = parseFloat(value);
      console.log('Parsed amount:', { amount, isNaN: isNaN(amount) });
      if (isNaN(amount)) {
        throw new Error('Amount must be a valid number');
      }
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('date')
    .exists().withMessage('Date is required')
    .notEmpty().withMessage('Date cannot be empty')
    .custom((value) => {
      console.log('Validating date:', { value, type: typeof value });
      if (!value) {
        throw new Error('Date is required');
      }
      const date = new Date(value);
      console.log('Parsed date:', { date, isValid: !isNaN(date.getTime()) });
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return true;
    }),
], async (req, res) => {
  console.log('Received budget item:', {
    body: req.body,
    headers: req.headers,
    params: req.params,
    user: req.user
  });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array();
      console.log('Validation errors:', {
        errors: validationErrors,
        body: req.body,
        firstError: validationErrors[0]
      });
      const firstError = validationErrors[0];
      return res.status(400).json({ 
        message: firstError.msg,
        field: firstError.param,
        errors: validationErrors
      });
    }

    // Log the validated data
    const { tripId } = req.params;
    const { category, description, amount, date } = req.body;
    console.log('Processing budget item:', {
      tripId,
      category,
      description,
      amount,
      date
    });

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be a valid number greater than 0',
        field: 'amount'
      });
    }

    // Parse and validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format',
        field: 'date'
      });
    }

    // Create budget item
    const item = await BudgetItem.create({
      tripId,
      category: category.trim(),
      description: description.trim(),
      amount: parsedAmount,
      date: parsedDate,
    });

    console.log('Created budget item:', item.toJSON());
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating budget item:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: error.errors[0].message,
        field: error.errors[0].path,
        errors: error.errors
      });
    }
    res.status(500).json({ message: 'Error saving budget item' });
  }
});

// Update budget item
router.put('/trips/:tripId/budget/:id', [
  auth,
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('date').isISO8601().withMessage('Invalid date'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { tripId, id } = req.params;
    const { category, description, amount, date } = req.body;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await BudgetItem.findOne({ where: { id, tripId } });
    if (!item) {
      return res.status(404).json({ message: 'Budget item not found' });
    }

    await item.update({
      category,
      description,
      amount,
      date,
    });

    res.json(item);
  } catch (error) {
    console.error('Error updating budget item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete budget item
router.delete('/trips/:tripId/budget/:id', auth, async (req, res) => {
  try {
    const { tripId, id } = req.params;

    // Check if trip exists and belongs to user
    const trip = await Trip.findOne({ where: { id: tripId, userId: req.user.id } });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const item = await BudgetItem.findOne({ where: { id, tripId } });
    if (!item) {
      return res.status(404).json({ message: 'Budget item not found' });
    }

    await item.destroy();
    res.json({ message: 'Budget item deleted' });
  } catch (error) {
    console.error('Error deleting budget item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
