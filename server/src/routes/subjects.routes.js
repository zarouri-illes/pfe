const express = require('express');
const { getAllSubjects } = require('../controllers/subjects.controller');

const router = express.Router();

router.get('/', getAllSubjects);

module.exports = router;
