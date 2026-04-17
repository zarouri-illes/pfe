const express = require('express');
const { getGoals, createGoal, toggleGoal, deleteGoal } = require('../controllers/goals.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', getGoals);
router.post('/', createGoal);
router.patch('/:id', toggleGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
