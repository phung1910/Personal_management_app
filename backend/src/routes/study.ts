import express, { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All study routes are protected
router.use(authenticateToken);

// @route   GET /api/study
// @desc    Get all study sessions for user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { user_id: req.user.id },
      // There's no created_at in the model schema, so we order by ID descending
      orderBy: { id: 'desc' } 
    });
    res.json(sessions);
  } catch (error) {
    console.error('Get study sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/study
// @desc    Create a new study session
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, objective, target_date, duration_minutes } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const session = await prisma.studySession.create({
      data: {
        user_id: req.user.id,
        title,
        objective: objective || null,
        status: 'todo', // default status
        progress_percentage: 0,
        duration_minutes: duration_minutes ? parseInt(duration_minutes as string) : 0,
        target_date: target_date ? new Date(target_date) : null,
      }
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create study session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/study/:id
// @desc    Update a study session
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, objective, status, progress_percentage, target_date, duration_minutes } = req.body;

    // Check if it belongs to user
    const existingSession = await prisma.studySession.findFirst({
      where: { id: parseInt(id as string), user_id: req.user.id }
    });

    if (!existingSession) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    const session = await prisma.studySession.update({
      where: { id: parseInt(id as string) },
      data: {
        title: title !== undefined ? title : existingSession.title,
        objective: objective !== undefined ? objective : existingSession.objective,
        status: status !== undefined ? status : existingSession.status,
        progress_percentage: progress_percentage !== undefined ? progress_percentage : existingSession.progress_percentage,
        duration_minutes: duration_minutes !== undefined ? parseInt(duration_minutes as string) : existingSession.duration_minutes,
        target_date: target_date !== undefined ? (target_date ? new Date(target_date) : null) : existingSession.target_date,
      }
    });

    res.json(session);
  } catch (error) {
    console.error('Update study session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/study/:id
// @desc    Delete a study session
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if it belongs to user
    const existingSession = await prisma.studySession.findFirst({
      where: { id: parseInt(id as string), user_id: req.user.id }
    });

    if (!existingSession) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    await prisma.studySession.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({ message: 'Session removed' });
  } catch (error) {
    console.error('Delete study session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
