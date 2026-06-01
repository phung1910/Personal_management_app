import express, { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All pomodoro routes are protected
router.use(authenticateToken);

// @route   GET /api/pomodoro
// @desc    Get all pomodoro logs for user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.pomodoroLog.findMany({
      where: { user_id: req.user.id },
      orderBy: { completed_at: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error('Get pomodoro logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/pomodoro
// @desc    Log a completed pomodoro session
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_name, duration_minutes } = req.body;

    if (!task_name || !duration_minutes) {
      res.status(400).json({ message: 'Task name and duration are required' });
      return;
    }

    const log = await prisma.pomodoroLog.create({
      data: {
        user_id: req.user.id,
        task_name,
        duration_minutes: parseInt(duration_minutes as string)
      }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Create pomodoro log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/pomodoro/:id
// @desc    Delete a pomodoro log
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingLog = await prisma.pomodoroLog.findFirst({
      where: { id: parseInt(id as string), user_id: req.user.id }
    });

    if (!existingLog) {
      res.status(404).json({ message: 'Log not found' });
      return;
    }

    await prisma.pomodoroLog.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({ message: 'Log removed' });
  } catch (error) {
    console.error('Delete pomodoro log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
