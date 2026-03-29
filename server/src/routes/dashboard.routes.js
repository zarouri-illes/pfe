const express = require('express');
const { getDashboardData } = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, getDashboardData);

module.exports = router;
