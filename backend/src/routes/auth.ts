import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateToken, authMiddleware } from '../middleware/auth';

const router = Router();

async function enrichUser(user: any) {
  const predictionsCount = await prisma.prediction.count({ where: { userId: user.id } });
  const correctPredictions = await prisma.prediction.count({ where: { userId: user.id, status: 'CORRECT' } });
  const finishedCount = await prisma.fixture.count({
    where: { isClosed: true, actualScoreA: { not: null }, actualScoreB: { not: null } },
  });
  const accuracy = finishedCount > 0 && predictionsCount > 0
    ? Math.round((correctPredictions / predictionsCount) * 100)
    : null;
  const rank = (await prisma.user.count({ where: { points: { gt: user.points } } })) + 1;
  const { passwordHash, ...safe } = user;
  return { ...safe, accuracy, predictionsCount, rank };
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, fullName, email, password, semester, department } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, fullName, email, passwordHash, semester, department },
    });

    const token = generateToken({ userId: user.id, username: user.username });
    res.status(201).json({ token, user: await enrichUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ userId: user.id, username: user.username });
    res.json({ token, user: await enrichUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: await enrichUser(user) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
