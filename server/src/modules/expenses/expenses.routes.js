const express = require('express');
const { createExpense, getExpenses } = require('./expenses.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { createExpenseSchema } = require('./expenses.validation');

const router = express.Router();

router.post(
  '/',
  protect,
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DISPATCHER'),
  validate(createExpenseSchema),
  createExpense
);

router.get(
  '/',
  protect,
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'),
  getExpenses
);

module.exports = router;
