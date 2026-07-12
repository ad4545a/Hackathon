const express = require('express');
const { login, logout, getMe } = require('./auth.controller');
const { protect } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { loginSchema } = require('./auth.validation');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
