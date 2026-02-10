const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation middleware
const validateUser = [
  body('name')
    .exists().withMessage('Name is required')
  .isString()
  .trim()
  .isLength({ min: 2, max: 50 })
  .matches(/^[a-zA-Z\s]+$/),
  
  body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Please enter a valid email')
  .normalizeEmail(),
  
 body('contactNo')
  .trim()
  .notEmpty().withMessage('Contact number is required')
  .isString().withMessage('Contact number must be a string')
  .matches(/^[0-9+\-\s()]{10,15}$/)
  .withMessage('Please enter a valid contact number (10–15 digits)'),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 10, max: 200 }).withMessage('Address must be between 10 and 200 characters')
];

// Create user
router.post('/users', validateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { name, email, contactNo, address } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        errors: [{ field: 'email', message: 'Email already registered' }]
      });
    }

    const user = new User({ name, email, contactNo, address });
    await user.save();

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message 
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users',
      error: error.message 
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user',
      error: error.message 
    });
  }
});

module.exports = router;