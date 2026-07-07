import express, { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { authenticateToken } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

const router = express.Router();

router.use(authenticateToken);

// @route   GET /api/finance/summary
// @desc    Get summary of finances (total income, expense, balance)
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: req.user.id }
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalIncomeAllTime = 0;
    let totalExpenseAllTime = 0;

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const expenseBreakdown: Record<string, number> = {};

    transactions.forEach(t => {
      const amount = Number(t.amount);
      const tDate = new Date(t.transaction_date);
      const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

      if (t.type === 'income') {
        totalIncomeAllTime += amount;
        if (isCurrentMonth) {
          monthlyIncome += amount;
        }
      } else if (t.type === 'expense') {
        totalExpenseAllTime += amount;
        
        if (isCurrentMonth) {
          monthlyExpense += amount;
          // Group by category for current month
          if (expenseBreakdown[t.category]) {
            expenseBreakdown[t.category] += amount;
          } else {
            expenseBreakdown[t.category] = amount;
          }
        }
      }
    });

    const balance = totalIncomeAllTime - totalExpenseAllTime;

    res.json({
      total_income: monthlyIncome,
      total_expense: monthlyExpense,
      balance: balance,
      expense_breakdown: expenseBreakdown
    });
  } catch (error) {
    console.error('Get finance summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance
// @desc    Get all transactions
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: req.user.id },
      orderBy: { transaction_date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/finance
// @desc    Add a new transaction
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, amount, category, description, transaction_date } = req.body;

    if (!type || !amount || !category || !transaction_date) {
      res.status(400).json({ message: 'Please provide all required fields' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        user_id: req.user.id,
        type,
        amount: parseFloat(amount),
        category,
        description: description || null,
        transaction_date: new Date(transaction_date)
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/finance/:id
// @desc    Delete a transaction
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: parseInt(id as string), user_id: req.user.id }
    });

    if (!existingTransaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    await prisma.transaction.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
