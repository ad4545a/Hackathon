const express = require('express');
const { createExpense, getExpenses } = require('../controllers/expenseController');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  restrictTo('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'),
  createExpense
);
router.get('/', getExpenses);

module.exports = router;
