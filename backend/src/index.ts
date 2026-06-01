import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
import authRoutes from './routes/auth';
import studyRoutes from './routes/study';
import pomodoroRoutes from './routes/pomodoro';
import financeRoutes from './routes/finance';
import eventsRoutes from './routes/events';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/events', eventsRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Personal Management App API is running');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
