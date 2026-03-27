const express = require('express');
const { getExams } = require('../controllers/exams.controller');

const router = express.Router();

router.get('/', getExams);

module.exports = router;
