const express = require('express');
const { getAllSubjects } = require('../controllers/subjects.controller');
const { optionalVerifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalVerifyToken, getAllSubjects);

module.exports = router;
