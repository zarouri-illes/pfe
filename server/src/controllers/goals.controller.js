const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/goals
 * @desc    Get all goals for the logged-in user
 */
const getGoals = asyncHandler(async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ data: goals });
});

/**
 * @route   POST /api/goals
 * @desc    Create a new goal
 */
const createGoal = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Goal text is required' });

  const goal = await prisma.goal.create({
    data: {
      userId: req.user.id,
      text,
    },
  });
  res.status(201).json({ data: goal });
});

/**
 * @route   PATCH /api/goals/:id
 * @desc    Toggle goal completion status
 */
const toggleGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await prisma.goal.findUnique({ where: { id: parseInt(id, 10) } });

  if (!goal || goal.userId !== req.user.id) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const updatedGoal = await prisma.goal.update({
    where: { id: parseInt(id, 10) },
    data: { isCompleted: !goal.isCompleted },
  });

  res.status(200).json({ data: updatedGoal });
});

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete a goal
 */
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await prisma.goal.findUnique({ where: { id: parseInt(id, 10) } });

  if (!goal || goal.userId !== req.user.id) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  await prisma.goal.delete({ where: { id: parseInt(id, 10) } });
  res.status(200).json({ message: 'Goal deleted' });
});

module.exports = { getGoals, createGoal, toggleGoal, deleteGoal };
