import express, { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// @route   GET /api/events
// @desc    Get all events for the user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.eventSchedule.findMany({
      where: { user_id: req.user.id },
      orderBy: { start_time: 'asc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category, start_time, end_time, location_or_link, notes, color } = req.body;

    if (!title || !start_time || !end_time) {
      res.status(400).json({ message: 'Please provide title, start_time, and end_time' });
      return;
    }

    const event = await prisma.eventSchedule.create({
      data: {
        user_id: req.user.id,
        title,
        category: category || 'Default',
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        location_or_link: location_or_link || null,
        notes: notes || null,
        color: color || null
      }
    });

    // Auto-create a corresponding task in Todo List (StudySession)
    await prisma.studySession.create({
      data: {
        user_id: req.user.id,
        title,
        objective: `From Schedule (${category || 'Default'})`,
        target_date: new Date(start_time),
        status: 'todo'
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/bulk
// @desc    Create multiple events at once
router.post('/bulk', async (req: Request, res: Response): Promise<void> => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ message: 'Please provide an array of events' });
      return;
    }

    const eventsToCreate = events.map((e: any) => ({
      user_id: req.user.id,
      title: e.title,
      category: e.category || 'Default',
      start_time: new Date(e.start_time),
      end_time: new Date(e.end_time),
      location_or_link: e.location_or_link || null,
      notes: e.notes || null,
      color: e.color || null
    }));

    await prisma.eventSchedule.createMany({
      data: eventsToCreate
    });

    // Auto-create corresponding tasks in Todo List (StudySession)
    const sessionsToCreate = events.map((e: any) => ({
      user_id: req.user.id,
      title: e.title,
      objective: `From Schedule (${e.category || 'Default'})`,
      target_date: new Date(e.start_time),
      status: 'todo'
    }));

    await prisma.studySession.createMany({
      data: sessionsToCreate
    });

    res.status(201).json({ message: 'Bulk events created successfully' });
  } catch (error) {
    console.error('Bulk create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, category, start_time, end_time, location_or_link, notes, color } = req.body;

    const existingEvent = await prisma.eventSchedule.findFirst({
      where: { id: parseInt(id as string), user_id: req.user.id }
    });

    if (!existingEvent) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const updatedEvent = await prisma.eventSchedule.update({
      where: { id: parseInt(id as string) },
      data: {
        title: title !== undefined ? title : existingEvent.title,
        category: category !== undefined ? category : existingEvent.category,
        start_time: start_time ? new Date(start_time) : existingEvent.start_time,
        end_time: end_time ? new Date(end_time) : existingEvent.end_time,
        location_or_link: location_or_link !== undefined ? location_or_link : existingEvent.location_or_link,
        notes: notes !== undefined ? notes : existingEvent.notes,
        color: color !== undefined ? color : existingEvent.color
      }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingEvent = await prisma.eventSchedule.findFirst({
      where: { id: parseInt(id as string), user_id: req.user.id }
    });

    if (!existingEvent) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    await prisma.eventSchedule.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({ message: 'Event removed' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
